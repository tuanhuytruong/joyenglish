# Kanban - Layout + Data Table + Shop Fix Batch

## Goal
Fix approved UX/layout issues on dev branch before committing: prevent home overlap, simplify Data settings, add row workflow, and fix shop purchase ReferenceError.

## Todo
- [x] Compact player/stat/shop layout on home/game screen
- [x] Remove obsolete Auto Fill block from Data tab
- [x] Reorganize Data tab toolbar so table shows multiple rows
- [x] Add `+ Add Row` button
- [x] Add Tab-to-add-row from last row Column B
- [x] Expose `window.triggerClickShop` for shop buttons
- [x] Verify local port 8888 with browser smoke test
- [x] Run `git diff --check`
- [ ] Report to anh Huy before commit/push

## Verification checklist
- [x] Home screen options do not overlap player stats/shop/actions
- [x] Data table shows at least 8 rows on normal viewport
- [x] Sample data still works
- [x] Add row button works and focuses new row
- [x] Tab from last row Column B adds a row
- [x] Shop purchase button does not throw ReferenceError
- [x] Shop state updates cash/mana correctly
- [x] Save/start battle works
- [x] No new browser console errors
