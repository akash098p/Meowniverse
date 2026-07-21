/**
 * MiniGameManager - Handles all mini games
 * @module gameplay/MiniGameManager
 */
import EventBus from '../core/EventBus.js';
import GameEngine from '../core/GameEngine.js';
import StateManager from '../core/StateManager.js';
import MemoryMatchGame from './games/memory.js';
import SnakeGame from './games/snake.js';
import FlappyPetGame from './games/flappy.js';
import CatchFoodGame from './games/catch.js';
import ReactionTestGame from './games/reaction.js';
import RockPaperScissorsGame from './games/rps.js';
import Tile2048Game from './games/game2048.js';
import TreasureHuntGame from './games/treasure.js';

class MiniGameManager {
    /** @type {MiniGameManager} */
    static #instance;

    /** @type {Object|null} */
    #currentGame = null;

    /** @type {HTMLDivElement|null} */
    #overlay = null;

    static getInstance() {
        if (!MiniGameManager.#instance) {
            MiniGameManager.#instance = new MiniGameManager();
        }
        return MiniGameManager.#instance;
    }

    init() {
        EventBus.getInstance().on('minigame:start', ({ gameId }) => {
            console.log('[MiniGameManager] Received minigame:start event:', gameId);
            this.startGameDirect(gameId);
        });
        console.log('[MiniGameManager] Initialized, listening for minigame:start');
    }

    /**
     * Start a game directly (public method for UI to call)
     * @param {string} gameId
     */
    startGameDirect(gameId) {
        this.#startGame(gameId);
    }

    /**
     * Start a game by ID
     * @param {string} gameId
     */
    #startGame(gameId) {
        const games = {
            memory: () => new MemoryMatchGame(this),
            snake: () => new SnakeGame(this),
            flappy: () => new FlappyPetGame(this),
            catch: () => new CatchFoodGame(this),
            reaction: () => new ReactionTestGame(this),
            rps: () => new RockPaperScissorsGame(this),
            '2048': () => new Tile2048Game(this),
            treasure: () => new TreasureHuntGame(this)
        };

        const gameFactory = games[gameId];
        if (!gameFactory) {
            this.showToast('Unknown game!', 'error');
            return;
        }

        // Close any existing game
        this.closeCurrentGame();
        
        try {
            this.#currentGame = gameFactory();
            this.#currentGame.start();
        } catch (error) {
            console.error('[MiniGameManager] Error starting game:', error);
            this.showToast(`Failed to start: ${error.message}`, 'error');
            this.closeCurrentGame();
        }
    }

    /**
     * Close the currently running game
     */
    closeCurrentGame() {
        if (this.#currentGame) {
            this.#currentGame.destroy();
            this.#currentGame = null;
        }
        this.removeOverlay();
    }

    /**
     * Create game overlay container
     * @returns {HTMLDivElement}
     */
    createOverlay() {
        this.removeOverlay();
        const overlay = document.createElement('div');
        overlay.className = 'minigame-overlay';
        overlay.innerHTML = `
            <div class="minigame-overlay-header">
                <span class="minigame-overlay-title"></span>
                <button class="minigame-overlay-close">✕</button>
            </div>
            <div class="minigame-overlay-body"></div>
        `;
        overlay.querySelector('.minigame-overlay-close').addEventListener('click', () => this.closeCurrentGame());
        document.getElementById('app').appendChild(overlay);
        this.#overlay = overlay;
        return overlay;
    }

    /**
     * Remove game overlay
     */
    removeOverlay() {
        if (this.#overlay) {
            this.#overlay.remove();
            this.#overlay = null;
        }
    }

    /**
     * Get overlay body element
     * @returns {HTMLElement|null}
     */
    getBody() {
        return this.#overlay?.querySelector('.minigame-overlay-body') || null;
    }

    /**
     * Set overlay title
     * @param {string} title
     */
    setTitle(title) {
        const el = this.#overlay?.querySelector('.minigame-overlay-title');
        if (el) el.textContent = title;
    }

    /**
     * Show a toast message
     * @param {string} msg
     * @param {string} type
     */
    showToast(msg, type = 'info') {
        const toast = document.getElementById('notification-toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.className = `notification-toast notification-${type}`;
        toast.classList.remove('hidden');
        clearTimeout(window._toastTimeout);
        window._toastTimeout = setTimeout(() => toast.classList.add('hidden'), 2500);
    }

    /**
     * Award coins for winning a game
     * @param {number} coins
     */
    awardCoins(coins) {
        GameEngine.getInstance().addCoins(coins);
        StateManager.getInstance().update('stats.gamesPlayed', c => (c || 0) + 1);
        this.showToast(`+${coins} coins!`, 'success');
    }
}

export default MiniGameManager;

