export default {
    id: 'dragon',
    name: 'Dragon',
    description: 'A mythical scaled creature of legend',
    rarity: 'rare',
    emoji: '🐉',
    unlockLevel: 15,
    baseStats: {
        maxHealth: 150, maxHunger: 130, maxHappiness: 80, maxEnergy: 130,
        maxCleanliness: 60, maxSleep: 80, maxIntelligence: 120, maxStrength: 150
    },
    decayRates: {
        health: 0.05, hunger: 1.2, happiness: 0.7, energy: 0.4,
        cleanliness: 0.8, sleep: 0.6, intelligence: 0.04, strength: 0.02
    },
    growth: {
        baby: { days: 0, name: 'Hatchling', emoji: '🐉' },
        child: { days: 5, name: 'Young Dragon', emoji: '🐉' },
        teen: { days: 12, name: 'Teen Dragon', emoji: '🐉' },
        adult: { days: 25, name: 'Adult Dragon', emoji: '🐉' },
        elder: { days: 50, name: 'Elder Dragon', emoji: '🐉' }
    },
    personality: { baseTraits: ['brave', 'independent'], possibleTraits: ['smart', 'loyal', 'playful', 'curious', 'lazy'] },
    favoriteFood: 'steak',
    favoriteToy: 'gem',
    abilities: [
        { name: 'Fire Breath', unlockLevel: 15, description: 'Cook food instantly' },
        { name: 'Flight', unlockLevel: 20, description: 'Access sky environments' },
        { name: 'Dragon Roar', unlockLevel: 30, description: 'Scare away negative effects' }
    ],
    sounds: { happy: 'roar', hungry: 'growl', sad: 'whimper', sleeping: 'purr-deep' },
    animations: { idle: 'dragon-idle', walk: 'dragon-stomp', run: 'dragon-run', sleep: 'dragon-sleep', eat: 'dragon-eat', play: 'dragon-play', dance: 'dragon-dance' }
};