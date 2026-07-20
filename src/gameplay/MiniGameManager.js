/**
 * MiniGameManager - Handles all mini games
 * @module gameplay/MiniGameManager
 */
import EventBus from '../core/EventBus.js';
import GameEngine from '../core/GameEngine.js';

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
            this.#startGame(gameId);
        });
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
        
        this.#currentGame = gameFactory();
        this.#currentGame.start();
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
        this.showToast(`+${coins} coins!`, 'success');
    }
}

export default MiniGameManager;

// ==================== MEMORY MATCH ====================
class MemoryMatchGame {
    constructor(manager) {
        this.manager = manager;
        this.cards = [];
        this.flipped = [];
        this.matched = 0;
        this.moves = 0;
        this.locked = false;
    }

    start() {
        const overlay = this.manager.createOverlay();
        this.manager.setTitle('🧠 Memory Match');
        const body = this.manager.getBody();

        const emojis = ['🐱', '🐶', '🐰', '🐧', '🦊', '🐉', '🐟', '🐸'];
        const deck = [...emojis, ...emojis].sort(() => Math.random() - 0.5);

        body.innerHTML = `
            <div class="minigame-stats">
                <span>Moves: <strong id="memory-moves">0</strong></span>
                <span>Matched: <strong id="memory-matched">0</strong>/8</span>
            </div>
            <div class="memory-grid"></div>
        `;

        const grid = body.querySelector('.memory-grid');
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:10px;max-width:400px;margin:0 auto;';

        deck.forEach((emoji, i) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.index = i;
            card.dataset.emoji = emoji;
            card.style.cssText = 'aspect-ratio:1;background:var(--color-primary);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:2rem;cursor:pointer;transition:all 0.3s;color:transparent;';
            card.addEventListener('click', () => this.#flip(card));
            grid.appendChild(card);
        });
    }

    #flip(card) {
        if (this.locked || card.classList.contains('matched') || card.classList.contains('flipped')) return;
        card.style.color = 'white';
        card.style.background = 'var(--color-surface)';
        card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        card.textContent = card.dataset.emoji;
        card.classList.add('flipped');

        this.flipped.push(card);
        if (this.flipped.length === 2) {
            this.locked = true;
            this.moves++;
            document.getElementById('memory-moves').textContent = this.moves;

            const [a, b] = this.flipped;
            if (a.dataset.emoji === b.dataset.emoji) {
                a.classList.add('matched');
                b.classList.add('matched');
                a.style.background = 'var(--color-success)';
                b.style.background = 'var(--color-success)';
                this.matched++;
                document.getElementById('memory-matched').textContent = this.matched;
                this.flipped = [];
                this.locked = false;
                if (this.matched === 8) {
                    this.#win();
                }
            } else {
                setTimeout(() => {
                    a.style.color = 'transparent';
                    a.style.background = 'var(--color-primary)';
                    a.textContent = '';
                    b.style.color = 'transparent';
                    b.style.background = 'var(--color-primary)';
                    b.textContent = '';
                    a.classList.remove('flipped');
                    b.classList.remove('flipped');
                    this.flipped = [];
                    this.locked = false;
                }, 800);
            }
        }
    }

    #win() {
        const bonus = Math.max(50 - this.moves, 10);
        this.manager.awardCoins(bonus);
        this.manager.showToast(`🎉 You won! +${bonus} coins in ${this.moves} moves!`, 'success');
        setTimeout(() => this.manager.closeCurrentGame(), 2000);
    }

    destroy() {}
}

// ==================== SNAKE ====================
class SnakeGame {
    constructor(manager) {
        this.manager = manager;
        this.snake = [{x: 5, y: 5}];
        this.food = {x: 0, y: 0};
        this.direction = {x: 1, y: 0};
        this.nextDirection = {x: 1, y: 0};
        this.score = 0;
        this.running = false;
        this.interval = null;
        this.cellSize = 20;
        this.gridSize = 15;
    }

