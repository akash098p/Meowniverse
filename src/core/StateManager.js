/**
 * StateManager - Centralized game state management
 * @module core/StateManager
 * 
 * Manages all game state with reactive updates, history tracking,
 * and serialization support for save/load.
 */
class StateManager {
    /** @type {StateManager} */
    static #instance;

    /** @type {Object} */
    #state = {};

    /** @type {Map<string, Set<Function>>} */
    #watchers = new Map();

    /** @type {Array<Object>} */
    #history = [];

    /** @type {number} */
    #maxHistory = 50;

    /** @type {boolean} */
    #frozen = false;

    /**
     * Get the singleton instance
     * @returns {StateManager}
     */
    static getInstance() {
        if (!StateManager.#instance) {
            StateManager.#instance = new StateManager();
        }
        return StateManager.#instance;
    }

    /**
     * Initialize state with defaults
     * @param {Object} initialState
     */
    init(initialState = {}) {
        this.#state = this.#deepClone(initialState);
        this.#history = [];
        this.#notifyAll();
    }

    /**
     * Get a value from state using dot notation
     * @param {string} path - e.g., 'pets.0.stats.health'
     * @param {*} [defaultValue] - Value if path not found
     * @returns {*}
     */
    get(path, defaultValue = undefined) {
        const keys = path.split('.');
        let current = this.#state;
        
        for (const key of keys) {
            if (current === null || current === undefined || typeof current !== 'object') {
                return defaultValue;
            }
            current = current[key];
        }
        
        return current !== undefined ? current : defaultValue;
    }

    /**
     * Set a value using dot notation
     * @param {string} path - e.g., 'pets.0.stats.health'
     * @param {*} value - New value
     * @param {boolean} [recordHistory=true] - Whether to record in history
     */
    set(path, value, recordHistory = true) {
        if (this.#frozen) return;

        const oldValue = this.get(path);
        
        if (recordHistory) {
            this.#recordHistory(path, oldValue, value);
        }

        const keys = path.split('.');
        let current = this.#state;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in current) || typeof current[keys[i]] !== 'object') {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        this.#notify(path, value, oldValue);
    }

    /**
     * Update a value using a reducer function
     * @param {string} path
     * @param {Function} reducer - (currentValue) => newValue
     */
    update(path, reducer) {
        const current = this.get(path);
        this.set(path, reducer(current));
    }

    /**
     * Watch for changes on a path
     * @param {string} path
     * @param {Function} callback - (newValue, oldValue) => void
     * @returns {Function} Unwatch function
     */
    watch(path, callback) {
        if (!this.#watchers.has(path)) {
            this.#watchers.set(path, new Set());
        }
        this.#watchers.get(path).add(callback);
        return () => this.#watchers.get(path)?.delete(callback);
    }

    /**
     * Get entire state snapshot
     * @returns {Object}
     */
    getState() {
        return this.#deepClone(this.#state);
    }

    /**
     * Replace entire state (for loading saves)
     * @param {Object} newState
     */
    setState(newState) {
        this.#state = this.#deepClone(newState);
        this.#notifyAll();
    }

    /**
     * Freeze state updates
     */
    freeze() {
        this.#frozen = true;
    }

    /**
     * Unfreeze state updates
     */
    unfreeze() {
        this.#frozen = false;
    }

    /**
     * Undo last change
     * @returns {boolean} Whether undo was possible
     */
    undo() {
        if (this.#history.length === 0) return false;
        const entry = this.#history.pop();
        this.set(entry.path, entry.oldValue, false);
        return true;
    }

    /**
     * Get history length
     * @returns {number}
     */
    getHistoryLength() {
        return this.#history.length;
    }

    /**
     * Clear all state
     */
    reset() {
        this.#state = {};
        this.#history = [];
        this.#watchers.clear();
    }

    /**
     * Record a change in history
     * @private
     */
    #recordHistory(path, oldValue, newValue) {
        if (oldValue === newValue) return;
        this.#history.push({ path, oldValue, newValue, timestamp: Date.now() });
        if (this.#history.length > this.#maxHistory) {
            this.#history.shift();
        }
    }

    /**
     * Notify watchers of a change
     * @private
     */
    #notify(path, newValue, oldValue) {
        const watchers = this.#watchers.get(path);
        if (watchers) {
            for (const callback of watchers) {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    console.error(`[StateManager] Error in watcher for "${path}":`, error);
                }
            }
        }
    }

    /**
     * Notify all watchers (for state replacement)
     * @private
     */
    #notifyAll() {
        for (const [path, watchers] of this.#watchers) {
            const value = this.get(path);
            for (const callback of watchers) {
                try {
                    callback(value, undefined);
                } catch (error) {
                    console.error(`[StateManager] Error in watcher for "${path}":`, error);
                }
            }
        }
    }

    /**
     * Deep clone an object
     * @private
     * @param {*} obj
     * @returns {*}
     */
    #deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (Array.isArray(obj)) return obj.map(item => this.#deepClone(item));
        const cloned = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                cloned[key] = this.#deepClone(obj[key]);
            }
        }
        return cloned;
    }
}

export default StateManager;