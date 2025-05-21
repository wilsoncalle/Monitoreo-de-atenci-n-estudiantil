<?php
/**
 * Eliminar estudiante de la base de datos
 */

// Incluir configuración de la base de datos
require_once 'config.php';

// Establecer encabezados para respuesta JSON
header('Content-Type: application/json');

// Verificar si la solicitud es POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// Obtener datos POST como JSON
$postData = json_decode(file_get_contents('php://input'), true);

if (!$postData) {
    echo json_encode(['success' => false, 'message' => 'Datos no válidos']);
    exit;
}

// Extraer ID del estudiante
$student_id = isset($postData['id']) ? $postData['id'] : null;

// Validar datos
if (!$student_id) {
    echo json_encode(['success' => false, 'message' => 'ID de estudiante no proporcionado']);
    exit;
}

// Conectar a la base de datos
$conn = connectDB();

// Verificar conexión
if (!$conn) {
    echo json_encode(['success' => false, 'message' => 'Error de conexión a la base de datos']);
    exit;
}

try {
    // Preparar consulta para eliminar estudiante
    $stmt = $conn->prepare("DELETE FROM students WHERE id = :student_id");
    
    // Vincular parámetros
    $stmt->bindParam(':student_id', $student_id);
    
    // Ejecutar consulta
    $stmt->execute();
    
    // Verificar si se eliminó alguna fila
    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Estudiante eliminado correctamente'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No se encontró el estudiante con ID ' . $student_id
        ]);
    }
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
