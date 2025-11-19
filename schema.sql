-- E-Heritage Vault Database Schema (Odisha Edition)
-- Drop and create database
DROP DATABASE IF EXISTS e_heritage_vault;
CREATE DATABASE e_heritage_vault CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE e_heritage_vault;

-- States table
CREATE TABLE states (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    region ENUM('North', 'South', 'East', 'West', 'Central', 'Northeast') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Cities table
CREATE TABLE cities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    state_id INT NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    population INT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE,
    INDEX idx_state (state_id),
    INDEX idx_location (latitude, longitude),
    UNIQUE KEY unique_city_state (name, state_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Monuments table
CREATE TABLE monuments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    historical_period VARCHAR(100),
    built_year INT,
    dynasty VARCHAR(100),
    architecture_style VARCHAR(100),
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    address TEXT,
    city_id INT NOT NULL,
    state_id INT NOT NULL,
    monument_type ENUM('Temple', 'Fort', 'Palace', 'Archaeological', 'Museum', 'Heritage Village', 'Sacred Grove', 'Cave', 'Stepwell', 'Other') NOT NULL,
    entry_fee DECIMAL(10,2) DEFAULT 0.00,
    opening_hours VARCHAR(100),
    closing_day VARCHAR(50),
    best_time_to_visit VARCHAR(100),
    visit_duration INT COMMENT 'In minutes',
    accessibility_features TEXT,
    facilities TEXT,
    ar_available BOOLEAN DEFAULT FALSE,
    vr_available BOOLEAN DEFAULT FALSE,
    audio_guide_available BOOLEAN DEFAULT FALSE,
    unesco_site BOOLEAN DEFAULT FALSE,
    asi_protected BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    total_visitors INT DEFAULT 0,
    status ENUM('Active', 'Under Renovation', 'Closed', 'Seasonal') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE,
    FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE,
    INDEX idx_location (latitude, longitude),
    INDEX idx_type (monument_type),
    INDEX idx_city (city_id),
    INDEX idx_state (state_id),
    INDEX idx_rating (rating),
    INDEX idx_status (status),
    FULLTEXT idx_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    profile_image VARCHAR(255),
    bio TEXT,
    phone VARCHAR(20),
    date_of_birth DATE,
    city VARCHAR(100),
    state VARCHAR(100),
    role ENUM('user', 'admin', 'moderator', 'guide') DEFAULT 'user',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Reviews table
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    monument_id INT NOT NULL,
    user_id INT NOT NULL,
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    comment TEXT,
    visit_date DATE,
    helpful_count INT DEFAULT 0,
    reported_count INT DEFAULT 0,
    is_verified_visit BOOLEAN DEFAULT FALSE,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (monument_id) REFERENCES monuments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_monument (monument_id),
    INDEX idx_user (user_id),
    INDEX idx_rating (rating),
    INDEX idx_status (status),
    UNIQUE KEY unique_user_monument_review (user_id, monument_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Favorites table
CREATE TABLE favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    monument_id INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (monument_id) REFERENCES monuments(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (user_id, monument_id),
    INDEX idx_user (user_id),
    INDEX idx_monument (monument_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Monument Images table
CREATE TABLE monument_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    monument_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    thumbnail_url VARCHAR(255),
    caption TEXT,
    uploaded_by INT,
    image_type ENUM('exterior', 'interior', 'detail', 'aerial', 'historical', 'other') DEFAULT 'exterior',
    is_primary BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (monument_id) REFERENCES monuments(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_monument (monument_id),
    INDEX idx_primary (is_primary),
    INDEX idx_approved (is_approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Visit History table
CREATE TABLE visit_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    monument_id INT NOT NULL,
    visit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_minutes INT,
    rating_given BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (monument_id) REFERENCES monuments(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_monument (monument_id),
    INDEX idx_date (visit_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
