/**
 * Meowl pet configuration - A mystical owl-cat hybrid
 * @module config/pets/meowl
 */
export default {
    id: 'meowl',
    name: 'Meowl',
    description: 'A mystical owl-cat hybrid with luminous eyes and feathered wings',
    rarity: 'legendary',
    emoji: '🦉',
    unlockLevel: 1,
    baseStats: {
        maxHealth: 120,
        maxHunger: 100,
        maxHappiness: 100,
        maxEnergy: 100,
        maxCleanliness: 100,
        maxSleep: 100,
        maxIntelligence: 150,
        maxStrength: 80
    },
    decayRates: {
        health: 0.08,
        hunger: 0.6,
        happiness: 0.4,
        energy: 0.25,
        cleanliness: 0.3,
        sleep: 0.5,
        intelligence: 0.03,
        strength: 0.04
    },
    growth: {
        baby: { days: 0, name: 'Meowlet', emoji: '🦉' },
        child: { days: 3, name: 'Young Meowl', emoji: '🦉' },
        teen: { days: 7, name: 'Teen Meowl', emoji: '🦉' },
        adult: { days: 14, name: 'Adult Meowl', emoji: '🦉' },
        elder: { days: 30, name: 'Elder Meowl', emoji: '🦉' }
    },
    personality: {
        baseTraits: ['wise', 'mysterious'],
        possibleTraits: ['playful', 'loyal', 'smart', 'energetic', 'calm']
    },
    favoriteFood: 'fish',
    favoriteToy: 'yarn',
    abilities: [
        { name: 'Night Vision', unlockLevel: 3, description: 'Sees perfectly in darkness' },
        { name: 'Silent Flight', unlockLevel: 7, description: 'Moves without making a sound' },
        { name: 'Wisdom Glow', unlockLevel: 12, description: 'Glows when using intelligence' },
        { name: 'Lunar Blessing', unlockLevel: 20, description: 'Heals faster under moonlight' }
    ],
    sounds: {
        happy: 'meowl-happy',
        hungry: 'meowl-hungry',
        sad: 'meowl-sad',
        sleeping: 'meowl-purr'
    },
    animations: {
        idle: 'meowl-idle',
        walk: 'meowl-walk',
        run: 'meowl-run',
        sleep: 'meowl-sleep',
        eat: 'meowl-eat',
        play: 'meowl-play',
        fly: 'meowl-fly'
    }
};