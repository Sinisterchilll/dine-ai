export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { restaurants, restaurant_configs, menu_items, categories, orders, chat_messages, sessions, token_usage, customer_preferences } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
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
            id: { type: 'number', description: 'The menu item ID shown as [ID:X] in the menu' },
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

const SAVE_PREF_TOOL: Anthropic.Tool = {
  name: 'save_customer_preference',
  description: "Silently save the customer's dietary/allergy/spice preferences for future visits. Call this whenever the customer mentions being vegetarian, vegan, having allergies, or a spice preference. This is a background action — do NOT mention to the customer that you're saving their preferences.",
  input_schema: {
    type: 'object' as const,
    properties: {
      dietary: { type: 'array', items: { type: 'string' }, description: "e.g. ['vegetarian', 'vegan', 'gluten-free']" },
      allergens: { type: 'array', items: { type: 'string' }, description: "e.g. ['dairy', 'nuts', 'gluten']" },
      spice_pref: { type: 'string', description: "One of: 'mild', 'medium', 'spicy'" },
      notes: { type: 'string', description: 'Any other relevant notes about the customer' },
    },
  },
};

export async function POST(req: NextRequest) {
  try {
    const { session_id, restaurant_id, messages, cart, device_id } = await req.json();

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

    // Load customer preferences for personalization
    let customerPrefs = null;
    if (device_id) {
      const [prefs] = await db.select()
        .from(customer_preferences)
        .where(and(eq(customer_preferences.device_id, device_id), eq(customer_preferences.restaurant_id, restaurant_id)));
      customerPrefs = prefs || null;
    }

    const systemPrompt = buildSystemPrompt(
      restaurant,
      config || { ai_personality: 'friendly', ai_greeting: null, custom_knowledge: null, languages: '["English"]' },
      menuWithCategories,
      pastOrders,
      customerName,
      cart || [],
      customerPrefs,
    ) + '\n\nYou have tools available: add_to_cart (use when customer explicitly orders) and save_customer_preference (use silently when customer mentions dietary needs). Be proactive with add_to_cart — if they say "I\'ll have X", call it immediately.';

    const anthropicMessages: Anthropic.MessageParam[] = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const tools = [ADD_TO_CART_TOOL, SAVE_PREF_TOOL];

    // First API call
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages: anthropicMessages,
    });

    let assistantContent = '';
    let cartActions: CartItem[] = [];
    let totalInputTokens = response.usage.input_tokens;
    let totalOutputTokens = response.usage.output_tokens;

    // Handle tool use — may be add_to_cart, save_customer_preference, or both
    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[];
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolBlock of toolUseBlocks) {
        if (toolBlock.name === 'add_to_cart') {
          const input = toolBlock.input as { items: CartItem[] };
          // Try ID match first, fall back to name match (Claude sometimes makes up IDs)
          cartActions = (input.items || []).flatMap(item => {
            const found = menuWithCategories.find(m => m.id === item.id)
              || menuWithCategories.find(m => m.name.toLowerCase() === item.name.toLowerCase());
            if (!found || !found.in_stock) return [];
            return [{ id: found.id, name: found.name, price: found.price, qty: Math.max(1, Math.round(item.qty)) }];
          });

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: cartActions.length > 0
              ? `Added to cart: ${cartActions.map(i => `${i.qty}× ${i.name} (₹${i.price * i.qty})`).join(', ')}`
              : 'Could not add items — they may be out of stock or not on the menu.',
          });
        } else if (toolBlock.name === 'save_customer_preference') {
          // Save preferences silently in background
          const input = toolBlock.input as { dietary?: string[]; allergens?: string[]; spice_pref?: string; notes?: string };
          if (device_id) {
            try {
              // Check if row exists
              const [existing] = await db.select()
                .from(customer_preferences)
                .where(and(eq(customer_preferences.device_id, device_id), eq(customer_preferences.restaurant_id, restaurant_id)));

              const updates = {
                device_id,
                restaurant_id,
                dietary: input.dietary ? JSON.stringify(input.dietary) : (existing?.dietary ?? null),
                allergens: input.allergens ? JSON.stringify(input.allergens) : (existing?.allergens ?? null),
                spice_pref: input.spice_pref ?? existing?.spice_pref ?? null,
                notes: input.notes ?? existing?.notes ?? null,
                updated_at: new Date().toISOString(),
              };

              if (existing) {
                await db.update(customer_preferences).set(updates).where(eq(customer_preferences.id, existing.id));
              } else {
                await db.insert(customer_preferences).values(updates);
              }
            } catch (e) {
              console.error('Failed to save preferences:', e);
            }
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: 'Preferences saved.',
          });
        }
      }

      // Second call: get the assistant's confirmation/reply text
      const secondResponse = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 512,
        system: systemPrompt,
        tools,
        messages: [
          ...anthropicMessages,
          { role: 'assistant', content: response.content },
          { role: 'user', content: toolResults },
        ],
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
