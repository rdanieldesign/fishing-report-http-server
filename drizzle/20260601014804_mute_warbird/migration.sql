ALTER TABLE `locations` MODIFY COLUMN `coordinates` POINT NULL SRID 4326;--> statement-breakpoint
ALTER TABLE `report_images` MODIFY COLUMN `reportId` int unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `locations` DROP COLUMN `googleMapsLink`;