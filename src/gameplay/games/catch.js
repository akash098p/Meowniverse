/**
 * CatchFoodGame - Catch falling food, avoid bombs
 * @module gameplay/games/CatchFoodGame
 */
import GameBase from './game-base.js';

export default class CatchFoodGame extends GameBase {
    constructor(manager) {
        super(manager);
        this.items = [];
        this.basket = { x: 200 };
        this.score = 0;
        this.missed = 0;
        this.maxMissed = 5;
        this.interval = null;
        this.width = 0;
        this.height = 350;
        this.frameCount = 0;
        this.canvas = null;
        this.ctx = null;
        this.foods = ['🍎', '🍕', '🍔', '🍩', '🍪', '🍇', '🍌', '🍓', '🧀', '🥕', '🧁', '🍦'];
        this.bombs = ['💣', '🌶️', '⚡'];
        this.combo = 0;
        this._move = null;
    }

    start() {
        const overlay = this.manager.createOverlay();
        this.manager.setTitle('🍎 Catch Food');
        const body = this.manager.getBody();
        this.running = true;

        this.width = Math.min(400, window.innerWidth - 40);
        this.height = Math.min(420, window.innerHeight - 200);
        this.basket.x = this.width / 2;
        this.items = [];
        this.score = 0;
        this.missed = 0;
        this.combo = 0;
        this.frameCount = 0;

        body.innerHTML = `
            <div class="mg-header">
                <div class="mg-stat"><span>Score</span><strong id="catch-score">0</strong></div>
                <div class="mg-stat"><span>Combo</span><strong id="catch-combo">0x</strong></div>
                <div class="mg-stat"><span>Missed</span><strong id="catch-missed">0/${this.maxMissed}</strong></div>
            </div>
            <div class="mg-canvas-wrapper">
                <canvas id="catch-canvas" width="${this.width}" height="${this.height}"></canvas>
            </div>
            <div class="mg-footer">Move mouse/touch to catch food, avoid bombs!</div>
        `;

        this.canvas = document.getElementById('catch-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.#draw();
        this.interval = setInterval(() => this.#tick(), 30);

        this._move = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX);
            if (!clientX) return;
            const scaleX = this.width / rect.width;
            this.basket.x = Math.max(35, Math.min(this.width - 35, (clientX - rect.left) * scaleX));
        };
        this.canvas.addEventListener('mousemove', this._move);
        this.canvas.addEventListener('touchmove', this._move);
    }

    #tick() {
        if (!this.running) return;
        this.frameCount++;

        // Spawn items
        const spawnRate = Math.max(12, 25 - Math.floor(this.score / 50));
        if (this.frameCount % spawnRate === 0) {
            const isBomb = Math.random() < 0.15 + (this.score / 500);
            const speed = 1.5 + Math.random() * 2 + (this.score / 200);
            this.items.push({
                x: 15 + Math.random() * (this.width - 30),
                y: -25,
                speed: Math.min(speed, 5),
                emoji: isBomb
                    ? this.bombs[Math.floor(Math.random() * this.bombs.length)]
                    : this.foods[Math.floor(Math.random() * this.foods.length)],
                isBomb,
                rotation: Math.random() * Math.PI * 2
            });
        }

        // Update items
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.y += item.speed;
            item.rotation += 0.05;

            // Check catch
            const catchY = this.height - 55;
            if (item.y > catchY && item.y < this.height - 15 &&
                Math.abs(item.x - this.basket.x) < 40) {
                if (item.isBomb) {
                    this.createParticles(item.x, item.y, {
                        count: 15, colors: ['#ff4757', '#ff6b9d', '#ffd700'], speed: 4
                    });
                    this.#gameOver();
                    return;
                }
                this.score += 10 + this.combo * 2;
                this.combo++;
                document.getElementById('catch-score').textContent = this.score;
                document.getElementById('catch-combo').textContent = `${this.combo}x`;
                
                this.createParticles(item.x, item.y, {
                    count: 6, colors: ['#ffd700', '#4caf50'], speed: 3, size: 5
                });
                
                this.items.splice(i, 1);
                continue;
            }

            // Missed
            if (item.y > this.height) {
                if (!item.isBomb) {
                    this.missed++;
                    this.combo = 0;
                    document.getElementById('catch-combo').textContent = '0x';
                    document.getElementById('catch-missed').textContent = `${this.missed}/${this.maxMissed}`;
                    if (this.missed >= this.maxMissed) {
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
        const w = this.width;
        const h = this.height;

        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#e8f5e9');
        grad.addColorStop(0.5, '#fff5f7');
        grad.addColorStop(1, '#ffe4e1');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Decorative dots
        ctx.fillStyle = 'rgba(255, 107, 157, 0.06)';
        for (let i = 0; i < 20; i++) {
            const dx = (i * 73 + 31) % w;
            const dy = (i * 47 + 17) % (h * 0.6);
            ctx.beginPath();
            ctx.arc(dx, dy, 3 + i % 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Items
        ctx.font = `${Math.min(28, this.width * 0.07)}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const item of this.items) {
            ctx.save();
            ctx.translate(item.x, item.y);
            ctx.rotate(item.rotation);
            ctx.fillText(item.emoji, 0, 0);
            
            // Bomb warning glow
            if (item.isBomb) {
                ctx.shadowColor = '#ff4757';
                ctx.shadowBlur = 15;
                ctx.fillText(item.emoji, 0, 0);
                ctx.shadowBlur = 0;
            }
            ctx.restore();
        }

        // Basket
        const bx = this.basket.x;
        const by = h - 30;

        // Basket shadow
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(bx, by + 15, 45, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Basket body
        const bGrad = ctx.createLinearGradient(bx - 40, by - 20, bx + 40, by + 10);
        bGrad.addColorStop(0, '#A0522D');
        bGrad.addColorStop(0.5, '#8B4513');
        bGrad.addColorStop(1, '#6d3410');
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.moveTo(bx - 40, by - 5);
        ctx.lineTo(bx + 40, by - 5);
        ctx.lineTo(bx + 32, by + 10);
        ctx.lineTo(bx - 32, by + 10);
        ctx.closePath();
        ctx.fill();

        // Basket rim
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(bx - 42, by - 10, 84, 8);
        ctx.fillStyle = '#c47a4a';
        ctx.fillRect(bx - 42, by - 10, 84, 3);

        // Basket weave pattern
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        for (let i = -30; i <= 30; i += 10) {
            ctx.beginPath();
            ctx.moveTo(bx + i, by - 4);
            ctx.lineTo(bx + i + 5, by + 9);
            ctx.stroke();
        }

        // Basket emoji
        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧺', bx, by - 2);

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
                { label: 'Best Combo', value: `${this.combo}x` }
            ],
            coins: bonus,
            onRestart: () => this.start()
        });
    }

    destroy() {
        super.destroy();
        clearInterval(this.interval);
        if (this._move) {
            this.canvas?.removeEventListener('mousemove', this._move);
            this.canvas?.removeEventListener('touchmove', this._move);
        }
    }
}

