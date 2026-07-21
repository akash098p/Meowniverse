# Meowniverse 🐱
<div align="center">
    <img width="480" height="160" alt="twitter-gif-2078931665972252699_6a5df8190767d" src="https://github.com/user-attachments/assets/a87712ae-4055-446e-96b5-7630458698b6" />
</div>

A **production-ready browser-based Virtual Pet Game** built with **HTML5, CSS3, and modern JavaScript (ES2023 Modules)**. Runs entirely in the browser without requiring a backend.

## 🎮 Features

### Core Systems
- **Game Engine** with fixed-timestep game loop
- **Event Bus** for decoupled communication
- **State Manager** with reactive updates
- **Time System** with day/night cycle
- **Save Manager** with LocalStorage + IndexedDB
- **Content Registry** for data-driven architecture
- **Auto-Save** and offline progress calculation

### Pets
- **7 Species**: Cat, Dog, Bunny, Penguin, Duck, Dragon, Fox
- **Growth Stages**: Baby → Child → Teen → Adult → Elder
- **Dynamic Stats**: Health, Hunger, Happiness, Energy, Cleanliness, Sleep, Intelligence, Strength
- **Mood System**: 13 moods calculated from stats
- **Personality System**: Traits influenced by player behavior
- **Evolution System**: Care quality affects growth
- **Abilities**: Unique abilities unlock at higher levels

### Gameplay
- **Actions**: Feed, Play, Sleep, Bath, Heal, Train, Study
- **Shop**: Food, Toys, Furniture, Decorations, Accessories, Themes
- **Inventory**: Manage collected items
- **Currency**: Coins (earnable) and Diamonds (premium)
- **XP & Leveling**: Player and pet progression
- **Mini-Games**: Memory, Snake, Flappy, Catch, Reaction, RPS, 2048, Treasure Hunt
- **Daily Quests**: Rotating objectives with rewards
- **Achievements**: 8+ achievements to unlock
- **10 Environments**: Bedroom, Kitchen, Bathroom, Garden, Park, Beach, Forest, Winter, Rain, Space

### Technical
- **PWA-ready** with service worker and manifest
- **Offline capable** with caching
- **Responsive mobile-first design**
- **7 Themes**: Light, Dark, Pixel, Nature, Cyberpunk, Halloween, Christmas
- **Modular architecture** with ES Modules
- **Data-driven design** - add content via config files
- **No framework dependencies**

## 🚀 Quick Start

### Option 1: Open directly
Open `index.html` in any modern browser.

### Option 2: Local server (recommended)
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

Then visit `http://localhost:8000`

### Option 3: GitHub Pages
Push to a GitHub repository and enable GitHub Pages in the repository settings.

## 📁 Project Structure

```
meowniverse/
├── index.html              # Entry point
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── README.md               # This file
├── assets/
│   ├── audio/              # Sound effects and music
│   ├── images/             # Icons and sprites
│   └── fonts/              # Custom fonts
├── src/
│   ├── main.js             # Application bootstrap
│   ├── core/               # Engine systems
│   │   ├── EventBus.js     # Pub/sub event system
│   │   ├── StateManager.js # Reactive state management
│   │   ├── GameLoop.js     # Fixed-timestep loop
│   │   ├── TimeSystem.js   # In-game time
│   │   ├── SaveManager.js  # Save/load with LocalStorage + IndexedDB
│   │   ├── Registry.js     # Content registry
│   │   ├── GameEngine.js   # Main engine orchestrator
│   │   └── ContentLoader.js# Dynamic content loading
│   ├── pets/
│   │   └── Pet.js          # Pet entity class
│   ├── gameplay/           # Gameplay systems (future)
│   ├── ui/
│   │   ├── UIManager.js    # Main UI controller
│   │   ├── components/     # UI components (future)
│   │   └── screens/        # Screen controllers (future)
│   ├── utils/              # Utility functions (future)
│   └── config/             # Game content configurations
│       ├── pets/           # Pet species configs
│       ├── items/          # Food, toy configs
│       ├── themes/         # Theme configs
│       ├── environments/   # Environment configs
│       ├── mini-games/     # Mini-game configs (future)
│       ├── quests/         # Quest configs (future)
│       └── achievements/   # Achievement configs (future)
└── styles/
    ├── main.css            # Main stylesheet
    ├── components/         # Component styles
    └── themes/             # Theme stylesheets
```

## 🧩 Adding New Content

The game uses a **data-driven architecture**. Adding new content requires **no gameplay code changes**.

### Adding a New Pet
1. Create `src/config/pets/yourpet.js`
2. Add the import to `src/core/ContentLoader.js`
3. Register it in the `#loadPetConfigs` method

Example pet config:
```javascript
export default {
    id: 'yourpet',
    name: 'Your Pet',
    description: 'Description here',
    rarity: 'common',
    emoji: '🐾',
    unlockLevel: 1,
    baseStats: { /* ... */ },
    decayRates: { /* ... */ },
    growth: { /* ... */ },
    personality: { /* ... */ },
    favoriteFood: 'foodId',
    favoriteToy: 'toyId',
    abilities: [ /* ... */ ],
    sounds: { /* ... */ },
    animations: { /* ... */ }
};
```

### Adding New Items
Add entries to the existing config files in `src/config/items/`.

### Adding New Themes
Add entries to `src/config/themes/themes.js`.

### Adding New Environments
Add entries to `src/config/environments/environments.js`.

## 🎯 Mini-Games

The mini-game framework supports these games:
- **Memory Match** - Match pairs of cards
- **Snake** - Classic snake game
- **Flappy Pet** - Flappy bird style
- **Catch Food** - Catch falling items
- **Reaction Test** - Test your reflexes
- **Rock Paper Scissors** - Classic RPS
- **2048** - Merge tiles
- **Treasure Hunt** - Find hidden treasure

Each game rewards Coins, XP, and Happiness.

## 🌐 Browser Support

- Chrome 80+
- Firefox 80+
- Safari 14+
- Edge 80+
- Opera 67+

## 🔧 Development

### Prerequisites
- Modern web browser
- Text editor (VS Code recommended)
- Local HTTP server for development

### Architecture Principles
- **SOLID** principles where applicable
- **Event-driven** communication via EventBus
- **Data-driven** content via Registry
- **Modular** ES Module structure
- **Singleton** pattern for core systems
- **Reactive** state management

### Key Design Decisions
- **No framework** - Vanilla JS for maximum control and minimal dependencies
- **ES Modules** - Native module system for clean imports
- **CSS Custom Properties** - Dynamic theming without preprocessors
- **LocalStorage + IndexedDB** - Dual storage for reliability
- **Emoji-based graphics** - No heavy asset loading required

## 📄 License

MIT License - feel free to use, modify, and distribute.

## 🙏 Acknowledgments

- Built with ❤️ for pet lovers everywhere
- Inspired by classic virtual pet games like Tamagotchi, Nintendogs, and Pou
