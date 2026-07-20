export default {
    id: 'fox',
    name: 'Fox',
    description: 'A clever and swift forest trickster',
    rarity: 'uncommon',
    emoji: '🦊',
    unlockLevel: 7,
    baseStats: {
        maxHealth: 90, maxHunger: 90, maxHappiness: 100, maxEnergy: 110,
        maxCleanliness: 90, maxSleep: 90, maxIntelligence: 110, maxStrength: 80
    },
    decayRates: {
        health: 0.1, hunger: 0.8, happiness: 0.5, energy: 0.4,
        cleanliness: 0.5, sleep: 0.5, intelligence: 0.04, strength: 0.06
    },
    growth: {
        baby: { days: 0, name: 'Kit', emoji: '🦊' },
        child: { days: 3, name: 'Young Fox', emoji: '🦊' },
        teen: { days: 8, name: 'Teen Fox', emoji: '🦊' },
        adult: { days: 16, name: 'Adult Fox', emoji: '🦊' },
        elder: { days: 35, name: 'Elder Fox', emoji: '🦊' }
    },
    personality: { baseTraits: ['smart', 'curious'], possibleTraits: ['playful', 'independent', 'loyal', 'brave', 'funny'] },
    favoriteFood: 'berry',
    favoriteToy: 'puzzle-box',
    abilities: [
        { name: 'Quick Reflexes', unlockLevel: 7, description: 'Better reaction in games' },
        { name: 'Forest Lore', unlockLevel: 14, description: 'Find rare items in forests' },
        { name: 'Trickster', unlockLevel: 21, description: 'Double rewards from quests' }
    ],
    sounds: { happy: 'yip', hungry: 'yip-hungry', sad: 'whine', sleeping: 'purr' },
    animations: { idle: 'fox-idle', walk: 'fox-trot', run: 'fox-sprint', sleep: 'fox-sleep', eat: 'fox-eat', play: 'fox-play', dance: 'fox-dance' }
};