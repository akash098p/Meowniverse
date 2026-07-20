/**
 * EventBus - Central event-driven communication system
 * @module core/EventBus
 * 
 * Provides a publish/subscribe pattern for decoupled communication
 * between all game systems, UI components, and modules.
 */
class EventBus {
    /** @type {EventBus} */
    static #instance;

    /** @type {Map<string, Set<Function>>} */
    #listeners = new Map();

    /** @type {Map<string, Set<Function>>} */
    #onceListeners = new Map();

    /** @type {boolean} */
    #debugMode = false;

    /**
     * Get the singleton instance
     * @returns {EventBus}
     */
    static getInstance() {
        if (!EventBus.#instance) {
            EventBus.#instance = new EventBus();
        }
        return EventBus.#instance;
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.#listeners.has(event)) {
            this.#listeners.set(event, new Set());
        }
        this.#listeners.get(event).add(callback);

        if (this.#debugMode) {
            console.log(`[EventBus] Subscribed to "${event}"`);
        }

        return () => this.off(event, callback);
    }

    /**
     * Subscribe to an event once
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    once(event, callback) {
        if (!this.#onceListeners.has(event)) {
            this.#onceListeners.set(event, new Set());
        }
        this.#onceListeners.get(event).add(callback);

        if (this.#debugMode) {
            console.log(`[EventBus] Subscribed once to "${event}"`);
        }

        return () => this.#onceListeners.get(event)?.delete(callback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback to remove
     */
    off(event, callback) {
        this.#listeners.get(event)?.delete(callback);
        this.#onceListeners.get(event)?.delete(callback);
    }

    /**
     * Emit an event with data
     * @param {string} event - Event name
     * @param {*} [data] - Event data
     */
    emit(event, data) {
        if (this.#debugMode) {
            console.log(`[EventBus] Emitting "${event}"`, data);
        }

        const listeners = this.#listeners.get(event);
        if (listeners) {
            for (const callback of listeners) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[EventBus] Error in listener for "${event}":`, error);
                }
            }
        }

        const onceListeners = this.#onceListeners.get(event);
        if (onceListeners) {
            for (const callback of onceListeners) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[EventBus] Error in once-listener for "${event}":`, error);
                }
            }
            this.#onceListeners.delete(event);
        }
    }

    /**
     * Remove all listeners for an event
     * @param {string} [event] - Event name (removes all if omitted)
     */
    clear(event) {
        if (event) {
            this.#listeners.delete(event);
            this.#onceListeners.delete(event);
        } else {
            this.#listeners.clear();
            this.#onceListeners.clear();
        }
    }

    /**
     * Enable or disable debug logging
     * @param {boolean} enabled
     */
    setDebugMode(enabled) {
        this.#debugMode = enabled;
    }

    /**
     * Get count of listeners for an event
     * @param {string} event
     * @returns {number}
     */
    listenerCount(event) {
        return (this.#listeners.get(event)?.size || 0) + 
               (this.#onceListeners.get(event)?.size || 0);
    }
}

export default EventBus;