# UX Layout + Data Table Fix Implementation Plan

> **For Hermes:** Implement task-by-task only after anh Huy approves this plan. Do not commit/push until after verification and explicit approval.

**Goal:** Fix the current layout issues after the recent UX/gameplay additions: prevent answer options from overlapping player stats, simplify the Data settings tab, add a clear way to add rows to the Data table, and fix the shop purchase click error on the deployed dev page.

**Architecture:** Keep this as a small UI/layout + bugfix batch, not a gameplay rewrite. Use existing static HTML/CSS/vanilla JS files, preserve the current data schema (`cotA`, `cotB`, `active`), and reuse existing `createGridRow`, paste, sample data, settings-save, and `GameplayManager.buyUpgrade` flows. Prefer CSS/HTML layout fixes first; touch JS only for row-adding, removing obsolete Auto Fill wiring, and exposing the shop click handler safely for inline HTML `onclick` usage.

**Tech Stack:** Static HTML/CSS/vanilla JS in `/opt/data/workspace/joyenglish`.

---

## Current Context / Problems Observed

### 1. Home/game screen overlap

Relevant file: `index.html`

Current layout puts player panels low and wide:
- P1 container: `index.html:289` currently uses `absolute bottom-4 left-8 ... gap-6 ... w-64`.
- P2 container: `index.html:371` currently uses `absolute bottom-4 right-8 ... gap-6 ... w-64`.
- Answer options are already occupying the side/lower areas, so the added HP/Mana/Cash/Streak/Shop content makes player panels collide with answer options/stat zones.

Relevant CSS:
- `css/styles.css:248-284` for shop buttons.
- `css/styles.css:182-196` for reward strips.

### 2. Data settings tab too tall / table squeezed

Relevant file: `index.html`

The Data tab top toolbar is overloaded:
- `index.html:561-642` contains multiple large cards in a wrapping toolbar.
- Auto fill panel at `index.html:583-596` is no longer necessary because sample data exists.
- Table starts at `index.html:644`, but currently only ~1 row is visible because the toolbar takes too much vertical space.

Relevant CSS:
- `.table-container` at `css/styles.css:24` has `max-height: 55vh`, but because `#tab-data` uses flex and `.tab-content.active` forces block/flex overrides, the real visible height is constrained by the large toolbar.
- `.preset-panel`, `.quick-start-panel`, and `.setup-status-card` are visually large for a dense modal toolbar.

### 3. Need add-row workflow

Relevant JS:
- `createGridRow(i)` exists at `js/main.js:299-322` and already attaches input listeners and checkbox listeners.
- Initial rows are created at `js/main.js:324`.
- Paste auto-expands rows at `js/main.js:360-383`.
- Keyboard navigation at `js/main.js:286-296` currently moves around existing rows only; Tab is not used for adding a new row.

### 4. Shop purchase click error on deployed dev page

Reported deployed error:
```text
tuanhuytruong.github.io says
JS Error: Uncaught ReferenceError: triggerClickShop is not defined
Line: 340
URL: https://tuanhuytruong.github.io/joyenglish-dev/
```

Relevant files:
- `index.html:338-340` and `index.html:422-424` use inline `onclick="triggerClickShop(...)"` for shop buttons.
- `js/main.js` added `GameplayManager.buyUpgrade(...)`, but the global wrapper `window.triggerClickShop` is either missing, defined too locally, or not attached before the inline handler runs.

Likely cause:
- Existing skill buttons use `triggerClickSkill(...)` globally, but the new shop buttons were added with similar inline handlers without exposing a matching global function on `window`.

---

## Proposed Approach

### A. Game/home layout: make side player panels compact and out of answer-option area

Use minimal, controlled layout changes:

1. Move player stat blocks higher and reduce vertical footprint.
2. Reduce gaps and avatar sizes slightly.
3. Make shop/buttons compact in one grouped panel.
4. Avoid changing answer card positions unless necessary.

Target outcome:
- Answer options remain easy to click/read.
- Player HP/Mana/Cash/Streak/Shop remain visible but no longer overlap option cards.
- Keep 16:9 game composition intact.

Likely changes:
- `index.html:289` and `index.html:371`:
  - Change player containers from `bottom-4` to something like `bottom-2` or move stats to a tighter stack with smaller `gap`.
  - Consider reducing `w-64` to `w-56`.
  - Reduce `gap-6` to `gap-3`.
- `index.html:328` and `index.html:412`:
  - Reduce avatar from `w-40 h-40` to `w-32 h-32` or responsive `w-32 h-32 xl:w-36 xl:h-36`.
