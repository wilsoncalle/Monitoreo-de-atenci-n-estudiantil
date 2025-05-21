/**
 * Gestión de estudiantes para el Sistema de Monitoreo de Atención Estudiantil
 * Este módulo maneja la selección, creación, edición y eliminación de estudiantes
 */

const Students = (function() {
    // Clave para almacenamiento en localStorage
    const STUDENTS_STORAGE_KEY = 'focus_monitor_students';
    const CURRENT_STUDENT_KEY = 'focus_monitor_current_student';

    // Estudiante que se está editando actualmente
    let currentEditingStudent = null;

    // Inicializar el módulo
    function init() {
        // Configurar manejadores de eventos
        setupEventListeners();
        
        // Cargar y mostrar estudiantes
        loadStudentsView();

        // Verificar si hay un estudiante activo
        checkCurrentStudent();
    }

    // Configurar manejadores de eventos
    function setupEventListeners() {
        // Navegación entre páginas
        document.getElementById('manageStudentsBtn').addEventListener('click', showStudentManagement);
        document.getElementById('backToSelectionBtn').addEventListener('click', showStudentSelection);
        document.getElementById('changeStudentBtn').addEventListener('click', showStudentSelection);
        document.getElementById('addNewStudentBtn').addEventListener('click', showStudentManagement);

        // Formulario de estudiantes
        document.getElementById('studentForm').addEventListener('submit', saveStudent);
        document.getElementById('clearFormBtn').addEventListener('click', clearStudentForm);

        // Eliminación de estudiantes
        document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDeleteStudent);
    }

    // Cargar estudiantes desde el servidor y/o localStorage
    async function fetchStudentsFromServer() {
        try {
            const response = await fetch('php/get_students.php');
            const data = await response.json();
            
            if (data.success) {
                // Guardar los datos del servidor en localStorage para tener una copia local
                saveStudents(data.students);
                return data.students;
            } else {
                console.error('Error al obtener estudiantes del servidor:', data.message);
                return null;
            }
        } catch (error) {
            console.error('Error al comunicarse con el servidor:', error);
            return null;
        }
    }
    
    // Obtener estudiantes (primero intenta del servidor, luego del localStorage)
    function getStudents() {
        const storedStudents = localStorage.getItem(STUDENTS_STORAGE_KEY);
        return storedStudents ? JSON.parse(storedStudents) : [];
    }
    
    // Cargar estudiantes del servidor y actualizar la interfaz
    async function loadStudentsFromServer() {
        const serverStudents = await fetchStudentsFromServer();
        
        if (serverStudents) {
            // Si se pudieron cargar del servidor, actualizar la vista
            updateStudentSelectionView(serverStudents);
            updateStudentManagementView(serverStudents);
            return true;
        } else {
            // Si no se pudieron cargar del servidor, usar localStorage
            const localStudents = getStudents();
            updateStudentSelectionView(localStudents);
            updateStudentManagementView(localStudents);
            return false;
        }
    }

    // Guardar estudiantes en localStorage
    function saveStudents(students) {
        localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
    }

    // Cargar y mostrar los estudiantes
    function loadStudentsView() {
        // Intentar cargar desde el servidor, si falla, usar localStorage
        loadStudentsFromServer().catch(() => {
            const students = getStudents();
            updateStudentSelectionView(students);
            updateStudentManagementView(students);
        });
    }

    // Actualizar vista de selección de estudiantes
    function updateStudentSelectionView(students) {
        const studentList = document.getElementById('studentList');
        studentList.innerHTML = '';

        if (students.length === 0) {
            studentList.innerHTML = `
                <div class="alert alert-info text-center">
                    <i class="bi bi-info-circle"></i> No hay estudiantes registrados.
                    <br>
                    Haz clic en "Añadir Nuevo Estudiante" para comenzar.
                </div>
            `;
            return;
        }

        students.forEach(student => {
            const studentCard = document.createElement('div');
            studentCard.className = 'student-card';
            studentCard.dataset.id = student.id;

            // Obtener iniciales para el avatar
            const initials = getInitials(student.name);

            studentCard.innerHTML = `
                <div class="student-info d-flex align-items-center">
                    <div class="student-avatar">${initials}</div>
                    <div class="flex-grow-1">
                        <h3 class="h5 mb-1">${student.name}</h3>
                        <p class="text-muted mb-0 small">${student.email || 'Sin correo registrado'}</p>
                    </div>
                    <button class="btn btn-sm btn-outline-secondary edit-student-btn" data-id="${student.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                </div>
            `;

            // Agregar evento para seleccionar estudiante
            studentCard.addEventListener('click', function(e) {
                if (!e.target.closest('.edit-student-btn')) {
                    selectStudent(student);
                }
            });

            // Agregar evento para editar estudiante
            const editBtn = studentCard.querySelector('.edit-student-btn');
            editBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                editStudent(student.id);
            });

            studentList.appendChild(studentCard);
        });
    }

    // Actualizar vista de gestión de estudiantes
    function updateStudentManagementView(students) {
        const studentTableBody = document.getElementById('studentTableBody');
        studentTableBody.innerHTML = '';

        if (students.length === 0) {
            studentTableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center">No hay estudiantes registrados</td>
                </tr>
            `;
            return;
        }

        students.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <div class="student-avatar" style="width: 36px; height: 36px; font-size: 14px;">${getInitials(student.name)}</div>
                        <div class="ms-2">
                            <div class="fw-bold">${student.name}</div>
                            <div class="text-muted small">${student.notes ? student.notes.substring(0, 30) + (student.notes.length > 30 ? '...' : '') : 'Sin notas'}</div>
                        </div>
                    </div>
                </td>
                <td>
                    ${student.email ? `<div><i class="bi bi-envelope"></i> ${student.email}</div>` : ''}
                    ${student.tutorPhone ? `<div><i class="bi bi-whatsapp"></i> ${student.tutorPhone}</div>` : ''}
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary edit-btn" data-id="${student.id}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger delete-btn" data-id="${student.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;

            // Agregar eventos para editar y eliminar
            const editBtn = row.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => editStudent(student.id));

            const deleteBtn = row.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deleteStudent(student.id));

            studentTableBody.appendChild(row);
        });
    }

    // Seleccionar estudiante y mostrar dashboard
    function selectStudent(student) {
        // Guardar estudiante actual
        localStorage.setItem(CURRENT_STUDENT_KEY, JSON.stringify(student));
        
        // Actualizar nombre del estudiante en el dashboard
        document.getElementById('currentStudentName').textContent = student.name;
        
        // Configurar datos del estudiante para el monitoreo
        if (AppConfig) {
            AppConfig.updateSetting('studentName', student.name);
            if (student.tutorPhone) {
                AppConfig.updateSetting('tutorPhone', student.tutorPhone);
            }
        }
        
        // Mostrar dashboard
        showDashboard();
    }

    // Editar estudiante
    function editStudent(studentId) {
        const students = getStudents();
        const student = students.find(s => s.id === studentId);
        
        if (student) {
            // Guardar referencia al estudiante que se está editando
            currentEditingStudent = student;
            
            // Rellenar formulario
            document.getElementById('studentId').value = student.id;
            document.getElementById('studentNameInput').value = student.name;
            document.getElementById('studentEmail').value = student.email || '';
            document.getElementById('tutorPhoneInput').value = student.tutorPhone || '';
            document.getElementById('studentNotes').value = student.notes || '';
            
            // Mostrar página de gestión
            showStudentManagement();
        }
    }

    // Guardar estudiante (nuevo o existente) en el servidor y localStorage
    async function saveStudentToServer(studentData) {
        try {
            // Mostrar datos que se envían al servidor para depuración
            console.log('Enviando datos al servidor:', studentData);
            
            const response = await fetch('php/save_student.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(studentData)
            });
            
            // Mostrar respuesta completa del servidor
            const responseText = await response.text();
            console.log('Respuesta del servidor (texto):', responseText);
            
            // Intentar parsear como JSON
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Respuesta del servidor (JSON):', data);
            } catch (e) {
                console.error('Error al parsear respuesta JSON:', e);
                console.error('Texto de respuesta:', responseText);
                return false;
            }
            
            if (data.success) {
                // Si el servidor asigna un nuevo ID, actualizar el objeto del estudiante
                if (data.student_id && !studentData.id) {
                    studentData.id = data.student_id.toString();
                }
                console.log('Estudiante guardado exitosamente en el servidor');
                return true;
            } else {
                console.error('Error al guardar estudiante en el servidor:', data.message);
                if (data.debug) {
                    console.error('Información de depuración:', data.debug);
                }
                return false;
            }
        } catch (error) {
            console.error('Error al comunicarse con el servidor:', error);
            return false;
        }
    }
    
    // Guardar estudiante (nuevo o existente)
    async function saveStudent(e) {
        e.preventDefault();
        
        const studentId = document.getElementById('studentId').value;
        const name = document.getElementById('studentNameInput').value.trim();
        const email = document.getElementById('studentEmail').value.trim() || null;
        const tutorPhone = document.getElementById('tutorPhoneInput').value.trim() || null;
        const notes = document.getElementById('studentNotes').value.trim() || null;
        
        if (!name) {
            alert('Por favor ingresa el nombre del estudiante');
            return;
        }
        
        // Mostrar indicador de carga
        const saveBtn = e.target.querySelector('button[type="submit"]');
        const originalBtnText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
        saveBtn.disabled = true;
        
        let studentData;
        
        if (studentId) {
            // Actualizar estudiante existente
            studentData = {
                id: studentId,
                name,
                email,
                tutorPhone,
                notes,
                updatedAt: new Date().toISOString()
            };
        } else {
            // Crear nuevo estudiante
            studentData = {
                id: generateId(), // ID temporal para localStorage
                name,
                email,
                tutorPhone,
                notes,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        }
        
        try {
            // Intentar guardar en el servidor
            const serverSuccess = await saveStudentToServer(studentData);
            
            // Independientemente del resultado del servidor, guardar localmente
            const students = getStudents();
            
            if (studentId) {
                // Actualizar estudiante existente en localStorage
                const index = students.findIndex(s => s.id === studentId);
                if (index !== -1) {
                    students[index] = studentData;
                }
            } else {
                // Agregar nuevo estudiante a localStorage
                students.push(studentData);
            }
            
            // Guardar cambios en localStorage
            saveStudents(students);
            
            // Actualizar vistas
            loadStudentsView();
            
            // Limpiar formulario
            clearStudentForm();
            
            // Mostrar vista de selección
            showStudentSelection();
            
            // Mostrar mensaje de éxito o advertencia
            if (!serverSuccess) {
                showNotification('Estudiante guardado localmente, pero no se pudo conectar con el servidor.', 'warning');
            }
        } catch (error) {
            console.error('Error al guardar estudiante:', error);
            showNotification('Error al guardar el estudiante. Inténtalo de nuevo.', 'danger');
        } finally {
            // Restaurar botón
            saveBtn.innerHTML = originalBtnText;
            saveBtn.disabled = false;
        }
    }
    
    // Mostrar notificación temporal
    function showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} notification-toast`;
        notification.innerHTML = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '9999';
        notification.style.minWidth = '300px';
        notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        notification.style.transition = 'all 0.3s ease';
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        
        // Agregar al DOM
        document.body.appendChild(notification);
        
        // Forzar reflow para que la transición funcione
        notification.offsetHeight;
        
        // Mostrar con animación
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
        
        // Remover después de 5 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 5000);
    }

    // Eliminar estudiante (muestra confirmación)
    function deleteStudent(studentId) {
        currentEditingStudent = { id: studentId };
        
        // Mostrar modal de confirmación
        const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        deleteModal.show();
    }

    // Eliminar estudiante del servidor
    async function deleteStudentFromServer(studentId) {
        try {
            const response = await fetch('php/delete_student.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: studentId })
            });
            
            const data = await response.json();
            
            if (data.success) {
                return true;
            } else {
                console.error('Error al eliminar estudiante del servidor:', data.message);
                return false;
            }
        } catch (error) {
            console.error('Error al comunicarse con el servidor:', error);
            return false;
        }
    }
    
    // Confirmar eliminación de estudiante
    async function confirmDeleteStudent() {
        if (!currentEditingStudent || !currentEditingStudent.id) return;
        
        const studentId = currentEditingStudent.id;
        
        // Mostrar indicador de carga en el botón de eliminar
        const deleteBtn = document.getElementById('confirmDeleteBtn');
        const originalBtnText = deleteBtn.innerHTML;
        deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Eliminando...';
        deleteBtn.disabled = true;
        
        try {
            // Intentar eliminar en el servidor
            const serverSuccess = await deleteStudentFromServer(studentId);
            
            // Independientemente del resultado del servidor, eliminar localmente
            let students = getStudents();
            students = students.filter(s => s.id !== studentId);
            
            // Guardar cambios en localStorage
            saveStudents(students);
            
            // Si el estudiante eliminado era el actual, limpiar selección
            const currentStudent = getCurrentStudent();
            if (currentStudent && currentStudent.id === studentId) {
                localStorage.removeItem(CURRENT_STUDENT_KEY);
            }
            
            // Actualizar vistas
            loadStudentsView();
            
            // Ocultar modal
            const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
            deleteModal.hide();
            
            // Mostrar mensaje de éxito o advertencia
            if (!serverSuccess) {
                showNotification('Estudiante eliminado localmente, pero no se pudo conectar con el servidor.', 'warning');
            }
        } catch (error) {
            console.error('Error al eliminar estudiante:', error);
            showNotification('Error al eliminar el estudiante.', 'danger');
            
            // Restaurar botón
            deleteBtn.innerHTML = originalBtnText;
            deleteBtn.disabled = false;
            return;
        }
        
        // Restaurar botón
        deleteBtn.innerHTML = originalBtnText;
        deleteBtn.disabled = false;
        
        // Resetear estudiante en edición
        currentEditingStudent = null;
    }

    // Limpiar formulario de estudiante
    function clearStudentForm() {
        document.getElementById('studentId').value = '';
        document.getElementById('studentNameInput').value = '';
        document.getElementById('studentEmail').value = '';
        document.getElementById('tutorPhoneInput').value = '';
        document.getElementById('studentNotes').value = '';
        
        // Resetear estudiante en edición
        currentEditingStudent = null;
    }

    // Obtener estudiante actualmente seleccionado
    function getCurrentStudent() {
        const storedStudent = localStorage.getItem(CURRENT_STUDENT_KEY);
        return storedStudent ? JSON.parse(storedStudent) : null;
    }

    // Verificar si hay un estudiante activo y mostrar la vista correspondiente
    function checkCurrentStudent() {
        const currentStudent = getCurrentStudent();
        
        if (currentStudent) {
            // Actualizar nombre del estudiante en el dashboard
            document.getElementById('currentStudentName').textContent = currentStudent.name;
            
            // Configurar datos del estudiante para el monitoreo
            if (AppConfig) {
                AppConfig.updateSetting('studentName', currentStudent.name);
                if (currentStudent.tutorPhone) {
                    AppConfig.updateSetting('tutorPhone', currentStudent.tutorPhone);
                }
            }
            
            // Mostrar dashboard
            showDashboard();
        } else {
            // Mostrar selección de estudiante
            showStudentSelection();
        }
    }

    // Mostrar vista de selección de estudiantes
    function showStudentSelection() {
        hideAllPages();
        document.getElementById('studentSelectionPage').classList.add('active');
    }

    // Mostrar vista de gestión de estudiantes
    function showStudentManagement() {
        hideAllPages();
        document.getElementById('studentManagementPage').classList.add('active');
    }

    // Mostrar dashboard
    function showDashboard() {
        hideAllPages();
        document.getElementById('dashboardPage').classList.add('active');
    }

    // Ocultar todas las páginas
    function hideAllPages() {
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => page.classList.remove('active'));
    }

    // Generar ID único
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    // Obtener iniciales de un nombre
    function getInitials(name) {
        if (!name) return '?';
        
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    // API pública
    return {
        init,
        getStudents,
        getCurrentStudent,
        showStudentSelection,
        showDashboard,
        clearStudentForm
    };
})();

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    Students.init();
});
