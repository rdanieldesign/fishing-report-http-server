-- Clear coordinates stored without SRID 4326 so they can be re-entered
-- correctly via the API (which uses ST_GeomFromText with axis-order=long-lat).
UPDATE `locations` SET `coordinates` = NULL;
