/**
 * MemoryMatchGame - Memory card matching game
 * @module gameplay/games/MemoryMatchGame
 */
import GameBase from './game-base.js';

export default class MemoryMatchGame extends GameBase {
    constructor(manager) {
        super(manager);
        this.cards = [];
        this.flipped = [];
        this.matchedPairs = 0;
        this.totalPairs = 8;
        this.moves = 0;
        this.locked = false;
        this.timeout = null;
    }

    start() {
        const overlay = this.manager.createOverlay();
        this.manager.setTitle('🧠 Memory Match');
        const body = this.manager.getBody();
        this.running = true;

        const emojis = ['🐱', '🐶', '🐰', '🐧', '🦊', '🐉', '🐟', '🐸'];
        const deck = [...emojis, ...emojis].sort(() => Math.random() - 0.5);

        body.innerHTML = `
            <div class="mg-header">
                <div class="mg-stat"><span>Moves</span><strong id="memory-moves">0</strong></div>
                <div class="mg-stat"><span>Matched</span><strong id="memory-matched">0/${this.totalPairs}</strong></div>
                <div class="mg-stat"><span>Pairs</span><strong>${this.totalPairs}</strong></div>
            </div>
            <div class="memory-grid" id="memory-grid"></div>
            <div class="mg-footer">Click cards to find matching pairs!</div>
        `;

        const grid = body.querySelector('#memory-grid');
        this.cards = [];

        deck.forEach((emoji, i) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.index = i;
            card.dataset.emoji = emoji;
            card.innerHTML = `
                <div class="memory-card-inner">
                    <div class="memory-card-front">❓</div>
                    <div class="memory-card-back">${emoji}</div>
                </div>
            `;
            card.addEventListener('click', () => this.#flip(card));
            grid.appendChild(card);
            this.cards.push(card);
        });
    }

    #flip(card) {
        if (this.locked || card.classList.contains('matched') || card.classList.contains('flipped')) return;
        if (this.flipped.length >= 2) return;

        card.classList.add('flipped');
        this.flipped.push(card);

        if (this.flipped.length === 2) {
            this.locked = true;
            this.moves++;
            document.getElementById('memory-moves').textContent = this.moves;

            const [a, b] = this.flipped;
            if (a.dataset.emoji === b.dataset.emoji) {
                this.timeout = setTimeout(() => {
                    a.classList.add('matched');
                    b.classList.add('matched');
                    this.matchedPairs++;
                    document.getElementById('memory-matched').textContent = `${this.matchedPairs}/${this.totalPairs}`;
                    this.flipped = [];
                    this.locked = false;

                    // Particle effect
                    const rect = a.getBoundingClientRect();
                    this.createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, {
                        count: 10, colors: ['#ffd700', '#ff6b9d', '#4caf50']
                    });

                    if (this.matchedPairs === this.totalPairs) {
                        this.#win();
                    }
                }, 400);
            } else {
                this.timeout = setTimeout(() => {
                    a.classList.remove('flipped');
                    b.classList.remove('flipped');
                    this.flipped = [];
                    this.locked = false;
                }, 900);
            }
        }
    }

    #win() {
        this.running = false;
        const bonus = Math.max(50 - this.moves, 10);
        this.manager.awardCoins(bonus);
        
        const body = this.manager.getBody();
        const particles = () => {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    this.createParticles(
                        Math.random() * body.offsetWidth,
                        Math.random() * body.offsetHeight,
                        { count: 20, colors: ['#ffd700', '#ff6b9d', '#c44dff', '#4caf50', '#2196f3'], speed: 6 }
                    );
                }, i * 200);
            }
        };
        particles();

        setTimeout(() => {
            this.showGameOver(body, {
                title: '🎉 You Win!',
                stats: [
                    { label: 'Moves', value: this.moves },
                    { label: 'Pairs', value: `${this.matchedPairs}/${this.totalPairs}` }
                ],
                coins: bonus,
                onRestart: () => this.start()
            });
        }, 800);
    }

    destroy() {
        super.destroy();
        clearTimeout(this.timeout);
    }
}