    start() {
        const overlay = this.manager.createOverlay();
        this.manager.setTitle('🐍 Snake');
        const body = this.manager.getBody();

        body.innerHTML = `
            <div class="minigame-stats">
                <span>Score: <strong id="snake-score">0</strong></span>
            </div>
            <div id="snake-canvas-wrapper" style="display:flex;justify-content:center;padding:10px;">
                <canvas id="snake-canvas" width="${this.cellSize * this.gridSize}" height="${this.cellSize * this.gridSize}" 
                    style="border:2px solid var(--color-primary);border-radius:8px;background:#1a1a2e;"></canvas>
            </div>
            <div style="text-align:center;padding:10px;color:var(--color-text-secondary);font-size:0.8rem;">
                Use arrow keys or swipe to change direction
            </div>
        `;

        this.canvas = document.getElementById('snake-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.#placeFood();
        this.running = true;
        this.interval = setInterval(() => this.#tick(), 150);

        this.#handleInput();
    }

    #placeFood() {
        const free = [];
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                if (!this.snake.some(s => s.x === x && s.y === y)) {
                    free.push({x, y});
                }
            }
        }
        if (free.length > 0) {
            this.food = free[Math.floor(Math.random() * free.length)];
        }
    }

    #tick() {
        this.direction = { ...this.nextDirection };
        const head = { x: this.snake[0].x + this.direction.x, y: this.snake[0].y + this.direction.y };

        // Wall wrap
        if (head.x < 0) head.x = this.gridSize - 1;
        if (head.x >= this.gridSize) head.x = 0;
        if (head.y < 0) head.y = this.gridSize - 1;
        if (head.y >= this.gridSize) head.y = 0;

        // Self collision
        if (this.snake.some(s => s.x === head.x && s.y === head.y)) {
            this.#gameOver();
            return;
        }

        this.snake.unshift(head);
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            document.getElementById('snake-score').textContent = this.score;
            this.#placeFood();
        } else {
            this.snake.pop();
        }
        this.#draw();
    }

    #draw() {
        const ctx = this.ctx;
        const cs = this.cellSize;
        ctx.clearRect(0, 0, cs * this.gridSize, cs * this.gridSize);

        // Draw food
        ctx.fillStyle = '#ff4757';
        ctx.beginPath();
        ctx.arc(this.food.x * cs + cs/2, this.food.y * cs + cs/2, cs/2 - 1, 0, Math.PI * 2);
        ctx.fill();

        // Draw snake
        this.snake.forEach((seg, i) => {
            const gradient = ctx.createRadialGradient(seg.x * cs + cs/2, seg.y * cs + cs/2, 0, seg.x * cs + cs/2, seg.y * cs + cs/2, cs/2);
            gradient.addColorStop(0, i === 0 ? '#70a1ff' : '#1e90ff');
            gradient.addColorStop(1, i === 0 ? '#1e90ff' : '#0066cc');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(seg.x * cs + cs/2, seg.y * cs + cs/2, cs/2 - 1, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    #handleInput() {
        const keyHandler = (e) => {
            if (e.key.startsWith('Arrow')) e.preventDefault();
            switch (e.key) {
                case 'ArrowUp': if (this.direction.y !== 1) this.nextDirection = {x: 0, y: -1}; break;
                case 'ArrowDown': if (this.direction.y !== -1) this.nextDirection = {x: 0, y: 1}; break;
                case 'ArrowLeft': if (this.direction.x !== 1) this.nextDirection = {x: -1, y: 0}; break;
                case 'ArrowRight': if (this.direction.x !== -1) this.nextDirection = {x: 1, y: 0}; break;
            }
        };
        document.addEventListener('keydown', keyHandler);

        // Touch swipe
        let touchStart = null;
        const touchHandler = (e) => {
            const touch = e.touches[0];
            if (e.type === 'touchstart') touchStart = {x: touch.clientX, y: touch.clientY};
            if (e.type === 'touchend' && touchStart) {
                const dx = touch.clientX - touchStart.x;
                const dy = touch.clientY - touchStart.y;
                if (Math.abs(dx) > Math.abs(dy)) {
                    if (dx > 0 && this.direction.x !== -1) this.nextDirection = {x: 1, y: 0};
                    else if (dx < 0 && this.direction.x !== 1) this.nextDirection = {x: -1, y: 0};
                } else {
                    if (dy > 0 && this.direction.y !== -1) this.nextDirection = {x: 0, y: 1};
                    else if (dy < 0 && this.direction.y !== 1) this.nextDirection = {x: 0, y: -1};
                }
                touchStart = null;
            }
        };
        document.addEventListener('touchstart', touchHandler);
        document.addEventListener('touchend', touchHandler);
        
        this._keyHandler = keyHandler;
        this._touchHandler = touchHandler;
    }

    #gameOver() {
        this.running = false;
        clearInterval(this.interval);
        const bonus = Math.floor(this.score / 2);
        if (bonus > 0) this.manager.awardCoins(bonus);
        this.manager.showToast(`💀 Game Over! Score: ${this.score}`, 'warning');
        setTimeout(() => this.manager.closeCurrentGame(), 2000);
    }

    destroy() {
        clearInterval(this.interval);
        if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
        if (this._touchHandler) {
            document.removeEventListener('touchstart', this._touchHandler);
            document.removeEventListener('touchend', this._touchHandler);
        }
    }
}

