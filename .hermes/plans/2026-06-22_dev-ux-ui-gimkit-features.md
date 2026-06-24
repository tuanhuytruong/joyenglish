# Dev UX/UI + Gimkit-inspired Feature Enhancement Plan

> **For Hermes:** Implement this plan task-by-task on branch `dev`. Follow Huy's workflow: Plan → Kanban → Execute task-by-task → Verify → Report. Do not commit or push without explicit permission.

**Goal:** Improve JoyEnglish on the `dev` branch so teachers can set up games faster, students can understand/play more easily, and the gameplay has more Gimkit-like variety via modes, streaks, powerups, and reward loops.

**Architecture:** Keep the current static HTML/CSS/ES module app, but reduce inline complexity by adding small focused modules for game configuration, player feedback, economy/powerups, and presets. Make UX/UI changes incrementally in `index.html`, `css/styles.css`, and JS modules, verifying each slice locally with `python3 -m http.server 8888`.

**Tech Stack:** Static HTML, Tailwind CDN classes, vanilla JavaScript ES modules, browser `localStorage`, local Python HTTP server for verification.

---

## Current context

- Repo path: `/opt/data/workspace/joyenglish`
- Current branch: `dev` tracking `origin/dev`
- Current status observed: `?? .hermes/` because plan files exist locally.
- Main files:
  - `index.html`: large single-page UI, settings modal, answer cards, player panels, skill settings.
  - `js/main.js`: setup controls, grid handling, `GameplayManager`, quiz flow, keyboard handling.
  - `js/ui.js`: HP/mana/history/end-game UI.
  - `js/skills.js`: skill animations and basic skill hooks.
  - `js/state.js`: shared `gameState`.
  - `js/settings.js`: load/save `localStorage` settings.
  - `js/imageResolver.js`: image source resolution.
  - `css/styles.css`: currently duplicates some inline CSS from `index.html` but is not linked from `index.html` yet.
- Existing game features:
  - 2-player quiz battle.
  - Answer buttons with per-player hotkeys.
  - HP, mana, basic actions, ultimate queue.
  - Sequential/random quiz modes.
  - Wrong-answer retry pool.
  - Sudden death timer.
  - Skill settings table lists many skill concepts, but `GameplayManager.SKILL_POOL` currently only includes `meteor` and `kamehameha`.

## Product direction inspired by Gimkit

Use Gimkit ideas as inspiration, not a clone:

- Make every correct answer feel rewarding: points/cash/XP/streaks.
- Give students strategic choices: spend earned currency on upgrades or powerups.
- Offer classroom-friendly game modes: classic battle, boss raid, team race, survival/sudden-death variants.
- Make teacher setup faster: presets, clearer labels, sample data, validation, preview.
- Keep the game playable from one shared screen with keyboard/mouse.

## Proposed phased roadmap

### Phase 1 — UX/UI foundation: easier setup and clearer in-game feedback

**Outcome:** Teachers can configure and run a game with less confusion; students see what is happening immediately.

#### Task 1.1: Link and consolidate the stylesheet

**Objective:** Ensure `css/styles.css` is actually loaded and can host shared styles.

**Files:**
- Modify: `index.html`
- Modify: `css/styles.css`

**Steps:**
1. Add `<link rel="stylesheet" href="css/styles.css">` after the Google Fonts link in `index.html`.
2. Keep inline styles initially to avoid accidental visual regressions.
3. Move only safe reusable additions to `css/styles.css` first: helper classes for cards, badges, progress chips, toast/feedback overlays.
4. Verify no duplicate style conflicts break the screen.

**Verification:**
- Run: `python3 -m http.server 8888` from repo root.
- Open local page, confirm no console errors and original layout still renders.

#### Task 1.2: Add a compact in-game HUD guide

**Objective:** Make controls and game state obvious during play.

**Files:**
- Modify: `index.html`
- Modify: `css/styles.css`
- Modify: `js/ui.js`

**Steps:**
1. Add a top-center mini HUD inside `#game-aspect-wrapper` showing:
   - Current mode.
   - Question counter.
   - Timer.
   - Small labels: correct = +mana/+cash, wrong = stun.
