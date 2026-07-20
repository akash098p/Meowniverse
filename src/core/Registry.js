/**
 * Registry - Central content registry for data-driven architecture
 * @module core/Registry
 * 
 * All game content (pets, items, themes, etc.) is registered here
 * from configuration files. Adding new content only requires creating
 * a config file - no gameplay code changes needed.
 */
class Registry {
    /** @type {Registry} */
    static #instance;

    /** @type {Map<string, Map<string, Object>>} */
    #registries = new Map();

    static getInstance() {
        if (!Registry.#instance) {
            Registry.#instance = new Registry();
        }
        return Registry.#instance;
    }

    /**
     * Register an item in a category
     * @param {string} category - e.g., 'pets', 'foods', 'themes'
     * @param {string} id - Unique identifier
     * @param {Object} data - Item configuration
     */
    register(category, id, data) {
        if (!this.#registries.has(category)) {
            this.#registries.set(category, new Map());
        }
        this.#registries.get(category).set(id, { ...data, id });
    }

    /**
     * Register multiple items at once
     * @param {string} category
     * @param {Object<string, Object>} items - Map of id -> config
     */
    registerMany(category, items) {
        for (const [id, data] of Object.entries(items)) {
            this.register(category, id, data);
        }
    }

    /**
     * Get a registered item
     * @param {string} category
     * @param {string} id
     * @returns {Object|undefined}
     */
    get(category, id) {
        return this.#registries.get(category)?.get(id);
    }

    /**
     * Get all items in a category
     * @param {string} category
     * @returns {Array<Object>}
     */
    getAll(category) {
        const map = this.#registries.get(category);
        return map ? Array.from(map.values()) : [];
    }

    /**
     * Get all items as a map
     * @param {string} category
     * @returns {Map<string, Object>}
     */
    getMap(category) {
        return this.#registries.get(category) || new Map();
    }

    /**
     * Check if item exists
     * @param {string} category
     * @param {string} id
     * @returns {boolean}
     */
    has(category, id) {
        return this.#registries.get(category)?.has(id) || false;
    }

    /**
     * Get all category names
     * @returns {string[]}
     */
    getCategories() {
        return Array.from(this.#registries.keys());
    }

    /**
     * Get count of items in a category
     * @param {string} category
     * @returns {number}
     */
    count(category) {
        return this.#registries.get(category)?.size || 0;
    }

    /**
     * Filter items by predicate
     * @param {string} category
     * @param {Function} predicate - (item) => boolean
     * @returns {Array<Object>}
     */
    filter(category, predicate) {
        return this.getAll(category).filter(predicate);
    }

    /**
     * Find first item matching predicate
     * @param {string} category
     * @param {Function} predicate
     * @returns {Object|undefined}
     */
    find(category, predicate) {
        return this.getAll(category).find(predicate);
    }

    /**
     * Remove an item from registry
     * @param {string} category
     * @param {string} id
     */
    unregister(category, id) {
        this.#registries.get(category)?.delete(id);
    }

    /**
     * Clear a category or all registries
     * @param {string} [category]
     */
    clear(category) {
        if (category) {
            this.#registries.delete(category);
        } else {
            this.#registries.clear();
        }
    }

    /**
     * Get serializable snapshot of all registries
     * @returns {Object}
     */
    snapshot() {
        const result = {};
        for (const [category, items] of this.#registries) {
            result[category] = Object.fromEntries(items);
        }
        return result;
    }
}

export default Registry;