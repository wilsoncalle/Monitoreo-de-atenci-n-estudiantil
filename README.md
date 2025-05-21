# Student Attention Monitoring System

This web application uses machine learning to monitor student attention during classes. The system uses a webcam to detect if a student is:

- Attentive (looking forward)
- Using a cell phone
- Sleeping or distracted

## Features

- Real-time detection using a Teachable Machine model
- Event logging with timestamps
- WhatsApp integration for sending alerts to teachers/tutors
- MySQL database for storing attention events

## Setup Instructions

1. Train your model in Teachable Machine (https://teachablemachine.withgoogle.com/)
2. Export the model and place the model files in the `model` directory
3. Set up the MySQL database using the provided SQL script
4. Open `index.html` in a web browser with camera permissions

## Technologies Used

- HTML, CSS, JavaScript
- TensorFlow.js
- Teachable Machine
- MySQL
- Bootstrap for UI
