/**
 * SaveManager - Handles game save/load with LocalStorage and IndexedDB
 * @module core/SaveManager
 */
class SaveManager {
    /** @type {SaveManager} */
    static #instance;

    /** @type {string} */
    #saveKey = 'meowniverse_save';

    /** @type {string} */
    #backupKey = 'meowniverse_save_backup';

    /** @type {number} */
    #autoSaveInterval = 60000; // 1 minute

    /** @type {number|null} */
    #autoSaveTimer = null;

    /** @type {boolean} */
    #autoSaveEnabled = true;

    /** @type {number} */
    #saveVersion = 1;

    static getInstance() {
        if (!SaveManager.#instance) {
            SaveManager.#instance = new SaveManager();
        }
        return SaveManager.#instance;
    }

    /**
     * Save game state
     * @param {Object} gameState - Full game state to save
     * @returns {Promise<boolean>} Success
     */
    async save(gameState) {
        try {
            const saveData = {
                version: this.#saveVersion,
                timestamp: Date.now(),
                state: gameState
            };

            const serialized = JSON.stringify(saveData);
            
            // Primary save to LocalStorage
            localStorage.setItem(this.#saveKey, serialized);
            
            // Backup save
            localStorage.setItem(this.#backupKey, serialized);

            // Also try IndexedDB for larger saves
            await this.#saveToIndexedDB(saveData);

            return true;
        } catch (error) {
            console.error('[SaveManager] Save failed:', error);
            return false;
        }
    }

    /**
     * Load game state
     * @returns {Promise<Object|null>} Game state or null
     */
    async load() {
        try {
            // Try primary save
            let data = localStorage.getItem(this.#saveKey);
            
            // Try backup if primary fails
            if (!data) {
                data = localStorage.getItem(this.#backupKey);
            }

            if (!data) {
                // Try IndexedDB
                const indexedData = await this.#loadFromIndexedDB();
                if (indexedData) {
                    return indexedData.state;
                }
                return null;
            }

            const parsed = JSON.parse(data);
            
            // Version migration
            if (parsed.version < this.#saveVersion) {
                return this.#migrate(parsed);
            }

            return parsed.state;
        } catch (error) {
            console.error('[SaveManager] Load failed:', error);
            return null;
        }
    }

    /**
     * Start auto-save
     * @param {Function} getStateFn - Function that returns current state
     */
    startAutoSave(getStateFn) {
        this.#autoSaveTimer = setInterval(async () => {
            if (this.#autoSaveEnabled) {
                const state = getStateFn();
                await this.save(state);
            }
        }, this.#autoSaveInterval);
    }

    /**
     * Stop auto-save
     */
    stopAutoSave() {
        if (this.#autoSaveTimer) {
            clearInterval(this.#autoSaveTimer);
            this.#autoSaveTimer = null;
        }
    }

    /**
     * Enable/disable auto-save
     * @param {boolean} enabled
     */
    setAutoSave(enabled) {
        this.#autoSaveEnabled = enabled;
    }

    /**
     * Delete all saves
     */
    async deleteSave() {
        localStorage.removeItem(this.#saveKey);
        localStorage.removeItem(this.#backupKey);
        await this.#deleteFromIndexedDB();
    }

    /**
     * Get save metadata
     * @returns {Object|null}
     */
    getSaveInfo() {
        try {
            const data = localStorage.getItem(this.#saveKey);
            if (!data) return null;
            const parsed = JSON.parse(data);
            return {
                version: parsed.version,
                timestamp: parsed.timestamp,
                date: new Date(parsed.timestamp).toLocaleString()
            };
        } catch {
            return null;
        }
    }

    /**
     * Check if save exists
     * @returns {boolean}
     */
    hasSave() {
        return localStorage.getItem(this.#saveKey) !== null ||
               localStorage.getItem(this.#backupKey) !== null;
    }

    /**
     * Save to IndexedDB
     * @private
     */
    #saveToIndexedDB(data) {
        return new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open('MeowniverseDB', 1);
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains('saves')) {
                        db.createObjectStore('saves', { keyPath: 'id' });
                    }
                };

                request.onsuccess = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains('saves')) {
                        resolve();
                        return;
                    }
                    const transaction = db.transaction(['saves'], 'readwrite');
                    const store = transaction.objectStore('saves');
                    store.put({ id: 'main', ...data });
                    transaction.oncomplete = () => resolve();
                    transaction.onerror = () => reject();
                };

                request.onerror = () => reject();
            } catch {
                resolve(); // Fail silently if IndexedDB unavailable
            }
        });
    }

    /**
     * Load from IndexedDB
     * @private
     */
    #loadFromIndexedDB() {
        return new Promise((resolve) => {
            try {
                const request = indexedDB.open('MeowniverseDB', 1);
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains('saves')) {
                        db.createObjectStore('saves', { keyPath: 'id' });
                    }
                };

                request.onsuccess = (event) => {
                    const db = event.target.result;
                    // Check if the object store exists before trying to use it
                    if (!db.objectStoreNames.contains('saves')) {
                        resolve(null);
                        return;
                    }
                    try {
                        const transaction = db.transaction(['saves'], 'readonly');
                        const store = transaction.objectStore('saves');
                        const getRequest = store.get('main');
                        getRequest.onsuccess = () => resolve(getRequest.result || null);
                        getRequest.onerror = () => resolve(null);
                    } catch {
                        resolve(null);
                    }
                };

                request.onerror = () => resolve(null);
            } catch {
                resolve(null);
            }
        });
    }

    /**
     * Delete from IndexedDB
     * @private
     */
    #deleteFromIndexedDB() {
        return new Promise((resolve) => {
            try {
                const request = indexedDB.open('MeowniverseDB', 1);
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains('saves')) {
                        db.createObjectStore('saves', { keyPath: 'id' });
                    }
                };
                request.onsuccess = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains('saves')) {
                        resolve();
                        return;
                    }
                    try {
                        const transaction = db.transaction(['saves'], 'readwrite');
                        const store = transaction.objectStore('saves');
                        store.delete('main');
                    } catch {}
                    resolve();
                };
                request.onerror = () => resolve();
            } catch {
                resolve();
            }
        });
    }

    /**
     * Migrate save data from older versions
     * @private
     */
    #migrate(saveData) {
        // Future migration logic here
        saveData.version = this.#saveVersion;
        return saveData.state;
    }
}

export default SaveManager;