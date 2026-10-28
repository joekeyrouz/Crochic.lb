CREATE TABLE `photo_library` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`url` varchar(500) NOT NULL,
	`storageKey` varchar(500) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`alt` varchar(200),
	`mimeType` varchar(100) NOT NULL,
	`fileSize` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `photo_library_id` PRIMARY KEY(`id`),
	CONSTRAINT `photo_library_storageKey_unique` UNIQUE(`storageKey`)
);
