CREATE TABLE `weather_daily` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`location_id` int unsigned NOT NULL,
	`date` date NOT NULL,
	`temp_max` decimal(5,2),
	`temp_min` decimal(5,2),
	`temp_mean` decimal(5,2),
	`precipitation_sum` decimal(6,3),
	`weather_code` int,
	`wind_speed_max` decimal(6,2),
	`cloud_cover_min` decimal(5,2),
	`cloud_cover_max` decimal(5,2),
	`cloud_cover_mean` decimal(5,2),
	CONSTRAINT `location_date_unique` UNIQUE INDEX(`location_id`,`date`),
	CONSTRAINT `weather_daily_location_id_locations_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`)
);
--> statement-breakpoint
ALTER TABLE `locations` MODIFY COLUMN `coordinates` POINT SRID 4326;