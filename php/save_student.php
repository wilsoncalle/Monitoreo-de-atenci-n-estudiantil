<?php
/**
 * Guardar estudiante en la base de datos
 * Este script maneja la creación y actualización de estudiantes
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

// Extraer datos del estudiante y registrarlos para depuración
$debug_data = [];
$debug_data['post_data'] = $postData;

$student_id = isset($postData['id']) ? $postData['id'] : null;
$name = isset($postData['name']) ? $postData['name'] : '';
$email = isset($postData['email']) ? $postData['email'] : null;
$tutor_phone = isset($postData['tutorPhone']) ? $postData['tutorPhone'] : null;
$notes = isset($postData['notes']) ? $postData['notes'] : null;

// Registrar los datos extraídos para depuración
$debug_data['extracted_data'] = [
    'student_id' => $student_id,
    'name' => $name,
    'email' => $email,
    'tutor_phone' => $tutor_phone,
    'notes' => $notes
];

logError('Datos recibidos: ' . json_encode($debug_data));

// Validar datos
if (empty($name)) {
    echo json_encode(['success' => false, 'message' => 'El nombre del estudiante es obligatorio']);
    exit;
}

// Conectar a la base de datos
$conn = connectDB();

// Verificar conexión
if (!$conn) {
    // Verificar si la base de datos existe
    try {
        $checkConn = new PDO(
            "mysql:host=" . DB_HOST,
            DB_USER,
            DB_PASS
        );
        
        $checkConn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Verificar si la base de datos existe
        $stmt = $checkConn->query("SHOW DATABASES LIKE '".DB_NAME."'");
        $dbExists = $stmt->rowCount() > 0;
        
        if (!$dbExists) {
            logError('La base de datos '.DB_NAME.' no existe');
            echo json_encode(['success' => false, 'message' => 'Error: La base de datos no existe', 'debug' => 'Base de datos '.DB_NAME.' no encontrada']);
            exit;
        } else {
            // Verificar si la tabla existe
            $stmt = $checkConn->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '" . DB_NAME . "' AND table_name = 'students'");
            $tableExists = $stmt->fetchColumn() > 0;
            
            if (!$tableExists) {
                logError('La tabla students no existe en la base de datos '.DB_NAME);
                echo json_encode(['success' => false, 'message' => 'Error: La tabla de estudiantes no existe', 'debug' => 'Tabla students no encontrada']);
                exit;
            }
        }
    } catch(PDOException $e) {
        logError('Error al verificar base de datos: ' . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error de conexión a la base de datos', 'debug' => $e->getMessage()]);
        exit;
    }
    
    echo json_encode(['success' => false, 'message' => 'Error de conexión a la base de datos']);
    exit;
}

try {
    // Primero verificar si el estudiante ya existe en la base de datos
    $existe = false;
    if ($student_id) {
        $check = $conn->prepare("SELECT COUNT(*) FROM students WHERE id = :id");
        $check->bindParam(':id', $student_id);
        $check->execute();
        $existe = ($check->fetchColumn() > 0);
    }
    
    // Registrar la operación que se va a realizar basada en la existencia real en la BD
    $operacion = $existe ? 'actualización' : 'inserción';
    logError("Iniciando operación de {$operacion} para estudiante con ID: {$student_id} (existe en BD: " . ($existe ? 'SÍ' : 'NO') . ")");
    
    // Verificar si es una actualización o inserción
    if ($existe) {
        // Actualizar estudiante existente
        $query = "
            UPDATE students 
            SET name = :name, 
                email = :email, 
                tutor_phone = :tutor_phone, 
                notes = :notes,
                updated_at = NOW()
            WHERE id = :student_id
        ";
        logError("Consulta de actualización: {$query}");
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':student_id', $student_id);
    } else {
        // Crear nuevo estudiante
        $query = "
            INSERT INTO students (id, name, email, tutor_phone, notes, created_at, updated_at)
            VALUES (:student_id, :name, :email, :tutor_phone, :notes, NOW(), NOW())
        ";
        logError("Consulta de inserción: {$query}");
        
        $stmt = $conn->prepare($query);
        // Usar el ID generado en JavaScript
        $stmt->bindParam(':student_id', $student_id);
    }
    
    // Vincular parámetros
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':tutor_phone', $tutor_phone);
    $stmt->bindParam(':notes', $notes);
    
    // Registrar valores que se van a insertar
    $params = [
        'student_id' => $student_id,
        'name' => $name,
        'email' => $email,
        'tutor_phone' => $tutor_phone,
        'notes' => $notes
    ];
    logError("Parámetros para la consulta: " . json_encode($params));
    
    // Ejecutar consulta
    $result = $stmt->execute();
    
    // Verificar si la ejecución fue exitosa
    if ($result) {
        logError("Consulta ejecutada con éxito para estudiante ID: {$student_id}");
    } else {
        logError("Error al ejecutar consulta para estudiante ID: {$student_id}");
        logError("Error info: " . json_encode($stmt->errorInfo()));
    }
    
    // Si es un nuevo estudiante y no tenemos ID, generar uno
    // Sin embargo, ya deberíamos tener un ID desde JavaScript
    if (!$student_id) {
        // Solo como medida de seguridad, no deberíamos llegar aquí normalmente
        $student_id = uniqid('fallback_', true);
        logError('ADVERTENCIA: No se recibió ID para un nuevo estudiante, generando ID de emergencia: ' . $student_id);
    }
    
    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'message' => 'Estudiante guardado correctamente',
        'student_id' => $student_id
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
