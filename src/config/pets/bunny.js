export default {
    id: 'bunny',
    name: 'Bunny',
    description: 'A soft and gentle hoppy friend',
    rarity: 'common',
    emoji: '🐰',
    unlockLevel: 2,
    baseStats: {
        maxHealth: 80, maxHunger: 80, maxHappiness: 120, maxEnergy: 100,
        maxCleanliness: 100, maxSleep: 100, maxIntelligence: 90, maxStrength: 60
    },
    decayRates: {
        health: 0.1, hunger: 0.7, happiness: 0.4, energy: 0.4,
        cleanliness: 0.5, sleep: 0.5, intelligence: 0.06, strength: 0.08
    },
    growth: {
        baby: { days: 0, name: 'Kit', emoji: '🐰' },
        child: { days: 2, name: 'Young Bunny', emoji: '🐰' },
        teen: { days: 5, name: 'Teen Bunny', emoji: '🐰' },
        adult: { days: 10, name: 'Adult Bunny', emoji: '🐰' },
        elder: { days: 25, name: 'Elder Bunny', emoji: '🐰' }
    },
    personality: { baseTraits: ['friendly', 'playful'], possibleTraits: ['curious', 'lazy', 'loyal', 'smart', 'energetic'] },
    favoriteFood: 'carrot',
    favoriteToy: 'ball',
    abilities: [
        { name: 'Hop', unlockLevel: 3, description: 'Jump higher in mini-games' },
        { name: 'Fluffy Coat', unlockLevel: 8, description: 'Resists cold environments' },
        { name: 'Binky', unlockLevel: 15, description: 'Dance to boost happiness' }
    ],
    sounds: { happy: 'squeak', hungry: 'squeak-hungry', sad: 'whimper', sleeping: 'purr' },
    animations: { idle: 'bunny-idle', walk: 'bunny-hop', run: 'bunny-run', sleep: 'bunny-sleep', eat: 'bunny-eat', play: 'bunny-play', dance: 'bunny-dance' }
};