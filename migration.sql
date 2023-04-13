DROP TABLE IF EXISTS destinations CASCADE;


CREATE TABLE destinations (
    id SERIAL PRIMARY KEY,
    country VARCHAR(200),
    city_state VARCHAR(100),
    climate text
);