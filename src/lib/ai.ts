interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  veg: boolean | null;
  spice_level: number | null;
  calories: number | null;
  allergens: string | null;
  is_popular: boolean | null;
  is_chef_special: boolean | null;
  is_today_special: boolean | null;
  in_stock: boolean | null;
  category_name?: string | null;
}

interface Restaurant {
  name: string;
  currency: string | null;
}

interface Config {
  ai_personality: string | null;
  ai_greeting: string | null;
  custom_knowledge: string | null;
  languages: string | null;
}

interface Order {
  items: string;
  total: number;
  created_at: string | null;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

interface CustomerPreferences {
  dietary: string | null;
  allergens: string | null;
  spice_pref: string | null;
  notes: string | null;
}

export function buildSystemPrompt(
  restaurant: Restaurant,
  config: Config,
  menuItems: MenuItem[],
  pastOrders: Order[],
  customerName: string | null,
  cart: CartItem[],
  prefs?: CustomerPreferences | null
): string {
  const inStock = menuItems.filter(i => i.in_stock);
  const outOfStock = menuItems.filter(i => !i.in_stock);
  const todaySpecials = menuItems.filter(i => i.is_today_special && i.in_stock);
  const spiceLabels = ['Not spicy', 'Mild', 'Medium', 'Spicy'];
  const symbol = restaurant.currency === 'INR' ? '₹' : '$';

  const menuText = inStock.map(item => {
    const tags = [];
    if (item.veg) tags.push('VEG'); else tags.push('NON-VEG');
    if (item.is_popular) tags.push('POPULAR');
    if (item.is_chef_special) tags.push("CHEF'S SPECIAL");
    if (item.is_today_special) tags.push("TODAY'S SPECIAL");
    const spice = spiceLabels[item.spice_level ?? 0] || 'Not spicy';
    const allergens = item.allergens ? JSON.parse(item.allergens) as string[] : [];
    const allergenText = allergens.length > 0 ? `Allergens: ${allergens.join(', ')}` : 'No common allergens';
    return `- [ID:${item.id}] ${item.name} (${symbol}${item.price}) [${item.category_name || 'Menu'}] [${tags.join(', ')}]: ${item.description || ''}. Spice: ${spice}. Cal: ~${item.calories || 'N/A'}. ${allergenText}.`;
  }).join('\n');

  const outOfStockText = outOfStock.length > 0 ? outOfStock.map(i => i.name).join(', ') : 'None';
  const todaySpecialsText = todaySpecials.length > 0 ? todaySpecials.map(i => i.name).join(', ') : 'None today';

  const cartText = cart.length > 0
    ? cart.map(i => `${i.name} x${i.qty} = ${symbol}${(i.price * i.qty).toFixed(0)}`).join(', ')
    : 'Empty';

  const ordersText = pastOrders.length > 0
    ? pastOrders.slice(0, 5).map(o => {
        const items = JSON.parse(o.items) as CartItem[];
        return `- ${items.map(i => `${i.name} x${i.qty}`).join(', ')} (Total: ${symbol}${o.total})`;
      }).join('\n')
    : 'No previous orders';

  const personality = config.ai_personality || 'friendly';
  const personalityInstructions: Record<string, string> = {
    friendly: 'Be warm, enthusiastic, and conversational. Use occasional food emojis. Make the customer feel welcome.',
    formal: 'Be professional, courteous, and precise. Maintain a refined dining atmosphere.',
    witty: 'Be clever and playful with food puns. Keep it fun while being helpful.',
  };
  const personalityText = personalityInstructions[personality] || 'Be warm and helpful.';
  const languages = config.languages ? JSON.parse(config.languages) as string[] : ['English'];

  // Build customer profile section from remembered preferences
  let profileSection = '';
  if (prefs) {
    const lines: string[] = [];
    if (prefs.dietary) {
      try {
        const d = JSON.parse(prefs.dietary) as string[];
        if (d.length > 0) lines.push(`- Dietary preference: ${d.join(', ')}`);
      } catch { /* ignore parse error */ }
    }
    if (prefs.allergens) {
      try {
        const a = JSON.parse(prefs.allergens) as string[];
        if (a.length > 0) lines.push(`- Allergens to AVOID: ${a.join(', ')} — always warn before recommending anything containing these`);
      } catch { /* ignore parse error */ }
    }
    if (prefs.spice_pref) lines.push(`- Spice preference: ${prefs.spice_pref}`);
    if (prefs.notes) lines.push(`- Notes: ${prefs.notes}`);
    if (lines.length > 0) {
      profileSection = `\nCUSTOMER PROFILE (remembered from previous visits):\n${lines.join('\n')}\n`;
    }
  }

  return `You are ${restaurant.name}'s AI dining assistant named DineAI.

PERSONALITY: ${personalityText}

${config.custom_knowledge ? `SPECIAL KNOWLEDGE ABOUT THIS RESTAURANT:\n${config.custom_knowledge}\n` : ''}
FULL MENU (in-stock items only — use the [ID:X] number when calling add_to_cart):
${menuText}

TODAY'S SPECIALS: ${todaySpecialsText}
CURRENTLY OUT OF STOCK: ${outOfStockText}
${profileSection}
CUSTOMER: ${customerName || 'Guest'}
CUSTOMER'S CURRENT CART: ${cartText}
CUSTOMER'S PAST ORDERS:
${ordersText}

SUPPORTED LANGUAGES: ${languages.join(', ')}

RULES:
1. Keep replies concise (2-4 sentences max, unless customer asks for details)
2. Always mention price when recommending an item
3. NEVER invent menu items not listed above
4. ALLERGEN SAFETY: If customer mentions any allergy, or if their profile has allergens, warn clearly before recommending anything containing those
5. Suggest complementary items and pairings naturally
6. Respond in the same language the customer uses
7. If asked about items out of stock, apologize and suggest alternatives
8. Be knowledgeable about spice levels and ingredients
9. For ordering, use the add_to_cart tool when the customer explicitly asks to order specific items
10. Currency: ${restaurant.currency === 'INR' ? 'INR (₹ Rupees)' : restaurant.currency}
11. UPSELL (do this at most once per conversation): When the cart has food but no drinks, suggest a beverage. When cart has mains but no bread, suggest a bread. Suggest dessert naturally at end of meal. One sentence, natural, not pushy.
12. MEMORY: When a customer mentions their dietary restrictions, allergies, or spice preference, call save_customer_preference to remember it for next time.`;
}
