-- Create database
CREATE DATABASE IF NOT EXISTS promoteam;
USE promoteam;

-- Users table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  insta_username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'promoter') DEFAULT 'promoter',
  points_total INT DEFAULT 0,
  status ENUM('active', 'suspended', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  INDEXES (email, insta_username, points_total)
) ENGINE=InnoDB;

-- Invites table
CREATE TABLE invites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(100) UNIQUE NOT NULL,
  created_by INT NOT NULL,
  used_by INT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (used_by) REFERENCES users(id),
  INDEX (code, expires_at)
) ENGINE=InnoDB;

-- Missions table
CREATE TABLE missions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  action_type ENUM('like', 'comment', 'share', 'story', 'post', 'follow') NOT NULL,
  points_per_proof INT DEFAULT 1,
  max_per_user INT DEFAULT 10,
  deadline TIMESTAMP NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (active, deadline)
) ENGINE=InnoDB;

-- Proofs table
CREATE TABLE proofs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  mission_id INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  images_count INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  reviewed_by INT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id),
  INDEX (user_id, status),
  INDEX (mission_id, status),
  INDEX (created_at)
) ENGINE=InnoDB;

-- Proof images table
CREATE TABLE proof_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  proof_id INT NOT NULL,
  image_path VARCHAR(500) NOT NULL,
  image_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proof_id) REFERENCES proofs(id) ON DELETE CASCADE,
  INDEX (image_hash),
  UNIQUE KEY unique_hash (image_hash)
) ENGINE=InnoDB;

-- Points history table
CREATE TABLE points_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  proof_id INT NOT NULL,
  points INT NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (proof_id) REFERENCES proofs(id) ON DELETE CASCADE,
  INDEX (user_id, created_at),
  INDEX (created_at)
) ENGINE=InnoDB;

-- Admin logs table
CREATE TABLE admin_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_id INT,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id),
  INDEX (admin_id, action),
  INDEX (created_at)
) ENGINE=InnoDB;

-- Create initial admin user (password: admin123)
INSERT INTO users (first_name, last_name, insta_username, email, password_hash, role)
VALUES ('Admin', 'Promoteam', 'promoteam_admin', 'admin@promoteam.sauroraa.be', 
        '$2a$10$k1gn.FY8TvIQcV4uR8.cKON3qSYqA5zJB1L0K0C0M0E0P0Q0R0S0T0U0', 'admin');