// ==================== FLAPPY PET ====================
class FlappyPetGame {
    constructor(manager) {
        this.manager = manager;
        this.bird = { x: 60, y: 200, vy: 0 };
        this.pipes = [];
        this.score = 0;
        this.running = false;
        this.interval = null;
        this.width = 400;
        this.height = 350;
        this.gravity = 0.4;
        this.pipeSpeed = 2;
        this.pipeGap = 120;
        this.pipeWidth = 45;
        this.frameCount = 0;
    }

    start() {
        const overlay = this.manager.createOverlay();
        this.manager.setTitle('🐦 Flappy Pet');
        const body = this.manager.getBody();

        body.innerHTML = `
            <div class="minigame-stats">
                <span>Score: <strong id="flappy-score">0</strong></span>
            </div>
            <div style="display:flex;justify-content:center;padding:10px;">
                <canvas id="flappy-canvas" width="${this.width}" height="${this.height}"
                    style="border:2px solid var(--color-primary);border-radius:8px;background:linear-gradient(180deg,#87ceeb 0%,#e0f7fa 100%);cursor:pointer;"></canvas>
            </div>
            <div style="text-align:center;padding:10px;color:var(--color-text-secondary);font-size:0.8rem;">
                Tap / Click / Space to flap!
            </div>
        `;

        this.canvas = document.getElementById('flappy-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.running = true;
        this.interval = setInterval(() => this.#tick(), 20);

        const flap = (e) => {
            if (e.type === 'keydown' && e.key !== ' ') return;
            e.preventDefault();
            if (!this.running) return;
            this.bird.vy = -7;
        };
        this.canvas.addEventListener('click', flap);
        document.addEventListener('keydown', flap);
        this._flap = flap;
    }

    #tick() {
        this.frameCount++;
        this.bird.vy += this.gravity;
        this.bird.y += this.bird.vy;

        if (this.frameCount % 60 === 0) {
            const pipeY = Math.floor(Math.random() * (this.height - this.pipeGap - 60)) + 30;
            this.pipes.push({ x: this.width, top: pipeY, bottom: pipeY + this.pipeGap });
        }

        for (let i = this.pipes.length - 1; i >= 0; i--) {
            this.pipes[i].x -= this.pipeSpeed;
            if (this.pipes[i].x < -this.pipeWidth) {
                this.pipes.splice(i, 1);
                continue;
            }
            if (!this.pipes[i].scored && this.pipes[i].x + this.pipeWidth < this.bird.x) {
                this.pipes[i].scored = true;
                this.score++;
                document.getElementById('flappy-score').textContent = this.score;
            }
        }

        // Collision
        if (this.bird.y < 0 || this.bird.y > this.height) {
            this.#gameOver(); return;
        }
        for (const p of this.pipes) {
            if (this.bird.x + 15 > p.x && this.bird.x - 15 < p.x + this.pipeWidth) {
                if (this.bird.y - 12 < p.top || this.bird.y + 12 > p.bottom) {
                    this.#gameOver(); return;
                }
            }
        }

        this.#draw();
    }

    #draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        // Pipes
        ctx.fillStyle = '#4caf50';
        for (const p of this.pipes) {
            ctx.fillRect(p.x, 0, this.pipeWidth, p.top);
            ctx.fillRect(p.x, p.bottom, this.pipeWidth, this.height - p.bottom);
            ctx.fillStyle = '#388e3c';
            ctx.fillRect(p.x - 3, p.top - 25, this.pipeWidth + 6, 25);
            ctx.fillRect(p.x - 3, p.bottom, this.pipeWidth + 6, 25);
            ctx.fillStyle = '#4caf50';
        }

        // Bird
        ctx.save();
        ctx.translate(this.bird.x, this.bird.y);
        ctx.rotate(Math.min(this.bird.vy * 0.05, 0.5));
        ctx.font = '30px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐦', 0, 0);
        ctx.restore();
    }

    #gameOver() {
        this.running = false;
        clearInterval(this.interval);
        const bonus = Math.floor(this.score * 5);
        if (bonus > 0) this.manager.awardCoins(bonus);
        this.manager.showToast(`💀 Score: ${this.score}`, 'warning');
        setTimeout(() => this.manager.closeCurrentGame(), 2000);
    }

    destroy() {
        clearInterval(this.interval);
        if (this._flap) {
            document.removeEventListener('keydown', this._flap);
        }
    }
}

