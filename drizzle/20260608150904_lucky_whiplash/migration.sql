CREATE TABLE `data_migrations` (
	`name` varchar(255) PRIMARY KEY,
	`applied_at` timestamp NOT NULL DEFAULT (now())
);
