DROP DATABASE IF EXISTS houselens;
CREATE DATABASE houselens;
USE houselens;

CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    price INT,
    date DATE,
    postcode VARCHAR(20),
    property_type CHAR(1),
    street VARCHAR(255),
    locality VARCHAR(255),
    town VARCHAR(255),
    borough VARCHAR(255),
    county VARCHAR(255),
    lat DECIMAL(10,6),
    lng DECIMAL(10,6)
);

LOAD DATA LOCAL INFILE 'D:\\UCL\\HouseLens\\Front\\data\\london_2021_2025_geo.csv'
INTO TABLE transactions
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(price, @date_str, postcode, property_type, street, locality, town, borough, county, @postcode_dup, lat, lng)
SET date = STR_TO_DATE(@date_str, '%Y/%m/%d %H:%i');
