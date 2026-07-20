export default {
    id: 'dog',
    name: 'Dog',
    description: 'A loyal and energetic canine companion',
    rarity: 'common',
    emoji: '🐶',
    unlockLevel: 1,
    baseStats: {
        maxHealth: 120, maxHunger: 120, maxHappiness: 100, maxEnergy: 120,
        maxCleanliness: 80, maxSleep: 80, maxIntelligence: 80, maxStrength: 100
    },
    decayRates: {
        health: 0.15, hunger: 1.0, happiness: 0.6, energy: 0.5,
        cleanliness: 0.6, sleep: 0.7, intelligence: 0.05, strength: 0.03
    },
    growth: {
        baby: { days: 0, name: 'Puppy', emoji: '🐶' },
        child: { days: 3, name: 'Young Dog', emoji: '🐶' },
        teen: { days: 7, name: 'Teen Dog', emoji: '🐶' },
        adult: { days: 14, name: 'Adult Dog', emoji: '🐶' },
        elder: { days: 30, name: 'Elder Dog', emoji: '🐶' }
    },
    personality: { baseTraits: ['loyal', 'energetic'], possibleTraits: ['brave', 'playful', 'friendly', 'smart', 'lazy'] },
    favoriteFood: 'bone',
    favoriteToy: 'ball',
    abilities: [
        { name: 'Loyal Guard', unlockLevel: 5, description: 'Protects other pets' },
        { name: 'Fetch Master', unlockLevel: 10, description: 'Earns more from mini-games' },
        { name: 'Howl', unlockLevel: 20, description: 'Boosts mood of all pets' }
    ],
    sounds: { happy: 'bark-happy', hungry: 'bark-hungry', sad: 'whine', sleeping: 'snore' },
    animations: { idle: 'dog-idle', walk: 'dog-walk', run: 'dog-run', sleep: 'dog-sleep', eat: 'dog-eat', play: 'dog-play', dance: 'dog-dance' }
};