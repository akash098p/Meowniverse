/**
 * Meowniverse - Main Entry Point
 * @module main
 * 
 * Bootstraps the game engine, loads content, and starts the game.
 */
import GameEngine from './core/GameEngine.js';
import ContentLoader from './core/ContentLoader.js';
import UIManager from './ui/UIManager.js';
import Registry from './core/Registry.js';
import Pet from './pets/Pet.js';
import StateManager from './core/StateManager.js';
import SaveManager from './core/SaveManager.js';
import GameLoop from './core/GameLoop.js';
import MiniGameManager from './gameplay/MiniGameManager.js';

/**
 * Bootstrap the game
 */
async function bootstrap() {
    try {
        console.log('[Meowniverse] Starting...');

        // Initialize mini game manager
        MiniGameManager.getInstance().init();

        // Load all game content from config
        await ContentLoader.getInstance().loadAll();
        console.log('[Meowniverse] Content loaded');

        // Try to load saved game
        const engine = GameEngine.getInstance();
        const saveManager = SaveManager.getInstance();
        const savedState = await saveManager.load();

        // Initialize UI first so elements are cached before we try to update them
        UIManager.getInstance().init();

        if (savedState) {
            console.log('[Meowniverse] Loading saved game');
            // Initialize engine with saved state
            await engine.init(savedState);
            
            // Recreate pets from saved data
            const pets = savedState.pets || [];
            if (pets.length > 0) {
                const petData = pets[0]; // Active pet
                const pet = new Pet(petData.species, petData.name, petData);
                UIManager.getInstance().setActivePet(pet);
            }

            // Apply saved theme
            const themeId = savedState.theme || 'light';
            applyTheme(themeId);
        } else {
            console.log('[Meowniverse] New game');
            // New game - create first pet
            await engine.init();

            // Give starting items
            const sm = StateManager.getInstance();
            sm.set('inventory', {
                fish: 3,
                bread: 5,
                ball: 1,
                yarn: 1
            });

            // Create starter pet (Meowl)
            const starterPet = new Pet('meowl', 'Meowl');
            starterPet.hatched = true;
            sm.set('pets', [starterPet.serialize()]);
            sm.set('activePetIndex', 0);
            
            UIManager.getInstance().setActivePet(starterPet);

            // Apply default light theme
            applyTheme('light');
        }

        // Set up pet update loop
        const gameLoop = GameLoop.getInstance();
        gameLoop.addUpdatable((dt) => {
            const gameMinutes = dt / 60000; // Convert ms to minutes
            const ui = UIManager.getInstance();
            const activePet = ui.getActivePet();
            if (activePet && activePet.hatched) {
                activePet.update(gameMinutes);
                ui.updateAll();
            }
        }, 50, 'PetUpdate');

        // Start the game
        engine.start();

        // Register service worker
        registerServiceWorker();

        console.log('[Meowniverse] Game started successfully!');
    } catch (error) {
        console.error('[Meowniverse] Failed to start:', error);
        // Show error on loading screen
        const loadingText = document.getElementById('loading-text');
        if (loadingText) {
            loadingText.textContent = 'Something went wrong... ' + error.message;
        }
    }
}

/**
 * Apply theme colors
 * @param {string} themeId
 */
function applyTheme(themeId) {
    const theme = Registry.getInstance().get('themes', themeId);
    if (!theme) return;

    const root = document.documentElement;
    const colors = theme.colors;
    for (const [key, value] of Object.entries(colors)) {
        root.style.setProperty(`--color-${key}`, value);
    }
    StateManager.getInstance().set('theme', themeId);
}

/**
 * Register service worker for PWA support
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('[SW] Registered'))
            .catch(err => console.warn('[SW] Registration failed:', err));
    }
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}