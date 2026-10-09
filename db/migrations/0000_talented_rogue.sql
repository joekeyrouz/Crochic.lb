CREATE TABLE `categories` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`slug` varchar(140) NOT NULL,
	`description` text,
	`image` varchar(500),
	`active` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(60),
	`address` varchar(300),
	`city` varchar(120),
	`country` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletter_subscribers` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `newsletter_subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletter_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`orderId` bigint unsigned NOT NULL,
	`productId` bigint unsigned NOT NULL,
	`productName` varchar(200) NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`quantity` int NOT NULL,
	`lineTotal` decimal(10,2) NOT NULL,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_status_history` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`orderId` bigint unsigned NOT NULL,
	`status` varchar(40) NOT NULL,
	`note` varchar(300),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_status_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(40) NOT NULL,
	`customerId` bigint unsigned NOT NULL,
	`status` enum('pending','confirmed','preparing','ready','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`subtotal` decimal(10,2) NOT NULL,
	`deliveryFee` decimal(10,2) NOT NULL DEFAULT '0',
	`total` decimal(10,2) NOT NULL,
	`paymentMethod` varchar(40) NOT NULL DEFAULT 'cod',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_number_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`productId` bigint unsigned NOT NULL,
	`url` varchar(500) NOT NULL,
	`alt` varchar(200),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isPrimary` boolean NOT NULL DEFAULT false,
	CONSTRAINT `product_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`slug` varchar(220) NOT NULL,
	`sku` varchar(60) NOT NULL,
	`categoryId` bigint unsigned NOT NULL,
	`description` text,
	`shortDescription` varchar(400),
	`price` decimal(10,2) NOT NULL,
	`salePrice` decimal(10,2),
	`stock` int NOT NULL DEFAULT 0,
	`materials` varchar(400),
	`dimensions` varchar(200),
	`careInstructions` text,
	`featured` boolean NOT NULL DEFAULT false,
	`isNew` boolean NOT NULL DEFAULT false,
	`active` boolean NOT NULL DEFAULT true,
	`seoTitle` varchar(200),
	`seoDescription` varchar(400),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`customerName` varchar(120) NOT NULL,
	`review` text NOT NULL,
	`rating` int NOT NULL DEFAULT 5,
	`approved` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text,
	CONSTRAINT `site_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`unionId` varchar(255) NOT NULL,
	`name` varchar(255),
	`email` varchar(320),
	`avatar` text,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	`lastSignInAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_unionId_unique` UNIQUE(`unionId`)
);
--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_status_history` ADD CONSTRAINT `order_status_history_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `customers_email_idx` ON `customers` (`email`);--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`orderId`);--> statement-breakpoint
CREATE INDEX `order_status_history_order_idx` ON `order_status_history` (`orderId`);--> statement-breakpoint
CREATE INDEX `orders_customer_idx` ON `orders` (`customerId`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `product_images_product_idx` ON `product_images` (`productId`);--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`categoryId`);--> statement-breakpoint
CREATE INDEX `products_active_idx` ON `products` (`active`);