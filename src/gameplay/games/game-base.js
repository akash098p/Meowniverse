/**
 * GameBase - Base class for all mini games
 * @module gameplay/games/GameBase
 */
export default class GameBase {
    constructor(manager) {
        this.manager = manager;
        this.running = false;
        this.score = 0;
        this.particles = [];
    }

    start() {
        throw new Error('start() must be implemented');
    }

    destroy() {
        this.running = false;
        this.particles = [];
    }

    /**
     * Create a particle effect
     */
    createParticles(x, y, config = {}) {
        const {
            count = 12,
            colors = ['#ff6b9d', '#c44dff', '#ffd700', '#4caf50', '#2196f3'],
            speed = 4,
            size = 6,
            life = 40,
            spread = Math.PI * 2
        } = config;

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * spread;
            const velocity = (Math.random() * 0.5 + 0.5) * speed;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity - 2,
                size: Math.random() * size + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: Math.random() * life + life * 0.5,
                maxLife: life * 1.5,
                gravity: 0.1
            });
        }
    }

    /**
     * Update and render particles on a canvas context
     */
    updateParticles(ctx) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.life--;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    /**
     * Draw a rounded rectangle on canvas context (polyfill for ctx.roundRect)
     */
    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    /**
     * Create a countdown animation element
     */
    createCountdown(body, onComplete) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position:absolute;top:0;left:0;right:0;bottom:0;
            display:flex;align-items:center;justify-content:center;
            background:rgba(0,0,0,0.4);z-index:10;
            font-size:5rem;font-weight:800;color:white;
            text-shadow:0 4px 20px rgba(0,0,0,0.3);
        `;
        body.appendChild(overlay);

        let count = 3;
        overlay.textContent = count;
        
        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                overlay.textContent = count;
                overlay.style.animation = 'none';
                overlay.offsetHeight;
                overlay.style.animation = 'countdownPop 0.4s ease';
            } else if (count === 0) {
                overlay.textContent = 'GO!';
                overlay.style.color = '#4caf50';
                overlay.style.animation = 'countdownPop 0.4s ease';
            } else {
                clearInterval(interval);
                overlay.remove();
                if (onComplete) onComplete();
            }
        }, 800);

        return interval;
    }

    /**
     * Show game over screen with stats
     */
    showGameOver(body, { title = 'Game Over', stats = [], coins = 0, onRestart }) {
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        overlay.innerHTML = `
            <div class="game-over-content">
                <div class="game-over-emoji">🎮</div>
                <h2 class="game-over-title">${title}</h2>
                <div class="game-over-stats">
                    ${stats.map(s => `<div class="game-over-stat"><span>${s.label}:</span><strong>${s.value}</strong></div>`).join('')}
                    ${coins > 0 ? `<div class="game-over-stat coins">🎉 Coins earned: <strong>+${coins}</strong></div>` : ''}
                </div>
                <div class="game-over-actions">
                    <button class="btn btn-primary game-over-restart">Play Again</button>
                    <button class="btn btn-secondary game-over-close">Close</button>
                </div>
            </div>
        `;
        body.appendChild(overlay);

        overlay.querySelector('.game-over-close').addEventListener('click', () => this.manager.closeCurrentGame());
        if (onRestart) {
            overlay.querySelector('.game-over-restart').addEventListener('click', () => {
                overlay.remove();
                onRestart();
            });
        } else {
            overlay.querySelector('.game-over-restart').addEventListener('click', () => {
                overlay.remove();
                this.start();
            });
        }

        return overlay;
    }
}

