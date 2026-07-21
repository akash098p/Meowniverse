/**
 * Tile2048Game - Classic 2048 number puzzle
 * @module gameplay/games/Tile2048Game
 */
import GameBase from './game-base.js';

export default class Tile2048Game extends GameBase {
    constructor(manager) {
        super(manager);
        this.grid = Array(4).fill(null).map(() => Array(4).fill(0));
        this.score = 0;
        this.interval = null;
        this.tileSize = 0;
        this.gap = 8;
        this.width = 0;
        this.canvas = null;
        this.ctx = null;
        this._keyHandler = null;
        this.animating = false;
        this.colors = {
            0: '#cdc1b4', 2: '#eee4da', 4: '#ede0c8', 8: '#f2b179',
            16: '#f59563', 32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72',
            256: '#edcc61', 512: '#edc850', 1024: '#edc53f', 2048: '#edc22e',
            4096: '#3c3a32', 8192: '#3c3a32'
        };
    }

    start() {
        const overlay = this.manager.createOverlay();
        this.manager.setTitle('🔢 2048');
        const body = this.manager.getBody();
        this.running = true;

        const maxWidth = Math.min(360, window.innerWidth - 40);
        this.tileSize = Math.floor((maxWidth - this.gap * 5) / 4);
        this.width = this.tileSize * 4 + this.gap * 5;

        this.grid = Array(4).fill(null).map(() => Array(4).fill(0));
        this.score = 0;

        body.innerHTML = `
            <div class="mg-header">
                <div class="mg-stat"><span>Score</span><strong id="game2048-score">0</strong></div>
                <div class="mg-stat"><span>Target</span><strong>2048</strong></div>
            </div>
            <div class="mg-canvas-wrapper">
                <canvas id="game2048-canvas" width="${this.width}" height="${this.width}"></canvas>
            </div>
            <div class="mg-footer">Use arrow keys to merge tiles!</div>
        `;

        this.canvas = document.getElementById('game2048-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.#addTile();
        this.#addTile();
        this.#draw();

        this._keyHandler = (e) => {
            if (!this.running || this.animating) return;
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
                this.animating = true;
                setTimeout(() => {
                    this.#addTile();
                    this.#draw();
                    this.animating = false;
                    if (this.#isGameOver()) this.#gameOver();
                }, 100);
            }
        };
        document.addEventListener('keydown', this._keyHandler);

        // Touch support
        let touchStartX = 0, touchStartY = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            touchStartX = t.clientX;
            touchStartY = t.clientY;
        });
        this.canvas.addEventListener('touchend', (e) => {
            if (!this.running || this.animating) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - touchStartX;
            const dy = t.clientY - touchStartY;
            if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
            
            let moved = false;
            if (Math.abs(dx) > Math.abs(dy)) {
                moved = dx > 0 ? this.#move(1, 0) : this.#move(-1, 0);
            } else {
                moved = dy > 0 ? this.#move(0, 1) : this.#move(0, -1);
            }
            if (moved) {
                this.animating = true;
                setTimeout(() => {
                    this.#addTile();
                    this.#draw();
                    this.animating = false;
                    if (this.#isGameOver()) this.#gameOver();
                }, 100);
            }
        });
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
        const totalSize = this.width;

        // Background
        ctx.fillStyle = '#bbada0';
        this.roundRect(ctx, 0, 0, totalSize, totalSize, 8);
        ctx.fill();

        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                const val = this.grid[y][x];
                const px = g + x * (ts + g);
                const py = g + y * (ts + g);

                // Tile background
                ctx.fillStyle = this.colors[val] || '#3c3a32';
                this.roundRect(ctx, px, py, ts, ts, 6);
                ctx.fill();

                // New tile glow
                if (val === 2 || val === 4) {
                    ctx.shadowColor = 'rgba(255,255,255,0.3)';
                    ctx.shadowBlur = 10;
                    ctx.fillStyle = this.colors[val];
                    this.roundRect(ctx, px, py, ts, ts, 6);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }

                if (val !== 0) {
                    ctx.fillStyle = val <= 4 ? '#776e65' : '#f9f6f2';
                    const fontSize = val >= 1000 ? (val >= 10000 ? 'bold 16px sans-serif' : 'bold 20px sans-serif')
                        : 'bold 28px sans-serif';
                    ctx.font = fontSize;
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

        const body = this.manager.getBody();
        this.showGameOver(body, {
            title: '💀 Game Over',
            stats: [{ label: 'Score', value: this.score }],
            coins: bonus,
            onRestart: () => this.start()
        });
    }

    destroy() {
        super.destroy();
        if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
    }
}

