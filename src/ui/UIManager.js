/**
 * UIManager - Main UI controller
 * @module ui/UIManager
 * 
 * Handles all DOM interactions, screen navigation, and UI updates.
 * Listens to EventBus events and updates the DOM accordingly.
 */
import EventBus from '../core/EventBus.js';
import StateManager from '../core/StateManager.js';
import Registry from '../core/Registry.js';
import GameEngine from '../core/GameEngine.js';
import Pet from '../pets/Pet.js';
import PetRenderer from '../pets/PetRenderer.js';
import MeowlRenderer from '../pets/MeowlRenderer.js';
import ModelRenderer3D from '../pets/ModelRenderer3D.js';
import AssetConfig from '../assets/AssetConfig.js';
import AudioManager from '../core/AudioManager.js';
import MiniGameManager from '../gameplay/MiniGameManager.js';

class UIManager {
    /** @type {UIManager} */
    static #instance;

    /** @type {Object} */
    #elements = {};

    /** @type {Pet|null} */
    #activePet = null;

    /** @type {PetRenderer|ModelRenderer3D|null} */
    #petRenderer = null;

    /** @type {Array<Function>} */
    #cleanups = [];

    /** @type {number|null} */
    #notificationTimeout = null;

    static getInstance() {
        if (!UIManager.#instance) {
            UIManager.#instance = new UIManager();
        }
        return UIManager.#instance;
    }

    /**
     * Initialize UI
     */
    init() {
        this.#cacheElements();
        this.#setupEventListeners();
        this.#subscribeToEvents();
        this.#setupLoadingScreen();
    }

    /**
     * Set active pet reference
     * @param {Pet} pet
     */
    setActivePet(pet) {
        this.#activePet = pet;
        this.#initPetRenderer();
        this.#updatePetDisplay();
    }

    /**
     * Update all UI elements
     */
    updateAll() {
        this.#updateCurrency();
        this.#updatePetDisplay();
        this.#updateStats();
        this.#updateInventory();
        this.#updateShop();
        this.#updateQuests();
        this.#updateAchievements();
        this.#updateMiniGames();
    }

    /**
     * Cache DOM element references
     * @private
     */
    #cacheElements() {
        const ids = [
            'loading-screen', 'loading-bar', 'loading-text', 'game-container',
            'coin-display', 'diamond-display', 'pet-sprite', 'pet-mood-bubble',
            'pet-name', 'pet-level', 'pet-name-tag', 'environment-bg',
            'weather-overlay', 'day-night-overlay', 'notification-toast',
            'speech-bubble', 'inventory-grid', 'shop-grid', 'shop-tabs',
            'minigame-grid', 'quest-container', 'achievement-container',
            'theme-selector', 'settings-modal', 'health-bar', 'hunger-bar',
            'happiness-bar', 'energy-bar', 'cleanliness-bar', 'sleep-bar',
            'health-value', 'hunger-value', 'happiness-value', 'energy-value',
            'cleanliness-value', 'sleep-value'
        ];

