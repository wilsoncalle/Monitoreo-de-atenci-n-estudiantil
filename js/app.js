/**
 * Main application for Student Attention Monitoring System
 * This handles the Teachable Machine model loading, webcam setup,
 * prediction, and UI updates
 */

// Main application
const App = (function() {
    // Private variables
    let model;
    let webcam;
    let maxPredictions;
    let isMonitoring = false;
    let predictionInterval;
    let currentState = null;
    let stateCounter = 0;
    
    // Variables para métricas de sesión
    let sessionMetrics = {
        atento: 0,
        celular: 0,
        dormido: 0
    };
    let sessionTimer;
    
    // DOM Elements
    const webcamElement = document.getElementById('webcam');
    const canvasElement = document.getElementById('canvas');
    const statusIndicator = document.getElementById('status-indicator');
    const currentStatusElement = document.getElementById('current-status');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const alertBtn = document.getElementById('alertBtn');
    const eventLog = document.getElementById('event-log');
    
    // Elementos de métricas de sesión
    const attentionTimeElement = document.getElementById('attention-time');
    const phoneTimeElement = document.getElementById('phone-time');
    const distractedTimeElement = document.getElementById('distracted-time');
    
    // Progress bars and probability displays
    const progressBars = [
        document.getElementById('atento-bar'),
        document.getElementById('celular-bar'),
        document.getElementById('dormido-bar')
    ];
    
    const probabilityDisplays = [
        document.getElementById('atento-prob'),
        document.getElementById('celular-prob'),
        document.getElementById('dormido-prob')
    ];
    
    // Initialize the application
    async function init() {
        setupEventListeners();
        loadUISettings();
        
        // Al iniciar, aplicamos clase para estilo grisáceo/oscuro a la cámara desactivada
        document.querySelector('.webcam-container').classList.add('camera-inactive');
        
        // Al iniciar, no intentamos activar la cámara automáticamente
        // Mostramos mensaje para que el usuario active la cámara manualmente
        statusIndicator.innerHTML = '<div class="alert alert-info">Haz clic en "Activar Cámara Manualmente" para iniciar la cámara</div>';
        document.getElementById('activateCameraBtn').style.display = 'inline-block';
    }
    
    // Función para activar la cámara manualmente
    async function activateCamera() {
        try {
            // Cambiar estado del botón
            const cameraBtn = document.getElementById('activateCameraBtn');
            cameraBtn.disabled = true;
            cameraBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Activando cámara...';
            
            // Intentar inicializar la cámara
            await setupWebcam();
            
            // Actualizar interfaz si es exitoso
            statusIndicator.innerHTML = '<div class="alert alert-success">Cámara lista. Presiona "Iniciar Monitoreo" para comenzar.</div>';
            startBtn.disabled = false;
            cameraBtn.style.display = 'none'; // Ocultar botón de activación
            
            // Remover clase de cámara inactiva para quitar el filtro grisáceo
            document.querySelector('.webcam-container').classList.remove('camera-inactive');
        } catch (error) {
            // Mostrar error y reactivar botón
            statusIndicator.innerHTML = `<div class="alert alert-danger">Error al acceder a la cámara: ${error.message}</div>`;
            console.error('Error setting up webcam:', error);
            
            const cameraBtn = document.getElementById('activateCameraBtn');
            cameraBtn.disabled = false;
            cameraBtn.innerHTML = '<i class="bi bi-camera-video"></i> Intentar de nuevo';
        }
    }
    
    // Setup event listeners
    function setupEventListeners() {
        startBtn.addEventListener('click', startMonitoring);
        stopBtn.addEventListener('click', stopMonitoring);
        alertBtn.addEventListener('click', sendWhatsAppAlert);
        document.getElementById('activateCameraBtn').addEventListener('click', activateCamera);
        
        // Configuration modal
        const detectionThreshold = document.getElementById('detectionThreshold');
        const thresholdValue = document.getElementById('thresholdValue');
        
        detectionThreshold.addEventListener('input', function() {
            thresholdValue.textContent = this.value;
        });
        
        document.getElementById('saveConfigBtn').addEventListener('click', saveConfig);
        
        // Add config button to navbar if it doesn't exist
        if (!document.getElementById('configBtn')) {
            const configBtn = document.createElement('button');
            configBtn.id = 'configBtn';
            configBtn.className = 'btn btn-outline-info position-fixed';
            configBtn.style.top = '10px';
            configBtn.style.right = '10px';
            configBtn.innerHTML = '<i class="bi bi-gear"></i> Configuración';
            configBtn.setAttribute('data-bs-toggle', 'modal');
            configBtn.setAttribute('data-bs-target', '#configModal');
            document.body.appendChild(configBtn);
        }
    }
    
    // Load settings into UI
    function loadUISettings() {
        const settings = AppConfig.getSettings();
        
        document.getElementById('tutorPhone').value = settings.tutorPhone || '';
        document.getElementById('currentStudentName').textContent = settings.studentName || 'Estudiante';
        document.getElementById('detectionThreshold').value = AppConfig.CONFIG.detectionThreshold;
        document.getElementById('thresholdValue').textContent = AppConfig.CONFIG.detectionThreshold;
        
        // Load previous events
        displayEvents();
    }
    
    // Save configuration
    function saveConfig() {
        const tutorPhone = document.getElementById('tutorPhone').value.trim();
        const studentName = document.getElementById('studentName').value.trim() || 'Estudiante';
        const threshold = parseFloat(document.getElementById('detectionThreshold').value);
        
        // Update settings
        AppConfig.updateSetting('tutorPhone', tutorPhone);
        AppConfig.updateSetting('studentName', studentName);
        AppConfig.CONFIG.detectionThreshold = threshold;
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('configModal'));
        modal.hide();
        
        // Show success message
        statusIndicator.innerHTML = '<div class="alert alert-success">Configuración guardada correctamente.</div>';
        setTimeout(() => {
            if (!isMonitoring) {
                statusIndicator.innerHTML = '<div class="alert alert-info">Cámara lista. Presiona "Iniciar Monitoreo" para comenzar.</div>';
            }
        }, 2000);
    }
    
    // Setup webcam with improved error handling and compatibility
    async function setupWebcam() {
        return new Promise((resolve, reject) => {
            console.log('Iniciando configuración de cámara...');
            statusIndicator.innerHTML = '<div class="alert alert-info">Solicitando acceso a la cámara...</div>';
            
            const constraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            };
            
            // Compatibilidad con navegadores antiguos
            if (navigator.mediaDevices === undefined) {
                navigator.mediaDevices = {};
                console.warn('navigator.mediaDevices no está disponible, creando polyfill');
            }
            
            // Verificar si getUserMedia está disponible
            if (navigator.mediaDevices.getUserMedia === undefined) {
                navigator.mediaDevices.getUserMedia = function(constraints) {
                    console.log('Usando método alternativo para getUserMedia');
                    const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
                    
                    if (!getUserMedia) {
                        return Promise.reject(new Error('getUserMedia no está implementado en este navegador'));
                    }
                    
                    return new Promise(function(resolve, reject) {
                        getUserMedia.call(navigator, constraints, resolve, reject);
                    });
                };
            }
            
            console.log('Solicitando getUserMedia con:', constraints);
            navigator.mediaDevices.getUserMedia(constraints)
                .then(stream => {
                    console.log('Acceso a la cámara concedido, configurando stream...');
                    webcamElement.srcObject = stream;
                    webcamElement.addEventListener('loadeddata', () => {
                        console.log('Cámara cargada correctamente');
                        resolve();
                    });
                })
                .catch(error => {
                    console.error('Error al acceder a la cámara:', error);
                    let errorMessage = '';
                    
                    // Mensajes de error más descriptivos según el tipo de error
                    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                        errorMessage = 'Permiso denegado. Por favor, permite el acceso a la cámara en la configuración de tu navegador.';
                    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                        errorMessage = 'No se encontró ninguna cámara. Verifica que tu cámara esté conectada correctamente.';
                    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                        errorMessage = 'La cámara está en uso por otra aplicación. Cierra cualquier programa que pueda estar usando la cámara.';
                    } else if (error.name === 'OverconstrainedError') {
                        errorMessage = 'Las restricciones de video solicitadas no pueden ser cumplidas por tu cámara.';
                    } else {
                        errorMessage = error.message || 'Error desconocido al acceder a la cámara';
                    }
                    
                    reject(new Error(errorMessage));
                });
        });
    }
    
    // Load Teachable Machine model
    async function loadModel() {
        statusIndicator.innerHTML = '<div class="alert alert-info">Cargando modelo...</div>';
        
        try {
            const modelURL = AppConfig.CONFIG.modelURL;
            const modelMetadataURL = modelURL.replace('model.json', 'metadata.json');
            
            model = await tmImage.load(modelURL, modelMetadataURL);
            maxPredictions = model.getTotalClasses();
            
            statusIndicator.innerHTML = '<div class="alert alert-success">Modelo cargado correctamente.</div>';
            return true;
        } catch (error) {
            statusIndicator.innerHTML = `<div class="alert alert-danger">Error al cargar el modelo: ${error.message}</div>`;
            console.error('Error loading model:', error);
            return false;
        }
    }
    
    // Start monitoring
    async function startMonitoring() {
        if (isMonitoring) return;
        
        // Load model if not already loaded
        if (!model) {
            const success = await loadModel();
            if (!success) return;
        }
        
        isMonitoring = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        alertBtn.disabled = false;
        
        // Inicializar métricas de sesión
        resetSessionMetrics();
        
        // Iniciar timer para actualizar métricas cada segundo
        sessionTimer = setInterval(updateSessionMetrics, 1000);
        
        statusIndicator.innerHTML = '<div class="alert alert-primary">Monitoreando atención...</div>';
        
        // Start prediction loop
        predictionInterval = setInterval(predict, AppConfig.CONFIG.detectionInterval);
    }
    
    // Stop monitoring
    function stopMonitoring() {
        if (!isMonitoring) return;
        
        isMonitoring = false;
        clearInterval(predictionInterval);
        clearInterval(sessionTimer);
        
        startBtn.disabled = false;
        stopBtn.disabled = true;
        alertBtn.disabled = true;
        
        statusIndicator.innerHTML = '<div class="alert alert-info">Monitoreo detenido. Presiona "Iniciar Monitoreo" para comenzar.</div>';
    }
    
    // Make prediction
    async function predict() {
        if (!model || !isMonitoring) return;
        
        try {
            // Get prediction
            const prediction = await model.predict(webcamElement);
            
            // Update UI with prediction values
            updatePredictionUI(prediction);
            
            // Determine current state
            const highestPrediction = getHighestPrediction(prediction);
            
            // Check if prediction is above threshold
            if (highestPrediction.probability >= AppConfig.CONFIG.detectionThreshold) {
                // Check if state has changed
                if (currentState !== highestPrediction.className) {
                    stateCounter++;
                    
                    // Confirm state change after consecutive detections
                    if (stateCounter >= AppConfig.CONFIG.stateChangeThreshold) {
                        const oldState = currentState;
                        currentState = highestPrediction.className;
                        stateCounter = 0;
                        
                        // Log state change if it's not the initial state
                        if (oldState !== null) {
                            logStateChange(currentState, highestPrediction.probability);
                        } else {
                            // Initial state
                            updateCurrentStateUI(currentState);
                        }
                    }
                } else {
                    // Reset counter if same state
                    stateCounter = 0;
                }
            }
        } catch (error) {
            console.error('Error during prediction:', error);
        }
    }
    
    // Get highest prediction
    function getHighestPrediction(predictions) {
        let highest = { probability: 0, className: null, index: -1 };
        
        for (let i = 0; i < predictions.length; i++) {
            if (predictions[i].probability > highest.probability) {
                highest.probability = predictions[i].probability;
                highest.className = predictions[i].className;
                highest.index = i;
            }
        }
        
        return highest;
    }
    
    // Update prediction UI
    function updatePredictionUI(predictions) {
        for (let i = 0; i < predictions.length; i++) {
            const probability = predictions[i].probability.toFixed(2);
            const percent = Math.round(probability * 100);
            
            // Update progress bar
            progressBars[i].style.width = `${percent}%`;
            
            // Update probability display
            probabilityDisplays[i].textContent = `${percent}%`;
        }
    }
    
    // Update current state UI
    function updateCurrentStateUI(state) {
        // Para asegurar consistencia, convertimos el estado a primera letra mayúscula
        const normalizedState = normalizeStateName(state);
        
        // Find index of normalized state
        const index = AppConfig.CONFIG.classNames.findIndex(name => name === normalizedState);
        
        if (index !== -1) {
            // Remove all status classes
            currentStatusElement.className = 'alert';
            
            // Add appropriate class
            currentStatusElement.classList.add(AppConfig.CONFIG.classStyles[index]);
            
            // Update text
            currentStatusElement.textContent = normalizedState;
            
            // Actualizar currentState con el valor normalizado
            currentState = normalizedState;
        } else {
            // Unknown state
            currentStatusElement.className = 'alert alert-secondary';
            currentStatusElement.textContent = 'Desconocido';
        }
    }
    
    // Resetear métricas de sesión
    function resetSessionMetrics() {
        sessionMetrics = {
            atento: 0,
            celular: 0,
            dormido: 0
        };
        updateSessionMetricsUI();
    }
    
    // Normalizar el nombre del estado para comparaciones consistentes
    function normalizeStateName(state) {
        if (!state) return null;
        
        // Buscar la coincidencia más cercana en los nombres de clase configurados
        const lowerState = state.toLowerCase();
        
        if (lowerState.includes('atento')) return 'Atento';
        if (lowerState.includes('celular')) return 'Usando Celular';
        if (lowerState.includes('dormido') || lowerState.includes('distra')) return 'Dormido/Distraído';
        
        return state; // Si no hay coincidencia, devolver el original
    }
    
    // Actualizar métricas de sesión según el estado actual
    function updateSessionMetrics() {
        if (isMonitoring && currentState) {
            // Usar el estado normalizado
            const normalizedState = normalizeStateName(currentState);
            
            switch(normalizedState) {
                case 'Atento':
                    sessionMetrics.atento += 1;
                    break;
                case 'Usando Celular':
                    sessionMetrics.celular += 1;
                    break;
                case 'Dormido/Distraído':
                    sessionMetrics.dormido += 1;
                    break;
            }
            updateSessionMetricsUI();
        }
    }
    
    // Actualizar la UI de métricas de sesión
    function updateSessionMetricsUI() {
        attentionTimeElement.textContent = formatTime(sessionMetrics.atento);
        phoneTimeElement.textContent = formatTime(sessionMetrics.celular);
        distractedTimeElement.textContent = formatTime(sessionMetrics.dormido);
    }
    
    // Formato de tiempo para las métricas (segundos a MM:SS)
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    // Log state change
    function logStateChange(state, confidence) {
        // Update UI
        updateCurrentStateUI(state);
        
        // Log to database
        Database.logEvent(state, confidence).then(event => {
            // Add to event log UI
            addEventToLog(event);
        });
    }
    
    // Add event to log UI
    function addEventToLog(event) {
        // Create event element
        const eventElement = document.createElement('div');
        
        // Find index of state
        const index = AppConfig.CONFIG.classNames.findIndex(name => name === event.state);
        
        // Add classes
        eventElement.className = 'event-item';
        if (index !== -1) {
            eventElement.classList.add(AppConfig.CONFIG.eventStyles[index]);
        }
        
        // Format date
        const formattedDate = Database.formatDate(event.timestamp);
        
        // Set content
        eventElement.innerHTML = `
            <strong>${event.state}</strong> (${Math.round(event.confidence * 100)}%)
            <br>
            <small>${formattedDate}</small>
        `;
        
        // Add to log
        eventLog.prepend(eventElement);
        
        // Limit number of events shown
        const events = eventLog.querySelectorAll('.event-item');
        if (events.length > AppConfig.CONFIG.maxEventsShown) {
            eventLog.removeChild(events[events.length - 1]);
        }
    }
    
    // Display events from database
    function displayEvents() {
        const events = Database.getLocalEvents();
        
        // Clear log
        eventLog.innerHTML = '';
        
        // Add events to log (most recent first)
        events.slice().reverse().forEach(event => {
            addEventToLog(event);
        });
    }
    
    // Send WhatsApp alert
    function sendWhatsAppAlert() {
        if (!currentState) return;
        
        const settings = AppConfig.getSettings();
        
        if (!settings.tutorPhone) {
            alert('Por favor configura el número de WhatsApp del tutor en la configuración.');
            
            // Open config modal
            const configModal = new bootstrap.Modal(document.getElementById('configModal'));
            configModal.show();
            
            return;
        }
        
        // Create message
        const message = encodeURIComponent(
            `${AppConfig.CONFIG.defaultMessage} ${currentState}. ` +
            `Estudiante: ${settings.studentName}. ` +
            `Hora: ${new Date().toLocaleString()}`
        );
        
        // Create WhatsApp URL
        const whatsappURL = `${AppConfig.CONFIG.whatsappBaseURL}${settings.tutorPhone}?text=${message}`;
        
        // Open WhatsApp
        window.open(whatsappURL, '_blank');
    }
    
    // Public API
    return {
        init,
        startMonitoring,
        stopMonitoring
    };
})();

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});
