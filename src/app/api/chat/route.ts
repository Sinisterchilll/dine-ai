export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { restaurants, restaurant_configs, menu_items, categories, orders, chat_messages, sessions, token_usage } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { buildSystemPrompt } from '@/lib/ai';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-20250514';

const INPUT_COST_PER_M = 3.0;
const OUTPUT_COST_PER_M = 15.0;

interface CartItem { id: number; name: string; price: number; qty: number; }

const ADD_TO_CART_TOOL: Anthropic.Tool = {
  name: 'add_to_cart',
  description: "Add one or more menu items to the customer's cart. Use this tool ONLY when the customer explicitly says they want to order, add, or get specific items (e.g. 'add 2 butter chickens', 'I'll have the paneer tikka', 'one lassi please'). Do NOT call this just for recommendations — only when they clearly want to add to cart.",
  input_schema: {
    type: 'object' as const,
    properties: {
      items: {
        type: 'array',
        description: 'List of items to add to cart',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'The menu item ID' },
            name: { type: 'string', description: 'The menu item name' },
            price: { type: 'number', description: 'The price of one unit' },
            qty: { type: 'number', description: 'Quantity to add (minimum 1)' },
          },
          required: ['id', 'name', 'price', 'qty'],
        },
      },
    },
    required: ['items'],
  },
};

export async function POST(req: NextRequest) {
  try {
    const { session_id, restaurant_id, messages, cart } = await req.json();

    if (!restaurant_id || !messages?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, restaurant_id));
    if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });

    const [config] = await db.select().from(restaurant_configs).where(eq(restaurant_configs.restaurant_id, restaurant_id));

    const menuWithCategories = await db
      .select({
        id: menu_items.id,
        name: menu_items.name,
        description: menu_items.description,
        price: menu_items.price,
        veg: menu_items.veg,
        spice_level: menu_items.spice_level,
        calories: menu_items.calories,
        allergens: menu_items.allergens,
        is_popular: menu_items.is_popular,
        is_chef_special: menu_items.is_chef_special,
        is_today_special: menu_items.is_today_special,
        in_stock: menu_items.in_stock,
        category_name: categories.name,
      })
      .from(menu_items)
      .leftJoin(categories, eq(menu_items.category_id, categories.id))
      .where(eq(menu_items.restaurant_id, restaurant_id));

    let customerName: string | null = null;
    let pastOrders: { items: string; total: number; created_at: string | null }[] = [];

    if (session_id) {
      const [session] = await db.select().from(sessions).where(eq(sessions.id, session_id));
      customerName = session?.customer_name || null;
      pastOrders = await db.select({ items: orders.items, total: orders.total, created_at: orders.created_at })
        .from(orders).where(eq(orders.session_id, session_id)).orderBy(desc(orders.created_at)).limit(5);
    }

    const systemPrompt = buildSystemPrompt(restaurant, config || {
      ai_personality: 'friendly', ai_greeting: null, custom_knowledge: null, languages: '["English"]',
    }, menuWithCategories, pastOrders, customerName, cart || []) +
      '\n\nYou have an add_to_cart tool. Use it immediately when the customer explicitly asks to order or add specific items. Be proactive — if they say "I\'ll have X", call the tool.';

    const anthropicMessages: Anthropic.MessageParam[] = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // First API call
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      tools: [ADD_TO_CART_TOOL],
      messages: anthropicMessages,
    });

    let assistantContent = '';
    let cartActions: CartItem[] = [];
    let totalInputTokens = response.usage.input_tokens;
    let totalOutputTokens = response.usage.output_tokens;

    if (response.stop_reason === 'tool_use') {
      const toolUseBlock = response.content.find(b => b.type === 'tool_use') as Anthropic.ToolUseBlock | undefined;

      if (toolUseBlock?.name === 'add_to_cart') {
        const input = toolUseBlock.input as { items: CartItem[] };
        // Validate items against actual in-stock menu
        cartActions = (input.items || []).filter(item => {
          const found = menuWithCategories.find(m => m.id === item.id);
          return found && found.in_stock;
        }).map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: Math.max(1, Math.round(item.qty)),
        }));
      }

      // Second call with tool result to get the assistant's confirmation text
      const toolResultMsg: Anthropic.MessageParam = {
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: toolUseBlock?.id || '',
          content: cartActions.length > 0
            ? `Added to cart: ${cartActions.map(i => `${i.qty}× ${i.name} (₹${i.price * i.qty})`).join(', ')}`
            : 'Could not add items — they may be out of stock or not on the menu.',
        }],
      };

      const secondResponse = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 512,
        system: systemPrompt,
        tools: [ADD_TO_CART_TOOL],
        messages: [...anthropicMessages, { role: 'assistant', content: response.content }, toolResultMsg],
      });

      assistantContent = (secondResponse.content.find(b => b.type === 'text') as Anthropic.TextBlock | undefined)?.text || 'Done!';
      totalInputTokens += secondResponse.usage.input_tokens;
      totalOutputTokens += secondResponse.usage.output_tokens;
    } else {
      assistantContent = (response.content.find(b => b.type === 'text') as Anthropic.TextBlock | undefined)?.text || '';
    }

    const costUsd = (totalInputTokens / 1_000_000) * INPUT_COST_PER_M + (totalOutputTokens / 1_000_000) * OUTPUT_COST_PER_M;

    if (session_id) {
      const lastUserMsg = messages[messages.length - 1];
      await db.insert(chat_messages).values([
        { session_id, restaurant_id, role: 'user', content: lastUserMsg.content },
        { session_id, restaurant_id, role: 'assistant', content: assistantContent },
      ]);
    }

    await db.insert(token_usage).values({
      restaurant_id,
      session_id: session_id || null,
      model: MODEL,
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      cost_usd: costUsd,
    });

    return NextResponse.json({ content: assistantContent, cartActions });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to get AI response' }, { status: 500 });
  }
}
