# Budgeto — Micro animation plan (2026-02-02)

Goal: make the app feel more "alive" and premium without getting distracting. Default: subtle motion, fast timings, and always respect `prefers-reduced-motion`.

## Principles
- Motion should explain state change (navigation, feedback) — not decorate.
- Use consistent timings:
  - `--t-fast` ~120ms for press/hover
  - `--t-med` ~220ms for view changes
- Use a soft ease-out (`--ease-out`) to feel responsive.
- Always disable/limit animations under `prefers-reduced-motion: reduce`.

## Where animations add value
1) **Tab / page transitions**
- When switching Dashboard/Add/Settings: a light fade + 6px slide-in on the `.page` content.
- Purpose: communicates context change; avoids “hard cuts”.

2) **Bottom navigation micro-interactions**
- Active item: background + color transition, slight icon scale.
- Tap feedback: small scale-down.

3) **Buttons & interactive controls**
- Press feedback: scale-down and tiny translate.
- Hover lift (desktop): gentle.
- Inputs: focus ring already exists; make it feel smoother via transitions.

4) **Cards & list items**
- Desktop hover: 1px lift + deeper shadow.
- List items: same, but lighter.

5) **Toast**
- Enter animation: slide up + fade.
- Purpose: improves readability and perceived quality.

6) **Charts (small but high impact)**
- Bar chart: bars “grow” in with stagger (35ms steps).
- Sparkline: stroke draw animation.
- Stacked bar: width transitions on update.

7) **Exit animations ("next level")**
- Toast: animate out on auto-hide and manual close.
- Entries list delete: animate out the list row before removing from DOM.

## Implementation steps
1. Add global motion tokens (`--t-fast`, `--t-med`, `--ease-out`).
2. Add tab-change animation trigger in React (`tabAnimating` for 220ms).
3. Implement CSS animations/transitions for:
   - `.main.tabAnimating .page` entrance
   - `.navItem` transitions and active icon scale
   - button transitions and press feedback
   - card/list hover lift (hover-capable devices)
   - `.toast` enter + exit animation
   - chart animations (`.bars .bar`, `.spark path`, `.stackedPart`)
   - `.listItem.leaving` exit state
4. Add small React state to keep elements mounted long enough for exit animation:
   - `toastLeaving` + delayed unmount
   - `leavingIds` for list rows
5. Add `prefers-reduced-motion` overrides to remove the above animations.

Notes:
- We keep everything CSS-first to avoid complex JS animation state.
- Exit animations for toast/list deletions are skipped for now (would require keeping items mounted briefly).
