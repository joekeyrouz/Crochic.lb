ALTER TABLE `reviews` MODIFY COLUMN `approved` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `reviews` ADD `orderItemId` bigint unsigned;--> statement-breakpoint
ALTER TABLE `reviews` ADD `customerId` bigint unsigned;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_order_item_unique` UNIQUE(`orderItemId`);--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_orderItemId_order_items_id_fk` FOREIGN KEY (`orderItemId`) REFERENCES `order_items`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `reviews_customer_idx` ON `reviews` (`customerId`);