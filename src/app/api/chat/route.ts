export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { restaurants, restaurant_configs, menu_items, categories, orders, chat_messages, sessions, token_usage } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { buildSystemPrompt } from '@/lib/ai';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-20250514';

// Cost per million tokens (USD)
const INPUT_COST_PER_M = 3.0;
const OUTPUT_COST_PER_M = 15.0;

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
    }, menuWithCategories, pastOrders, customerName, cart || []);

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const assistantContent = response.content[0].type === 'text' ? response.content[0].text : '';
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const costUsd = (inputTokens / 1_000_000) * INPUT_COST_PER_M + (outputTokens / 1_000_000) * OUTPUT_COST_PER_M;

    // Store messages and token usage
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
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: costUsd,
    });

    return NextResponse.json({ content: assistantContent, inputTokens, outputTokens });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to get AI response' }, { status: 500 });
  }
}
