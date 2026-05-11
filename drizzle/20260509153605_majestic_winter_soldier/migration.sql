CREATE TABLE `report_images` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`reportId` int unsigned NOT NULL,
	`imageKey` varchar(500),
	`status` enum('uploading','complete','failed') NOT NULL DEFAULT 'uploading',
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `report_images_reportId_reports_id_fk` FOREIGN KEY (`reportId`) REFERENCES `reports`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `report_images` (`reportId`, `imageKey`, `status`)
SELECT r.`id`, jt.`imageKey`, 'complete'
FROM `reports` r
CROSS JOIN JSON_TABLE(r.`imageIds`, '$[*]' COLUMNS (`imageKey` VARCHAR(500) PATH '$')) AS jt
WHERE r.`imageIds` IS NOT NULL
  AND r.`imageIds` != '[]'
  AND JSON_VALID(r.`imageIds`);
--> statement-breakpoint
ALTER TABLE `reports` DROP COLUMN `imageIds`;