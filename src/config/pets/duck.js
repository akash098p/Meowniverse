export default {
    id: 'duck',
    name: 'Duck',
    description: 'A quacky little waterfowl',
    rarity: 'common',
    emoji: '🦆',
    unlockLevel: 3,
    baseStats: {
        maxHealth: 80, maxHunger: 90, maxHappiness: 110, maxEnergy: 90,
        maxCleanliness: 70, maxSleep: 90, maxIntelligence: 80, maxStrength: 70
    },
    decayRates: {
        health: 0.1, hunger: 0.8, happiness: 0.5, energy: 0.4,
        cleanliness: 0.7, sleep: 0.5, intelligence: 0.06, strength: 0.07
    },
    growth: {
        baby: { days: 0, name: 'Duckling', emoji: '🦆' },
        child: { days: 2, name: 'Young Duck', emoji: '🦆' },
        teen: { days: 6, name: 'Teen Duck', emoji: '🦆' },
        adult: { days: 12, name: 'Adult Duck', emoji: '🦆' },
        elder: { days: 28, name: 'Elder Duck', emoji: '🦆' }
    },
    personality: { baseTraits: ['funny', 'playful'], possibleTraits: ['curious', 'lazy', 'friendly', 'smart', 'energetic'] },
    favoriteFood: 'bread',
    favoriteToy: 'rubber-duck',
    abilities: [
        { name: 'Swimming', unlockLevel: 4, description: 'Swim in water environments' },
        { name: 'Quack Attack', unlockLevel: 11, description: 'Distract enemies in games' },
        { name: 'Feather Shield', unlockLevel: 18, description: 'Waterproof protection' }
    ],
    sounds: { happy: 'quack', hungry: 'quack-hungry', sad: 'quack-sad', sleeping: 'quack-sleep' },
    animations: { idle: 'duck-idle', walk: 'duck-waddle', run: 'duck-run', sleep: 'duck-sleep', eat: 'duck-eat', play: 'duck-play', dance: 'duck-dance' }
};