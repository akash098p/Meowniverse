export default {
    id: 'penguin',
    name: 'Penguin',
    description: 'A chilly waddler who loves the cold',
    rarity: 'uncommon',
    emoji: '🐧',
    unlockLevel: 5,
    baseStats: {
        maxHealth: 90, maxHunger: 100, maxHappiness: 100, maxEnergy: 90,
        maxCleanliness: 100, maxSleep: 100, maxIntelligence: 100, maxStrength: 80
    },
    decayRates: {
        health: 0.1, hunger: 0.9, happiness: 0.5, energy: 0.3,
        cleanliness: 0.3, sleep: 0.5, intelligence: 0.07, strength: 0.06
    },
    growth: {
        baby: { days: 0, name: 'Chick', emoji: '🐧' },
        child: { days: 3, name: 'Young Penguin', emoji: '🐧' },
        teen: { days: 8, name: 'Teen Penguin', emoji: '🐧' },
        adult: { days: 15, name: 'Adult Penguin', emoji: '🐧' },
        elder: { days: 35, name: 'Elder Penguin', emoji: '🐧' }
    },
    personality: { baseTraits: ['funny', 'loyal'], possibleTraits: ['brave', 'smart', 'playful', 'curious', 'energetic'] },
    favoriteFood: 'fish',
    favoriteToy: 'ice-block',
    abilities: [
        { name: 'Ice Slide', unlockLevel: 5, description: 'Move faster in winter' },
        { name: 'Diving', unlockLevel: 12, description: 'Explore underwater areas' },
        { name: 'Blizzard Resistance', unlockLevel: 22, description: 'Immune to cold weather' }
    ],
    sounds: { happy: 'squawk', hungry: 'squawk-hungry', sad: 'squawk-sad', sleeping: 'chirp' },
    animations: { idle: 'penguin-idle', walk: 'penguin-waddle', run: 'penguin-slide', sleep: 'penguin-sleep', eat: 'penguin-eat', play: 'penguin-play', dance: 'penguin-dance' }
};