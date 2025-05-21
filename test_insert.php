<?php
/**
 * Script para probar la inserción de un estudiante directamente
 */

// Incluir configuración de la base de datos
require_once 'php/config.php';

echo "<html><head><title>Prueba de Inserción</title>";
echo "<style>body{font-family:Arial,sans-serif;margin:20px;line-height:1.6}
.success{color:green;font-weight:bold} .error{color:red;font-weight:bold}
pre{background:#f5f5f5;padding:10px;border-radius:5px;overflow:auto}
.container{max-width:800px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:5px;box-shadow:0 0 10px rgba(0,0,0,0.1)}
h1{color:#333}</style>";
echo "</head><body><div class='container'>";
echo "<h1>Prueba de Inserción de Estudiante</h1>";

// Generar un ID único
function generateId() {
    return 'test_' . substr(md5(uniqid(mt_rand(), true)), 0, 10) . time();
}

// Datos de prueba
$studentData = [
    'id' => generateId(),
    'name' => 'Estudiante de Prueba',
    'email' => 'prueba@ejemplo.com',
    'tutor_phone' => '5491123456789',
    'notes' => 'Nota de prueba insertada directamente'
];

echo "<h2>Datos a insertar:</h2>";
echo "<pre>" . print_r($studentData, true) . "</pre>";

// Conectar a la base de datos
$conn = connectDB();

if (!$conn) {
    echo "<p class='error'>Error al conectar a la base de datos.</p>";
    echo "</div></body></html>";
    exit;
}

try {
    // Preparar inserción
    $stmt = $conn->prepare("
        INSERT INTO students (id, name, email, tutor_phone, notes, created_at, updated_at)
        VALUES (:id, :name, :email, :tutor_phone, :notes, NOW(), NOW())
    ");
    
    // Vincular parámetros
    $stmt->bindParam(':id', $studentData['id']);
    $stmt->bindParam(':name', $studentData['name']);
    $stmt->bindParam(':email', $studentData['email']);
    $stmt->bindParam(':tutor_phone', $studentData['tutor_phone']);
    $stmt->bindParam(':notes', $studentData['notes']);
    
    // Ejecutar consulta
    $stmt->execute();
    
    echo "<p class='success'>✓ Estudiante insertado correctamente con ID: " . $studentData['id'] . "</p>";
    
    // Verificar inserción
    $stmt = $conn->prepare("SELECT * FROM students WHERE id = :id");
    $stmt->bindParam(':id', $studentData['id']);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "<h2>Registro insertado en la base de datos:</h2>";
    echo "<pre>" . print_r($result, true) . "</pre>";
    
    // Eliminar el registro de prueba
    $stmt = $conn->prepare("DELETE FROM students WHERE id = :id");
    $stmt->bindParam(':id', $studentData['id']);
    $stmt->execute();
    echo "<p>Registro de prueba eliminado.</p>";
    
} catch(PDOException $e) {
    echo "<p class='error'>Error al insertar estudiante: " . $e->getMessage() . "</p>";
}

echo "</div></body></html>";
?>
