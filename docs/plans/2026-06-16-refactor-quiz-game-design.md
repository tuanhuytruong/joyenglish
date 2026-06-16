# Quiz Game Refactoring Design

**Goal:** Refactor the massive monolithic `quiz_game.html` file into a modular, maintainable structure using Vanilla HTML/CSS/JS and Native ES Modules. No build steps or bundlers are required, allowing it to be easily deployed on GitHub Pages.

## Architecture & Technology
- **Vanilla Web Technologies:** Standard HTML5, CSS3, and modern JavaScript (ES6+).
- **Native ES Modules:** Use `<script type="module" src="js/main.js"></script>` to orchestrate the JavaScript, completely avoiding global namespace pollution and making dependencies explicit.
- **Static Hosting:** The files can be served directly over any HTTP server, making it fully compatible with GitHub Pages.

## Component Split

### 1. Structure & Styling
- **`quiz_game.html`**: The main HTML shell. The inline `<style>` tag will be removed, and the logic in the `<script>` tag will be extracted. It will contain `<link rel="stylesheet" href="css/styles.css">` and `<script type="module" src="js/main.js"></script>`.
- **`css/styles.css`**: All CSS rules extracted from `quiz_game.html` (including animations, z-index configurations, and skill effects).

### 2. JavaScript Modules (`js/`)
- **`js/main.js`**: The entry point. Imports other modules, binds the initial global event listeners (or UI hooks), and initializes the game state when the DOM is loaded.
- **`js/state.js`**: Centralized game state management. Holds `GameplayManager.state`, player HP, mana, shields, timers, and current quiz logic.
- **`js/audio.js`**: Sound effects logic. Manages `audioCtx`, MP3 file loading, `playSound()`, and volume constants (`EXTERNAL_AUDIO_VOLUMES`).
- **`js/effects.js`**: Visual feedback animations. Contains `spawnFloatingText`, `fireConfetti`, `playWeaponBarrage`, and `takeDamage` animation effects.
- **`js/skills.js`**: The core logic for skills (Kamehameha, Shields, Heals, Mega Fireball, Freeze). Imports necessary functions from `effects.js` and `audio.js` to execute.
- **`js/ui.js`**: DOM manipulation. Handles updating health/mana bars, rendering the leaderboard, toggling modals (settings, endgame, VS screen), and applying DOM states.
- **`js/settings.js`**: LocalStorage integration. Manages saving/loading configurations, game data, and keyboard mappings.

## Data Flow
- `main.js` kicks off the process.
- UI elements (buttons) trigger events handled by `main.js` or `ui.js`, which then modify the data in `state.js` and trigger corresponding visual/audio cues through `skills.js`, `effects.js`, and `audio.js`.
- Updates to the state trigger `ui.js` to refresh the visual representation on the screen.

## Error Handling & Testing
- Use standard `console.error` and try/catch around LocalStorage access to ensure failing to read settings does not crash the game.
- Modules must be tested using a local HTTP server (`Live Server` in VSCode) because `file:///` protocol blocks ES modules due to CORS.
