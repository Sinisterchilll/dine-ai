import { pgTable, text, integer, real, boolean, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const restaurants = pgTable('restaurants', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  logo_emoji: text('logo_emoji').default('🍽️'),
  address: text('address'),
  cuisine_type: text('cuisine_type'),
  currency: text('currency').default('INR'),
  status: text('status').default('active'),
  created_at: text('created_at').default(sql`now()`),
});

export const restaurant_configs = pgTable('restaurant_configs', {
  id: serial('id').primaryKey(),
  restaurant_id: integer('restaurant_id').notNull().references(() => restaurants.id),
  ai_personality: text('ai_personality').default('friendly'),
  ai_greeting: text('ai_greeting'),
  custom_knowledge: text('custom_knowledge'),
  languages: text('languages').default('["English"]'),
  updated_at: text('updated_at').default(sql`now()`),
});

export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  restaurant_id: integer('restaurant_id').references(() => restaurants.id),
  created_at: text('created_at').default(sql`now()`),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  restaurant_id: integer('restaurant_id').notNull().references(() => restaurants.id),
  name: text('name').notNull(),
  sort_order: integer('sort_order').default(0),
  created_at: text('created_at').default(sql`now()`),
});

export const menu_items = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  restaurant_id: integer('restaurant_id').notNull().references(() => restaurants.id),
  category_id: integer('category_id').references(() => categories.id),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  veg: boolean('veg').default(true),
  spice_level: integer('spice_level').default(0),
  calories: integer('calories'),
  allergens: text('allergens').default('[]'),
  is_popular: boolean('is_popular').default(false),
  is_chef_special: boolean('is_chef_special').default(false),
  is_today_special: boolean('is_today_special').default(false),
  in_stock: boolean('in_stock').default(true),
  created_at: text('created_at').default(sql`now()`),
  updated_at: text('updated_at').default(sql`now()`),
});

export const tables = pgTable('tables', {
  id: serial('id').primaryKey(),
  restaurant_id: integer('restaurant_id').notNull().references(() => restaurants.id),
  table_number: integer('table_number').notNull(),
  label: text('label'),
  created_at: text('created_at').default(sql`now()`),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  restaurant_id: integer('restaurant_id').notNull().references(() => restaurants.id),
  table_id: integer('table_id').references(() => tables.id),
  device_id: text('device_id'),
  customer_name: text('customer_name'),
  customer_phone: text('customer_phone'),
  created_at: text('created_at').default(sql`now()`),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  session_id: text('session_id').references(() => sessions.id),
  restaurant_id: integer('restaurant_id').notNull().references(() => restaurants.id),
  table_id: integer('table_id').references(() => tables.id),
  items: text('items').notNull(),
  subtotal: real('subtotal').notNull(),
  tax: real('tax').notNull(),
  total: real('total').notNull(),
  status: text('status').default('pending'),
  created_at: text('created_at').default(sql`now()`),
});

export const chat_messages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  session_id: text('session_id').references(() => sessions.id),
  restaurant_id: integer('restaurant_id').notNull().references(() => restaurants.id),
  role: text('role').notNull(),
  content: text('content').notNull(),
  created_at: text('created_at').default(sql`now()`),
});

export const token_usage = pgTable('token_usage', {
  id: serial('id').primaryKey(),
  restaurant_id: integer('restaurant_id').notNull().references(() => restaurants.id),
  session_id: text('session_id').references(() => sessions.id),
  model: text('model').notNull(),
  input_tokens: integer('input_tokens').notNull(),
  output_tokens: integer('output_tokens').notNull(),
  cost_usd: real('cost_usd').notNull(),
  created_at: text('created_at').default(sql`now()`),
});

export const customer_preferences = pgTable('customer_preferences', {
  id: serial('id').primaryKey(),
  device_id: text('device_id').notNull(),
  restaurant_id: integer('restaurant_id').references(() => restaurants.id, { onDelete: 'cascade' }),
  dietary: text('dietary'),       // JSON array: ['vegetarian','vegan','gluten-free',...]
  allergens: text('allergens'),   // JSON array: ['dairy','nuts',...]
  spice_pref: text('spice_pref'),  // 'mild'|'medium'|'spicy'
  notes: text('notes'),
  updated_at: text('updated_at').default(sql`now()`),
});
