CREATE TABLE `admins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`restaurant_id` integer,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admins_email_unique` ON `admins` (`email`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`restaurant_id` integer NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` text,
	`restaurant_id` integer NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`restaurant_id` integer NOT NULL,
	`category_id` integer,
	`name` text NOT NULL,
	`description` text,
	`price` real NOT NULL,
	`veg` integer DEFAULT true,
	`spice_level` integer DEFAULT 0,
	`calories` integer,
	`allergens` text DEFAULT '[]',
	`is_popular` integer DEFAULT false,
	`is_chef_special` integer DEFAULT false,
	`is_today_special` integer DEFAULT false,
	`in_stock` integer DEFAULT true,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` text,
	`restaurant_id` integer NOT NULL,
	`table_id` integer,
	`items` text NOT NULL,
	`subtotal` real NOT NULL,
	`tax` real NOT NULL,
	`total` real NOT NULL,
	`status` text DEFAULT 'pending',
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`table_id`) REFERENCES `tables`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `restaurant_configs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`restaurant_id` integer NOT NULL,
	`ai_personality` text DEFAULT 'friendly',
	`ai_greeting` text,
	`custom_knowledge` text,
	`languages` text DEFAULT '["English"]',
	`updated_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `restaurants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`logo_emoji` text DEFAULT '🍽️',
	`address` text,
	`cuisine_type` text,
	`currency` text DEFAULT 'INR',
	`status` text DEFAULT 'active',
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `restaurants_slug_unique` ON `restaurants` (`slug`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`restaurant_id` integer NOT NULL,
	`table_id` integer,
	`device_id` text,
	`customer_name` text,
	`customer_phone` text,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`table_id`) REFERENCES `tables`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tables` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`restaurant_id` integer NOT NULL,
	`table_number` integer NOT NULL,
	`label` text,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `token_usage` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`restaurant_id` integer NOT NULL,
	`session_id` text,
	`model` text NOT NULL,
	`input_tokens` integer NOT NULL,
	`output_tokens` integer NOT NULL,
	`cost_usd` real NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
