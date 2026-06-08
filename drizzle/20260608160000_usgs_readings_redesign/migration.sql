DROP TABLE `usgs_readings`;
--> statement-breakpoint
CREATE TABLE `usgs_readings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`location_id` int unsigned NOT NULL,
	`recorded_at` timestamp NOT NULL,
	`time_slot` enum('midnight','early_morning','morning','noon','afternoon','evening') NOT NULL,
	`parameter_code` varchar(10) NOT NULL,
	`computation_identifier` varchar(100) NOT NULL,
	`parameter_name` varchar(100) NOT NULL,
	`value` decimal(12,3) NOT NULL,
	`unit` varchar(20) NOT NULL,
	CONSTRAINT `usgs_readings_id` PRIMARY KEY(`id`),
	CONSTRAINT `location_recorded_parameter_unique` UNIQUE(`location_id`,`recorded_at`,`parameter_code`)
);
--> statement-breakpoint
ALTER TABLE `usgs_readings` ADD CONSTRAINT `usgs_readings_location_id_locations_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
