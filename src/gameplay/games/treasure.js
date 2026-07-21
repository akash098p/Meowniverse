/**
 * TreasureHuntGame - Find the treasure on a grid
 * @module gameplay/games/TreasureHuntGame
 */
import GameBase from './game-base.js';

export default class TreasureHuntGame extends GameBase {
    constructor(manager) {
        super(manager);
        this.gridSize = 5;
        this.treasure = { x: 0, y: 0 };
        this.player = { x: 0, y: 0 };
        this.moves = 0;
        this.maxMoves = 12;
        this.found = false;
        this.gameOver = false;
        this.body = null;
        this._keyHandler = null;
        this.discovered = [];
        this.distances = [];
    }

    start() {
        this.treasure = {
            x: Math.floor(Math.random() * this.gridSize),
            y: Math.floor(Math.random() * this.gridSize)
        };
        this.player = {
            x: Math.floor(Math.random() * this.gridSize),
            y: Math.floor(Math.random() * this.gridSize)
        };
        while (this.treasure.x === this.player.x && this.treasure.y === this.player.y) {
            this.treasure = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
        }

        this.moves = 0;
        this.found = false;
        this.gameOver = false;
        this.discovered = [];
        this.distances = [];

        const overlay = this.manager.createOverlay();
        this.manager.setTitle('💎 Treasure Hunt');
        this.body = this.manager.getBody();
        this.running = true;

        const cellSize = Math.min(64, Math.floor((window.innerWidth - 60) / this.gridSize));

        this.body.innerHTML = `
            <div class="mg-header">
                <div class="mg-stat"><span>Moves Left</span><strong id="th-moves">${this.maxMoves}</strong></div>
                <div class="mg-stat"><span>Hint</span><strong id="th-hint">Find the 💎!</strong></div>
                <div class="mg-stat"><span>Found</span><strong id="th-found">0/${this.gridSize * this.gridSize}</strong></div>
            </div>
            <div class="th-game">
                <div class="th-grid" id="th-grid" style="grid-template-columns:repeat(${this.gridSize}, ${cellSize}px);"></div>
                <div class="th-controls">
                    <button class="th-btn" data-dir="up">⬆️</button>
                    <div class="th-row">
                        <button class="th-btn" data-dir="left">⬅️</button>
                        <button class="th-btn" data-dir="down">⬇️</button>
                        <button class="th-btn" data-dir="right">➡️</button>
                    </div>
                </div>
            </div>
            <div class="mg-footer">Navigate to find the treasure! Use buttons or arrow keys.</div>
        `;

        this.#renderGrid();

        this.body.querySelectorAll('.th-btn').forEach(btn => {
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
        if (this.found || this.gameOver || !this.running) return;

        switch (dir) {
            case 'up': if (this.player.y > 0) this.player.y--; else return; break;
            case 'down': if (this.player.y < this.gridSize - 1) this.player.y++; else return; break;
            case 'left': if (this.player.x > 0) this.player.x--; else return; break;
            case 'right': if (this.player.x < this.gridSize - 1) this.player.x++; else return; break;
        }

        this.moves++;
        const remaining = this.maxMoves - this.moves;
        document.getElementById('th-moves').textContent = remaining;

        const hint = document.getElementById('th-hint');

        // Check if found
        if (this.player.x === this.treasure.x && this.player.y === this.treasure.y) {
            this.found = true;
            hint.textContent = '🎉 You found the treasure!';
            hint.style.color = '#ffd700';

            // Big celebration particles
            const gridEl = document.getElementById('th-grid');
            for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                    this.createParticles(
                        Math.random() * gridEl.offsetWidth + gridEl.offsetLeft,
                        Math.random() * gridEl.offsetHeight + gridEl.offsetTop,
                        { count: 15, colors: ['#ffd700', '#ff6b9d', '#c44dff', '#4caf50'], speed: 5 }
                    );
                }, i * 100);
            }

            const bonus = Math.max(10, (this.maxMoves - this.moves) * 5 + 20);
            this.manager.awardCoins(bonus);
            setTimeout(() => {
                this.showGameOver(this.body, {
                    title: '💎 Treasure Found!',
                    stats: [
                        { label: 'Moves Used', value: this.moves },
                        { label: 'Moves Left', value: remaining }
                    ],
                    coins: bonus,
                    onRestart: () => this.start()
                });
            }, 800);
        } else if (remaining <= 0) {
            this.gameOver = true;
            hint.textContent = '💀 Out of moves!';
            hint.style.color = '#f44336';
            setTimeout(() => {
                this.showGameOver(this.body, {
                    title: '💀 Out of Moves',
                    stats: [
                        { label: 'Moves Used', value: this.moves },
                        { label: 'Found Cells', value: this.discovered.length }
                    ],
                    coins: 5,
                    onRestart: () => this.start()
                });
            }, 800);
        } else {
            const dx = this.player.x - this.treasure.x;
            const dy = this.player.y - this.treasure.y;
            const dist = Math.round(Math.sqrt(dx * dx + dy * dy) * 10) / 10;
            this.distances.push(dist);
            
            // Direction hint
            let dirHint = '';
            if (dy < 0) dirHint += '⬆️';
            if (dy > 0) dirHint += '⬇️';
            if (dx > 0) dirHint += '➡️';
            if (dx < 0) dirHint += '⬅️';
            
            hint.innerHTML = `📍 Distance: ${dist} ${dirHint}`;
            hint.style.color = '';

            // Track discovered
            const key = `${this.player.x},${this.player.y}`;
            if (!this.discovered.includes(key)) {
                this.discovered.push(key);
                document.getElementById('th-found').textContent = `${this.discovered.length}/${this.gridSize * this.gridSize}`;
            }
        }

        this.#renderGrid();
    }

    #renderGrid() {
        const grid = document.getElementById('th-grid');
        if (!grid) return;

        const cellSize = Math.min(64, Math.floor((window.innerWidth - 60) / this.gridSize));
        grid.innerHTML = '';
        
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'th-cell';
                cell.style.width = `${cellSize}px`;
                cell.style.height = `${cellSize}px`;

                const isPlayer = this.player.x === x && this.player.y === y;
                const isTreasure = this.treasure.x === x && this.treasure.y === y;
                const isDiscovered = this.discovered.includes(`${x},${y}`);

                if (isPlayer) {
                    cell.textContent = '🧭';
                    cell.className = 'th-cell th-player';
                } else if (this.found && isTreasure) {
                    cell.textContent = '💎';
                    cell.className = 'th-cell th-treasure';
                } else if (isDiscovered || this.found) {
                    cell.className = 'th-cell th-discovered';
                    if (isTreasure) {
                        cell.textContent = '💎';
                        cell.className = 'th-cell th-treasure';
                    } else {
                        cell.textContent = '·';
                    }
                } else {
                    cell.textContent = '?';
                    cell.className = 'th-cell th-hidden';
                }

                // Add heat effect based on distance
                if (isPlayer || (!isPlayer && !this.found)) {
                    const dx = this.player.x - x;
                    const dy = this.player.y - y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const pulseDelay = dist * 0.1;
                    cell.style.animationDelay = `${pulseDelay}s`;
                }

                grid.appendChild(cell);
            }
        }
    }

    destroy() {
        super.destroy();
        if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
    }
}

