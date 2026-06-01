SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'locations'
    AND column_name = 'coordinates'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `locations` ADD `coordinates` POINT NULL SRID 4326',
  'SELECT ''coordinates column already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- TODO: Once all rows are backfilled, add a migration to MODIFY to NOT NULL and add SPATIAL INDEX.