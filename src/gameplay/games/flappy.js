/**
 * FlappyPetGame - Flappy Bird clone with pet
 * @module gameplay/games/FlappyPetGame
 */
import GameBase from './game-base.js';

export default class FlappyPetGame extends GameBase {
    constructor(manager) {
        super(manager);
        this.bird = { x: 80, y: 250, vy: 0 };
        this.pipes = [];
        this.score = 0;
        this.interval = null;
        this.width = 0;
        this.height = 350;
        this.gravity = 0.45;
        this.pipeSpeed = 2.5;
        this.pipeGap = 130;
        this.pipeWidth = 50;
        this.frameCount = 0;
        this.groundHeight = 40;
        this.canvas = null;
        this.ctx = null;
        this._flap = null;
        this.clouds = [];
        this.stars = [];
    }

    start() {
        const overlay = this.manager.createOverlay();
        this.manager.setTitle('🐦 Flappy Pet');
        const body = this.manager.getBody();
        this.running = true;

        this.width = Math.min(400, window.innerWidth - 40);
        this.height = Math.min(400, window.innerHeight - 250);

        this.bird = { x: this.width * 0.2, y: this.height / 2, vy: 0 };
        this.pipes = [];
        this.score = 0;
        this.frameCount = 0;

        // Generate clouds
        this.clouds = Array(4).fill(null).map(() => ({
            x: Math.random() * this.width,
            y: Math.random() * this.height * 0.4,
            speed: 0.3 + Math.random() * 0.5,
            size: 30 + Math.random() * 40
        }));

        body.innerHTML = `
            <div class="mg-header">
                <div class="mg-stat"><span>Score</span><strong id="flappy-score">0</strong></div>
                <div class="mg-stat"><span>Best</span><strong id="flappy-best">0</strong></div>
            </div>
            <div class="mg-canvas-wrapper">
                <canvas id="flappy-canvas" width="${this.width}" height="${this.height}"></canvas>
            </div>
            <div class="mg-footer">Tap / Click / Space to flap!</div>
        `;

        this.canvas = document.getElementById('flappy-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.#draw();

        this.interval = setInterval(() => this.#tick(), 20);

        this._flap = (e) => {
            if (e.type === 'keydown' && e.key !== ' ') return;
            e.preventDefault();
            if (!this.running) return;
            this.bird.vy = -7.5;
            
            // Small wing particles
            this.createParticles(this.bird.x, this.bird.y, {
                count: 3, colors: ['rgba(255,255,255,0.6)'], speed: 2, size: 3, life: 15
            });
        };
        this.canvas.addEventListener('click', this._flap);
        document.addEventListener('keydown', this._flap);
    }

    #tick() {
        if (!this.running) return;
        this.frameCount++;

        // Physics
        this.bird.vy += this.gravity;
        this.bird.y += this.bird.vy;

        // Spawn pipes
        if (this.frameCount % 70 === 0) {
            const minTop = 40;
            const maxTop = this.height - this.pipeGap - 40;
            const top = Math.floor(Math.random() * (maxTop - minTop)) + minTop;
            this.pipes.push({ x: this.width, top, bottom: top + this.pipeGap, scored: false });
        }

        // Update pipes
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
        if (this.bird.y < 0 || this.bird.y > this.height - this.groundHeight) {
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
        const w = this.width;
        const h = this.height;

        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, '#1a1a4e');
        skyGrad.addColorStop(0.3, '#4a90d9');
        skyGrad.addColorStop(0.6, '#87ceeb');
        skyGrad.addColorStop(0.85, '#e0f7fa');
        skyGrad.addColorStop(1, '#8bc34a');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);

        // Stars (top)
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        for (let i = 0; i < 15; i++) {
            const sx = (i * 37 + 13) % w;
            const sy = (i * 23 + 7) % (h * 0.3);
            const ss = 1 + Math.sin(this.frameCount * 0.05 + i) * 0.5;
            ctx.beginPath();
            ctx.arc(sx, sy, ss, 0, Math.PI * 2);
            ctx.fill();
        }

        // Clouds
        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x > w + cloud.size) cloud.x = -cloud.size;
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.4, cloud.y - cloud.size * 0.2, cloud.size * 0.35, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.8, cloud.y, cloud.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
        });

        // Pipes
        for (const p of this.pipes) {
            // Pipe body
            const grad = ctx.createLinearGradient(p.x, 0, p.x + this.pipeWidth, 0);
            grad.addColorStop(0, '#2e7d32');
            grad.addColorStop(0.3, '#4caf50');
            grad.addColorStop(0.7, '#4caf50');
            grad.addColorStop(1, '#2e7d32');
            ctx.fillStyle = grad;
            ctx.fillRect(p.x, 0, this.pipeWidth, p.top);
            ctx.fillRect(p.x, p.bottom, this.pipeWidth, h - p.bottom);

            // Pipe cap
            ctx.fillStyle = '#388e3c';
            ctx.fillRect(p.x - 4, p.top - 20, this.pipeWidth + 8, 20);
            ctx.fillRect(p.x - 4, p.bottom, this.pipeWidth + 8, 20);

            // Pipe highlight
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(p.x + 5, 0, 8, p.top);
            ctx.fillRect(p.x + 5, p.bottom, 8, h - p.bottom);
        }

        // Ground
        ctx.fillStyle = '#8bc34a';
        ctx.fillRect(0, h - this.groundHeight, w, this.groundHeight);
        ctx.fillStyle = '#689f38';
        ctx.fillRect(0, h - this.groundHeight, w, 3);
        // Grass pattern
        ctx.fillStyle = '#7cb342';
        for (let x = 0; x < w; x += 20) {
            const gh = 5 + Math.sin(x * 0.3 + this.frameCount * 0.05) * 3;
            ctx.fillRect(x, h - this.groundHeight - gh, 2, gh);
        }

        // Bird (pet)
        ctx.save();
        ctx.translate(this.bird.x, this.bird.y);
        const angle = Math.min(this.bird.vy * 0.06, 0.8);
        ctx.rotate(angle);

        // Body
        ctx.font = `${Math.min(36, this.width * 0.09)}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐱', 0, 0);

        // Wing animation
        const wingY = Math.sin(this.frameCount * 0.3) * 4;
        ctx.font = '16px serif';
        ctx.fillText('🪽', -16, -8 + wingY);

        ctx.restore();

        // Particles
        this.updateParticles(ctx);
    }

    #gameOver() {
        this.running = false;
        clearInterval(this.interval);
        const bonus = Math.floor(this.score * 5);
        if (bonus > 0) this.manager.awardCoins(bonus);
        
        // Explosion particles
        this.createParticles(this.bird.x, this.bird.y, {
            count: 20, colors: ['#ff4757', '#ff6b9d', '#ffd700'], speed: 5
        });

        const body = this.manager.getBody();
        this.showGameOver(body, {
            title: '💀 Crash!',
            stats: [
                { label: 'Score', value: this.score },
                { label: 'Pipes Passed', value: this.score }
            ],
            coins: bonus,
            onRestart: () => this.start()
        });
    }

    destroy() {
        super.destroy();
        clearInterval(this.interval);
        if (this._flap) {
            document.removeEventListener('keydown', this._flap);
        }
    }
}

