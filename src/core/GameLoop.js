/**
 * GameLoop - Main game loop with fixed timestep
 * @module core/GameLoop
 * 
 * Provides a consistent update cycle with delta time,
 * tick-based updates, and performance monitoring.
 */
class GameLoop {
    /** @type {GameLoop} */
    static #instance;

    /** @type {boolean} */
    #running = false;

    /** @type {number} */
    #lastTime = 0;

    /** @type {number} */
    #accumulator = 0;

    /** @type {number} */
    #fixedDelta = 1000 / 60; // 60 ticks per second

    /** @type {number} */
    #maxFrameTime = 200; // Cap to prevent spiral of death

    /** @type {number} */
    #rafId = null;

    /** @type {Array<{priority: number, callback: Function, name: string}>} */
    #updatables = [];

    /** @type {Object} */
    #metrics = {
        fps: 0,
        frameCount: 0,
        lastFpsUpdate: 0,
        averageUpdateTime: 0,
        totalUpdateTime: 0
    };

    /**
     * Get singleton instance
     * @returns {GameLoop}
     */
    static getInstance() {
        if (!GameLoop.#instance) {
            GameLoop.#instance = new GameLoop();
        }
        return GameLoop.#instance;
    }

    /**
     * Register an update callback
     * @param {Function} callback - (deltaTime, elapsedTime) => void
     * @param {number} [priority=0] - Higher runs first
     * @param {string} [name='anonymous'] - For debugging
     * @returns {Function} Unregister function
     */
    addUpdatable(callback, priority = 0, name = 'anonymous') {
        const entry = { priority, callback, name };
        this.#updatables.push(entry);
        this.#updatables.sort((a, b) => b.priority - a.priority);
        return () => {
            const index = this.#updatables.indexOf(entry);
            if (index !== -1) this.#updatables.splice(index, 1);
        };
    }

    /**
     * Start the game loop
     */
    start() {
        if (this.#running) return;
        this.#running = true;
        this.#lastTime = performance.now();
        this.#metrics.lastFpsUpdate = this.#lastTime;
        this.#loop(this.#lastTime);
    }

    /**
     * Stop the game loop
     */
    stop() {
        this.#running = false;
        if (this.#rafId) {
            cancelAnimationFrame(this.#rafId);
            this.#rafId = null;
        }
    }

    /**
     * Pause the loop
     */
    pause() {
        this.#running = false;
    }

    /**
     * Resume the loop
     */
    resume() {
        if (!this.#running) {
            this.#running = true;
            this.#lastTime = performance.now();
            this.#loop(this.#lastTime);
        }
    }

    /**
     * Check if running
     * @returns {boolean}
     */
    isRunning() {
        return this.#running;
    }

    /**
     * Get performance metrics
     * @returns {Object}
     */
    getMetrics() {
        return { ...this.#metrics };
    }

    /**
     * Main loop
     * @private
     * @param {number} currentTime
     */
    #loop(currentTime) {
        if (!this.#running) return;

        const frameTime = Math.min(currentTime - this.#lastTime, this.#maxFrameTime);
        this.#lastTime = currentTime;
        this.#accumulator += frameTime;

        // FPS calculation
        this.#metrics.frameCount++;
        if (currentTime - this.#metrics.lastFpsUpdate >= 1000) {
            this.#metrics.fps = this.#metrics.frameCount;
            this.#metrics.frameCount = 0;
            this.#metrics.lastFpsUpdate = currentTime;
        }

        // Fixed timestep updates
        const startTime = performance.now();
        while (this.#accumulator >= this.#fixedDelta) {
            this.#update(this.#fixedDelta, currentTime);
            this.#accumulator -= this.#fixedDelta;
        }

        const updateTime = performance.now() - startTime;
        this.#metrics.totalUpdateTime += updateTime;
        this.#metrics.averageUpdateTime = this.#metrics.totalUpdateTime / 
            (this.#metrics.frameCount || 1);

        this.#rafId = requestAnimationFrame((time) => this.#loop(time));
    }

    /**
     * Run all update callbacks
     * @private
     * @param {number} deltaTime
     * @param {number} elapsedTime
     */
    #update(deltaTime, elapsedTime) {
        for (const entry of this.#updatables) {
            try {
                entry.callback(deltaTime, elapsedTime);
            } catch (error) {
                console.error(`[GameLoop] Error in updatable "${entry.name}":`, error);
            }
        }
    }
}

export default GameLoop;