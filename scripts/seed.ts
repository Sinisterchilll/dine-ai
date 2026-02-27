import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../src/lib/db/schema';
import bcrypt from 'bcrypt';
import path from 'path';

const sqlite = new Database(path.join(process.cwd(), 'dineai.db'));
const db = drizzle(sqlite, { schema });

async function seed() {
  console.log('Seeding database...');

  sqlite.exec('DELETE FROM token_usage');
  sqlite.exec('DELETE FROM chat_messages');
  sqlite.exec('DELETE FROM orders');
  sqlite.exec('DELETE FROM sessions');
  sqlite.exec('DELETE FROM tables');
  sqlite.exec('DELETE FROM menu_items');
  sqlite.exec('DELETE FROM categories');
  sqlite.exec('DELETE FROM restaurant_configs');
  sqlite.exec('DELETE FROM admins');
  sqlite.exec('DELETE FROM restaurants');

  const [restaurant] = await db.insert(schema.restaurants).values({
    name: 'Spice Garden',
    slug: 'spice-garden',
    description: 'Authentic Indian cuisine with a modern twist. From tandoor delights to aromatic biryanis.',
    logo_emoji: '🌿',
    address: '42 MG Road, Bengaluru, Karnataka 560001',
    cuisine_type: 'Indian',
    currency: 'INR',
    status: 'active',
  }).returning();

  await db.insert(schema.restaurant_configs).values({
    restaurant_id: restaurant.id,
    ai_personality: 'friendly',
    ai_greeting: "Hey there! Welcome to Spice Garden 🌿 I'm your AI dining companion. Ask me anything about our menu!",
    custom_knowledge: 'We source our spices directly from Kerala and Rajasthan. Our tandoor has been seasoned for 10 years. We offer a complimentary papadum basket with all main course orders. Special dietary accommodations available on request.',
    languages: '["English", "Hindi", "Kannada"]',
  });

  const superHash = await bcrypt.hash('password123', 12);
  await db.insert(schema.admins).values({
    email: 'super@dineai.com',
    password_hash: superHash,
    name: 'Super Admin',
    role: 'super',
    restaurant_id: null,
  });

  const adminHash = await bcrypt.hash('password123', 12);
  await db.insert(schema.admins).values({
    email: 'admin@spicegarden.com',
    password_hash: adminHash,
    name: 'Spice Garden Admin',
    role: 'restaurant',
    restaurant_id: restaurant.id,
  });

  const categoryNames = ['Starters', 'Mains', 'Breads', 'Rice & Biryani', 'Desserts', 'Beverages'];
  const categoryMap: Record<string, number> = {};
  for (let i = 0; i < categoryNames.length; i++) {
    const [cat] = await db.insert(schema.categories).values({
      restaurant_id: restaurant.id,
      name: categoryNames[i],
      sort_order: i,
    }).returning();
    categoryMap[categoryNames[i]] = cat.id;
  }

  const menuItems = [
    { name: 'Paneer Tikka', category: 'Starters', price: 329, veg: true, spice_level: 2, description: 'Cottage cheese marinated in yogurt and spices, chargrilled in tandoor', allergens: ['dairy'], calories: 280, is_popular: true, is_chef_special: false, is_today_special: false, in_stock: true },
    { name: 'Chicken 65', category: 'Starters', price: 349, veg: false, spice_level: 3, description: 'Hyderabadi-style deep fried chicken with curry leaves and red chilies', allergens: [], calories: 350, is_popular: true, is_chef_special: false, is_today_special: false, in_stock: true },
    { name: 'Mutton Seekh Kebab', category: 'Starters', price: 429, veg: false, spice_level: 2, description: 'Minced mutton with herbs and spices, cooked on skewers in tandoor', allergens: [], calories: 310, is_popular: false, is_chef_special: true, is_today_special: true, in_stock: true },
    { name: 'Hara Bhara Kebab', category: 'Starters', price: 279, veg: true, spice_level: 1, description: 'Spinach and pea patties with mint chutney, lightly pan-fried', allergens: [], calories: 180, is_popular: false, is_chef_special: false, is_today_special: false, in_stock: true },
    { name: 'Crispy Corn', category: 'Starters', price: 249, veg: true, spice_level: 1, description: 'Golden fried corn kernels tossed with spices, curry leaves and peppers', allergens: ['corn'], calories: 220, is_popular: true, is_chef_special: false, is_today_special: false, in_stock: true },
    { name: 'Butter Chicken', category: 'Mains', price: 399, veg: false, spice_level: 1, description: 'Tender chicken in rich tomato-butter gravy with kasuri methi. Our signature dish', allergens: ['dairy'], calories: 450, is_popular: true, is_chef_special: true, is_today_special: false, in_stock: true },
    { name: 'Dal Makhani', category: 'Mains', price: 299, veg: true, spice_level: 1, description: 'Black lentils slow-cooked overnight with butter and cream', allergens: ['dairy'], calories: 380, is_popular: true, is_chef_special: false, is_today_special: false, in_stock: true },
    { name: 'Paneer Butter Masala', category: 'Mains', price: 349, veg: true, spice_level: 1, description: 'Cottage cheese cubes in creamy tomato gravy with cashew paste', allergens: ['dairy', 'nuts'], calories: 420, is_popular: true, is_chef_special: false, is_today_special: false, in_stock: true },
    { name: 'Chicken Chettinad', category: 'Mains', price: 429, veg: false, spice_level: 3, description: 'Fiery Tamil Nadu style chicken curry with freshly ground spices', allergens: [], calories: 380, is_popular: false, is_chef_special: true, is_today_special: true, in_stock: true },
    { name: 'Lamb Rogan Josh', category: 'Mains', price: 499, veg: false, spice_level: 2, description: 'Kashmiri slow-cooked lamb in aromatic gravy with whole spices', allergens: [], calories: 420, is_popular: false, is_chef_special: true, is_today_special: false, in_stock: true },
    { name: 'Palak Paneer', category: 'Mains', price: 319, veg: true, spice_level: 1, description: 'Fresh spinach puree with soft paneer cubes and mild spices', allergens: ['dairy'], calories: 340, is_popular: false, is_chef_special: false, is_today_special: false, in_stock: true },
    { name: 'Chole Bhature', category: 'Mains', price: 279, veg: true, spice_level: 2, description: 'Spiced chickpea curry served with fluffy deep-fried bread', allergens: ['gluten'], calories: 520, is_popular: true, is_chef_special: false, is_today_special: false, in_stock: true },
    { name: 'Butter Naan', category: 'Breads', price: 69, veg: true, spice_level: 0, description: 'Soft leavened bread brushed with butter from our tandoor', allergens: ['gluten', 'dairy'], calories: 260, is_popular: true, is_chef_special: false, is_today_special: false, in_stock: true },
    { name: 'Garlic Naan', category: 'Breads', price: 79, veg: true, spice_level: 0, description: 'Naan topped with fresh garlic and coriander', allergens: ['gluten', 'dairy'], calories: 280, is_popular: true, is_chef_special: false, is_today_special: false, in_stock: true },
    { name: 'Laccha Paratha', category: 'Breads', price: 69, veg: true, spice_level: 0, description: 'Layered flaky whole wheat bread cooked in tandoor', allergens: ['gluten'], calories: 240, is_popular: false, is_chef_special: false, is_today_special: false, in_stock: true },
    { name: 'Hyderabadi Chicken Biryani', category: 'Rice & Biryani', price: 399, veg: false, spice_level: 2, description: 'Fragrant basmati rice layered with spiced chicken, dum-cooked with saffron', allergens: [], calories: 580, is_popular: true, is_chef_special: true, is_today_special: false, in_stock: true },
    { name: 'Veg Biryani', category: 'Rice & Biryani', price: 299, veg: true, spice_level: 2, description: 'Mixed vegetables and paneer with basmati rice, herbs and whole spices', allergens: ['dairy'], calories: 450, is_popular: false, is_chef_special: false, is_today_special: false, in_stock: true },
    { name: 'Jeera Rice', category: 'Rice & Biryani', price: 179, veg: true, spice_level: 0, description: 'Basmati rice tempered with cumin seeds and ghee', allergens: ['dairy'], calories: 320, is_popular: false, is_chef_special: false, is_today_special: false, in_stock: true },
    { name: 'Gulab Jamun', category: 'Desserts', price: 149, veg: true, spice_level: 0, description: 'Soft milk dumplings soaked in rose-cardamom sugar syrup. Served warm', allergens: ['dairy', 'gluten'], calories: 380, is_popular: true, is_chef_special: false, is_today_special: false, in_stock: true },
    { name: 'Rasmalai', category: 'Desserts', price: 179, veg: true, spice_level: 0, description: 'Soft paneer discs in chilled saffron-cardamom milk, topped with pistachios', allergens: ['dairy', 'nuts'], calories: 320, is_popular: false, is_chef_special: true, is_today_special: true, in_stock: true },
    { name: 'Kulfi Falooda', category: 'Desserts', price: 199, veg: true, spice_level: 0, description: 'Traditional Indian ice cream with vermicelli, rose syrup and basil seeds', allergens: ['dairy', 'gluten'], calories: 400, is_popular: true, is_chef_special: false, is_today_special: false, in_stock: false },
    { name: 'Masala Chai', category: 'Beverages', price: 79, veg: true, spice_level: 0, description: 'Authentic Indian spiced tea brewed with cardamom, ginger and cinnamon', allergens: ['dairy'], calories: 80, is_popular: true, is_chef_special: false, is_today_special: false, in_stock: true },
    { name: 'Mango Lassi', category: 'Beverages', price: 149, veg: true, spice_level: 0, description: 'Chilled yogurt smoothie blended with Alphonso mango pulp', allergens: ['dairy'], calories: 200, is_popular: true, is_chef_special: false, is_today_special: false, in_stock: true },
    { name: 'Fresh Lime Soda', category: 'Beverages', price: 99, veg: true, spice_level: 0, description: 'Freshly squeezed lime with soda water — sweet, salt, or mixed', allergens: [], calories: 60, is_popular: false, is_chef_special: false, is_today_special: false, in_stock: true },
    { name: 'Cold Coffee', category: 'Beverages', price: 169, veg: true, spice_level: 0, description: 'Creamy iced coffee blended with vanilla ice cream', allergens: ['dairy'], calories: 280, is_popular: false, is_chef_special: false, is_today_special: false, in_stock: true },
  ];

  for (const item of menuItems) {
    await db.insert(schema.menu_items).values({
      restaurant_id: restaurant.id,
      category_id: categoryMap[item.category],
      name: item.name,
      description: item.description,
      price: item.price,
      veg: item.veg,
      spice_level: item.spice_level,
      calories: item.calories,
      allergens: JSON.stringify(item.allergens),
      is_popular: item.is_popular,
      is_chef_special: item.is_chef_special,
      is_today_special: item.is_today_special,
      in_stock: item.in_stock,
    });
  }

  const tableLabels = ['Main Hall', 'Window Seat', 'Garden View', 'Corner Booth', 'Private Dining'];
  for (let i = 1; i <= 5; i++) {
    await db.insert(schema.tables).values({
      restaurant_id: restaurant.id,
      table_number: i,
      label: tableLabels[i - 1],
    });
  }

  console.log('✓ Seed complete!');
  console.log('  Super admin: super@dineai.com / password123');
  console.log('  Restaurant admin: admin@spicegarden.com / password123');
  sqlite.close();
}

seed().catch(console.error);
