/**
 * TimeSystem - Manages in-game time, day/night cycle, and date
 * @module core/TimeSystem
 */
class TimeSystem {
    /** @type {TimeSystem} */
    static #instance;

    /** @type {number} */
    #gameTime = 0; // Total game minutes elapsed

    /** @type {number} */
    #timeScale = 1; // 1 real second = 1 game minute

    /** @type {number} */
    #dayLength = 1440; // 24 hours in game minutes

    /** @type {number} */
    #lastRealTime = 0;

    /** @type {boolean} */
    #paused = false;

    /** @type {Array<Function>} */
    #listeners = [];

    static getInstance() {
        if (!TimeSystem.#instance) {
            TimeSystem.#instance = new TimeSystem();
        }
        return TimeSystem.#instance;
    }

    /**
     * Initialize time system
     * @param {number} [startTime=480] - Starting game minute (480 = 8:00 AM)
     * @param {number} [timeScale=1]
     */
    init(startTime = 480, timeScale = 1) {
        this.#gameTime = startTime;
        this.#timeScale = timeScale;
        this.#lastRealTime = Date.now();
    }

    /**
     * Update game time
     * @param {number} deltaTime - Real ms elapsed
     */
    update(deltaTime) {
        if (this.#paused) return;

        const realMinutes = deltaTime / 60000;
        const gameMinutes = realMinutes * this.#timeScale;
        this.#gameTime += gameMinutes;

        this.#notifyListeners();
    }

    /**
     * Calculate offline progress
     * @param {number} offlineMs - Milliseconds offline
     * @returns {number} Game minutes elapsed
     */
    calculateOfflineProgress(offlineMs) {
        const realMinutes = offlineMs / 60000;
        return Math.min(realMinutes * this.#timeScale, 1440 * 7); // Max 7 game days
    }

    /**
     * Get current hour (0-23)
     * @returns {number}
     */
    getHour() {
        return Math.floor((this.#gameTime % this.#dayLength) / 60);
    }

    /**
     * Get current minute (0-59)
     * @returns {number}
     */
    getMinute() {
        return Math.floor((this.#gameTime % this.#dayLength) % 60);
    }

    /**
     * Get formatted time string
     * @returns {string}
     */
    getTimeString() {
        const h = this.getHour();
        const m = this.getMinute();
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
    }

    /**
     * Get current day number
     * @returns {number}
     */
    getDay() {
        return Math.floor(this.#gameTime / this.#dayLength) + 1;
    }

    /**
     * Check if it's day time (6:00 - 18:00)
     * @returns {boolean}
     */
    isDaytime() {
        const hour = this.getHour();
        return hour >= 6 && hour < 18;
    }

    /**
     * Get daylight intensity (0-1)
     * @returns {number}
     */
    getDaylightIntensity() {
        const hour = this.getHour();
        if (hour >= 6 && hour < 12) return (hour - 6) / 6;
        if (hour >= 12 && hour < 18) return 1 - (hour - 12) / 6;
        return 0;
    }

    /**
     * Get total game minutes
     * @returns {number}
     */
    getGameTime() {
        return this.#gameTime;
    }

    /**
     * Set time scale
     * @param {number} scale
     */
    setTimeScale(scale) {
        this.#timeScale = Math.max(0.1, Math.min(scale, 60));
    }

    /**
     * Pause time
     */
    pause() {
        this.#paused = true;
    }

    /**
     * Resume time
     */
    resume() {
        this.#paused = false;
        this.#lastRealTime = Date.now();
    }

    /**
     * Check if paused
     * @returns {boolean}
     */
    isPaused() {
        return this.#paused;
    }

    /**
     * Serialize for save
     * @returns {Object}
     */
    serialize() {
        return {
            gameTime: this.#gameTime,
            timeScale: this.#timeScale,
            paused: this.#paused
        };
    }

    /**
     * Deserialize from save
     * @param {Object} data
     */
    deserialize(data) {
        this.#gameTime = data.gameTime || 480;
        this.#timeScale = data.timeScale || 1;
        this.#paused = data.paused || false;
    }

    /**
     * Add time change listener
     * @param {Function} listener
     */
    addListener(listener) {
        this.#listeners.push(listener);
    }

    /**
     * Notify all listeners
     * @private
     */
    #notifyListeners() {
        const timeData = {
            hour: this.getHour(),
            minute: this.getMinute(),
            day: this.getDay(),
            isDaytime: this.isDaytime(),
            timeString: this.getTimeString(),
            daylightIntensity: this.getDaylightIntensity()
        };
        for (const listener of this.#listeners) {
            try { listener(timeData); } catch (e) { console.error(e); }
        }
    }
}

export default TimeSystem;