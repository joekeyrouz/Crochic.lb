CREATE TABLE `admin_login_attempts` (
	`email` varchar(320) NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`windowStartedAt` timestamp NOT NULL,
	`lockedUntil` timestamp,
	CONSTRAINT `admin_login_attempts_email` PRIMARY KEY(`email`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);