- `index.html:342` and `index.html:426`:
  - Reduce action button group padding/gap from `gap-4 p-3` to `gap-2 p-2`.
- `css/styles.css`:
  - Add targeted compact rules for `.player-shop-panel`, `.shop-btn`, `.player-reward-strip` if Tailwind class edits are insufficient.

### B. Data tab: simplify toolbar and give table most of the modal height

Remove or hide obsolete Auto Fill block:
- Remove the Auto Fill panel from `index.html:583-596`.
- Remove or leave dormant the `btn-auto-fill` JS listener. Preferred: remove listener safely or guard it with optional chaining so missing element does not error.

Reorganize Data tab toolbar into two compact rows:

Row 1: teacher workflow controls
- `Game Presets`
- `Quick Start Data`
- `Setup Status`
- `Save` remains in modal header unchanged

Row 2: advanced/simple data controls
- Column A/B display type
- Question mode
- Image source
- Clear All
- New `+ Add Row` button

Target outcome:
- Table gets at least ~60-70% of modal body height.
- At least 8-12 rows visible on a normal laptop screen.
- Less visual noise in Data tab.

Possible implementation details:
- Add wrapper classes in `index.html`:
  - `.data-toolbar`
  - `.data-toolbar-main`
  - `.data-toolbar-secondary`
  - `.data-toolbar-card`
- Adjust `css/styles.css`:
  - `#tab-data.active { display: flex !important; min-height: 0; }`
  - `.data-toolbar { flex-shrink: 0; padding: 10px; gap: 8px; }`
  - `.table-container { flex: 1 1 auto; min-height: 0; max-height: none; }`
  - `.excel-table td { height: 36px; }` if needed.

### C. Add row functionality

Add both button and keyboard path:

1. Add `+ Add Row` button near Clear All in Data tab.
   - New button ID: `btn-add-row`.
   - Location: near `btn-clear-data` around `index.html:638-641`.

2. Add JS handler:
   - Use existing `createGridRow(currentRowCount + 1)`.
   - Focus first input of the new row after creation.
   - Call `updateSetupStatus()`.

3. Add Tab-to-add behavior:
   - In `attachInputListeners` keydown block, detect:
     - `e.key === 'Tab'`
     - active input is last editable cell in last row (`colB` and `row === currentRowCount`)
     - not `e.shiftKey`
   - Prevent default, create one new row, focus new row colA.
   - Keep normal Tab behavior elsewhere to avoid surprising teachers.

4. Optional but useful:
   - Add `Ctrl+Enter` / `Cmd+Enter` shortcut to add row from any cell if easy, but not required for this batch.

### D. Fix shop `triggerClickShop` global handler

Add a safe global wrapper similar to existing skill click wrappers:

```js
window.triggerClickShop = function(playerId, upgradeType) {
    if (!window.GameplayManager || typeof window.GameplayManager.buyUpgrade !== 'function') {
        console.warn('Shop is not ready yet');
        return;
    }
    window.GameplayManager.buyUpgrade(playerId, upgradeType);
};
```

Implementation notes:
- Define it in `js/main.js` in the same global area where `triggerClickSkill`/other window wrappers are defined, not inside a local-only scope that may be inaccessible to inline `onclick`.
- Keep the existing `GameplayManager.buyUpgrade` implementation; do not duplicate purchase logic.
- Add a smoke test that calls both:
  - `typeof window.triggerClickShop === 'function'`
  - `window.triggerClickShop('p1', 'mana')` after setting cash, confirming no ReferenceError and state updates.

---

## Step-by-Step Plan

### Task 1: Create implementation Kanban after approval

**Objective:** Track work task-by-task once anh Huy approves.

**Files:**
- Create: `.hermes/kanban/2026-06-22_layout-data-table-fix.md`

**Steps:**
1. Create Kanban with Todo / Doing / Verify / Done sections.
2. Include checklist for the three requested issues.
3. Do not edit app files until Kanban exists.

**Verification:**
- Confirm Kanban file exists.

---

### Task 2: Compact home/player layout

**Objective:** Stop answer options from overlapping player stat/shop areas.

**Files:**
- Modify: `index.html:289-366`
- Modify: `index.html:371-449`
- Modify: `css/styles.css:182-284` if needed

**Planned edits:**
- Reduce player panel width from `w-64` to `w-56` or responsive equivalent.
- Reduce gaps:
  - outer player stack `gap-6` → `gap-3`
  - avatar/action stack `gap-4` → `gap-2`
  - action group `gap-4 p-3` → `gap-2 p-2`
