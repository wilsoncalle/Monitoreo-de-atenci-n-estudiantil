<?php
/**
 * Save event to database for Student Attention Monitoring System
 */

// Include database configuration
require_once 'config.php';

// Set headers for JSON response
header('Content-Type: application/json');

// Check if request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get POST data
$student_name = isset($_POST['student_name']) ? $_POST['student_name'] : 'Unknown';
$state = isset($_POST['state']) ? $_POST['state'] : '';
$confidence = isset($_POST['confidence']) ? floatval($_POST['confidence']) : 0;
$timestamp = isset($_POST['timestamp']) ? $_POST['timestamp'] : date('Y-m-d H:i:s');

// Validate data
if (empty($state)) {
    echo json_encode(['success' => false, 'message' => 'State is required']);
    exit;
}

// Connect to database
$conn = connectDB();

// Check connection
if (!$conn) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

try {
    // Prepare SQL statement
    $stmt = $conn->prepare("
        INSERT INTO attention_events (student_name, state, confidence, event_time)
        VALUES (:student_name, :state, :confidence, :event_time)
    ");
    
    // Bind parameters
    $stmt->bindParam(':student_name', $student_name);
    $stmt->bindParam(':state', $state);
    $stmt->bindParam(':confidence', $confidence);
    $stmt->bindParam(':event_time', $timestamp);
    
    // Execute query
    $stmt->execute();
    
    // Get last insert ID
    $event_id = $conn->lastInsertId();
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Event saved successfully',
        'event_id' => $event_id
    ]);
} catch(PDOException $e) {
    // Return error response
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

// Close connection
$conn = null;
?>
