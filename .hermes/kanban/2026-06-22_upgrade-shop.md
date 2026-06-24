# Kanban - Upgrade Shop Batch

## Goal
Add a small, low-risk cash shop inspired by Gimkit so players can spend earned cash on simple buffs during battle.

## Todo
- [ ] Add compact shop UI for P1/P2 near each player action area.
- [ ] Add purchasable upgrades:
  - Mana Boost: costs $20, grants +2 mana.
  - Shield Snack: costs $30, grants +25 shield.
  - Double Cash: costs $40, enables 2x cash for the next 3 correct answers.
- [ ] Disable/visually dim purchases when player lacks cash.
- [ ] Wire buttons through safe global click handlers.
- [ ] Verify correct answer cash loop still works.
- [ ] Verify successful and failed purchases in browser.

## Doing
- Creating kanban and implementation scope.

## Done

## Verification
- Run static site at http://127.0.0.1:8888
- Use 4 sample vocab rows.
- Start battle.
- Earn cash via correct answers.
- Buy each upgrade and confirm state/UI updates.

## Notes
- No external GIF/MP3 required in this batch.
- Ask before commit or push.
