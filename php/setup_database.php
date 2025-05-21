<?php
/**
 * Script para configurar la base de datos y verificar la conexión
 * Este archivo creará la base de datos y las tablas necesarias si no existen
 */

// Configuración de la base de datos
$DB_HOST = 'localhost';
$DB_USER = 'root';
$DB_PASS = '';
$DB_NAME = 'attention_monitor';

// Función para mostrar mensajes formateados
function showMessage($message, $type = 'info') {
    $color = 'black';
    switch ($type) {
        case 'success':
            $color = 'green';
            break;
        case 'error':
            $color = 'red';
            break;
        case 'warning':
            $color = 'orange';
            break;
    }
    echo "<div style='color: $color; margin: 10px 0;'>$message</div>";
}

// Intentar conectar a MySQL sin seleccionar base de datos
try {
    $conn = new PDO("mysql:host=$DB_HOST", $DB_USER, $DB_PASS);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    showMessage("✅ Conexión a MySQL exitosa", "success");
    
    // Crear base de datos si no existe
    $conn->exec("CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    showMessage("✅ Base de datos '$DB_NAME' creada o verificada correctamente", "success");
    
    // Seleccionar la base de datos
    $conn->exec("USE $DB_NAME");
    
    // Crear tabla de estudiantes si no existe
    $sqlCreateStudentsTable = "
    CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NULL,
        tutor_phone VARCHAR(20) NULL,
        notes TEXT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    
    $conn->exec($sqlCreateStudentsTable);
    showMessage("✅ Tabla 'students' creada o verificada correctamente", "success");
    
    // Crear tabla de eventos de atención si no existe
    $sqlCreateEventsTable = "
    CREATE TABLE IF NOT EXISTS attention_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_name VARCHAR(100) NOT NULL,
        state VARCHAR(50) NOT NULL,
        confidence FLOAT NOT NULL,
        event_time DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    
    $conn->exec($sqlCreateEventsTable);
    showMessage("✅ Tabla 'attention_events' creada o verificada correctamente", "success");

    // Mostrar estudiantes existentes
    $stmt = $conn->query("SELECT * FROM students");
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($students) > 0) {
        showMessage("🧑‍🎓 Estudiantes en la base de datos:", "info");
        echo "<table border='1' cellpadding='5' style='border-collapse: collapse;'>";
        echo "<tr><th>ID</th><th>Nombre</th><th>Email</th><th>Teléfono de tutor</th></tr>";
        foreach ($students as $student) {
            echo "<tr>";
            echo "<td>{$student['id']}</td>";
            echo "<td>{$student['name']}</td>";
            echo "<td>{$student['email']}</td>";
            echo "<td>{$student['tutor_phone']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        showMessage("ℹ️ No hay estudiantes en la base de datos", "info");
    }
    
} catch(PDOException $e) {
    showMessage("❌ Error de conexión/configuración: " . $e->getMessage(), "error");
}

// Verificar la configuración de PHP
showMessage("📊 Información de PHP:", "info");
echo "<div style='background-color: #f5f5f5; padding: 10px; border-radius: 5px;'>";
echo "PHP Version: " . phpversion() . "<br>";
echo "PDO Drivers: " . implode(", ", PDO::getAvailableDrivers()) . "<br>";
echo "Extensions: " . implode(", ", get_loaded_extensions()) . "<br>";
echo "</div>";

// Mostrar instrucciones adicionales
showMessage("📝 Instrucciones:", "info");
echo "<ol>";
echo "<li>Si todos los elementos anteriores tienen una marca de verificación verde (✅), la base de datos está configurada correctamente.</li>";
echo "<li>Si hay errores, asegúrate de que tu servidor MySQL esté en ejecución y que los credenciales sean correctos en php/config.php</li>";
echo "<li>Después de verificar que todo esté configurado correctamente, intenta nuevamente agregar un estudiante en la aplicación.</li>";
echo "</ol>";
?>

<style>
    body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        margin: 20px;
    }
    h1 {
        color: #333;
    }
</style>

<h1>Verificación de la Base de Datos - Sistema de Monitoreo de Atención Estudiantil</h1>

<div style="margin-top: 20px;">
    <a href="../index.html" style="padding: 10px 15px; background-color: #0071e3; color: white; text-decoration: none; border-radius: 5px;">Volver a la aplicación</a>
</div>
