CREATE TABLE `email_login_codes` (
	`email` varchar(320) NOT NULL,
	`codeHash` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`sends` int NOT NULL DEFAULT 1,
	`windowStartedAt` timestamp NOT NULL,
	`sentAt` timestamp NOT NULL,
	CONSTRAINT `email_login_codes_email` PRIMARY KEY(`email`)
);
--> statement-breakpoint
CREATE INDEX `email_login_codes_window_idx` ON `email_login_codes` (`windowStartedAt`);