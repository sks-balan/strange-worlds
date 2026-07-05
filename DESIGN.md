# Strange Worlds — Design Doc & Decision Record

Living document. Newest decisions at the top of the log. Open questions at the bottom — move them up into the log as they get resolved.

---

## Decision log

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
