# Strange Worlds — Claude Code Project Context

> Working title. A surreal narrative adventure game for iPhone and iPad.

You are helping build **Strange Worlds**, a single-player narrative adventure for iOS. Read this file before doing anything in this repo. When in doubt, ask before generating code.

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

- **Language:** Swift 5.9+ (Swift 6 features welcome where stable)
- **UI shell:** SwiftUI for menus, settings, save selection, narrative overlays
- **Game rendering:** SpriteKit (2D stylized art is the primary direction)
- **Audio:** AVFoundation for music, SpriteKit's audio for SFX
- **Persistence:** Codable models + JSON in app's Documents directory; iCloud sync as a stretch goal
- **Platforms:** iPhone and iPad universal (iOS 17+). Apple Silicon Mac via Catalyst is a nice-to-have, not a requirement.
- **Build:** Xcode 15+, SwiftPM for any dependencies (prefer zero deps where reasonable)
- **Source control:** git, conventional commits

### Why SpriteKit (and not Unity, SceneKit, or RealityKit)

- Smallest install size, best battery life, native feel
- 2D stylized art is the design direction; SpriteKit is purpose-built for it
- No engine license, no version churn, no asset pipeline foreign to Xcode
- If we ever need 3D moments (e.g. the portal transition), SceneKit can be embedded into a SpriteKit scene

If something genuinely needs a different stack, flag it and discuss before pulling it in.

---

## Repository layout

```
strange_worlds/
├── CLAUDE.md                    This file
├── DESIGN.md                    Living design doc (to be written)
├── StrangeWorlds.xcodeproj/     Xcode project (created in step 1)
├── StrangeWorlds/
│   ├── App/                     @main, app lifecycle, root SwiftUI views
│   ├── Game/
│   │   ├── Scenes/              SKScene subclasses, one per game area
│   │   ├── Entities/            Player, NPCs, interactable objects
│   │   ├── Components/          GameplayKit components (movement, dialogue, animation)
│   │   ├── Systems/             GameplayKit systems and managers
│   │   └── Rendering/           Custom shaders, lighting, post-effects
│   ├── Narrative/
│   │   ├── Dialogue/            Dialogue trees as Codable data
│   │   ├── Story/               Story flags, chapter progression
│   │   └── Localization/        String catalogs
│   ├── Persistence/
│   │   ├── SaveGame.swift       Codable save model
│   │   └── SaveStore.swift      Read/write, autosave, migrations
│   ├── UI/                      SwiftUI views (menus, HUD overlays, settings)
│   ├── Audio/                   Music manager, SFX manager
│   ├── Input/                   Touch handling, gesture recognizers
│   └── Resources/
│       ├── Assets.xcassets      Art, icons
│       ├── Sounds/              Music and SFX files
│       └── Data/                JSON for dialogue, area definitions, etc.
└── StrangeWorldsTests/
```

This is a target — let the project grow into it. Don't scaffold empty folders.

---

## The first milestone: "Bedroom to Portal"

Before anything else, we ship a vertical slice that proves the stack and the tone:

1. App launches to a title screen (SwiftUI). One button: **Begin**.
2. Title fades into the **bedroom scene** (SpriteKit). The girl is rendered as a sprite. Player can move her with a touch joystick or tap-to-move.
3. Three interactable objects in the bedroom: a poster (she comments on it), a desk (she sweeps it clear in anger), and the **wall**.
4. After interacting with at least two things, tapping the wall reveals the portal: an animated, glowing seam in the wall.
5. Tapping the portal triggers a transition (parallax, particles, audio swell) into the **first fantasy area** — a single small screen, painterly, surreal. The player can walk a few steps and the demo ends with a fade-to-title.
6. Progress saves automatically. Reopening the app resumes at the last scene.

This slice proves: SwiftUI ↔ SpriteKit handoff, touch input, save/load, scene transitions, audio, and the visual bar. Everything afterward plugs into proven plumbing.

**Explicitly out of scope for milestone 1:** combat, inventory, dialogue trees, multiple chapters, settings menu, accessibility polish, App Store metadata. Those come later.

---

## Coding conventions

- Swift API Design Guidelines, no exceptions
- `// MARK: -` section headers in any file longer than ~100 lines
- Prefer `struct` and value semantics; reach for `class` only when identity or reference semantics are required (SpriteKit nodes are classes, naturally)
- `@MainActor` annotations on UI-touching code; keep game-logic types `Sendable` where feasible
- No force-unwraps in shipped code. `guard let` or `if let`, with a logged fallback
- Async/await over completion handlers. Combine only if it's clearly the cleanest tool
- Logging via `os.Logger`, not `print`
- Document any non-obvious decision with a `// NOTE:` comment explaining *why*, not *what*
- Tests for pure logic (save/load, dialogue evaluation, story flag resolution). SpriteKit visual code is exempt from unit tests; manual playtest instead.

---

## Working agreements with Claude Code

- **Ask before scaffolding.** Don't create dozens of empty files. Build the smallest thing that compiles and runs, then grow it.
- **Compile after every meaningful change.** `xcodebuild` or open Xcode and build. Don't hand back code that doesn't compile.
- **Small commits.** One logical change per commit. Conventional commit style: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.
- **Update DESIGN.md as we go.** When we make a design decision in chat, write it down. Future-us will forget.
- **Flag scope creep.** If a request implies way more than it sounds like, push back before writing the code.
- **Art and audio are placeholders for now.** Use simple colored shapes, SF Symbols, and silence. The visual design pass comes after the systems work.

---

## Open questions (resolve as we go, in DESIGN.md)

- Final game title (Strange Worlds is a working title)
- Protagonist's name
- Camera style: fixed-screen rooms, side-scrolling, or top-down? (Leaning side-scrolling / 2.5D parallax)
- Input: virtual joystick, tap-to-move, or swipe gestures? (Leaning tap-to-move with gesture overlays for actions)
- Save model: single save slot or multiple? (Leaning single autosave + manual checkpoints)
- Localization plan and target languages
- Monetization — premium, freemium, or portfolio piece?

---

## What to do first when starting a session

1. Read this file.
2. Read `DESIGN.md` if it exists.
3. Check `git log` for recent context.
4. Ask what we're working on today before generating anything substantial.