2. Keep existing `quiz-counter` and `quiz-timer` IDs if present; if they are already rendered elsewhere, mirror/relocate carefully rather than creating duplicate IDs.
3. Add a lightweight `renderGameStatus(state)` or extend `updateUI(state)` in `js/ui.js`.
4. Add CSS classes for readable translucent panels.

**Verification:**
- Start a match.
- Answer correct/wrong.
- Confirm counter, mana, HP, timer stay readable and update.

#### Task 1.3: Improve answer-card clarity and feedback

**Objective:** Students instantly understand answer options, ownership keys, and correctness.

**Files:**
- Modify: `index.html`
- Modify: `css/styles.css`
- Modify: `js/main.js`

**Steps:**
1. Add consistent answer-card classes instead of relying only on long Tailwind strings.
2. Add clearer key badges: P1 key badge on top-left, P2 key badge on bottom-right, answer number badge top-center.
3. Add hover/active/focus styling that does not shift layout too much.
4. In `handlePlayerAnswer`, after correct/wrong, show short floating label near the selected card:
   - Correct: `+1 Mana`, `Streak +1`, maybe `+$10` after Phase 2.
   - Wrong: `Stunned`, `-1 Mana`.

**Verification:**
- Use mouse and keyboard for both players.
- Confirm overlays do not block future questions after transition.

#### Task 1.4: Add teacher-friendly setup summary and validation

**Objective:** Before pressing FIGHT, teacher can see if the game is ready.

**Files:**
- Modify: `index.html`
- Modify: `js/main.js`
- Optional create: `js/validation.js`

**Steps:**
1. Add a small setup status card in settings modal header or Data tab:
   - Active question count.
   - Column A/B display type.
   - Uploaded images count.
   - Warnings: fewer than 4 unique answers, empty active rows, image failures.
2. Add `getGridData()` helper if current grid collection is inline only.
3. Disable or warn on `LƯU & ĐÓNG` if there are zero active questions.
4. Use non-blocking warning UI instead of only `alert()` where possible.

**Verification:**
- Empty grid → warning.
- 1 row only → warning about limited distractors.
- 4+ valid rows → ready state.

---

### Phase 2 — Gimkit-like reward loop: streaks, cash, upgrades

**Outcome:** Correct answers create momentum and choices, making gameplay more engaging.

#### Task 2.1: Extend game state with streaks and cash

**Objective:** Track reward state per player.

**Files:**
- Modify: `js/state.js`
- Modify: `js/main.js`
- Modify: `js/ui.js`

**Steps:**
1. Extend `p1` and `p2` state with:
   - `cash: 0`
   - `streak: 0`
   - `bestStreak: 0`
   - `multiplier: 1`
   - `upgrades: { answerValue: 1, manaGain: 1, shieldBoost: 0 }`
2. Reset these fields in `GameplayManager.initGame`.
3. Update `updateUI(state)` to render cash/streak badges near each player panel.
4. Add safe defaults so old localStorage settings don't break.

**Verification:**
- Start new game → both players cash 0/streak 0.
- Existing HP/mana behavior unchanged.

#### Task 2.2: Reward correct answers and punish wrong streaks

**Objective:** Make correct answers feel like progress.

**Files:**
- Modify: `js/main.js`
- Modify: `js/ui.js`

**Steps:**
1. In `handlePlayerAnswer` correct branch:
   - Increment player streak.
   - Update best streak.
   - Calculate cash reward, e.g. `baseCash = 10`, `streakBonus = Math.floor(streak / 3) * 5`, multiplied by `player.multiplier`.
   - Add mana using existing `addMana` but allow upgrade-adjusted gain later.
2. In wrong branch:
   - Reset streak to 0.
   - Keep current `-1 mana` behavior.
3. Show floating text: `+$10`, `3 streak!`, `Streak reset`.

**Verification:**
- Correct 3 answers in a row → visible streak and higher reward.
- Wrong answer → streak returns to 0.

#### Task 2.3: Add a simple upgrade shop panel

**Objective:** Let players spend earned cash on strategic upgrades.

**Files:**
- Modify: `index.html`
- Modify: `js/main.js`
- Modify: `js/ui.js`
- Optional create: `js/economy.js`

