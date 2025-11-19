-- E-Heritage Vault Seed Data (Odisha Only)
USE e_heritage_vault;

-- Insert Odisha state
INSERT INTO states (name, code, region) VALUES
('Odisha', 'OR', 'East');

-- Insert major Odisha cities
INSERT INTO cities (name, state_id, latitude, longitude, population, description) VALUES
('Bhubaneswar', 1, 20.2961, 85.8245, 837737, 'Capital city, known as the Temple City of India'),
('Puri', 1, 19.8135, 85.8312, 200564, 'Sacred coastal city, home to Jagannath Temple'),
('Konark', 1, 19.8876, 86.0944, 16000, 'Historic town famous for Sun Temple'),
('Cuttack', 1, 20.5124, 85.8829, 606007, 'Medieval capital and commercial hub'),
('Sambalpur', 1, 21.4669, 83.9812, 183383, 'Western Odisha city with rich tribal culture'),
('Rourkela', 1, 22.2604, 84.8536, 552398, 'Steel city of Odisha'),
('Berhampur', 1, 19.3150, 84.7941, 356598, 'Silk city of Odisha');

-- Insert famous Odisha monuments
INSERT INTO monuments (
    name, description, historical_period, built_year, dynasty, architecture_style,
    latitude, longitude, address, city_id, state_id, monument_type,
    entry_fee, opening_hours, closing_day, best_time_to_visit, visit_duration,
    accessibility_features, facilities, unesco_site, asi_protected, status
) VALUES
(
    'Konark Sun Temple',
    'A 13th-century CE sun temple shaped like a massive chariot with intricately carved stone wheels, pillars and walls. UNESCO World Heritage Site and architectural marvel.',
    'Medieval Period', 1250, 'Eastern Ganga Dynasty', 'Kalinga Architecture',
    19.8876, 86.0944, 'Konark, Puri District', 3, 1, 'Temple',
    40.00, '6:00 AM - 8:00 PM', 'None', 'October to March', 120,
    'Wheelchair accessible pathways, ramps available', 'Parking, restrooms, guides, cafeteria',
    TRUE, TRUE, 'Active'
),
(
    'Lingaraj Temple',
    'Ancient Hindu temple dedicated to Lord Shiva, largest temple in Bhubaneswar. Built in 11th century, exemplifies Kalinga architecture.',
    'Medieval Period', 1090, 'Somavamsi Dynasty', 'Kalinga Architecture',
    20.2380, 85.8360, 'Old Town, Bhubaneswar', 1, 1, 'Temple',
    0.00, '5:00 AM - 9:00 PM', 'None', 'October to March', 90,
    'Steps only, not wheelchair accessible', 'Parking nearby, restrooms, shoe stand',
    FALSE, TRUE, 'Active'
),
(
    'Jagannath Temple Puri',
    'One of the Char Dham pilgrimage sites, dedicated to Lord Jagannath. Famous for annual Rath Yatra (chariot festival).',
    'Medieval Period', 1161, 'Eastern Ganga Dynasty', 'Kalinga Architecture',
    19.8048, 85.8182, 'Grand Road, Puri', 2, 1, 'Temple',
    0.00, '5:00 AM - 11:00 PM', 'None', 'October to March', 180,
    'Limited accessibility, many steps', 'Parking, prasad shops, lodging nearby',
    FALSE, TRUE, 'Active'
),
(
    'Udayagiri and Khandagiri Caves',
    'Partly natural and partly artificial caves of archaeological, historical and religious importance. Dating back to 2nd century BCE.',
    'Ancient Period', -200, 'Mahameghavahana Dynasty', 'Rock-cut Architecture',
    20.2623, 85.7792, 'Khandagiri, Bhubaneswar', 1, 1, 'Cave',
    15.00, '7:00 AM - 6:00 PM', 'None', 'October to March', 120,
    'Steep climb, not suitable for wheelchairs', 'Parking, guides, small shops',
    FALSE, TRUE, 'Active'
),
(
    'Rajarani Temple',
    '11th-century Hindu temple known for erotic sculptures and unique architecture. Called "Love Temple" for romantic carvings.',
    'Medieval Period', 1100, 'Somavamsi Dynasty', 'Kalinga Architecture',
    20.2545, 85.8444, 'Tankapani Road, Bhubaneswar', 1, 1, 'Temple',
    10.00, '6:00 AM - 6:00 PM', 'None', 'October to March', 60,
    'Wheelchair accessible grounds', 'Parking, restrooms, garden',
    FALSE, TRUE, 'Active'
),
(
    'Dhauli Shanti Stupa',
    'Peace Pagoda built on the site of the historic Kalinga War. Rock edicts of Emperor Ashoka inscribed here.',
    'Ancient Period', 260, 'Mauryan Empire', 'Buddhist Architecture',
    20.1917, 85.8425, 'Dhauli Hills, Bhubaneswar', 1, 1, 'Archaeological',
    0.00, '6:00 AM - 7:00 PM', 'None', 'October to March', 90,
    'Wheelchair accessible', 'Parking, restrooms, viewpoint',
    FALSE, TRUE, 'Active'
),
(
    'Chilika Lake',
    "Asia's largest brackish water lagoon, haven for migratory birds. Not a monument but important heritage site.",
    'Natural Heritage', NULL, NULL, 'Natural',
    19.7168, 85.3240, 'Chilika, Multiple districts', 2, 1, 'Other',
    0.00, '6:00 AM - 6:00 PM', 'None', 'November to February', 240,
    'Boat access available', 'Parking, boat rides, resorts, restaurants',
    FALSE, FALSE, 'Active'
),
(
    'Bhitarkanika National Park',
    'Mangrove wetlands with rich biodiversity, crocodiles and nesting site for Olive Ridley sea turtles.',
    'Natural Heritage', NULL, NULL, 'Natural',
    20.7086, 87.0497, 'Kendrapara District', 4, 1, 'Heritage Village',
    50.00, '7:00 AM - 5:00 PM', 'None', 'November to February', 300,
    'Boat tours available', 'Parking, boat rides, guides, eco-lodges',
    FALSE, FALSE, 'Active'
);

-- Insert sample admin user (password: Admin@123)
INSERT INTO users (username, email, password_hash, full_name, role, email_verified, is_active) VALUES
('admin', 'admin@eheritage.com', '$2a$10$YourActualHashedPasswordHere', 'System Administrator', 'admin', TRUE, TRUE);

-- Insert sample regular user (password: User@123)
INSERT INTO users (username, email, password_hash, full_name, role, email_verified, is_active) VALUES
('tourist1', 'tourist@example.com', '$2a$10$YourActualHashedPasswordHere', 'John Doe', 'user', TRUE, TRUE);

-- Insert sample reviews
INSERT INTO reviews (monument_id, user_id, rating, title, comment, visit_date, status) VALUES
(1, 2, 5, 'Architectural Marvel!', 'The Konark Sun Temple is absolutely breathtaking. The intricate carvings and the sheer scale of the structure are mind-blowing.', '2024-12-15', 'approved'),
(2, 2, 4, 'Sacred and Serene', 'Lingaraj Temple is a spiritual experience. The architecture is stunning, though it gets very crowded during festivals.', '2024-11-20', 'approved');

-- Sample monument images (placeholder URLs)
INSERT INTO monument_images (monument_id, image_url, caption, is_primary, is_approved) VALUES
(1, 'https://example.com/konark-sun-temple-main.jpg', 'Main entrance of Konark Sun Temple', TRUE, TRUE),
(2, 'https://example.com/lingaraj-temple-main.jpg', 'Lingaraj Temple tower', TRUE, TRUE);
