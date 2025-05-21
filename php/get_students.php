<?php
/**
 * Obtener lista de estudiantes desde la base de datos
 */

// Incluir configuración de la base de datos
require_once 'config.php';

// Establecer encabezados para respuesta JSON
header('Content-Type: application/json');

// Conectar a la base de datos
$conn = connectDB();

// Verificar conexión
if (!$conn) {
    echo json_encode(['success' => false, 'message' => 'Error de conexión a la base de datos']);
    exit;
}

try {
    // Preparar consulta para obtener todos los estudiantes
    $stmt = $conn->prepare("
        SELECT id, name, email, tutor_phone, notes, 
               DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
               DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
        FROM students
        ORDER BY name ASC
    ");
    
    // Ejecutar consulta
    $stmt->execute();
    
    // Obtener resultados
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Formatear datos para JavaScript
    $formattedStudents = array_map(function($student) {
        return [
            'id' => $student['id'],
            'name' => $student['name'],
            'email' => $student['email'],
            'tutorPhone' => $student['tutor_phone'],
            'notes' => $student['notes'],
            'createdAt' => $student['created_at'],
            'updatedAt' => $student['updated_at']
        ];
    }, $students);
    
    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'students' => $formattedStudents
    ]);
} catch(PDOException $e) {
    // Respuesta de error
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage()
    ]);
}

// Cerrar conexión
$conn = null;
?>
