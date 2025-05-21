/**
 * Database operations for the Student Attention Monitoring System
 * This module handles local storage of events and communication with the backend
 */

// Database module
const Database = (function() {
    // Private variables
    const MAX_LOCAL_EVENTS = 100; // Maximum number of events to store locally
    
    // Get events from local storage
    function getLocalEvents() {
        const storedEvents = localStorage.getItem(AppConfig.STORAGE_KEYS.EVENTS);
        return storedEvents ? JSON.parse(storedEvents) : [];
    }
    
    // Save events to local storage
    function saveLocalEvents(events) {
        // Limit the number of events stored locally
        if (events.length > MAX_LOCAL_EVENTS) {
            events = events.slice(-MAX_LOCAL_EVENTS);
        }
        localStorage.setItem(AppConfig.STORAGE_KEYS.EVENTS, JSON.stringify(events));
    }
    
    // Add a new event to local storage
    function addLocalEvent(event) {
        const events = getLocalEvents();
        events.push(event);
        saveLocalEvents(events);
        return events;
    }
    
    // Clear all local events
    function clearLocalEvents() {
        localStorage.removeItem(AppConfig.STORAGE_KEYS.EVENTS);
    }
    
    // Save event to the server database
    async function saveEventToServer(event) {
        if (!AppConfig.CONFIG.dbEnabled) return false;
        
        try {
            const formData = new FormData();
            formData.append('student_name', event.studentName);
            formData.append('state', event.state);
            formData.append('confidence', event.confidence);
            formData.append('timestamp', event.timestamp);
            
            const response = await fetch(AppConfig.CONFIG.dbEndpoint, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Error saving event to server:', error);
            return false;
        }
    }
    
    // Create a new event
    function createEvent(state, confidence) {
        const settings = AppConfig.getSettings();
        const timestamp = new Date().toISOString();
        
        return {
            studentName: settings.studentName,
            state: state,
            confidence: confidence,
            timestamp: timestamp,
            saved: false
        };
    }
    
    // Add event to local storage and optionally save to server
    async function logEvent(state, confidence, saveToServer = true) {
        const event = createEvent(state, confidence);
        
        // Add to local storage
        addLocalEvent(event);
        
        // Save to server if enabled
        if (saveToServer) {
            try {
                const success = await saveEventToServer(event);
                if (success) {
                    event.saved = true;
                    // Update the event in local storage
                    const events = getLocalEvents();
                    const index = events.findIndex(e => e.timestamp === event.timestamp);
                    if (index !== -1) {
                        events[index] = event;
                        saveLocalEvents(events);
                    }
                }
            } catch (error) {
                console.error('Error saving event:', error);
            }
        }
        
        return event;
    }
    
    // Format date for display
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
    }
    
    // Public API
    return {
        getLocalEvents,
        addLocalEvent,
        clearLocalEvents,
        saveEventToServer,
        logEvent,
        formatDate
    };
})();

// Export Database module to global scope
window.Database = Database;
