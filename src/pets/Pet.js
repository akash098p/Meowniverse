/**
 * Pet - Individual pet entity
 * @module pets/Pet
 * 
 * Represents a single pet with stats, personality, growth, and behavior.
 * All pet types are loaded from configuration via the Registry.
 */
import EventBus from '../core/EventBus.js';
import StateManager from '../core/StateManager.js';
import Registry from '../core/Registry.js';
import TimeSystem from '../core/TimeSystem.js';

class Pet {
    /**
     * @param {string} speciesId - Pet species identifier
     * @param {string} name - Pet name
     * @param {Object} [options] - Optional overrides
     */
    constructor(speciesId, name, options = {}) {
        const config = Registry.getInstance().get('pets', speciesId);
        if (!config) {
            throw new Error(`Unknown pet species: ${speciesId}`);
        }

        this.config = config;
        this.id = options.id || `pet_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        this.species = speciesId;
        this.name = name;
        this.hatched = options.hatched || false;
        this.hatchTime = options.hatchTime || Date.now();
        this.birthTime = options.birthTime || Date.now();

        // Stats
        this.stats = options.stats || {
            health: 100,
            hunger: 100,
            happiness: 100,
            energy: 100,
            cleanliness: 100,
            sleep: 100,
            intelligence: 10,
            strength: 10
        };

        this.maxStats = { ...config.baseStats };

        // Growth
        this.age = options.age || 0; // in game days
        this.growthStage = options.growthStage || 'baby';

        // Personality
        this.personality = options.personality || [...config.personality.baseTraits];

        // Mood
        this.mood = options.mood || 'happy';

        // XP & Level
        this.xp = options.xp || 0;
        this.level = options.level || 1;
        this.xpToNext = options.xpToNext || 50;

        // Status effects
        this.isSleeping = options.isSleeping || false;
        this.isSick = options.isSick || false;
        this.isDirty = options.isDirty || false;

        // Equipment
        this.equipped = options.equipped || {};

        // Abilities
        this.unlockedAbilities = options.unlockedAbilities || [];

        // Affection
        this.affection = options.affection || 0;

        // Evolution path
        this.evolutionPath = options.evolutionPath || 'normal';

        this.#updateGrowthStage();
        this.#updateMood();
    }

    /**
     * Update pet stats based on elapsed game time
     * @param {number} gameMinutes - Minutes passed
     */
    update(gameMinutes) {
        if (this.isSleeping) {
            // Recover sleep and energy while sleeping
            this.stats.sleep = Math.min(100, this.stats.sleep + 0.5 * gameMinutes);
            this.stats.energy = Math.min(100, this.stats.energy + 0.3 * gameMinutes);
            this.stats.health = Math.min(100, this.stats.health + 0.1 * gameMinutes);
            return;
        }

        const decay = this.config.decayRates;
        const factor = gameMinutes / 60; // Convert to hours

        this.stats.hunger = Math.max(0, this.stats.hunger - decay.hunger * factor);
        this.stats.happiness = Math.max(0, this.stats.happiness - decay.happiness * factor);
        this.stats.energy = Math.max(0, this.stats.energy - decay.energy * factor);
        this.stats.cleanliness = Math.max(0, this.stats.cleanliness - decay.cleanliness * factor);
        this.stats.sleep = Math.max(0, this.stats.sleep - decay.sleep * factor);

        // Health decays if other stats are low
        if (this.stats.hunger < 20 || this.stats.happiness < 20 || this.stats.cleanliness < 20) {
            this.stats.health = Math.max(0, this.stats.health - decay.health * factor * 2);
        }

        // Age the pet
        this.age += gameMinutes / 1440; // Convert minutes to days
        this.#updateGrowthStage();
        this.#updateMood();
        this.#checkStatusEffects();
    }

    /**
     * Feed the pet
     * @param {string} foodId - Food item ID
     * @returns {Object} Result of feeding
     */
    feed(foodId) {
        const food = Registry.getInstance().get('foods', foodId);
        if (!food) return { success: false, message: 'Unknown food' };

        this.stats.hunger = Math.min(100, this.stats.hunger + (food.hunger || 0));
        this.stats.happiness = Math.min(100, this.stats.happiness + (food.happiness || 0));
        this.stats.energy = Math.min(100, this.stats.energy + (food.energy || 0));
        this.stats.health = Math.min(100, this.stats.health + (food.health || 0));
        this.stats.cleanliness = Math.min(100, this.stats.cleanliness + (food.cleanliness || 0));
        this.stats.strength = Math.min(100, this.stats.strength + (food.strength || 0));
        this.stats.intelligence = Math.min(100, this.stats.intelligence + (food.intelligence || 0));

        this.addXP(5);
        this.affection += 1;

        // Favorite food bonus
        if (foodId === this.config.favoriteFood) {
            this.stats.happiness = Math.min(100, this.stats.happiness + 10);
            this.addXP(10);
            this.affection += 2;
        }

        this.#updateMood();
        return { success: true, message: `${this.name} ate ${food.name}!` };
    }

    /**
     * Play with the pet
     * @param {string} [toyId] - Optional toy to use
     * @returns {Object} Result
     */
    play(toyId) {
        if (this.stats.energy < 10) {
            return { success: false, message: `${this.name} is too tired to play!` };
        }

        let happinessGain = 20;
        let energyLoss = 10;

        if (toyId) {
            const toy = Registry.getInstance().get('toys', toyId);
            if (toy) {
                happinessGain += toy.happiness || 0;
                energyLoss += toy.energy || 0;
                this.stats.intelligence = Math.min(100, this.stats.intelligence + (toy.intelligence || 0));
                this.stats.strength = Math.min(100, this.stats.strength + (toy.strength || 0));
            }
        }

        this.stats.happiness = Math.min(100, this.stats.happiness + happinessGain);
        this.stats.energy = Math.max(0, this.stats.energy - energyLoss);
        this.addXP(8);
        this.affection += 2;

        this.#updateMood();
        return { success: true, message: `${this.name} had fun playing!` };
    }

    /**
     * Put pet to sleep
     * @returns {Object} Result
     */
    sleep() {
        this.isSleeping = true;
        return { success: true, message: `${this.name} is now sleeping.` };
    }

    /**
     * Wake pet up
     * @returns {Object} Result
     */
    wakeUp() {
        this.isSleeping = false;
        this.stats.sleep = Math.min(100, this.stats.sleep + 30);
        this.stats.energy = Math.min(100, this.stats.energy + 20);
        return { success: true, message: `${this.name} woke up!` };
    }

    /**
     * Bathe the pet
     * @returns {Object} Result
     */
    bathe() {
        this.stats.cleanliness = 100;
        this.stats.happiness = Math.min(100, this.stats.happiness + 5);
        this.stats.energy = Math.max(0, this.stats.energy - 5);
        this.isDirty = false;
        this.addXP(5);
        return { success: true, message: `${this.name} is clean!` };
    }

    /**
     * Heal the pet
     * @param {string} [medicineId] - Optional medicine
     * @returns {Object} Result
     */
    heal(medicineId) {
        const healAmount = medicineId ? 50 : 20;
        this.stats.health = Math.min(100, this.stats.health + healAmount);
        this.isSick = false;
        this.addXP(10);
        return { success: true, message: `${this.name} feels better!` };
    }

    /**
     * Train the pet
     * @returns {Object} Result
     */
    train() {
        if (this.stats.energy < 20) {
            return { success: false, message: `${this.name} is too tired to train!` };
        }
        this.stats.strength = Math.min(100, this.stats.strength + 5);
        this.stats.energy = Math.max(0, this.stats.energy - 20);
        this.stats.happiness = Math.max(0, this.stats.happiness - 5);
        this.addXP(15);
        this.affection += 1;
        return { success: true, message: `${this.name} got stronger!` };
    }

    /**
     * Study with the pet
     * @returns {Object} Result
     */
    study() {
        if (this.stats.energy < 15) {
            return { success: false, message: `${this.name} is too tired to study!` };
        }
        this.stats.intelligence = Math.min(100, this.stats.intelligence + 5);
        this.stats.energy = Math.max(0, this.stats.energy - 15);
        this.stats.happiness = Math.max(0, this.stats.happiness - 3);
        this.addXP(15);
        this.affection += 1;
        return { success: true, message: `${this.name} learned something new!` };
    }

    /**
     * Add XP to pet
     * @param {number} amount
     */
    addXP(amount) {
        this.xp += amount;
        while (this.xp >= this.xpToNext) {
            this.xp -= this.xpToNext;
            this.level++;
            this.xpToNext = Math.floor(this.xpToNext * 1.4);
            this.#checkAbilityUnlocks();
            EventBus.getInstance().emit('pet:levelUp', { petId: this.id, level: this.level });
        }
    }

    /**
     * Get current mood based on stats
     * @returns {string}
     */
    getMood() {
        return this.mood;
    }

    /**
     * Get mood emoji
     * @returns {string}
     */
    getMoodEmoji() {
        const moodEmojis = {
            happy: '😊', excited: '🤩', hungry: '😋', sad: '😢',
            angry: '😠', dirty: '😰', sick: '🤒', sleeping: '😴',
            playing: '🎮', dancing: '💃', crying: '😭', tired: '😩',
            relaxed: '😌'
        };
        return moodEmojis[this.mood] || '😊';
    }

    /**
     * Get growth stage name
     * @returns {string}
     */
    getGrowthName() {
        const stage = this.config.growth[this.growthStage];
        return stage ? stage.name : this.growthStage;
    }

    /**
     * Get growth stage emoji
     * @returns {string}
     */
    getGrowthEmoji() {
        const stage = this.config.growth[this.growthStage];
        return stage ? stage.emoji : this.config.emoji;
    }

    /**
     * Serialize pet for saving
     * @returns {Object}
     */
    serialize() {
        return {
            id: this.id, species: this.species, name: this.name,
            hatched: this.hatched, hatchTime: this.hatchTime, birthTime: this.birthTime,
            stats: { ...this.stats }, age: this.age, growthStage: this.growthStage,
            personality: [...this.personality], mood: this.mood,
            xp: this.xp, level: this.level, xpToNext: this.xpToNext,
            isSleeping: this.isSleeping, isSick: this.isSick, isDirty: this.isDirty,
            equipped: { ...this.equipped }, unlockedAbilities: [...this.unlockedAbilities],
            affection: this.affection, evolutionPath: this.evolutionPath
        };
    }

    /**
     * Update growth stage based on age
     * @private
     */
    #updateGrowthStage() {
        const growth = this.config.growth;
        const stages = ['elder', 'adult', 'teen', 'child', 'baby'];
        
        for (const stage of stages) {
            if (growth[stage] && this.age >= growth[stage].days) {
                if (this.growthStage !== stage) {
                    const oldStage = this.growthStage;
                    this.growthStage = stage;
                    EventBus.getInstance().emit('pet:evolved', {
                        petId: this.id,
                        fromStage: oldStage,
                        toStage: stage
                    });
                }
                break;
            }
        }
    }

    /**
     * Update mood based on current stats
     * @private
     */
    #updateMood() {
        if (this.isSleeping) {
            this.mood = 'sleeping';
            return;
        }
        if (this.isSick) {
            this.mood = 'sick';
            return;
        }
        if (this.stats.health < 20) {
            this.mood = 'sick';
            return;
        }
        if (this.stats.hunger < 20) {
            this.mood = 'hungry';
            return;
        }
        if (this.stats.cleanliness < 20) {
            this.mood = 'dirty';
            return;
        }
        if (this.stats.energy < 20) {
            this.mood = 'tired';
            return;
        }
        if (this.stats.sleep < 20) {
            this.mood = 'tired';
            return;
        }
        if (this.stats.happiness > 80 && this.stats.energy > 60) {
            this.mood = 'excited';
            return;
        }
        if (this.stats.happiness > 60) {
            this.mood = 'happy';
            return;
        }
        if (this.stats.happiness > 30) {
            this.mood = 'relaxed';
            return;
        }
        this.mood = 'sad';
    }

    /**
     * Check for status effects
     * @private
     */
    #checkStatusEffects() {
        if (this.stats.health < 30) {
            this.isSick = true;
        } else if (this.stats.health > 60) {
            this.isSick = false;
        }
        if (this.stats.cleanliness < 20) {
            this.isDirty = true;
        } else if (this.stats.cleanliness > 50) {
            this.isDirty = false;
        }
    }

    /**
     * Check and unlock abilities
     * @private
     */
    #checkAbilityUnlocks() {
        for (const ability of this.config.abilities) {
            if (this.level >= ability.unlockLevel && !this.unlockedAbilities.includes(ability.name)) {
                this.unlockedAbilities.push(ability.name);
                EventBus.getInstance().emit('pet:abilityUnlocked', {
                    petId: this.id,
                    ability: ability.name,
                    description: ability.description
                });
            }
        }
    }
}

export default Pet;