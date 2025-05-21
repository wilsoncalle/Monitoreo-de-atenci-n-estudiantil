<?php
/**
 * Script para verificar y crear la base de datos y tablas
 */

// Activar registro de errores
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Configuración de la base de datos
define('DB_HOST', 'localhost');
define('DB_NAME', 'attention_monitor');
define('DB_USER', 'root');
define('DB_PASS', '');

echo "<html><head><title>Verificación de Base de Datos</title>";
echo "<style>body{font-family:Arial,sans-serif;margin:20px;line-height:1.6}
.success{color:green;font-weight:bold} .error{color:red;font-weight:bold}
.container{max-width:800px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:5px;box-shadow:0 0 10px rgba(0,0,0,0.1)}
h1{color:#333}</style>";
echo "</head><body><div class='container'>";
echo "<h1>Verificación de Base de Datos</h1>";

// 1. Verificar conexión al servidor MySQL
echo "<h2>1. Verificando conexión al servidor MySQL...</h2>";
try {
    $conn = new PDO("mysql:host=" . DB_HOST, DB_USER, DB_PASS);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<p class='success'>✓ Conexión exitosa al servidor MySQL.</p>";
} catch(PDOException $e) {
    echo "<p class='error'>✕ Error al conectar al servidor MySQL: " . $e->getMessage() . "</p>";
    echo "</div></body></html>";
    exit;
}

// 2. Verificar si la base de datos existe
echo "<h2>2. Verificando si la base de datos existe...</h2>";
try {
    $stmt = $conn->query("SHOW DATABASES LIKE '" . DB_NAME . "'");
    $dbExists = $stmt->rowCount() > 0;
    
    if ($dbExists) {
        echo "<p class='success'>✓ La base de datos '" . DB_NAME . "' existe.</p>";
    } else {
        echo "<p class='error'>✕ La base de datos '" . DB_NAME . "' no existe.</p>";
        echo "<p>Intentando crear la base de datos...</p>";
        
        // Crear la base de datos
        $conn->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
        echo "<p class='success'>✓ Base de datos '" . DB_NAME . "' creada exitosamente.</p>";
    }
} catch(PDOException $e) {
    echo "<p class='error'>✕ Error al verificar/crear la base de datos: " . $e->getMessage() . "</p>";
    echo "</div></body></html>";
    exit;
}

// 3. Conectar a la base de datos creada
echo "<h2>3. Conectando a la base de datos...</h2>";
try {
    $conn = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<p class='success'>✓ Conexión exitosa a la base de datos '" . DB_NAME . "'.</p>";
} catch(PDOException $e) {
    echo "<p class='error'>✕ Error al conectar a la base de datos: " . $e->getMessage() . "</p>";
    echo "</div></body></html>";
    exit;
}

// 4. Verificar si la tabla 'students' existe
echo "<h2>4. Verificando si la tabla 'students' existe...</h2>";
try {
    $stmt = $conn->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '" . DB_NAME . "' AND table_name = 'students'");
    $tableExists = $stmt->fetchColumn() > 0;
    
    if ($tableExists) {
        echo "<p class='success'>✓ La tabla 'students' existe.</p>";
        
        // Verificar estructura de la tabla
        echo "<h3>Verificando estructura de la tabla 'students'...</h3>";
        $stmt = $conn->query("DESCRIBE students");
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "<p>Columnas existentes: " . implode(", ", $columns) . "</p>";
        
        // Verificar si faltan columnas
        $requiredColumns = ['id', 'name', 'email', 'tutor_phone', 'notes', 'created_at', 'updated_at'];
        $missingColumns = array_diff($requiredColumns, $columns);
        
        if (empty($missingColumns)) {
            echo "<p class='success'>✓ La tabla tiene todas las columnas requeridas.</p>";
        } else {
            echo "<p class='error'>✕ Faltan columnas: " . implode(", ", $missingColumns) . "</p>";
            echo "<p>Intentando agregar columnas faltantes...</p>";
            
            // Agregar columnas faltantes
            foreach ($missingColumns as $column) {
                try {
                    switch ($column) {
                        case 'id':
                            $conn->exec("ALTER TABLE students ADD COLUMN id varchar(50) NOT NULL PRIMARY KEY");
                            break;
                        case 'name':
                            $conn->exec("ALTER TABLE students ADD COLUMN name varchar(255) NOT NULL");
                            break;
                        case 'email':
                            $conn->exec("ALTER TABLE students ADD COLUMN email varchar(255) DEFAULT NULL");
                            break;
                        case 'tutor_phone':
                            $conn->exec("ALTER TABLE students ADD COLUMN tutor_phone varchar(50) DEFAULT NULL");
                            break;
                        case 'notes':
                            $conn->exec("ALTER TABLE students ADD COLUMN notes TEXT DEFAULT NULL");
                            break;
                        case 'created_at':
                            $conn->exec("ALTER TABLE students ADD COLUMN created_at DATETIME DEFAULT NULL");
                            break;
                        case 'updated_at':
                            $conn->exec("ALTER TABLE students ADD COLUMN updated_at DATETIME DEFAULT NULL");
                            break;
                    }
                    echo "<p class='success'>✓ Columna '$column' agregada exitosamente.</p>";
                } catch(PDOException $e) {
                    echo "<p class='error'>✕ Error al agregar la columna '$column': " . $e->getMessage() . "</p>";
                }
            }
        }
    } else {
        echo "<p class='error'>✕ La tabla 'students' no existe.</p>";
        echo "<p>Intentando crear la tabla 'students'...</p>";
        
        // Crear la tabla
        $sql = "CREATE TABLE IF NOT EXISTS `students` (
            `id` varchar(50) NOT NULL,
            `name` varchar(255) NOT NULL,
            `email` varchar(255) DEFAULT NULL,
            `tutor_phone` varchar(50) DEFAULT NULL,
            `notes` TEXT DEFAULT NULL,
            `created_at` DATETIME DEFAULT NULL,
            `updated_at` DATETIME DEFAULT NULL,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
        
        $conn->exec($sql);
        echo "<p class='success'>✓ Tabla 'students' creada exitosamente.</p>";
    }
} catch(PDOException $e) {
    echo "<p class='error'>✕ Error al verificar/crear la tabla: " . $e->getMessage() . "</p>";
}

// 5. Probar inserción en la tabla
echo "<h2>5. Probando inserción en la tabla...</h2>";
try {
    $testId = "test_" . time();
    $stmt = $conn->prepare("INSERT INTO students (id, name, email, created_at, updated_at) VALUES (:id, :name, :email, NOW(), NOW())");
    $stmt->bindParam(':id', $testId);
    $name = "Usuario de Prueba";
    $stmt->bindParam(':name', $name);
    $email = "test@example.com";
    $stmt->bindParam(':email', $email);
    $stmt->execute();
    
    echo "<p class='success'>✓ Registro de prueba insertado correctamente con ID: $testId</p>";
    
    // Eliminar el registro de prueba
    $stmt = $conn->prepare("DELETE FROM students WHERE id = :id");
    $stmt->bindParam(':id', $testId);
    $stmt->execute();
    echo "<p>Registro de prueba eliminado.</p>";
} catch(PDOException $e) {
    echo "<p class='error'>✕ Error al probar inserción: " . $e->getMessage() . "</p>";
}

echo "<h2>Resumen</h2>";
echo "<p>Si todos los pasos anteriores tienen una marca de verificación (✓), tu base de datos está correctamente configurada.</p>";
echo "<p>Puedes intentar guardar un estudiante nuevamente en tu aplicación.</p>";

echo "</div></body></html>";
?>
