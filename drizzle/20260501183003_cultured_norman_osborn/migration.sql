ALTER TABLE `locations` ADD COLUMN IF NOT EXISTS `usgs_location_id` varchar(50);

CREATE TABLE IF NOT EXISTS `usgs_readings` (
  `id` varchar(100) NOT NULL,
  `post_id` int unsigned NOT NULL,
  `parameter_code` varchar(10) NOT NULL,
  `computation_identifier` varchar(100) NOT NULL,
  `parameter_name` varchar(100) NOT NULL,
  `value` decimal(12,3) NOT NULL,
  `unit` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `usgs_readings_post_id_reports_id_fk`
    FOREIGN KEY (`post_id`) REFERENCES `reports`(`id`) ON DELETE CASCADE
);
