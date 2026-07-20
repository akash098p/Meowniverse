/**
 * GameEngine - Main game engine orchestrating all systems
 * @module core/GameEngine
 * 
 * Initializes and coordinates all game systems, manages game state,
 * and provides the main API for gameplay interactions.
 */
import EventBus from './EventBus.js';
import StateManager from './StateManager.js';
import GameLoop from './GameLoop.js';
import TimeSystem from './TimeSystem.js';
import SaveManager from './SaveManager.js';
import Registry from './Registry.js';

class GameEngine {
    /** @type {GameEngine} */
    static #instance;

    /** @type {boolean} */
    #initialized = false;

    /** @type {Object} */
    #systems = {};

    /** @type {Object} */
    #defaultState = {
        version: 1,
        coins: 100,
        diamonds: 10,
        level: 1,
        xp: 0,
        xpToNext: 100,
        pets: [],
        activePetIndex: 0,
        inventory: {},
        equipped: {},
        environment: 'bedroom',
        theme: 'light',
        unlockedEnvironments: ['bedroom'],
        completedQuests: [],
        activeQuests: [],
        achievements: {},
        stats: {
            totalPlayTime: 0,
            totalFeedings: 0,
            totalPlaySessions: 0,
            totalBaths: 0,
            totalHeals: 0,
            totalTrainings: 0,
            totalStudies: 0,
            coinsEarned: 0,
            coinsSpent: 0,
            gamesPlayed: 0,
            gamesWon: 0
        },
        settings: {
            musicVolume: 70,
            sfxVolume: 80,
            browserNotifications: true,
            gameNotifications: true,
            autoSave: true
        },
        lastSaveTime: Date.now(),
        creationTime: Date.now()
    };

    static getInstance() {
        if (!GameEngine.#instance) {
            GameEngine.#instance = new GameEngine();
        }
        return GameEngine.#instance;
    }

    /**
     * Initialize the game engine
     * @param {Object} [customState] - Optional state to load
     */
    async init(customState) {
        if (this.#initialized) return;

        const eventBus = EventBus.getInstance();
        const stateManager = StateManager.getInstance();
        const gameLoop = GameLoop.getInstance();
        const timeSystem = TimeSystem.getInstance();
        const saveManager = SaveManager.getInstance();
        const registry = Registry.getInstance();

        this.#systems = {
            eventBus,
            stateManager,
            gameLoop,
            timeSystem,
            saveManager,
            registry
        };

        // Initialize state
        if (customState) {
            stateManager.init({ ...this.#defaultState, ...customState });
        } else {
            stateManager.init({ ...this.#defaultState });
        }

        // Initialize time
        timeSystem.init(480, 1);

        // Register game loop updates
        gameLoop.addUpdatable(
            (dt) => timeSystem.update(dt),
            100,
            'TimeSystem'
        );

        // Start auto-save
        saveManager.startAutoSave(() => this.getSaveData());

        this.#initialized = true;
        eventBus.emit('engine:initialized', {});
    }

    /**
     * Start the game
     */
    start() {
        if (!this.#initialized) return;
        GameLoop.getInstance().start();
        EventBus.getInstance().emit('engine:started', {});
    }

    /**
     * Pause the game
     */
    pause() {
        GameLoop.getInstance().pause();
        TimeSystem.getInstance().pause();
        EventBus.getInstance().emit('engine:paused', {});
    }

    /**
     * Resume the game
     */
    resume() {
        GameLoop.getInstance().resume();
        TimeSystem.getInstance().resume();
        EventBus.getInstance().emit('engine:resumed', {});
    }

    /**
     * Save the game
     * @returns {Promise<boolean>}
     */
    async save() {
        return await SaveManager.getInstance().save(this.getSaveData());
    }

    /**
     * Load the game
     * @returns {Promise<boolean>}
     */
    async load() {
        const data = await SaveManager.getInstance().load();
        if (data) {
            await this.init(data);
            return true;
        }
        return false;
    }

    /**
     * Get serializable save data
     * @returns {Object}
     */
    getSaveData() {
        const sm = StateManager.getInstance();
        const ts = TimeSystem.getInstance();
        const state = sm.getState();
        state.lastSaveTime = Date.now();
        state.time = ts.serialize();
        return state;
    }

    /**
     * Reset all game data
     */
    async reset() {
        await SaveManager.getInstance().deleteSave();
        StateManager.getInstance().reset();
        this.#initialized = false;
        EventBus.getInstance().emit('engine:reset', {});
    }

    /**
     * Get a system by name
     * @param {string} name
     * @returns {Object|undefined}
     */
    getSystem(name) {
        return this.#systems[name];
    }

    /**
     * Check if initialized
     * @returns {boolean}
     */
    isInitialized() {
        return this.#initialized;
    }

    /**
     * Add coins
     * @param {number} amount
     */
    addCoins(amount) {
        StateManager.getInstance().update('coins', c => c + amount);
        StateManager.getInstance().update('stats.coinsEarned', c => c + amount);
        EventBus.getInstance().emit('currency:changed', { coins: this.getCoins() });
    }

    /**
     * Spend coins
     * @param {number} amount
     * @returns {boolean} Whether successful
     */
    spendCoins(amount) {
        const current = this.getCoins();
        if (current < amount) return false;
        StateManager.getInstance().set('coins', current - amount);
        StateManager.getInstance().update('stats.coinsSpent', c => c + amount);
        EventBus.getInstance().emit('currency:changed', { coins: this.getCoins() });
        return true;
    }

    /**
     * Get current coins
     * @returns {number}
     */
    getCoins() {
        return StateManager.getInstance().get('coins', 0);
    }

    /**
     * Add diamonds
     * @param {number} amount
     */
    addDiamonds(amount) {
        StateManager.getInstance().update('diamonds', d => d + amount);
        EventBus.getInstance().emit('currency:changed', { diamonds: this.getDiamonds() });
    }

    /**
     * Get current diamonds
     * @returns {number}
     */
    getDiamonds() {
        return StateManager.getInstance().get('diamonds', 0);
    }

    /**
     * Add XP
     * @param {number} amount
     */
    addXP(amount) {
        const sm = StateManager.getInstance();
        let xp = sm.get('xp', 0) + amount;
        let level = sm.get('level', 1);
        let xpToNext = sm.get('xpToNext', 100);

        while (xp >= xpToNext) {
            xp -= xpToNext;
            level++;
            xpToNext = Math.floor(xpToNext * 1.5);
            EventBus.getInstance().emit('player:levelUp', { level });
        }

        sm.set('xp', xp);
        sm.set('level', level);
        sm.set('xpToNext', xpToNext);
        EventBus.getInstance().emit('player:xpChanged', { xp, level, xpToNext });
    }

    /**
     * Get player level
     * @returns {number}
     */
    getLevel() {
        return StateManager.getInstance().get('level', 1);
    }

    /**
     * Perform an action on the active pet
     * @param {string} action - Action name
     * @param {Object} [options] - Additional options
     */
    performAction(action, options = {}) {
        EventBus.getInstance().emit('pet:action', { action, ...options });
    }
}

export default GameEngine;