// ==================== CATCH FOOD ====================
class CatchFoodGame {
    constructor(manager) {
        this.manager = manager;
        this.items = [];
        this.basket = { x: 175 };
        this.score = 0;
        this.missed = 0;
        this.running = false;
        this.interval = null;
        this.width = 400;
        this.height = 350;
        this.frameCount = 0;
        this.foods = ['🍎', '🍕', '🍔', '🍩', '🍪', '🍇', '🍌', '🍓', '🧀', '🥕'];
        this.bombs = ['💣', '🌶️'];
    }

    start() {
        const overlay = this.manager.createOverlay();
        this.manager.setTitle('🍎 Catch Food');
        const body = this.manager.getBody();

        body.innerHTML = `
            <div class="minigame-stats">
                <span>Score: <strong id="catch-score">0</strong></span>
                <span>Missed: <strong id="catch-missed">0</strong>/5</span>
            </div>
            <div style="display:flex;justify-content:center;padding:10px;">
                <canvas id="catch-canvas" width="${this.width}" height="${this.height}"
                    style="border:2px solid var(--color-primary);border-radius:8px;background:linear-gradient(180deg,#fff5f7 0%,#ffe4e1 100%);"></canvas>
            </div>
            <div style="text-align:center;padding:10px;color:var(--color-text-secondary);font-size:0.8rem;">
                Move mouse/touch to catch food, avoid bombs!
            </div>
        `;

        this.canvas = document.getElementById('catch-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.running = true;
        this.interval = setInterval(() => this.#tick(), 30);

        const move = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
            this.basket.x = Math.max(30, Math.min(this.width - 30, x * (this.width / rect.width)));
        };
        this.canvas.addEventListener('mousemove', move);
        this.canvas.addEventListener('touchmove', move);
        this._move = move;
    }

    #tick() {
        this.frameCount++;

        if (this.frameCount % 20 === 0) {
            const isBomb = Math.random() < 0.2;
            this.items.push({
                x: Math.random() * (this.width - 30) + 15,
                y: -20,
                speed: 2 + Math.random() * 2,
                emoji: isBomb ? this.bombs[Math.floor(Math.random() * this.bombs.length)] : this.foods[Math.floor(Math.random() * this.foods.length)],
                isBomb
            });
        }

        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.y += item.speed;

            // Check catch
            if (item.y > this.height - 55 && item.y < this.height - 25 &&
                Math.abs(item.x - this.basket.x) < 35) {
                if (item.isBomb) {
                    this.#gameOver();
                    return;
                }
                this.score += 10;
                document.getElementById('catch-score').textContent = this.score;
                this.items.splice(i, 1);
                continue;
            }

            if (item.y > this.height) {
                if (!item.isBomb) {
                    this.missed++;
                    document.getElementById('catch-missed').textContent = this.missed;
                    if (this.missed >= 5) {
                        this.#gameOver();
                        return;
                    }
                }
                this.items.splice(i, 1);
            }
        }

