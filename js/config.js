/**
 * Configuration settings for the Student Attention Monitoring System
 */
const CONFIG = {
    // Teachable Machine model URL - replace with your own model URL after training
    modelURL: 'model/model.json',
    
    // Detection settings
    detectionInterval: 1000, // milliseconds between detections
    detectionThreshold: 0.7, // confidence threshold for detection (0.1-1.0)
    stateChangeThreshold: 3, // number of consecutive detections to confirm state change
    
    // Database settings
    dbEnabled: true, // set to false to disable database logging
    dbEndpoint: 'php/save_event.php', // endpoint for saving events to database
    
    // WhatsApp settings
    whatsappBaseURL: 'https://wa.me/', // base URL for WhatsApp web
    defaultMessage: 'Alerta: El estudiante ha sido detectado en estado: ', // default message template
    
    // UI settings
    uiUpdateInterval: 500, // milliseconds between UI updates
    maxEventsShown: 50, // maximum number of events to show in the log
    
    // Class names from Teachable Machine model
    classNames: ['Atento', 'Usando Celular', 'Dormido/Distraído'],
    
    // Class CSS classes for styling
    classStyles: ['status-atento', 'status-celular', 'status-dormido'],
    
    // Class event CSS classes
    eventStyles: ['event-atento', 'event-celular', 'event-dormido'],
    
    // Default user settings (can be changed in UI)
    defaultSettings: {
        studentName: 'Estudiante',
        tutorPhone: '', // should be in international format without +, e.g., 5491123456789
    }
};

// Local storage keys
const STORAGE_KEYS = {
    SETTINGS: 'attention_monitor_settings',
    EVENTS: 'attention_monitor_events'
};

// Load settings from local storage or use defaults
function loadSettings() {
    const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (storedSettings) {
        return JSON.parse(storedSettings);
    }
    return CONFIG.defaultSettings;
}

// Save settings to local storage
function saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

// Get current settings
function getSettings() {
    return loadSettings();
}

// Update a specific setting
function updateSetting(key, value) {
    const settings = loadSettings();
    settings[key] = value;
    saveSettings(settings);
    return settings;
}

// Export configuration functions
window.AppConfig = {
    CONFIG,
    STORAGE_KEYS,
    loadSettings,
    saveSettings,
    getSettings,
    updateSetting
};
