import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const restaurants = sqliteTable('restaurants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  logo_emoji: text('logo_emoji').default('🍽️'),
  address: text('address'),
  cuisine_type: text('cuisine_type'),
  currency: text('currency').default('INR'),
  status: text('status').default('active'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

export const restaurant_configs = sqliteTable('restaurant_configs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  restaurant_id: integer('restaurant_id').notNull().references(() => restaurants.id),
  ai_personality: text('ai_personality').default('friendly'),
  ai_greeting: text('ai_greeting'),
  custom_knowledge: text('custom_knowledge'),
  languages: text('languages').default('["English"]'),
  updated_at: text('updated_at').default(sql`(datetime('now'))`),
});

export const admins = sqliteTable('admins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  restaurant_id: integer('restaurant_id').references(() => restaurants.id),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  restaurant_id: integer('restaurant_id').notNull().references(() => restaurants.id),
  name: text('name').notNull(),
  sort_order: integer('sort_order').default(0),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

export const menu_items = sqliteTable('menu_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  restaurant_id: integer('restaurant_id').notNull().references(() => restaurants.id),
  category_id: integer('category_id').references(() => categories.id),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  veg: integer('veg', { mode: 'boolean' }).default(true),
  spice_level: integer('spice_level').default(0),
  calories: integer('calories'),
  allergens: text('allergens').default('[]'),
  is_popular: integer('is_popular', { mode: 'boolean' }).default(false),
  is_chef_special: integer('is_chef_special', { mode: 'boolean' }).default(false),
  is_today_special: integer('is_today_special', { mode: 'boolean' }).default(false),
  in_stock: integer('in_stock', { mode: 'boolean' }).default(true),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`),
});

export const tables = sqliteTable('tables', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  restaurant_id: integer('restaurant_id').notNull().references(() => restaurants.id),
  table_number: integer('table_number').notNull(),
  label: text('label'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  restaurant_id: integer('restaurant_id').notNull().references(() => restaurants.id),
  table_id: integer('table_id').references(() => tables.id),
  device_id: text('device_id'),
  customer_name: text('customer_name'),
  customer_phone: text('customer_phone'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  session_id: text('session_id').references(() => sessions.id),
  restaurant_id: integer('restaurant_id').notNull().references(() => restaurants.id),
  table_id: integer('table_id').references(() => tables.id),
  items: text('items').notNull(),
  subtotal: real('subtotal').notNull(),
  tax: real('tax').notNull(),
  total: real('total').notNull(),
  status: text('status').default('pending'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

export const chat_messages = sqliteTable('chat_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  session_id: text('session_id').references(() => sessions.id),
  restaurant_id: integer('restaurant_id').notNull().references(() => restaurants.id),
  role: text('role').notNull(),
  content: text('content').notNull(),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

export const token_usage = sqliteTable('token_usage', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  restaurant_id: integer('restaurant_id').notNull().references(() => restaurants.id),
  session_id: text('session_id').references(() => sessions.id),
  model: text('model').notNull(),
  input_tokens: integer('input_tokens').notNull(),
  output_tokens: integer('output_tokens').notNull(),
  cost_usd: real('cost_usd').notNull(),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});