        this.#draw();
    }

    #draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const item of this.items) {
            ctx.fillText(item.emoji, item.x, item.y);
        }

        // Basket
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.moveTo(this.basket.x - 40, this.height - 30);
        ctx.lineTo(this.basket.x + 40, this.height - 30);
        ctx.lineTo(this.basket.x + 30, this.height - 10);
        ctx.lineTo(this.basket.x - 30, this.height - 10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(this.basket.x - 32, this.height - 35, 64, 8);
        ctx.font = '28px serif';
        ctx.fillText('🧺', this.basket.x, this.height - 25);
    }

    #gameOver() {
        this.running = false;
        clearInterval(this.interval);
        const bonus = Math.floor(this.score / 2);
        if (bonus > 0) this.manager.awardCoins(bonus);
        this.manager.showToast(`💀 Score: ${this.score}`, 'warning');
        setTimeout(() => this.manager.closeCurrentGame(), 2000);
    }

    destroy() {
        clearInterval(this.interval);
        if (this._move) {
            this.canvas?.removeEventListener('mousemove', this._move);
            this.canvas?.removeEventListener('touchmove', this._move);
        }
    }
}

// ==================== REACTION TEST ====================
class ReactionTestGame {
    constructor(manager) {
        this.manager = manager;
        this.score = 0;
        this.round = 0;
        this.maxRounds = 8;
        this.waiting = false;
        this.timeout = null;
    }

    start() {
        const overlay = this.manager.createOverlay();
        this.manager.setTitle('⚡ Reaction Test');
        const body = this.manager.getBody();

        body.innerHTML = `
            <div class="minigame-stats">
                <span>Round: <strong id="reaction-round">0</strong>/${this.maxRounds}</span>
                <span>Score: <strong id="reaction-score">0</strong></span>
            </div>
            <div id="reaction-area" style="flex:1;display:flex;align-items:center;justify-content:center;padding:20px;min-height:200px;">
                <div id="reaction-btn" style="width:200px;height:200px;border-radius:50%;background:var(--color-primary);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:1.2rem;font-weight:600;color:white;text-align:center;padding:20px;transition:background 0.1s;">
                    Wait for green...
                </div>
            </div>
        `;

        this.btn = document.getElementById('reaction-btn');
        this.btn.addEventListener('click', () => this.#handleClick());
        this.#startRound();
    }

    #startRound() {
        this.round++;
        if (this.round > this.maxRounds) {
            this.#win();
            return;
        }
        document.getElementById('reaction-round').textContent = this.round;
        this.waiting = true;
        this.btn.style.background = 'var(--color-danger)';
        this.btn.textContent = 'Wait for green...';

        const delay = 1000 + Math.random() * 2000;
        this.timeout = setTimeout(() => {
            this.waiting = false;
            this.startTime = Date.now();
            this.btn.style.background = 'var(--color-success)';
            this.btn.textContent = 'CLICK NOW!';
        }, delay);
    }

    #handleClick() {
        if (this.waiting) {
            // Clicked too early
            this.btn.style.background = '#ff9800';
            this.btn.textContent = 'Too early! Wait for green...';
            clearTimeout(this.timeout);
            setTimeout(() => this.#startRound(), 1000);
            return;
        }
        if (this.startTime) {
            const reaction = Date.now() - this.startTime;
            const points = Math.max(0, Math.floor((500 - reaction) / 10)) + 10;
            this.score += points;
            document.getElementById('reaction-score').textContent = this.score;
            this.btn.textContent = `${reaction}ms! +${points}pts`;
            this.startTime = null;
            setTimeout(() => this.#startRound(), 800);
        }
    }

    #win() {
        const bonus = Math.floor(this.score / 3);
        this.manager.awardCoins(bonus);
        this.manager.showToast(`🎉 Reaction score: ${this.score}! +${bonus} coins`, 'success');
        setTimeout(() => this.manager.closeCurrentGame(), 2000);
    }

    destroy() {
        clearTimeout(this.timeout);
    }
}

// ==================== ROCK PAPER SCISSORS ====================
class RockPaperScissorsGame {
    constructor(manager) {
        this.manager = manager;
        this.score = 0;
        this.round = 0;
        this.maxRounds = 5;
        this.choices = [
            { id: 'rock', emoji: '✊', beats: 'scissors' },
            { id: 'paper', emoji: '✋', beats: 'rock' },
            { id: 'scissors', emoji: '✌️', beats: 'paper' }
        ];
    }

