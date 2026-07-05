# Strange Worlds — Design Doc & Decision Record

Living document. Newest decisions at the top of the log. Open questions at the bottom — move them up into the log as they get resolved.

---

## Decision log

### 2026-07-05 — Fantasy-world palette: sunset warmth over glowing turquoise water

Themed to the user's reference painting: warm orange/pink sunset sky with a huge pale sun, purple cliffs with sunset-lit edges, autumn-rust foliage on every ledge, and glowing turquoise cascades (soft band + bright core + falling streak particles + mist) into a luminous pool. The girl walks a dark shore strip in the foreground, silhouetted against the water light. The real world (bedroom) intentionally stays dark and desaturated so the portal contrast lands. Palette constants live at the top of `src/scenes/FantasyScene.ts`.

### 2026-07-05 — Public repo + GitHub Pages hosting

Repo made public so the free-tier GitHub Pages can host the game at https://sks-balan.github.io/strange-worlds/ — playable from any phone browser. Every push to main runs tests, builds, and deploys via Actions. Doubles as a portfolio piece; revisit visibility if anything sensitive ever lands here.

### 2026-07-05 — No React; plain `.ts`, no JSX

Phaser owns all rendering (single canvas) and the only DOM UI is the `#dialogue` overlay, driven by vanilla code. React would be a second framework managing almost nothing, against the zero-extra-deps rule. Revisit only if out-of-canvas UI grows real complexity (settings, save slots, inventory) — then a React layer may own menus while Phaser owns the world, and only those components become `.tsx`.

### 2026-07-05 — Portrait orientation (provisional), 390×844 design canvas

Milestone 1 uses a portrait phone canvas with FIT scaling (letterboxed elsewhere). One-handed portrait play fits "playable in short sessions"; revisit if the side-scrolling camera direction demands landscape.

### 2026-07-05 — Resume via title screen

Reopening the app shows the title with a single **Continue** button (labeled **Begin** with no save) that drops straight into the saved scene. Satisfies both "one button" and "resumes at the last scene" from the brief. Finishing the demo returns to the title but keeps the save.

### 2026-07-05 — Portal reveal rule

The wall counts as one of the "at least two things": `shouldRevealPortal` fires when 2 of {poster, desk, wall-touched} are set and the player taps the wall. Pure function in `src/systems/story.ts`, unit-tested.

### 2026-07-05 — Stack: TypeScript + Phaser 3 + Vite (supersedes Swift/SpriteKit)

**Decision:** Build in TypeScript with Phaser 3, bundled by Vite. The original brief (`strange_worlds_CLAUDE.md`) specified Swift/SwiftUI/SpriteKit.

**Why:**
- The dev machine has no Xcode installed and only ~24 GB free disk; Xcode + iOS simulators need 40–60 GB. Native iOS development was blocked on disk space.
- Browser hot-reload gives much faster iteration, and Claude Code can verify changes live in a preview instead of an iOS simulator.
- Phaser covers the same ground as SpriteKit for 2D stylized games (scenes, particles, tweens, touch, audio) with no license or engine churn.
- iOS/iPad distribution is preserved via Capacitor later; web and Android become free extra platforms.

**Trade-off accepted:** some native polish, install size, and battery efficiency vs. a native SpriteKit build.

### 2026-07-05 — Platform priority: mobile-web first

Develop at a phone viewport with touch input from day one, per the mobile-native pillar. Desktop browser works as a bonus. Capacitor iOS wrap comes after milestone 1, when there's something worth wrapping (and disk space for Xcode, which is still needed for App Store submission eventually).

### 2026-07-05 — Repo: private GitHub `sks-balan/strange-worlds`

Local repo at `~/development/strange_worlds`, pushed to a private GitHub repo, matching the user's other projects.

### 2026-07-05 — Input: tap-to-move (from original brief's leaning)

Tap a point, the girl walks there; tap an interactable, she walks over and interacts. Gesture overlays for special actions if needed later.

---

## Open questions (from the original brief, still unresolved)

- Final game title (Strange Worlds is a working title)
- Protagonist's name
- Camera style: fixed-screen rooms, side-scrolling, or top-down? (Leaning side-scrolling / 2.5D parallax)
- Save model: single save slot or multiple? (Leaning single autosave + manual checkpoints)
- Localization plan and target languages
- Monetization — premium, freemium, or portfolio piece?

---

## Milestone plan

### Milestone 1 — "Bedroom to Portal" (vertical slice)

Build order, one slice per commit-sized chunk:

1. Project scaffold: Vite + TypeScript + Phaser, phone-viewport index.html, empty boot scene renders.
2. Title scene: working-title text, **Begin** button, fade transition.
3. Bedroom scene: placeholder room, girl as a colored-shape sprite, tap-to-move.
4. Interaction system + story flags: poster, desk, wall as interactables; comments as minimal text overlays.
5. Portal reveal: after ≥2 interactions, wall tap plays glowing-seam animation.
6. Portal transition: particles/parallax/fade into the first fantasy area; walk a few steps; fade-to-title.
7. Autosave/resume: JSON save in localStorage; reopening resumes at last scene.
8. Vitest coverage for save/load and story-flag logic.

Out of scope for milestone 1: combat, inventory, dialogue trees, multiple chapters, settings, accessibility polish, App Store metadata, Capacitor.

### Milestone 2+ (sketch, revisit after M1)

- Visual design pass on the two existing scenes (real art direction, shaders/lighting mood)
- Audio pass: ambient music, SFX
- Additional fantasy areas + chapter structure
- Capacitor iOS wrap + device testing
