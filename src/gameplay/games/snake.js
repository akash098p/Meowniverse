/**
 * SnakeGame - Classic snake game
 * @module gameplay/games/SnakeGame
 */
import GameBase from './game-base.js';

export default class SnakeGame extends GameBase {
    constructor(manager) {
        super(manager);
        this.snake = [{x: 7, y: 7}];
        this.food = {x: 0, y: 0};
        this.direction = {x: 1, y: 0};
        this.nextDirection = {x: 1, y: 0};
        this.score = 0;
        this.interval = null;
        this.gridSize = 15;
        this.cellSize = 0;
        this.canvas = null;
        this.ctx = null;
        this._keyHandler = null;
        this._touchStart = null;
    }

    start() {
        const overlay = this.manager.createOverlay();
        this.manager.setTitle('🐍 Snake');
        const body = this.manager.getBody();
        this.running = true;

        // Calculate cell size based on viewport
        const maxWidth = Math.min(400, window.innerWidth - 40);
        this.cellSize = Math.floor(maxWidth / this.gridSize);
        const canvasSize = this.cellSize * this.gridSize;

        body.innerHTML = `
            <div class="mg-header">
                <div class="mg-stat"><span>Score</span><strong id="snake-score">0</strong></div>
                <div class="mg-stat"><span>Length</span><strong id="snake-length">1</strong></div>
            </div>
            <div class="mg-canvas-wrapper">
                <canvas id="snake-canvas" width="${canvasSize}" height="${canvasSize}"></canvas>
            </div>
            <div class="mg-footer">Use arrow keys or swipe to change direction</div>
        `;

        this.canvas = document.getElementById('snake-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        this.snake = [{x: 7, y: 7}];
        this.direction = {x: 1, y: 0};
        this.nextDirection = {x: 1, y: 0};
        this.score = 0;
        document.getElementById('snake-score').textContent = '0';
        document.getElementById('snake-length').textContent = '1';

        this.#placeFood();
        this.#draw();

        this.interval = setInterval(() => this.#tick(), 130);

        this._keyHandler = (e) => {
            if (e.key.startsWith('Arrow')) e.preventDefault();
            switch (e.key) {
                case 'ArrowUp': if (this.direction.y !== 1) this.nextDirection = {x: 0, y: -1}; break;
                case 'ArrowDown': if (this.direction.y !== -1) this.nextDirection = {x: 0, y: 1}; break;
                case 'ArrowLeft': if (this.direction.x !== 1) this.nextDirection = {x: -1, y: 0}; break;
                case 'ArrowRight': if (this.direction.x !== -1) this.nextDirection = {x: 1, y: 0}; break;
            }
        };
        document.addEventListener('keydown', this._keyHandler);

        this.canvas.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            this._touchStart = {x: t.clientX, y: t.clientY};
        });

        this.canvas.addEventListener('touchend', (e) => {
            if (!this._touchStart) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - this._touchStart.x;
            const dy = t.clientY - this._touchStart.y;
            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0 && this.direction.x !== -1) this.nextDirection = {x: 1, y: 0};
                else if (dx < 0 && this.direction.x !== 1) this.nextDirection = {x: -1, y: 0};
            } else {
                if (dy > 0 && this.direction.y !== -1) this.nextDirection = {x: 0, y: 1};
                else if (dy < 0 && this.direction.y !== 1) this.nextDirection = {x: 0, y: -1};
            }
            this._touchStart = null;
        });
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
        if (!this.running) return;
        
        this.direction = {...this.nextDirection};
        const head = {
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y
        };

        // Wall collision
        if (head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize) {
            this.#gameOver();
            return;
        }

        // Self collision
        if (this.snake.some(s => s.x === head.x && s.y === head.y)) {
            this.#gameOver();
            return;
        }

        this.snake.unshift(head);
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            document.getElementById('snake-score').textContent = this.score;
            document.getElementById('snake-length').textContent = this.snake.length;
            this.#placeFood();
            
            const rect = this.canvas.getBoundingClientRect();
            const cs = this.cellSize;
            this.createParticles(
                rect.left + this.food.x * cs + cs / 2,
                rect.top + this.food.y * cs + cs / 2,
                { count: 8, colors: ['#ffd700', '#ff6b9d'], speed: 3 }
            );
        } else {
            this.snake.pop();
        }
        this.#draw();
    }

    #draw() {
        const ctx = this.ctx;
        const cs = this.cellSize;
        const size = cs * this.gridSize;

        // Background with grid
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, size, size);
        
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= this.gridSize; x++) {
            ctx.beginPath();
            ctx.moveTo(x * cs, 0);
            ctx.lineTo(x * cs, size);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, x * cs);
            ctx.lineTo(size, x * cs);
            ctx.stroke();
        }

        // Food glow
        const fx = this.food.x * cs + cs / 2;
        const fy = this.food.y * cs + cs / 2;
        const glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, cs);
        glow.addColorStop(0, 'rgba(255, 71, 87, 0.4)');
        glow.addColorStop(1, 'rgba(255, 71, 87, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(this.food.x * cs - cs, this.food.y * cs - cs, cs * 3, cs * 3);

        // Food
        ctx.fillStyle = '#ff4757';
        ctx.beginPath();
        ctx.arc(fx, fy, cs / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff6b81';
        ctx.beginPath();
        ctx.arc(fx - 3, fy - 3, cs / 5, 0, Math.PI * 2);
        ctx.fill();

        // Snake
        this.snake.forEach((seg, i) => {
            const sx = seg.x * cs;
            const sy = seg.y * cs;
            const pad = 1;
            
            if (i === 0) {
                // Head - brighter
                const grad = ctx.createRadialGradient(sx + cs/2, sy + cs/2, 0, sx + cs/2, sy + cs/2, cs/2);
                grad.addColorStop(0, '#70a1ff');
                grad.addColorStop(1, '#1e90ff');
                ctx.fillStyle = grad;
                
                // Head
                ctx.fillStyle = '#1e90ff';
                this.roundRect(ctx, sx + pad, sy + pad, cs - pad * 2, cs - pad * 2, 4);
                ctx.fill();
                
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(sx + cs * 0.35, sy + cs * 0.35, cs * 0.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(sx + cs * 0.65, sy + cs * 0.35, cs * 0.1, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#2d3436';
                ctx.beginPath();
                ctx.arc(sx + cs * 0.35, sy + cs * 0.35, cs * 0.05, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(sx + cs * 0.65, sy + cs * 0.35, cs * 0.05, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Body - gradient based on position
                const ratio = i / this.snake.length;
                const r = Math.floor(30 + ratio * 20);
                const g = Math.floor(144 + ratio * 30);
                const b = Math.floor(255 - ratio * 50);
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                this.roundRect(ctx, sx + pad, sy + pad, cs - pad * 2, cs - pad * 2, cs / 3);
                ctx.fill();
            }
        });

        // Particles
        this.updateParticles(ctx);
    }

    #gameOver() {
        this.running = false;
        clearInterval(this.interval);
        const bonus = Math.floor(this.score / 2);
        if (bonus > 0) this.manager.awardCoins(bonus);
        
        const body = this.manager.getBody();
        this.showGameOver(body, {
            title: '💀 Game Over',
            stats: [
                { label: 'Score', value: this.score },
                { label: 'Length', value: this.snake.length }
            ],
            coins: bonus,
            onRestart: () => this.start()
        });
    }

    destroy() {
        super.destroy();
        clearInterval(this.interval);
        if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
    }
}