    start() {
        const overlay = this.manager.createOverlay();
        this.manager.setTitle('✂️ Rock Paper Scissors');
        const body = this.manager.getBody();

        body.innerHTML = `
            <div class="minigame-stats">
                <span>Round: <strong id="rps-round">0</strong>/${this.maxRounds}</span>
                <span>Wins: <strong id="rps-score">0</strong></span>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:15px;padding:20px;">
                <div id="rps-result" style="font-size:1rem;color:var(--color-text-secondary);min-height:60px;display:flex;flex-direction:column;align-items:center;gap:5px;">
                    Choose your move!
                </div>
                <div id="rps-choices" style="display:flex;gap:15px;">
                    ${this.choices.map(c => `<button class="rps-btn" data-id="${c.id}" style="width:80px;height:80px;border-radius:50%;border:3px solid var(--color-primary);background:var(--color-surface);font-size:2rem;cursor:pointer;transition:all 0.2s;">${c.emoji}</button>`).join('')}
                </div>
            </div>
        `;

        body.querySelectorAll('.rps-btn').forEach(btn => {
            btn.addEventListener('click', () => this.#play(btn.dataset.id));
        });
    }

    #play(playerChoice) {
        this.round++;
        document.getElementById('rps-round').textContent = this.round;

        const ai = this.choices[Math.floor(Math.random() * this.choices.length)];
        const player = this.choices.find(c => c.id === playerChoice);
        const resultEl = document.getElementById('rps-result');

        let result;
        if (player.id === ai.id) {
            result = `🤝 Tie! Both chose ${player.emoji}`;
        } else if (player.beats === ai.id) {
            this.score++;
            document.getElementById('rps-score').textContent = this.score;
            result = `🎉 You win! ${player.emoji} beats ${ai.emoji}`;
        } else {
            result = `😢 You lose! ${ai.emoji} beats ${player.emoji}`;
        }
        resultEl.innerHTML = result;

        if (this.round >= this.maxRounds) {
            setTimeout(() => {
                const bonus = this.score * 10;
                if (bonus > 0) this.manager.awardCoins(bonus);
                this.manager.showToast(`🏆 ${this.score}/${this.maxRounds} wins! +${bonus} coins`, 'success');
                setTimeout(() => this.manager.closeCurrentGame(), 1500);
            }, 1000);
        }
    }

    destroy() {}
}

// ==================== 2048 ====================
class Tile2048Game {
    constructor(manager) {
        this.manager = manager;
        this.grid = Array(4).fill(null).map(() => Array(4).fill(0));
        this.score = 0;
        this.running = false;
        this.tileSize = 70;
        this.gap = 6;
        this.colors = {
            0: '#cdc1b4', 2: '#eee4da', 4: '#ede0c8', 8: '#f2b179',
            16: '#f59563', 32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72',
            256: '#edcc61', 512: '#edc850', 1024: '#edc53f', 2048: '#edc22e'
        };
    }

