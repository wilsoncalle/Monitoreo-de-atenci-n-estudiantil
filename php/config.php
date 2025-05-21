<?php
/**
 * Database configuration for Student Attention Monitoring System
 */

// Activar registro de errores
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Database connection settings
define('DB_HOST', 'localhost');
define('DB_NAME', 'attention_monitor');
define('DB_USER', 'root');
define('DB_PASS', '');

// Crear archivo de log
function logError($message) {
    $logFile = __DIR__ . '/../logs/db_errors.log';
    $dir = dirname($logFile);
    
    // Crear directorio de logs si no existe
    if (!file_exists($dir)) {
        mkdir($dir, 0777, true);
    }
    
    // Añadir mensaje de error al archivo
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . $message . "\n", FILE_APPEND);
}

// Connect to database
function connectDB() {
    try {
        $conn = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME,
            DB_USER,
            DB_PASS,
            array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8")
        );
        
        // Set error mode to exception
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        return $conn;
    } catch(PDOException $e) {
        // Registrar error en archivo de log
        logError('Error de conexión a la base de datos: ' . $e->getMessage());
        return false;
    }
}
?>