**Steps:**
1. Add compact shop buttons under each player or near action area:
   - `💰 +Cash`: increases answer cash value.
   - `⚡ +Mana`: increases mana gain every N correct answers or adds bonus chance.
   - `🛡️ +Shield`: improves DEF basic action.
2. Implement costs that scale: `cost = base * level`.
3. Add click handlers exposed safely via module or event listeners, not new inline functions if avoidable.
4. Disable shop buttons if not enough cash.
5. Keep shop small so it does not overwhelm current battle UI.

**Verification:**
- Earn cash, buy upgrade, cash decreases, level increases.
- Button disabled when cash insufficient.
- Upgrade affects subsequent rewards/action values.

#### Task 2.4: Add settings to enable/disable economy

**Objective:** Teacher can choose simple mode or strategy mode.

**Files:**
- Modify: `index.html`
- Modify: `js/main.js`
- Modify: `js/settings.js` only if needed

**Steps:**
1. Add setting in HERO & BOSS or new Game Mode section:
   - `Enable Gimkit-style economy` checkbox default true on dev or false if preserving legacy behavior is preferred.
   - Base cash per correct answer.
   - Streak bonus interval.
2. Read these settings in `initGame` and reward calculation.
3. If disabled, hide shop/cash UI and retain original mana/skill-only gameplay.

**Verification:**
- Economy off → old behavior remains.
- Economy on → cash/shop appear and work.

---

### Phase 3 — Feature variety: modes and skill pool expansion

**Outcome:** More classroom replayability without making the app hard to operate.

#### Task 3.1: Add mode selector with presets

**Objective:** Support a few clear game variants.

**Files:**
- Modify: `index.html`
- Modify: `js/state.js`
- Modify: `js/main.js`

**Game modes:**
1. `Boss Battle` — current default: P1 vs P2/Boss HP battle.
2. `Race to Score` — first player to target cash/points wins.
3. `Survival` — sudden death pressure starts earlier; wrong answers hurt more.
4. `Practice` — no HP battle, focus on streak and correction.

**Steps:**
1. Add `gameMode` to state.
2. Add mode selector in settings.
3. Implement mode-specific win conditions minimally:
   - Boss Battle: existing HP endgame.
   - Race to Score: trigger end when cash/score reaches target.
   - Survival: use existing sudden death but with preset values.
   - Practice: suppress damaging attacks if needed; show completion summary.
4. Add preset button(s) that set multiple fields: HP, sudden death time, economy enabled, stun time.

**Verification:**
- Each mode starts without errors.
- Boss Battle remains unchanged as default.
- Race target can end a game without HP reaching 0.

#### Task 3.2: Make skill pool respect the existing skill settings table

**Objective:** The current settings table lists 10 ultimate skills, but only 2 are active. Make ownership settings meaningful.

**Files:**
- Modify: `js/main.js`
- Modify: `js/skills.js`
- Modify: `index.html` only if labels need IDs

**Steps:**
1. Define a skill registry array with all skill IDs, icons, setting owner keys, and handler names.
2. Update `buildDecks()` so each player deck includes only skills whose owner select is `p1`, `p2`, or `both`.
3. Keep unimplemented skills disabled or map to safe placeholder effects first.
4. Add user-facing note in settings: implemented now vs coming soon, unless implementing all.

**Verification:**
- Set Meteor owner to P1 only → only P1 can draw Meteor.
- Set Kamehameha to none → neither player draws it.
- Empty deck fallback does not crash.

#### Task 3.3: Implement 3 high-value additional skills first

**Objective:** Add variety without trying to implement all 10 at once.

**Recommended first skills:**
1. `Thunder Strike` — damage + stun opponent for configured seconds.
2. `Absolute Freeze` — freeze opponent controls for configured seconds.
3. `Mirror Shield` — next incoming ultimate is reduced/reflected.

**Files:**
- Modify: `js/skills.js`
- Modify: `js/main.js`
- Modify: `js/state.js`
- Modify: `js/ui.js` if status badges are needed

**Steps:**
1. Add state fields such as `statusEffects`, `mirrorShieldUntil`, or explicit booleans as needed.
2. Implement one skill at a time with simple visual effects first.
3. Wire skill ID to handler in `handleSkill`.
4. Verify each skill cannot permanently lock controls if game ends or resets.