    start() {
        const overlay = this.manager.createOverlay();
        this.manager.setTitle('🔢 2048');
        const body = this.manager.getBody();

        body.innerHTML = `
            <div class="minigame-stats">
                <span>Score: <strong id="game2048-score">0</strong></span>
            </div>
            <div style="display:flex;justify-content:center;padding:10px;">
                <canvas id="game2048-canvas" width="${this.tileSize * 4 + this.gap * 5}" height="${this.tileSize * 4 + this.gap * 5}"
                    style="border-radius:8px;background:#bbada0;"></canvas>
            </div>
            <div style="text-align:center;padding:10px;color:var(--color-text-secondary);font-size:0.8rem;">
                Use arrow keys to merge tiles!
            </div>
        `;

        this.canvas = document.getElementById('game2048-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.running = true;

        this.#addTile();
        this.#addTile();
        this.#draw();

        this._keyHandler = (e) => {
            if (!this.running) return;
            let moved = false;
            switch (e.key) {
                case 'ArrowUp': moved = this.#move(0, -1); break;
                case 'ArrowDown': moved = this.#move(0, 1); break;
                case 'ArrowLeft': moved = this.#move(-1, 0); break;
                case 'ArrowRight': moved = this.#move(1, 0); break;
                default: return;
            }
            e.preventDefault();
            if (moved) {
                this.#addTile();
                this.#draw();
                if (this.#isGameOver()) this.#gameOver();
            }
        };
        document.addEventListener('keydown', this._keyHandler);
    }

    #addTile() {
        const empty = [];
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                if (this.grid[y][x] === 0) empty.push({x, y});
            }
        }
        if (empty.length > 0) {
            const cell = empty[Math.floor(Math.random() * empty.length)];
            this.grid[cell.y][cell.x] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    #move(dx, dy) {
        let moved = false;
        const visited = Array(4).fill(null).map(() => Array(4).fill(false));

        const orderX = dx === 1 ? [3, 2, 1, 0] : [0, 1, 2, 3];
        const orderY = dy === 1 ? [3, 2, 1, 0] : [0, 1, 2, 3];

        for (const y of orderY) {
            for (const x of orderX) {
                if (this.grid[y][x] === 0) continue;
                let nx = x, ny = y;
                while (true) {
                    const nextX = nx + dx;
                    const nextY = ny + dy;
                    if (nextX < 0 || nextX > 3 || nextY < 0 || nextY > 3) break;
                    if (this.grid[nextY][nextX] === 0) {
                        this.grid[nextY][nextX] = this.grid[ny][nx];
                        this.grid[ny][nx] = 0;
                        nx = nextX;
                        ny = nextY;
                        moved = true;
                    } else if (this.grid[nextY][nextX] === this.grid[ny][nx] && !visited[nextY][nextX]) {
                        this.grid[nextY][nextX] *= 2;
                        this.score += this.grid[nextY][nextX];
                        this.grid[ny][nx] = 0;
                        visited[nextY][nextX] = true;
                        moved = true;
                        document.getElementById('game2048-score').textContent = this.score;
                        break;
                    } else break;
                }
            }
        }
        return moved;
    }

    #draw() {
        const ctx = this.ctx;
        const ts = this.tileSize;
        const g = this.gap;
        const totalSize = ts * 4 + g * 5;
        ctx.clearRect(0, 0, totalSize, totalSize);

        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                const val = this.grid[y][x];
                const px = g + x * (ts + g);
                const py = g + y * (ts + g);
                ctx.fillStyle = this.colors[val] || '#3c3a32';
                ctx.beginPath();
                ctx.roundRect(px, py, ts, ts, 4);
                ctx.fill();

                if (val !== 0) {
                    ctx.fillStyle = val <= 4 ? '#776e65' : '#f9f6f2';
                    ctx.font = val >= 1000 ? 'bold 20px sans-serif' : 'bold 28px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(val, px + ts / 2, py + ts / 2);
                }
            }
        }
    }

    #isGameOver() {
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                if (this.grid[y][x] === 0) return false;
                if (x < 3 && this.grid[y][x] === this.grid[y][x + 1]) return false;
                if (y < 3 && this.grid[y][x] === this.grid[y + 1][x]) return false;
            }
        }
        return true;
    }

    #gameOver() {
        this.running = false;
        const bonus = Math.floor(this.score / 10);
        if (bonus > 0) this.manager.awardCoins(bonus);
        this.manager.showToast(`💀 Score: ${this.score}`, 'warning');
        setTimeout(() => this.manager.closeCurrentGame(), 2000);
    }

    destroy() {
        if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
    }
}

// ==================== TREASURE HUNT ====================
class TreasureHuntGame {
    constructor(manager) {
        this.manager = manager;
        this.gridSize = 5;
        this.treasure = { x: 0, y: 0 };
        this.player = { x: 0, y: 0 };
        this.moves = 0;
        this.maxMoves = 10;
        this.found = false;
        this.gameOver = false;
    }

