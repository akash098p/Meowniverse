/**
 * RockPaperScissorsGame - Classic RPS with style
 * @module gameplay/games/RockPaperScissorsGame
 */
import GameBase from './game-base.js';

export default class RockPaperScissorsGame extends GameBase {
    constructor(manager) {
        super(manager);
        this.score = 0;
        this.round = 0;
        this.maxRounds = 7;
        this.wins = 0;
        this.losses = 0;
        this.ties = 0;
        this.choices = [
            { id: 'rock', emoji: '✊', label: 'Rock', beats: 'scissors', loses: 'paper' },
            { id: 'paper', emoji: '✋', label: 'Paper', beats: 'rock', loses: 'scissors' },
            { id: 'scissors', emoji: '✌️', label: 'Scissors', beats: 'paper', loses: 'rock' }
        ];
        this.body = null;
        this.resultEl = null;
        this.playerEl = null;
        this.aiEl = null;
    }

    start() {
        const overlay = this.manager.createOverlay();
        this.manager.setTitle('✂️ Rock Paper Scissors');
        this.body = this.manager.getBody();
        this.running = true;

        this.score = 0;
        this.round = 0;
        this.wins = 0;
        this.losses = 0;
        this.ties = 0;

        this.body.innerHTML = `
            <div class="mg-header">
                <div class="mg-stat"><span>Round</span><strong id="rps-round">0/${this.maxRounds}</strong></div>
                <div class="mg-stat"><span>Wins</span><strong id="rps-wins">0</strong></div>
                <div class="mg-stat"><span>Score</span><strong id="rps-score">0</strong></div>
            </div>
            <div class="rps-battle" id="rps-battle">
                <div class="rps-player">
                    <div class="rps-label">You</div>
                    <div class="rps-emoji" id="rps-player-choice">❓</div>
                </div>
                <div class="rps-vs">VS</div>
                <div class="rps-ai">
                    <div class="rps-label">Bot</div>
                    <div class="rps-emoji" id="rps-ai-choice">❓</div>
                </div>
            </div>
            <div class="rps-result" id="rps-result">Choose your move!</div>
            <div class="rps-choices" id="rps-choices">
                ${this.choices.map(c => `
                    <button class="rps-choice-btn" data-id="${c.id}">
                        <span class="rps-choice-emoji">${c.emoji}</span>
                        <span class="rps-choice-label">${c.label}</span>
                    </button>
                `).join('')}
            </div>
        `;

        this.playerEl = document.getElementById('rps-player-choice');
        this.aiEl = document.getElementById('rps-ai-choice');
        this.resultEl = document.getElementById('rps-result');

        this.body.querySelectorAll('.rps-choice-btn').forEach(btn => {
            btn.addEventListener('click', () => this.#play(btn.dataset.id));
        });
    }

    #play(playerId) {
        if (!this.running || this.round >= this.maxRounds) return;
        this.round++;
        document.getElementById('rps-round').textContent = `${this.round}/${this.maxRounds}`;

        const player = this.choices.find(c => c.id === playerId);
        const ai = this.choices[Math.floor(Math.random() * this.choices.length)];

        // Animate choices
        this.playerEl.textContent = player.emoji;
        this.playerEl.className = 'rps-emoji animate-choice';
        this.aiEl.textContent = ai.emoji;
        this.aiEl.className = 'rps-emoji animate-choice';

        let resultText = '';
        let resultClass = '';

        if (player.id === ai.id) {
            this.ties++;
            resultText = `🤝 Tie! Both chose ${player.label}`;
            resultClass = 'rps-tie';
        } else if (player.beats === ai.id) {
            this.wins++;
            this.score += 20;
            document.getElementById('rps-wins').textContent = this.wins;
            document.getElementById('rps-score').textContent = this.score;
            resultText = `🎉 You Win! ${player.emoji} beats ${ai.emoji}`;
            resultClass = 'rps-win';
            
            // Particles
            const rect = this.playerEl.getBoundingClientRect();
            this.createParticles(rect.left + rect.width/2, rect.top + rect.height/2, {
                count: 12, colors: ['#ffd700', '#4caf50'], speed: 4
            });
        } else {
            this.losses++;
            resultText = `😢 You Lose! ${ai.emoji} beats ${player.emoji}`;
            resultClass = 'rps-lose';
        }

        this.resultEl.textContent = resultText;
        this.resultEl.className = `rps-result ${resultClass}`;

        if (this.round >= this.maxRounds) {
            setTimeout(() => this.#finish(), 1200);
        }
    }

    #finish() {
        this.running = false;
        const bonus = this.score;
        if (bonus > 0) this.manager.awardCoins(bonus);

        this.showGameOver(this.body, {
            title: '🏆 Game Complete!',
            stats: [
                { label: 'Wins', value: this.wins },
                { label: 'Losses', value: this.losses },
                { label: 'Ties', value: this.ties },
                { label: 'Score', value: this.score }
            ],
            coins: bonus,
            onRestart: () => this.start()
        });
    }

    destroy() {
        super.destroy();
    }
}

