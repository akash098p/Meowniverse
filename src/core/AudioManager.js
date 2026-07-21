/**
 * AudioManager - Sound management system with named placeholder hooks
 * @module core/AudioManager
 * 
 * Placeholder implementation. Audio files are not included yet.
 * Add audio files to assets/audio/ matching the names below,
 * then update the #soundFiles mapping.
 * 
 * Supported formats: .mp3, .ogg, .wav
 */
class AudioManager {
    /** @type {AudioManager} */
    static #instance;

    /** @type {Object<string, HTMLAudioElement>} */
    #sounds = {};

    /** @type {boolean} */
    #muted = false;

    /** @type {number} */
    #masterVolume = 0.8;

    /** @type {boolean} */
    #loaded = false;

    static getInstance() {
        if (!AudioManager.#instance) {
            AudioManager.#instance = new AudioManager();
        }
        return AudioManager.#instance;
    }

    /**
     * Initialize the audio manager and preload sounds
     */
    async init() {
        if (this.#loaded) return;
        
        // Load settings
        const StateManager = (await import('./StateManager.js')).default;
        this.#masterVolume = StateManager.getInstance().get('settings.sfxVolume', 80) / 100;
        
        this.#loaded = true;
        console.log('[AudioManager] Initialized. Add audio files to assets/audio/');
    }

    /**
     * Play a sound by name
     * @param {string} name - Sound identifier
     * @param {Object} [options] - Playback options
     * @param {number} [options.volume=1] - Volume multiplier (0-1)
     * @param {boolean} [options.loop=false] - Loop the sound
     */
    play(name, options = {}) {
        if (this.#muted) return;

        const sound = this.#sounds[name];
        if (!sound) {
            // Sound not loaded yet - no audio files present
            return;
        }

        const volume = (options.volume ?? 1) * this.#masterVolume;
        sound.volume = Math.max(0, Math.min(1, volume));
        sound.loop = options.loop || false;
        sound.currentTime = 0;
        sound.play().catch(() => {
            // Autoplay may be blocked - user interaction needed
        });
    }

    /**
     * Stop a sound
     * @param {string} name
     */
    stop(name) {
        const sound = this.#sounds[name];
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    }

    /**
     * Stop all sounds
     */
    stopAll() {
        for (const sound of Object.values(this.#sounds)) {
            sound.pause();
            sound.currentTime = 0;
        }
    }

    /**
     * Toggle mute
     * @param {boolean} [muted] - If not provided, toggles current state
     */
    setMuted(muted) {
        this.#muted = muted !== undefined ? muted : !this.#muted;
        if (this.#muted) {
            this.stopAll();
        }
    }

    /**
     * Check if muted
     * @returns {boolean}
     */
    isMuted() {
        return this.#muted;
    }

    /**
     * Set master volume
     * @param {number} volume - 0 to 1
     */
    setVolume(volume) {
        this.#masterVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Preload a specific sound file
     * @param {string} name - Identifier
     * @param {string} src - Path to audio file
     * @param {boolean} [preload=true] - Preload metadata
     */
    loadSound(name, src, preload = true) {
        const audio = new Audio(src);
        audio.preload = preload ? 'auto' : 'metadata';
        this.#sounds[name] = audio;
    }

    /**
     * Get the list of all registered sound names
     * @returns {string[]}
     */
    getSoundNames() {
        return Object.keys(this.#sounds);
    }

    /**
     * Clean up
     */
    destroy() {
        this.stopAll();
        this.#sounds = {};
        this.#loaded = false;
    }
}

export default AudioManager;

/**
 * ====================================================
 *  SOUND NAMES & DESCRIPTIONS
 *  ====================================================
 *  Add the following audio files to assets/audio/:
 * 
 *  ┌─────────────────────┬──────────────────────────────────────────────┐
 *  │ Sound Name           │ Description / When Played                    │
 *  ├─────────────────────┼──────────────────────────────────────────────┤
 *  │ bgm_main            │ Background music for pet view screen          │
 *  │ bgm_shop            │ Background music for shop                     │
 *  │ bgm_game            │ Background music during mini-games            │
 *  │ sfx_click           │ UI button click / tap feedback               │
 *  │ sfx_notification    │ Achievement unlocked / notification popup     │
 *  │ sfx_coin            │ Coin earned / purchase made                  │
 *  │ sfx_button_hover    │ Button hover effect                          │
 *  │ sfx_feed            │ Pet feeding animation                        │
 *  │ sfx_play            │ Pet playing animation                        │
 *  │ sfx_sleep           │ Pet going to sleep                           │
 *  │ sfx_wake            │ Pet waking up                                │
 *  │ sfx_bath            │ Pet bathing                                  │
 *  │ sfx_heal            │ Pet healed / medicine used                   │
 *  │ sfx_train           │ Pet training                                 │
 *  │ sfx_levelup         │ Pet or player level up                       │
 *  │ sfx_evolve          │ Pet evolution                                │
 *  │ sfx_error           │ Error / insufficient funds / invalid action  │
 *  │ sfx_success         │ Success sound (quest complete, etc.)         │
 *  │ sfx_game_start      │ Mini-game countdown / start                  │
 *  │ sfx_game_over       │ Mini-game over / lose                        │
 *  │ sfx_game_win        │ Mini-game won                                │
 *  │ sfx_game_score      │ Score increase during game                   │
 *  │ sfx_card_flip       │ Memory match card flip                       │
 *  │ sfx_card_match      │ Memory match successful pair                 │
 *  │ sfx_snake_eat       │ Snake game food eaten                        │
 *  │ sfx_snake_death     │ Snake game collision                         │
 *  │ sfx_flappy_flap     │ Flappy pet jump/flap                         │
 *  │ sfx_flappy_score    │ Flappy pet pass pipe                         │
 *  │ sfx_catch_caught    │ Catch food - caught item                     │
 *  │ sfx_catch_bomb      │ Catch food - bomb caught                     │
 *  │ sfx_reaction_ready  │ Reaction test - green signal                 │
 *  │ sfx_reaction_early  │ Reaction test - clicked too early            │
 *  │ sfx_treasure_find   │ Treasure hunt - found treasure               │
 *  │ sfx_treasure_move   │ Treasure hunt - moved                        │
 *  │ sfx_rps_win         │ Rock paper scissors - won round              │
 *  │ sfx_rps_lose        │ Rock paper scissors - lost round             │
 *  │ sfx_rps_tie         │ Rock paper scissors - tie                    │
 *  │ sfx_2048_merge      │ 2048 - tiles merged                          │
 *  │ sfx_2048_gameover   │ 2048 - no moves left                         │
 *  │ sfx_pet_happy       │ Pet happy reaction                           │
 *  │ sfx_pet_sad         │ Pet sad reaction                             │
 *  │ sfx_pet_hungry      │ Pet hungry notification                      │
 *  │ sfx_ambient_room    │ Ambient room environment sound               │
 *  │ sfx_ambient_garden  │ Ambient garden environment sound             │
 *  │ sfx_ambient_beach   │ Ambient beach environment sound              │
 *  │ sfx_ambient_space   │ Ambient space environment sound              │
 *  │ sfx_weather_rain    │ Rain weather effect                          │
 *  │ sfx_weather_thunder │ Thunder weather effect                       │
 *  │ sfx_weather_wind    │ Wind weather effect                          │
 *  └─────────────────────┴──────────────────────────────────────────────┘
 * 
 *  File naming convention: assets/audio/{name}.mp3
 *  Example: assets/audio/sfx_click.mp3
 * 
 *  ====================================================
 */
