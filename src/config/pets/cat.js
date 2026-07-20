/**
 * Cat pet configuration
 * @module config/pets/cat
 */
export default {
    id: 'cat',
    name: 'Cat',
    description: 'A curious and independent feline friend',
    rarity: 'common',
    emoji: '🐱',
    unlockLevel: 1,
    baseStats: {
        maxHealth: 100,
        maxHunger: 100,
        maxHappiness: 100,
        maxEnergy: 100,
        maxCleanliness: 100,
        maxSleep: 100,
        maxIntelligence: 100,
        maxStrength: 100
    },
    decayRates: {
        health: 0.1,
        hunger: 0.8,
        happiness: 0.5,
        energy: 0.3,
        cleanliness: 0.4,
        sleep: 0.6,
        intelligence: 0.05,
        strength: 0.05
    },
    growth: {
        baby: { days: 0, name: 'Kitten', emoji: '🐱' },
        child: { days: 3, name: 'Young Cat', emoji: '🐱' },
        teen: { days: 7, name: 'Teen Cat', emoji: '🐱' },
        adult: { days: 14, name: 'Adult Cat', emoji: '🐱' },
        elder: { days: 30, name: 'Elder Cat', emoji: '🐱' }
    },
    personality: {
        baseTraits: ['curious', 'independent'],
        possibleTraits: ['playful', 'lazy', 'loyal', 'smart', 'energetic']
    },
    favoriteFood: 'fish',
    favoriteToy: 'yarn',
    abilities: [
        { name: 'Night Vision', unlockLevel: 5, description: 'Sees better at night' },
        { name: 'Purr Healing', unlockLevel: 10, description: 'Heals faster when happy' },
        { name: 'Nine Lives', unlockLevel: 20, description: 'Survive fatal damage once per day' }
    ],
    sounds: {
        happy: 'meow-happy',
        hungry: 'meow-hungry',
        sad: 'meow-sad',
        sleeping: 'purr'
    },
    animations: {
        idle: 'cat-idle',
        walk: 'cat-walk',
        run: 'cat-run',
        sleep: 'cat-sleep',
        eat: 'cat-eat',
        play: 'cat-play',
        dance: 'cat-dance'
    }
};