- Reduce avatar size:
  - `w-40 h-40` → `w-32 h-32 xl:w-36 xl:h-36`
- Reduce shop button dimensions if needed:
  - `.shop-btn min-width: 58px` → `52px`
  - `.shop-btn font-size: 11px`

**Verification:**
- Run local server on port 8888.
- Browser screenshot / visual inspect home screen.
- Confirm answer option cards are not covered by player panels or shop buttons.
- Confirm player stats/shop remain readable.

---

### Task 3: Simplify Data tab toolbar

**Objective:** Make Data tab readable and free vertical space for the table.

**Files:**
- Modify: `index.html:561-642`
- Modify: `css/styles.css:24, 313-389`, plus new layout helper classes
- Modify: `js/main.js:331-350` to avoid referencing removed Auto Fill DOM

**Planned edits:**
1. Remove the Auto Fill card:
   - Delete `index.html:583-596`.
2. Remove or guard the Auto Fill JS:
   - Replace direct `document.getElementById('btn-auto-fill').addEventListener(...)` with:
     ```js
     document.getElementById('btn-auto-fill')?.addEventListener('click', () => { ... });
     ```
   - Better: remove the whole Auto Fill listener if the UI is removed and no longer needed.
3. Convert top controls into a compact toolbar:
   - Use smaller cards/classes for presets, quick start, column type, image source, question mode, status.
4. Add CSS:
   ```css
   #tab-data.active {
       display: flex !important;
       min-height: 0;
   }
   .data-toolbar {
       flex-shrink: 0;
       display: grid;
       grid-template-columns: repeat(12, minmax(0, 1fr));
       gap: 8px;
       margin-bottom: 8px;
   }
   .data-toolbar-card {
       padding: 8px 10px;
       border-radius: 12px;
   }
   .table-container {
       flex: 1 1 auto;
       min-height: 0;
       max-height: none;
   }
   ```
   Exact grid spans can be tuned during implementation.

**Verification:**
- Open settings → Data tab.
- Confirm Auto Fill block is gone.
- Confirm table shows multiple rows, target 8+ rows visible.
- Confirm sample data buttons still render and work.

---

### Task 4: Add `+ Add Row` button

**Objective:** Let teachers add rows explicitly.

**Files:**
- Modify: `index.html:638-641`
- Modify: `js/main.js:299-322`, nearby after existing clear button listener
- Modify: `css/styles.css` for button styling if not using Tailwind only

**Planned HTML:**
Add near Clear All:
```html
<button id="btn-add-row" type="button" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow transition flex items-center gap-1 focus:outline-none">
    ➕ Add Row
</button>
```

**Planned JS:**
```js
function addDataRow({ focus = true } = {}) {
    createGridRow(currentRowCount + 1);
    if (focus) {
        document.querySelector(`.excel-input[data-col="colA"][data-row="${currentRowCount}"]`)?.focus();
    }
    updateSetupStatus();
}

document.getElementById('btn-add-row')?.addEventListener('click', () => addDataRow());
```

**Verification:**
- Click `+ Add Row`.
- Confirm row count increments.
- Confirm focus moves to new row Column A.
- Confirm save still collects active rows correctly.

---

### Task 5: Add Tab-to-add-row behavior

**Objective:** Make data entry faster with keyboard.

**Files:**
- Modify: `js/main.js:286-296`

**Planned JS logic:**
At top of the `keydown` listener inside `attachInputListeners`:
```js
if (e.key === 'Tab' && !e.shiftKey) {
    const isLastRow = row === currentRowCount;
    const isLastEditableCol = col === 'colB';
    if (isLastRow && isLastEditableCol) {
        e.preventDefault();
        addDataRow({ focus: true });
        return;
    }
}
```

Important: `addDataRow` must be defined before this event fires. Function declaration can live below `createGridRow`; because function declarations are hoisted, this is fine.

**Verification:**
- Focus last row Column B.
- Press Tab.
- Confirm a new row is created and focus moves to new row Column A.
- Confirm Shift+Tab still behaves normally.

---

### Task 6: Fix shop click handler ReferenceError

**Objective:** Fix deployed shop purchase error: `triggerClickShop is not defined`.

**Files:**
- Modify: `js/main.js`, near existing global click wrapper definitions

