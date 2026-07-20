/**
 * ContentLoader - Dynamically loads and registers all game content
 * @module core/ContentLoader
 * 
 * Scans config directories and auto-registers pets, items, themes, etc.
 * New content can be added by simply creating new config files.
 */
import Registry from './Registry.js';

class ContentLoader {
    /** @type {ContentLoader} */
    static #instance;

    /** @type {boolean} */
    #loaded = false;

    static getInstance() {
        if (!ContentLoader.#instance) {
            ContentLoader.#instance = new ContentLoader();
        }
        return ContentLoader.#instance;
    }

    /**
     * Load all game content
     */
    async loadAll() {
        if (this.#loaded) return;
        const reg = Registry.getInstance();

        // Load pets
        await this.#loadPetConfigs(reg);

        // Load items
        await this.#loadItemConfigs(reg);

        // Load themes
        await this.#loadThemeConfigs(reg);

        // Load environments
        await this.#loadEnvironmentConfigs(reg);

        this.#loaded = true;
    }

    /**
     * Load all pet configurations
     * @private
     */
    async #loadPetConfigs(reg) {
        try {
            const { default: cat } = await import('../config/pets/cat.js');
            const { default: dog } = await import('../config/pets/dog.js');
            const { default: bunny } = await import('../config/pets/bunny.js');
            const { default: penguin } = await import('../config/pets/penguin.js');
            const { default: duck } = await import('../config/pets/duck.js');
            const { default: dragon } = await import('../config/pets/dragon.js');
            const { default: fox } = await import('../config/pets/fox.js');
            const { default: meowl } = await import('../config/pets/meowl.js');

            reg.register('pets', 'cat', cat);
            reg.register('pets', 'dog', dog);
            reg.register('pets', 'bunny', bunny);
            reg.register('pets', 'penguin', penguin);
            reg.register('pets', 'duck', duck);
            reg.register('pets', 'dragon', dragon);
            reg.register('pets', 'fox', fox);
            reg.register('pets', 'meowl', meowl);
        } catch (error) {
            console.error('[ContentLoader] Error loading pets:', error);
        }
    }

    /**
     * Load all item configurations
     * @private
     */
    async #loadItemConfigs(reg) {
        try {
            const { default: foods } = await import('../config/items/foods.js');
            const { default: toys } = await import('../config/items/toys.js');

            reg.registerMany('foods', foods);
            reg.registerMany('toys', toys);
        } catch (error) {
            console.error('[ContentLoader] Error loading items:', error);
        }
    }

    /**
     * Load all theme configurations
     * @private
     */
    async #loadThemeConfigs(reg) {
        try {
            const { default: themes } = await import('../config/themes/themes.js');
            reg.registerMany('themes', themes);
        } catch (error) {
            console.error('[ContentLoader] Error loading themes:', error);
        }
    }

    /**
     * Load all environment configurations
     * @private
     */
    async #loadEnvironmentConfigs(reg) {
        try {
            const { default: environments } = await import('../config/environments/environments.js');
            reg.registerMany('environments', environments);
        } catch (error) {
            console.error('[ContentLoader] Error loading environments:', error);
        }
    }

    /**
     * Check if content is loaded
     * @returns {boolean}
     */
    isLoaded() {
        return this.#loaded;
    }
}

export default ContentLoader;