    start() {
        this.treasure = { x: Math.floor(Math.random() * this.gridSize), y: Math.floor(Math.random() * this.gridSize) };
        this.player = { x: Math.floor(Math.random() * this.gridSize), y: Math.floor(Math.random() * this.gridSize) };
        // Make sure they're not at the same position
        while (this.treasure.x === this.player.x && this.treasure.y === this.player.y) {
            this.treasure = { x: Math.floor(Math.random() * this.gridSize), y: Math.floor(Math.random() * this.gridSize) };
        }

        const overlay = this.manager.createOverlay();
        this.manager.setTitle('💎 Treasure Hunt');
        const body = this.manager.getBody();

        body.innerHTML = `
            <div class="minigame-stats">
                <span>Moves left: <strong id="th-moves">${this.maxMoves}</strong></span>
                <span>Hint: <strong id="th-hint">Find the treasure!</strong></span>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:15px;padding:10px;">
                <div id="th-grid" style="display:grid;grid-template-columns:repeat(${this.gridSize}, 60px);gap:4px;"></div>
                <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;">
                    <button class="th-dir" data-dir="up" style="width:60px;height:60px;border-radius:50%;border:2px solid var(--color-primary);background:var(--color-surface);font-size:1.5rem;cursor:pointer;">⬆️</button>
                    <button class="th-dir" data-dir="left" style="width:60px;height:60px;border-radius:50%;border:2px solid var(--color-primary);background:var(--color-surface);font-size:1.5rem;cursor:pointer;">⬅️</button>
                    <button class="th-dir" data-dir="right" style="width:60px;height:60px;border-radius:50%;border:2px solid var(--color-primary);background:var(--color-surface);font-size:1.5rem;cursor:pointer;">➡️</button>
                    <button class="th-dir" data-dir="down" style="width:60px;height:60px;border-radius:50%;border:2px solid var(--color-primary);background:var(--color-surface);font-size:1.5rem;cursor:pointer;">⬇️</button>
                </div>
            </div>
        `;

        this.#renderGrid(body);

        body.querySelectorAll('.th-dir').forEach(btn => {
            btn.addEventListener('click', () => this.#move(btn.dataset.dir));
        });

        this._keyHandler = (e) => {
            switch (e.key) {
                case 'ArrowUp': this.#move('up'); break;
                case 'ArrowDown': this.#move('down'); break;
                case 'ArrowLeft': this.#move('left'); break;
                case 'ArrowRight': this.#move('right'); break;
                default: return;
            }
            e.preventDefault();
        };
        document.addEventListener('keydown', this._keyHandler);
    }

    #move(dir) {
        if (this.found || this.gameOver) return;
        this.moves++;
        const remaining = this.maxMoves - this.moves;
        document.getElementById('th-moves').textContent = remaining;

        switch (dir) {
            case 'up': this.player.y = Math.max(0, this.player.y - 1); break;
            case 'down': this.player.y = Math.min(this.gridSize - 1, this.player.y + 1); break;
            case 'left': this.player.x = Math.max(0, this.player.x - 1); break;
            case 'right': this.player.x = Math.min(this.gridSize - 1, this.player.x + 1); break;
        }

        const hint = document.getElementById('th-hint');
        if (this.player.x === this.treasure.x && this.player.y === this.treasure.y) {
            this.found = true;
            hint.textContent = '🎉 You found the treasure!';
            const bonus = Math.max(10, (this.maxMoves - this.moves) * 5 + 20);
            this.manager.awardCoins(bonus);
            this.manager.showToast(`💎 Treasure found! +${bonus} coins!`, 'success');
            setTimeout(() => this.manager.closeCurrentGame(), 2000);
        } else if (remaining <= 0) {
            this.gameOver = true;
            hint.textContent = '💀 Out of moves!';
            this.manager.showToast('💀 Ran out of moves!', 'warning');
            setTimeout(() => this.manager.closeCurrentGame(), 2000);
        } else {
            const dx = Math.abs(this.player.x - this.treasure.x);
            const dy = Math.abs(this.player.y - this.treasure.y);
            const dist = Math.round(Math.sqrt(dx * dx + dy * dy) * 10) / 10;
            hint.textContent = `📍 Distance: ${dist}`;
        }

        this.#renderGrid();
    }

    #renderGrid(container) {
        const grid = (container || document).getElementById('th-grid');
        if (!grid) return;
        grid.innerHTML = '';
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = document.createElement('div');
                cell.style.cssText = 'width:60px;height:60px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;background:var(--color-surface);border:2px solid rgba(0,0,0,0.08);';
                if (this.player.x === x && this.player.y === y) {
                    cell.textContent = '🧭';
                    cell.style.background = 'var(--color-primary)';
                    cell.style.color = 'white';
                } else if (this.found && this.treasure.x === x && this.treasure.y === y) {
                    cell.textContent = '💎';
                    cell.style.background = '#ffd700';
                }
                grid.appendChild(cell);
            }
        }
    }

    destroy() {
        if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
    }
}