**Planned JS:**
```js
window.triggerClickShop = function(playerId, upgradeType) {
    if (!window.GameplayManager || typeof window.GameplayManager.buyUpgrade !== 'function') {
        console.warn('Shop is not ready yet');
        return;
    }
    window.GameplayManager.buyUpgrade(playerId, upgradeType);
};
```

**Verification:**
- In browser console, confirm:
  ```js
  typeof window.triggerClickShop === 'function'
  ```
- Start game, set P1 cash for test, click shop button or run:
  ```js
  window.GameplayManager.state.p1.cash = 100;
  window.GameplayManager.updateUI();
  window.triggerClickShop('p1', 'mana');
  ```
- Expected:
  - No `ReferenceError`.
  - P1 cash decreases by 20.
  - P1 mana increases by 2.
  - Shop UI updates.

---

### Task 7: End-to-end browser verification

**Objective:** Prove layout, data flows, and shop purchase work in the real app.

**Commands:**
```bash
python3 -m http.server 8888
```

**Browser checks:**
1. Home screen:
   - Open `http://127.0.0.1:8888`.
   - Confirm player panels no longer cover answer options.
   - Confirm stats/shop still visible.
2. Data tab:
   - Open settings.
   - Confirm Auto Fill block is removed.
   - Confirm table has significantly more visible rows than before.
   - Click `Animals` sample data.
   - Confirm 8 rows active and status says 8 questions/answers.
3. Add row:
   - Click `+ Add Row` and confirm row count increments.
   - Press Tab from last row Column B and confirm a new row is added.
4. Shop purchase:
   - Confirm `typeof window.triggerClickShop === 'function'`.
   - Give P1 test cash and click/buy Mana upgrade.
   - Confirm no `ReferenceError`, cash decreases, mana increases, and UI updates.
5. Save/start:
   - Save settings.
   - Start battle.
   - Confirm game starts and no JS console errors.

**Cleanup:**
- Stop local server after verification.
- Run:
```bash
git diff --check
```

---

## Files Likely to Change

- `index.html`
  - Compact player panel classes.
  - Simplify Data tab toolbar.
  - Remove Auto Fill UI.
  - Add `+ Add Row` button.

- `css/styles.css`
  - Add/adjust compact home layout rules.
  - Add Data tab toolbar/table sizing rules.
  - Possibly reduce shop/reward strip sizing.

- `js/main.js`
  - Remove/guard Auto Fill listener.
  - Add `addDataRow` helper.
  - Add `btn-add-row` click handler.
  - Add Tab-to-add-row keyboard behavior.
  - Expose `window.triggerClickShop` so inline shop buttons work on deployed pages.

No expected changes to:
- `js/state.js`
- `js/ui.js`
- `js/settings.js`

---

## Risks / Tradeoffs

1. **Over-compressing player UI:** If player panels become too small, younger students may have difficulty reading stats. Mitigation: compact only enough to avoid overlap; keep HP/Mana/Cash readable.
2. **Removing Auto Fill:** User explicitly said it is not needed if sample data exists. Existing paste support remains, so teachers can still bulk-import spreadsheet data.
3. **Tab behavior:** Hijacking Tab everywhere can be annoying. Mitigation: only add a row when Tab is pressed from the last row's Column B and not Shift+Tab.
4. **Responsive sizing:** The app is 16:9 inside `#game-aspect-wrapper`. Need verify at browser viewport size used by local smoke test and not rely only on code inspection.

---

## Acceptance Criteria

- [ ] Home screen: answer option cards do not overlap with player stats/shop/action buttons.
- [ ] Data tab: Auto Fill / Bật hàng loạt panel removed.
- [ ] Data tab: table area shows multiple rows clearly, target at least 8 visible rows on normal viewport.
- [ ] Data tab: sample data still works.
- [ ] Data tab: `+ Add Row` button works.
- [ ] Data tab: Tab from last row Column B adds a row and focuses new row Column A.
- [ ] Save/start battle still works with sample data.
- [ ] Shop buttons no longer throw `triggerClickShop is not defined`.
- [ ] Shop purchase updates cash/mana/shield/multiplier correctly through the button path.
- [ ] Browser console has no new JS errors.
- [ ] `git diff --check` passes.

---

## Suggested Execution Order After Approval

1. Create Kanban.
2. Fix game/home layout first and visually verify quickly.
3. Simplify Data toolbar and remove Auto Fill.
4. Add row button + Tab behavior.
5. Fix shop `triggerClickShop` ReferenceError.
6. Full browser smoke test on port 8888, including shop purchase path.
7. Report results to anh Huy.
8. Ask before commit/push.
