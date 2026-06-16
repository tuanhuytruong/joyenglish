# Refactor Quiz Game Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Refactor `quiz_game.html` into a modular Vanilla HTML/CSS/JS application using Native ES Modules.

**Architecture:** We will split the monolithic file into `css/styles.css` and multiple JS modules in a `js/` directory (`audio.js`, `effects.js`, `settings.js`, `ui.js`, `skills.js`, `state.js`, and `main.js`). The HTML file will be updated to link these files natively.

**Tech Stack:** Vanilla HTML/CSS/JS (ES Modules).

---

### Task 1: Create Folder Structure and Extract CSS

**Files:**
- Create: `css/styles.css`
- Modify: `quiz_game.html`

**Step 1: Extract CSS to styles.css**
Create `css/styles.css` and move all the content inside the `<style>` tag in `quiz_game.html` (lines ~22 to ~159) to this new file. 

**Step 2: Update HTML to link CSS**
In `quiz_game.html`, replace the inline `<style>` block with `<link rel="stylesheet" href="css/styles.css">`.

**Step 3: Commit**
```bash
git add css/styles.css quiz_game.html
git commit -m "refactor: extract inline CSS to css/styles.css"
```

### Task 2: Create JavaScript Modules and Extract Audio/Effects

**Files:**
- Create: `js/audio.js`
- Create: `js/effects.js`

**Step 1: Extract Audio Logic**
Create `js/audio.js`. Move the audio constants (`EXTERNAL_AUDIO_VOLUMES`), audio instances (`realKameAudio`, `welcomeAudio`, etc.), `audioCtx`, and the `playSound` function from `quiz_game.html` to `js/audio.js`. Add `export` keywords to functions and variables that need to be accessed externally (e.g., `export function playSound(effectType)`).

**Step 2: Extract Effects Logic**
Create `js/effects.js`. Move `WEAPON_ASSETS`, `spawnFloatingText`, `fireConfetti`, `playWeaponBarrage`, `createDeflectedProjectile`, and `takeDamage` to this file. Add `export` to these functions.

**Step 3: Commit**
```bash
git add js/audio.js js/effects.js quiz_game.html
git commit -m "refactor: extract audio and effects logic"
```

### Task 3: Extract Game State and UI Logic

**Files:**
- Create: `js/state.js`
- Create: `js/ui.js`

**Step 1: Extract State Management**
Create `js/state.js`. Move the `GameplayManager.state` initialization, along with player specific variables (`isP1Frozen`, `isP2Frozen`) to `js/state.js`. Export the state objects.

**Step 2: Extract UI Logic**
Create `js/ui.js`. Move functions responsible for DOM manipulation such as updating HP/Mana bars, rendering the leaderboard (`renderHallOfFame`, `saveMatchToHistory`), toggling modals (`triggerEndGame`), and applying DOM states. Add `export` keywords to the functions.

**Step 3: Commit**
```bash
git add js/state.js js/ui.js quiz_game.html
git commit -m "refactor: extract game state and ui logic"
```

### Task 4: Extract Settings and Skills Logic

**Files:**
- Create: `js/settings.js`
- Create: `js/skills.js`

**Step 1: Extract Settings Logic**
Create `js/settings.js`. Move `loadSettings` and `saveSettings` functions.

**Step 2: Extract Skills Logic**
Create `js/skills.js`. Move skill logic (Kamehameha, Shields, Heals, Mega Fireball, Freeze) and the `applyHealOverTime` function here.

**Step 3: Commit**
```bash
git add js/settings.js js/skills.js quiz_game.html
git commit -m "refactor: extract settings and skills logic"
```

### Task 5: Initialize main.js and Update HTML Script Tags

**Files:**
- Create: `js/main.js`
- Modify: `quiz_game.html`

**Step 1: Create Entry Point**
Create `js/main.js`. Add imports from all the newly created modules. Move the remaining initialization logic (e.g., event listeners, `DOMContentLoaded` callback) here. Expose global click handlers (`triggerClickAnswer`, `triggerClickSkill`) by attaching them to the `window` object since inline HTML click handlers (like `onclick="..."`) require them to be globally accessible.

**Step 2: Update HTML**
Remove the massive `<script>` block from `quiz_game.html`. Add `<script type="module" src="js/main.js"></script>` before the closing `</body>` tag.

**Step 3: Commit**
```bash
git add js/main.js quiz_game.html
git commit -m "refactor: create main.js entry point and update HTML"
```

### Task 6: Testing and Verification

**Step 1: Serve locally**
Since we are using ES modules, run a local development server (like python `http.server` or `live-server`).

**Step 2: Verify Game Initialization**
Open the game in the browser and verify the settings modal opens, the VS screen works, and audio loads without CORS errors.

**Step 3: Verify Game Loop**
Click answers and trigger skills. Verify that state updates, UI reflects the changes, animations trigger correctly, and no reference errors are thrown in the console.
