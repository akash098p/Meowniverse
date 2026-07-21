/**
 * ReactionTestGame - Test your reflexes
 * @module gameplay/games/ReactionTestGame
 */
import GameBase from './game-base.js';

export default class ReactionTestGame extends GameBase {
    constructor(manager) {
        super(manager);
        this.score = 0;
        this.round = 0;
        this.maxRounds = 8;
        this.waiting = false;
        this.timeout = null;
        this.startTime = 0;
        this.reactionTimes = [];
        this.btn = null;
        this.body = null;
    }

    start() {
        const overlay = this.manager.createOverlay();
        this.manager.setTitle('⚡ Reaction Test');
        this.body = this.manager.getBody();
        this.running = true;

        this.score = 0;
        this.round = 0;
        this.waiting = false;
        this.reactionTimes = [];

        this.body.innerHTML = `
            <div class="mg-header">
                <div class="mg-stat"><span>Round</span><strong id="reaction-round">0/${this.maxRounds}</strong></div>
                <div class="mg-stat"><span>Score</span><strong id="reaction-score">0</strong></div>
                <div class="mg-stat"><span>Avg</span><strong id="reaction-avg">-ms</strong></div>
            </div>
            <div class="reaction-area" id="reaction-area">
                <div class="reaction-btn" id="reaction-btn">
                    <span class="reaction-btn-text">Wait for green...</span>
                    <span class="reaction-btn-sub">Click when the button turns GREEN</span>
                </div>
            </div>
            <div class="mg-footer">React as fast as you can when it turns green!</div>
        `;

        this.btn = document.getElementById('reaction-btn');
        this.btn.addEventListener('click', () => this.#handleClick());
        this.#startRound();
    }

    #startRound() {
        this.round++;
        if (this.round > this.maxRounds) {
            this.#finish();
            return;
        }
        document.getElementById('reaction-round').textContent = `${this.round}/${this.maxRounds}`;
        this.waiting = true;
        this.btn.className = 'reaction-btn waiting';
        this.btn.querySelector('.reaction-btn-text').textContent = 'Wait for green...';
        this.btn.querySelector('.reaction-btn-sub').textContent = 'Click when the button turns GREEN';

        const delay = 1000 + Math.random() * 2500;
        this.timeout = setTimeout(() => {
            this.waiting = false;
            this.startTime = performance.now();
            this.btn.className = 'reaction-btn ready';
            this.btn.querySelector('.reaction-btn-text').textContent = 'CLICK NOW!';
            this.btn.querySelector('.reaction-btn-sub').textContent = '⚡⚡⚡';
        }, delay);
    }

    #handleClick() {
        if (!this.running) return;
        
        if (this.waiting) {
            // Too early!
            this.btn.className = 'reaction-btn early';
            this.btn.querySelector('.reaction-btn-text').textContent = 'Too early!';
            this.btn.querySelector('.reaction-btn-sub').textContent = 'Wait for green...';
            clearTimeout(this.timeout);
            setTimeout(() => this.#startRound(), 1000);
            return;
        }

        if (this.startTime) {
            const reaction = Math.round(performance.now() - this.startTime);
            this.reactionTimes.push(reaction);
            const points = Math.max(0, Math.floor((500 - reaction) / 10)) + 10;
            this.score += points;
            document.getElementById('reaction-score').textContent = this.score;
            
            const avg = Math.round(this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length);
            document.getElementById('reaction-avg').textContent = `${avg}ms`;

            // Visual feedback
            this.btn.className = reaction <= 200 ? 'reaction-btn perfect' : 'reaction-btn result';
            this.btn.querySelector('.reaction-btn-text').textContent = `${reaction}ms`;
            this.btn.querySelector('.reaction-btn-sub').textContent = reaction <= 200 ? '🏆 Perfect!' : `+${points}pts`;
            
            this.startTime = null;
            
            // Particle effect for fast reactions
            if (reaction <= 200) {
                const rect = this.btn.getBoundingClientRect();
                this.createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, {
                    count: 15, colors: ['#ffd700', '#ff6b9d', '#4caf50'], speed: 5
                });
            }

            setTimeout(() => this.#startRound(), 1000);
        }
    }

    #finish() {
        this.running = false;
        const bonus = Math.floor(this.score / 3);
        if (bonus > 0) this.manager.awardCoins(bonus);

        const avg = this.reactionTimes.length > 0
            ? Math.round(this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length)
            : 0;

        this.showGameOver(this.body, {
            title: '🎯 Complete!',
            stats: [
                { label: 'Score', value: this.score },
                { label: 'Avg Reaction', value: `${avg}ms` },
                { label: 'Best', value: this.reactionTimes.length > 0 ? `${Math.min(...this.reactionTimes)}ms` : '-' }
            ],
            coins: bonus,
            onRestart: () => this.start()
        });
    }

    destroy() {
        super.destroy();
        clearTimeout(this.timeout);
    }
}