**Verification:**
- Thunder: opponent loses HP and cannot answer during stun.
- Freeze: opponent controls blocked then restored.
- Mirror: visible shield, next skill interaction handled, shield expires.

---

### Phase 4 — Teacher workflow improvements

**Outcome:** Faster prep for classes, easier reuse.

#### Task 4.1: Add sample data and import/export helpers

**Objective:** Teacher can quickly test or reuse question sets.

**Files:**
- Modify: `index.html`
- Modify: `js/main.js`
- Optional create: `js/dataTools.js`

**Steps:**
1. Add buttons in Data tab:
   - `Load sample vocabulary`.
   - `Export JSON`.
   - `Import JSON`.
2. Export current grid rows plus display-type settings.
3. Import validates shape and fills grid.
4. Keep existing localStorage save/load intact.

**Verification:**
- Load sample → game can start immediately.
- Export → valid JSON downloaded/copied.
- Import exported file → restores rows.

#### Task 4.2: Add game preset buttons

**Objective:** One-click tuning for age/lesson style.

**Files:**
- Modify: `index.html`
- Modify: `js/main.js`

**Presets:**
- `Quick 5-min warmup`: lower HP, short sudden death, economy on.
- `Vocabulary drill`: practice/race mode, gentle stun, high streak reward.
- `Boss raid`: high boss HP, strong skills, longer timer.

**Verification:**
- Clicking preset updates relevant inputs and persists after save.

---

## Suggested Kanban backlog

### Todo
- Link CSS and add UI helper classes.
- Add in-game HUD guide/status.
- Improve answer-card clarity and feedback.
- Add setup validation/status card.
- Add cash/streak state.
- Add reward calculation and streak reset.
- Add upgrade shop UI and handlers.
- Add economy settings.
- Add game mode selector and presets.
- Make skill deck respect ownership settings.
- Implement Thunder Strike.
- Implement Absolute Freeze.
- Implement Mirror Shield.
- Add sample data/import/export.
- Run full local verification on port 8888.

### Verification checklist per task
- No browser console errors.
- Existing default game can still start.
- P1 and P2 keyboard controls still work.
- Mouse controls still work.
- Settings save/load still works.
- LocalStorage from older version does not crash page.
- Visual layout remains readable at 16:9 desktop size.

## Risks and tradeoffs

- `index.html` is very large and already contains many inline handlers/styles. Too much refactor at once is risky. Prefer incremental extraction.
- The settings table already advertises many skills that are not fully implemented. Turning all on at once may create balance bugs. Start with ownership-aware deck + 3 reliable skills.
- Gimkit-like economy can make the screen busy. Keep it optional and compact.
- Browser audio autoplay restrictions will still require a user interaction before some sounds play.
- External Gimkit research via web search returned no reliable direct results in this environment, so the plan uses generally known classroom-game patterns: streaks, currency, upgrades, modes, powerups.

## Local verification plan

1. From repo root:
   ```bash
   python3 -m http.server 8888
   ```
2. Open `http://localhost:8888`.
3. Smoke test setup:
   - Open settings.
   - Add/sample data.
   - Save & close.
   - Start battle.
4. Smoke test gameplay:
   - Correct/wrong answers for both players by keyboard and click.
   - Mana, cash, streak, HP update.
   - Skills draw and fire.
   - End-game modal appears.
5. Browser console should have no uncaught errors.

## Open questions for Huy

1. Economy default: nên bật mặc định để game giống Gimkit hơn, hay tắt mặc định để giữ gameplay cũ?
2. Game mode ưu tiên đầu tiên là gì: `Race to Score`, `Survival`, hay `Practice`?
3. Skill mới nên thiên về vui/visual effect hay cân bằng gameplay lớp học?
4. Có cần mobile/tablet layout không, hay ưu tiên màn hình lớp học 16:9 như hiện tại?

## Recommended first implementation slice

Start with Phase 1 + Task 2.1/2.2 only:

1. Link CSS safely.
2. Add HUD/status and clearer answer feedback.
3. Add streak/cash state and reward text.
4. Verify local gameplay.

This gives visible improvement quickly while keeping risk low. After Huy approves the direction, continue with shop, modes, and new skills.
