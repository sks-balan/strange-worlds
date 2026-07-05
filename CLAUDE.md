# Strange Worlds — Claude Code Project Context

> Working title. A surreal narrative adventure game, mobile-web first, iOS/iPad via Capacitor later.

You are helping build **Strange Worlds**, a single-player narrative adventure. Read this file before doing anything in this repo. The original iOS-native brief lives in `strange_worlds_CLAUDE.md`; the stack was switched to TypeScript on 2026-07-05 (see DESIGN.md for the decision record). Premise, pillars, and milestones are unchanged. When in doubt, ask before generating code.

---

## Premise

A 17-year-old girl is forced to move with her family. Furious at her parents, she trashes her new bedroom — and in doing so uncovers a hidden door (or portal) behind the wall. It leads into a fantasy world that is **surreal, supernatural, and strikingly beautiful**. The game is her journey through that world and what she discovers about herself along the way.

Tone: dreamlike, melancholic, occasionally unsettling, ultimately hopeful. Think *Gris*, *Spiritfarer*, *Sky: Children of the Light*, Studio Ghibli, Miyazaki interiors, Moebius landscapes.

## Design pillars

1. **Beauty over scale.** Every screen should feel like an illustration. We'd rather have 30 gorgeous areas than 300 functional ones.
2. **Story is environmental.** Minimal text. Show, don't tell. The world communicates through visuals, music, and ambient detail.
3. **Gentle gameplay.** Exploration, light puzzles, traversal. No fail states in the traditional sense. No combat, or if combat exists, it is non-violent (reflection, persuasion, transformation).
4. **Mobile-native.** Designed for touch from the start. Playable in short sessions. Respects battery and storage.

---

## Technical stack

- **Language:** TypeScript (strict mode), ES modules
- **Game engine:** Phaser 3 — scenes, sprites, particles, tweens, camera, touch input, audio
- **Build/dev:** Vite (dev server with HMR, production bundling)
- **UI shell:** DOM/CSS overlays for menus and narrative text where it beats in-canvas rendering; in-canvas Phaser UI for anything that must live in the game world
- **Persistence:** JSON save model in `localStorage` for now; Capacitor Preferences / filesystem when we wrap for iOS
- **Target:** Mobile-web first — develop and test at phone viewport with touch input from day one. Desktop browser is a free bonus. iPhone/iPad App Store distribution later via **Capacitor**.
- **Testing:** Vitest for pure logic (save/load, story flags, dialogue evaluation). Rendering/scene code is exempt from unit tests; verify by playing in the browser preview.
- **Dependencies:** Phaser + dev tooling only. Prefer zero further runtime deps where reasonable.
- **Source control:** git, conventional commits. Private repo `sks-balan/strange-worlds`.

### Why TypeScript + Phaser (and not Swift/SpriteKit as originally planned)

- The dev machine has no Xcode and ~24 GB free disk; Xcode + simulators need 40–60 GB. The native path was blocked before line one.
- Browser hot-reload iteration is dramatically faster, and Claude Code can verify every change live in a preview.
- Phaser is purpose-built for 2D stylized games, MIT-licensed, no engine churn.
- iOS shipping is preserved via Capacitor; Android and web become free platforms.
- Trade-off accepted: some native polish and battery efficiency vs. SpriteKit.

If something genuinely needs a different stack, flag it and discuss before pulling it in.

---

## Repository layout (target — let the project grow into it, don't scaffold empty folders)

```
strange_worlds/
├── CLAUDE.md                    This file
├── DESIGN.md                    Living design doc + decision record
├── strange_worlds_CLAUDE.md     Original iOS-native brief (historical)
├── index.html                   Vite entry
├── src/
│   ├── main.ts                  Phaser game config + boot
│   ├── scenes/                  One Phaser.Scene per game area (Title, Bedroom, ...)
│   ├── entities/                Player, NPCs, interactable objects
│   ├── systems/                 Story flags, interaction, transitions
│   ├── narrative/               Dialogue/story data as typed JSON + loaders
│   ├── persistence/             Save model, save store (autosave, migrations)
│   ├── ui/                      DOM overlay components, HUD
│   └── audio/                   Music manager, SFX manager
├── public/assets/               Art, sounds (placeholders for now)
└── tests/                       Vitest specs for pure logic
```

---

## The first milestone: "Bedroom to Portal"

Before anything else, we ship a vertical slice that proves the stack and the tone:

1. App launches to a title screen. One button: **Begin**.
2. Title fades into the **bedroom scene**. The girl is rendered as a sprite. Player moves her with tap-to-move.
3. Three interactable objects in the bedroom: a poster (she comments on it), a desk (she sweeps it clear in anger), and the **wall**.
4. After interacting with at least two things, tapping the wall reveals the portal: an animated, glowing seam in the wall.
5. Tapping the portal triggers a transition (parallax, particles, audio swell) into the **first fantasy area** — a single small screen, painterly, surreal. The player can walk a few steps and the demo ends with a fade-to-title.
6. Progress saves automatically. Reopening the app resumes at the last scene.

This slice proves: scene management, touch input, save/load, transitions, audio, and the visual bar. Everything afterward plugs into proven plumbing.

**Explicitly out of scope for milestone 1:** combat, inventory, dialogue trees, multiple chapters, settings menu, accessibility polish, App Store metadata, Capacitor wrapping. Those come later.

---

## Coding conventions

- TypeScript strict mode; no `any` in shipped code without a `// NOTE:` justifying it
- No non-null assertions (`!`) in shipped code; narrow with guards and log the fallback
- Prefer plain data + pure functions for game logic; classes only where Phaser's API expects them (Scenes, GameObjects)
- Game logic (flags, saves, dialogue) must not import Phaser — keep it testable in isolation
- Async/await over raw promises/callbacks
- Section comments in any file longer than ~100 lines
- Document any non-obvious decision with a `// NOTE:` comment explaining *why*, not *what*
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`

---

## Working agreements with Claude Code

- **Ask before scaffolding.** Don't create dozens of empty files. Build the smallest thing that compiles and runs, then grow it.
- **Verify after every meaningful change.** Run the Vite dev server, check the browser preview at a phone viewport, confirm no console errors. Don't hand back code that doesn't run.
- **Small commits.** One logical change per commit.
- **Update DESIGN.md as we go.** When we make a design decision in chat, write it down. Future-us will forget.
- **Flag scope creep.** If a request implies way more than it sounds like, push back before writing the code.
- **Art and audio are placeholders for now.** Simple colored shapes and silence. The visual design pass comes after the systems work.

---

## What to do first when starting a session

1. Read this file.
2. Read `DESIGN.md`.
3. Check `git log` for recent context.
4. Ask what we're working on today before generating anything substantial.