        for (const id of ids) {
            this.#elements[id] = document.getElementById(id);
        }
    }

    /**
     * Set up DOM event listeners
     * @private
     */
    #setupEventListeners() {
        const eb = EventBus.getInstance();

        // Action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                eb.emit('ui:action', { action });
            });
        });

        // Bottom navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const screen = btn.dataset.screen;
                this.#switchScreen(screen);
            });
        });

        // Close screen buttons
        document.querySelectorAll('.close-screen-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const screen = btn.dataset.screen;
                this.#switchScreen('pet-view');
            });
        });

        // Settings
        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.#openSettings();
        });

        document.getElementById('settings-close')?.addEventListener('click', () => {
            this.#closeSettings();
        });

        document.getElementById('save-now-btn')?.addEventListener('click', async () => {
            await GameEngine.getInstance().save();
            this.#showNotification('Game saved!', 'success');
        });

        document.getElementById('reset-game-btn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all game data? This cannot be undone!')) {
                GameEngine.getInstance().reset();
                location.reload();
            }
        });

        // Settings inputs
        document.getElementById('music-volume')?.addEventListener('input', (e) => {
            StateManager.getInstance().set('settings.musicVolume', parseInt(e.target.value));
        });

        document.getElementById('sfx-volume')?.addEventListener('input', (e) => {
            StateManager.getInstance().set('settings.sfxVolume', parseInt(e.target.value));
        });

        document.getElementById('browser-notif')?.addEventListener('change', (e) => {
            StateManager.getInstance().set('settings.browserNotifications', e.target.checked);
        });

        document.getElementById('game-notif')?.addEventListener('change', (e) => {
            StateManager.getInstance().set('settings.gameNotifications', e.target.checked);
        });

        document.getElementById('autosave')?.addEventListener('change', (e) => {
            StateManager.getInstance().set('settings.autoSave', e.target.checked);
        });

        // Shop tabs
        document.getElementById('shop-tabs')?.addEventListener('click', (e) => {
            const tab = e.target.closest('.shop-tab');
            if (tab) {
                document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.#updateShop(tab.dataset.category);
            }
        });

        // Menu button
        document.getElementById('menu-btn')?.addEventListener('click', () => {
            this.#switchScreen('pet-view');
        });

        // Notifications button
        document.getElementById('notifications-btn')?.addEventListener('click', () => {
            this.#showNotification('No new notifications', 'info');
        });
    }

    /**
     * Subscribe to EventBus events
     * @private
     */
    #subscribeToEvents() {
        const eb = EventBus.getInstance();

        this.#cleanups.push(
            eb.on('currency:changed', () => this.#updateCurrency()),
            eb.on('pet:action', (data) => this.#handlePetAction(data)),
            eb.on('pet:levelUp', (data) => {
                this.#showNotification(`Pet reached level ${data.level}!`, 'success');
                this.#updatePetDisplay();
            }),
            eb.on('pet:evolved', (data) => {
                this.#showNotification(`Pet evolved to ${data.toStage}!`, 'success');
                this.#updatePetDisplay();
            }),
            eb.on('pet:abilityUnlocked', (data) => {
                this.#showNotification(`New ability: ${data.ability}!`, 'success');
            }),
            eb.on('player:levelUp', (data) => {
                this.#showNotification(`You reached level ${data.level}!`, 'success');
            }),
            eb.on('player:xpChanged', () => this.#updatePetDisplay()),
            eb.on('engine:initialized', () => {
                this.#hideLoading();
                this.updateAll();
            })
        );
    }

    /**
     * Handle loading screen
     * @private
     */
    #setupLoadingScreen() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 100) progress = 100;
            this.#elements['loading-bar'].style.width = `${progress}%`;
            
            const texts = [
                'Hatching the universe...',
                'Warming up the engines...',
                'Feeding the pets...',
                'Polishing the stars...',
                'Almost ready...'
            ];
            this.#elements['loading-text'].textContent = texts[Math.floor(progress / 25) % texts.length];

            if (progress >= 100) {
                clearInterval(interval);
            }
        }, 200);
    }

    /**
     * Hide loading screen
     * @private
     */
    #hideLoading() {
        setTimeout(() => {
            this.#elements['loading-screen'].classList.add('hidden');
            this.#elements['game-container'].classList.remove('hidden');
        }, 500);
    }

    /**
     * Switch active screen
     * @private
     * @param {string} screenId
     */
    #switchScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
        }

        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const navBtn = document.querySelector(`.nav-btn[data-screen="${screenId}"]`);
        if (navBtn) navBtn.classList.add('active');

        // Toggle body class to hide action-bar and bottom-nav when overlay screens are active
        const overlayScreens = ['inventory', 'shop', 'minigames', 'quests', 'achievements'];
        if (overlayScreens.includes(screenId)) {
            document.body.classList.add('has-overlay');
        } else {
            document.body.classList.remove('has-overlay');
        }

        // Update content when switching to a screen
        switch (screenId) {
            case 'inventory': this.#updateInventory(); break;
            case 'shop': this.#updateShop(); break;
            case 'minigames': this.#updateMiniGames(); break;
            case 'quests': this.#updateQuests(); break;
            case 'achievements': this.#updateAchievements(); break;
        }
    }

    /**
     * Update currency display
     * @private
     */
    #updateCurrency() {
        const sm = StateManager.getInstance();
        this.#elements['coin-display'].textContent = sm.get('coins', 0);
        this.#elements['diamond-display'].textContent = sm.get('diamonds', 0);
    }

    /**
     * Initialize the pet renderer (3D model or Canvas2D fallback)
     * @private
     */
    #initPetRenderer() {
        // Destroy old renderer if exists
        if (this.#petRenderer) {
            this.#petRenderer.destroy();
            this.#petRenderer = null;
        }

        const spriteContainer = this.#elements['pet-sprite'];
        if (!spriteContainer) return;

        spriteContainer.innerHTML = '';

        if (!this.#activePet) return;

        const species = this.#activePet.species;

        // Check if species has a 3D model
        if (AssetConfig.hasModel(species)) {
            // Create container div for Three.js renderer
            const rendererContainer = document.createElement('div');
            rendererContainer.id = 'pet-3d-container';
            rendererContainer.style.cssText = 'width:240px;height:240px;display:block;margin:0 auto;';
            spriteContainer.appendChild(rendererContainer);

            try {
                this.#petRenderer = new ModelRenderer3D(rendererContainer, this.#activePet);
            } catch (e) {
                console.warn(`[UIManager] Failed to create 3D renderer for ${species}, using fallback:`, e);
                spriteContainer.innerHTML = '';
                this.#initCanvasFallback(spriteContainer);
            }
        } else {
            // Meowl gets its special image, others get Canvas2D
            if (species === 'meowl') {
                const img = document.createElement('img');
                img.id = 'pet-canvas';
                img.src = 'assets/images/meowl.png';
                img.alt = this.#activePet.name;
                img.style.cssText = 'width:240px;height:240px;object-fit:contain;display:block;margin:0 auto;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.2));';
                spriteContainer.appendChild(img);
            } else {
                this.#initCanvasFallback(spriteContainer);
            }
        }
    }

    /**
     * Initialize Canvas2D fallback renderer
     * @private
     * @param {HTMLElement} container
     */
    #initCanvasFallback(container) {
        let canvas = document.getElementById('pet-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'pet-canvas';
            canvas.width = 240;
            canvas.height = 240;
            canvas.style.cssText = 'width:240px;height:240px;display:block;margin:0 auto;';
            container.appendChild(canvas);
        }

        if (this.#activePet) {
            this.#petRenderer = new PetRenderer(canvas, this.#activePet);
        }
    }

    /**
     * Update pet display
     * @private
     */
    #updatePetDisplay() {
        if (!this.#activePet) return;
        // Guard: elements may not be cached yet if called before init()
        const name = this.#elements['pet-name'];
        const level = this.#elements['pet-level'];
        const mood = this.#elements['pet-mood-bubble'];
        if (!name || !level || !mood) return;

        const pet = this.#activePet;
        name.textContent = pet.name;
        level.textContent = `Lv.${pet.level} ${pet.getGrowthName()}`;
        mood.textContent = pet.getMoodEmoji();
        mood.className = `pet-mood-bubble mood-${pet.mood}`;

        this.#updateStats();
    }

    /**
     * Update stats bars
     * @private
     */
    #updateStats() {
        if (!this.#activePet) return;

        const stats = this.#activePet.stats;
        const statMappings = [
            { bar: 'health-bar', value: 'health-value', key: 'health' },
            { bar: 'hunger-bar', value: 'hunger-value', key: 'hunger' },
            { bar: 'happiness-bar', value: 'happiness-value', key: 'happiness' },
            { bar: 'energy-bar', value: 'energy-value', key: 'energy' },
            { bar: 'cleanliness-bar', value: 'cleanliness-value', key: 'cleanliness' },
            { bar: 'sleep-bar', value: 'sleep-value', key: 'sleep' }
        ];

        for (const mapping of statMappings) {
            const val = Math.round(stats[mapping.key] || 0);
            const bar = this.#elements[mapping.bar];
            const valueEl = this.#elements[mapping.value];
            if (bar) bar.style.width = `${val}%`;
            if (valueEl) valueEl.textContent = val;
        }
    }

    /**
     * Handle pet action from UI
     * @private
     * @param {Object} data
     */
    async #handlePetAction(data) {
        if (!this.#activePet) {
            this.#showNotification('No pet selected!', 'error');
            return;
        }

        const pet = this.#activePet;
        let result;

        switch (data.action) {
            case 'feed':
                // Use first available food from inventory
                const foods = this.#getInventoryItems('food');
                if (foods.length === 0) {
                    this.#showNotification('No food available! Buy some from the shop.', 'warning');
                    AudioManager.getInstance().play('sfx_error');
                    return;
                }
                result = pet.feed(foods[0].id);
                this.#useInventoryItem(foods[0].id);
                AudioManager.getInstance().play('sfx_feed');
                break;
            case 'play':
                result = pet.play();
                AudioManager.getInstance().play('sfx_play');
                // Trigger 3D model pet animation if applicable
                if (this.#petRenderer && typeof this.#petRenderer.pet === 'function') {
                    this.#petRenderer.pet();
                }
                break;
            case 'sleep':
                if (pet.isSleeping) {
                    result = pet.wakeUp();
                    AudioManager.getInstance().play('sfx_wake');
                } else {
                    result = pet.sleep();
                    AudioManager.getInstance().play('sfx_sleep');
                }
                break;
            case 'bath':
                result = pet.bathe();
                AudioManager.getInstance().play('sfx_bath');
                break;
            case 'heal':
                result = pet.heal();
                AudioManager.getInstance().play('sfx_heal');
                break;
            case 'train':
                result = pet.train();
                AudioManager.getInstance().play('sfx_train');
                break;
            case 'study':
                result = pet.study();
                break;
            default:
                result = { success: false, message: 'Unknown action' };
        }

        if (result.success) {
            this.#updateStats();
            this.#updatePetDisplay();
            this.#showNotification(result.message, 'success');
            GameEngine.getInstance().addXP(2);
        } else {
            this.#showNotification(result.message, 'warning');
            AudioManager.getInstance().play('sfx_error');
        }
    }

    /**
     * Get inventory items by category
     * @private
     */
    #getInventoryItems(category) {
        const inv = StateManager.getInstance().get('inventory', {});
        const items = [];
        for (const [id, count] of Object.entries(inv)) {
            if (count > 0) {
                const config = Registry.getInstance().get(category + 's', id);
                if (config) items.push({ id, ...config, count });
            }
        }
        return items;
    }

    /**
     * Use an inventory item
     * @private
     */
    #useInventoryItem(itemId) {
        const sm = StateManager.getInstance();
        const inv = sm.get('inventory', {});
        if (inv[itemId]) {
            inv[itemId]--;
            if (inv[itemId] <= 0) delete inv[itemId];
            sm.set('inventory', { ...inv });
        }
    }

    /**
     * Update inventory display
     * @private
     */
    #updateInventory() {
        const grid = this.#elements['inventory-grid'];
        if (!grid) return;

        const inv = StateManager.getInstance().get('inventory', {});
        grid.innerHTML = '';

        const hasItems = Object.keys(inv).length > 0;
        if (!hasItems) {
            grid.innerHTML = '<div class="empty-state">🎒 Your inventory is empty.<br>Buy items from the shop!</div>';
            return;
        }

        for (const [id, count] of Object.entries(inv)) {
            if (count <= 0) continue;
            // Try to find item in any registry
            let item = Registry.getInstance().get('foods', id) ||
                       Registry.getInstance().get('toys', id) ||
                       Registry.getInstance().get('furniture', id) ||
                       Registry.getInstance().get('decorations', id) ||
                       Registry.getInstance().get('accessories', id);

            if (!item) {
                item = { id, name: id, emoji: '📦' };
            }

            const card = document.createElement('div');
            card.className = 'inventory-item';
            card.innerHTML = `
                <span class="item-emoji">${item.emoji || '📦'}</span>
                <span class="item-name">${item.name}</span>
                <span class="item-count">x${count}</span>
            `;
            grid.appendChild(card);
        }
    }

    /**
     * Update shop display
     * @private
     * @param {string} [category='food']
     */
    #updateShop(category = 'food') {
        const grid = this.#elements['shop-grid'];
        if (!grid) return;

        const categoryMap = {
            food: 'foods',
            furniture: 'furniture',
            decorations: 'decorations',
            accessories: 'accessories',
            themes: 'themes'
        };

        const registryKey = categoryMap[category] || 'foods';
        let items = Registry.getInstance().getAll(registryKey);

        // Filter by unlock level
        const playerLevel = GameEngine.getInstance().getLevel();
        items = items.filter(item => (item.unlockLevel || 1) <= playerLevel);

        grid.innerHTML = '';

        if (items.length === 0) {
            grid.innerHTML = '<div class="empty-state">No items available yet.<br>Keep playing to unlock more!</div>';
            return;
        }

        for (const item of items) {
            const card = document.createElement('div');
            card.className = 'shop-item';
            card.innerHTML = `
                <span class="shop-item-emoji">${item.emoji || '📦'}</span>
                <span class="shop-item-name">${item.name}</span>
                <span class="shop-item-cost">🪙 ${item.cost || 0}</span>
                <button class="btn btn-primary buy-btn" data-id="${item.id}" data-category="${registryKey}">Buy</button>
            `;
            grid.appendChild(card);

            card.querySelector('.buy-btn').addEventListener('click', () => {
                this.#buyItem(item.id, registryKey, item.cost || 0);
            });
        }
    }

    /**
     * Buy an item from shop
     * @private
     */
    #buyItem(itemId, category, cost) {
        const engine = GameEngine.getInstance();
        if (engine.spendCoins(cost)) {
            const sm = StateManager.getInstance();
            const inv = sm.get('inventory', {});
            inv[itemId] = (inv[itemId] || 0) + 1;
            sm.set('inventory', { ...inv });
            this.#showNotification(`Purchased ${itemId}!`, 'success');
            AudioManager.getInstance().play('sfx_coin');
            this.#updateCurrency();
            this.#updateInventory();
        } else {
            this.#showNotification('Not enough coins!', 'error');
            AudioManager.getInstance().play('sfx_error');
        }
    }

    /**
     * Update mini-games display
     * @private
     */
    #updateMiniGames() {
        const grid = this.#elements['minigame-grid'];
        if (!grid) return;

        const games = [
            { id: 'memory', name: 'Memory Match', emoji: '🧠', desc: 'Match the cards!' },
            { id: 'snake', name: 'Snake', emoji: '🐍', desc: 'Feed the snake!' },
            { id: 'flappy', name: 'Flappy Pet', emoji: '🐦', desc: 'Fly through obstacles!' },
            { id: 'catch', name: 'Catch Food', emoji: '🍎', desc: 'Catch falling food!' },
            { id: 'reaction', name: 'Reaction Test', emoji: '⚡', desc: 'Test your reflexes!' },
            { id: 'rps', name: 'Rock Paper Scissors', emoji: '✂️', desc: 'Classic game!' },
            { id: '2048', name: '2048', emoji: '🔢', desc: 'Merge the tiles!' },
            { id: 'treasure', name: 'Treasure Hunt', emoji: '💎', desc: 'Find the treasure!' }
        ];

        grid.innerHTML = '';
        for (const game of games) {
            const card = document.createElement('div');
            card.className = 'minigame-card';
            card.innerHTML = `
                <span class="minigame-emoji">${game.emoji}</span>
                <span class="minigame-name">${game.name}</span>
                <span class="minigame-desc">${game.desc}</span>
                <button class="btn btn-primary play-game-btn" data-game="${game.id}">Play</button>
            `;
            grid.appendChild(card);

            card.querySelector('.play-game-btn').addEventListener('click', () => {
                AudioManager.getInstance().play('sfx_click');
                this.#startMiniGame(game.id);
            });
        }
    }

    /**
     * Start a mini-game
     * @private
     */
    #startMiniGame(gameId) {
        try {
            // Try direct call first (more reliable)
            MiniGameManager.getInstance().startGameDirect(gameId);
        } catch (e) {
            // Fallback to EventBus
            EventBus.getInstance().emit('minigame:start', { gameId });
        }
    }

    /**
     * Update quests display
     * @private
     */
    #updateQuests() {
        const container = this.#elements['quest-container'];
        if (!container) return;

        const dailyMissions = [
            { id: 'feed3', name: 'Feed your pet 3 times', reward: 50, progress: 0, max: 3 },
            { id: 'play2', name: 'Play with your pet twice', reward: 30, progress: 0, max: 2 },
            { id: 'clean1', name: 'Bathe your pet', reward: 25, progress: 0, max: 1 },
            { id: 'earn100', name: 'Earn 100 coins', reward: 100, progress: 0, max: 100 },
            { id: 'train1', name: 'Train your pet', reward: 40, progress: 0, max: 1 }
        ];

        container.innerHTML = '<h3>📋 Daily Missions</h3>';
        const list = document.createElement('div');
        list.className = 'quest-list';

        for (const mission of dailyMissions) {
            const el = document.createElement('div');
            el.className = 'quest-item';
            el.innerHTML = `
                <div class="quest-info">
                    <span class="quest-name">${mission.name}</span>
                    <div class="quest-progress-bar">
                        <div class="quest-progress-fill" style="width:${(mission.progress / mission.max) * 100}%"></div>
                    <span class="quest-progress-text">${mission.progress}/${mission.max}</span>
                </div>
                <span class="quest-reward">🪙 ${mission.reward}</span>
            `;
            list.appendChild(el);
        }

        container.appendChild(list);
    }

    /**
     * Update achievements display
     * @private
     */
    #updateAchievements() {
        const container = this.#elements['achievement-container'];
        if (!container) return;

        const achievements = [
            { id: 'first_pet', name: 'First Pet', desc: 'Hatch your first pet', emoji: '🥚', unlocked: true },
            { id: 'pet_lover', name: 'Pet Lover', desc: 'Raise a pet to adult', emoji: '❤️', unlocked: false },
            { id: 'millionaire', name: 'Millionaire', desc: 'Earn 1,000,000 coins', emoji: '💰', unlocked: false },
            { id: 'collector', name: 'Collector', desc: 'Own 50 different items', emoji: '🏛️', unlocked: false },
            { id: 'gamer', name: 'Gamer', desc: 'Play 100 mini-games', emoji: '🎮', unlocked: false },
            { id: 'trainer', name: 'Trainer', desc: 'Train a pet to level 50', emoji: '💪', unlocked: false },
            { id: 'explorer', name: 'Explorer', desc: 'Unlock all environments', emoji: '🗺️', unlocked: false },
            { id: 'fashionista', name: 'Fashionista', desc: 'Collect all themes', emoji: '👗', unlocked: false }
        ];

        container.innerHTML = '<h3>🏆 Achievements</h3>';
        const grid = document.createElement('div');
        grid.className = 'achievement-grid';

        for (const ach of achievements) {
            const el = document.createElement('div');
            el.className = `achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`;
            el.innerHTML = `
                <span class="achievement-emoji">${ach.unlocked ? ach.emoji : '🔒'}</span>
                <span class="achievement-name">${ach.name}</span>
                <span class="achievement-desc">${ach.desc}</span>
            `;
            grid.appendChild(el);
        }

        container.appendChild(grid);
    }

    /**
     * Open settings modal
     * @private
     */
    #openSettings() {
        this.#elements['settings-modal'].classList.remove('hidden');
        this.#updateThemeSelector();
    }

    /**
     * Close settings modal
     * @private
     */
    #closeSettings() {
        this.#elements['settings-modal'].classList.add('hidden');
    }

    /**
     * Update theme selector in settings
     * @private
     */
    #updateThemeSelector() {
        const container = this.#elements['theme-selector'];
        if (!container) return;

        const themes = Registry.getInstance().getAll('themes');
        const currentTheme = StateManager.getInstance().get('theme', 'light');

        container.innerHTML = '';
        for (const theme of themes) {
            const btn = document.createElement('button');
            btn.className = `theme-btn ${theme.id === currentTheme ? 'active' : ''}`;
            btn.innerHTML = `${theme.emoji} ${theme.name}`;
            btn.addEventListener('click', () => {
                this.#applyTheme(theme.id);
            });
            container.appendChild(btn);
        }
    }

    /**
     * Apply a theme
     * @private
     * @param {string} themeId
     */
    #applyTheme(themeId) {
        const theme = Registry.getInstance().get('themes', themeId);
        if (!theme) return;

        StateManager.getInstance().set('theme', themeId);
        const root = document.documentElement;
        const colors = theme.colors;

        for (const [key, value] of Object.entries(colors)) {
            root.style.setProperty(`--color-${key}`, value);
        }

        // Update active state in selector
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = document.querySelector(`.theme-btn[data-theme="${themeId}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        this.#showNotification(`Theme changed to ${theme.name}!`, 'success');
    }

    /**
     * Show a notification toast
     * @private
     * @param {string} message
     * @param {string} [type='info']
     */
    #showNotification(message, type = 'info') {
        const toast = this.#elements['notification-toast'];
        if (!toast) return;

        toast.textContent = message;
        toast.className = `notification-toast notification-${type}`;
        toast.classList.remove('hidden');

        clearTimeout(this.#notificationTimeout);
        this.#notificationTimeout = setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    /**
     * Get the active pet
     * @returns {Pet|null}
     */
    getActivePet() {
        return this.#activePet;
    }

    /**
     * Clean up event listeners
     */
    destroy() {
        if (this.#petRenderer) {
            this.#petRenderer.destroy();
            this.#petRenderer = null;
        }
        for (const cleanup of this.#cleanups) {
            cleanup();
        }
        this.#cleanups = [];
    }
}

export default UIManager;
