-- Database setup for Student Attention Monitoring System

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS attention_monitor;

-- Use the database
USE attention_monitor;

-- Create table for attention events
CREATE TABLE IF NOT EXISTS attention_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    confidence FLOAT NOT NULL,
    event_time DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_student_state ON attention_events(student_name, state);
CREATE INDEX idx_event_time ON attention_events(event_time);

-- Create table for students (optional, for future expansion)
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    tutor_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data (optional)
INSERT INTO students (name, email, tutor_phone) VALUES
('Juan Pérez', 'juan@example.com', '5491123456789'),
('María García', 'maria@example.com', '5491187654321');
