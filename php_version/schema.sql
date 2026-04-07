-- Strategy Builder Pro - Database Schema
-- Run this in your MySQL database (e.g., via phpMyAdmin)

CREATE DATABASE IF NOT EXISTS strategy_builder;
USE strategy_builder;

-- Strategies Table
CREATE TABLE IF NOT EXISTS strategies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Rules Table
CREATE TABLE IF NOT EXISTS rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    strategy_id INT NOT NULL,
    text TEXT NOT NULL,
    checked TINYINT(1) DEFAULT 0,
    FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Initial Data
INSERT INTO strategies (name) VALUES ('Default Strategy');
INSERT INTO rules (strategy_id, text, checked) VALUES (1, 'Define Objectives', 1), (1, 'Identify Risks', 0), (1, 'Allocate Resources', 0);
