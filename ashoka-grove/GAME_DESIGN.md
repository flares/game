# A Light in the Ashoka Grove · అభయం (Abhayam)
### Game Design Document & Build Spec — **Phase 1 (Night Search)**

> **One-line pitch:** On a single moonlit, fog-veiled screen, guide a tiny **Bala Hanumanthudu** with a virtual **joystick** from the **bottom-left** through a maze of ponds, lotuses and bridges — past **sleeping rakshasis** — up to **Sitamma** at the **top-right** under her tree. He carries only a small **lamp**; when lost or still he prays *Rāma nāma* and a wider **aura** reveals the way. Gather **Rama's keepsakes** and the **chūḍāmaṇi**, **don't startle Sitamma**, **toss her the chūḍāmaṇi** so she knows you are no illusion of Ravana — then Hanuman **grows great** and hope dawns.

- **Status:** Phase-1 design **locked** and implemented this session.
- **Location:** `game/ashoka-grove/` — a **standalone PWA inside the `flares/game` repo** (another app alongside Divya Gatha; relative paths, its own manifest + service worker, separately installable).
- **Audio:** Music is deferred — **not in Phase 1** (gentle SFX only; soundscape comes later).

---

## 0. Phase-1 gameplay mechanics — **the source of truth** (every point captured)

This section is written first and in full so nothing from the brief is lost. Each item is a hard requirement.

> **Revision (this session, after first playable):** the hero sprite was rebuilt as a **divine Bala Hanuman** (tall gold kireetam, fair face with white vanara fur-ruff, big eyes, Vaishnava tilak, white garland, red dhoti + flowing scarf, jhumka earrings, tail), the **map was made denser & more explorable** (a branching corridor *network* with more ponds, plank bridges, hedges, reeds and stepping stones; unlit areas read only as dim silhouettes so the path must be found), **Sitamma now sits on a carved stone slab at the foot of the tree**, the **lights were shrunk** to lamp ≈ **5×5 cells** and aura ≈ **8×8 cells**, and **subtle rotating tips** fade in at the top (e.g. *"When lost, pause and pray — say Rām — to see further."*).

### 0.1 Premise & framing
- It is a **night search for Sitamma** under the **moon**. The goal is to **find her and give her the chūḍāmaṇi**, **then grow bigger**.
- **One single screen** (no scrolling). The whole journey — **bottom-left → top-right** — fits on screen at once.
- **Bala Hanumanthudu** (a **small monkey**) **starts at the bottom-left**.
- **Sitamma sits at the top-right, under a tree** (the *simsupa* bower). She is **always visible to us in dim light**.

### 0.2 Mood, lighting & art
- The **whole screen is moonlit, cloud-covered, foggy**, painted in **light night-ish tones — deep dark blues/indigo/violet** (designer's choice of exact palette; see §6).
- A **silver moon** with a halo, **drifting clouds**, **low rolling fog/mist**, **fireflies**, **distant gold Lanka spires**, **garden lamps**.
- Everything sits in **dim moonlight**; the player's **lamp / aura** brighten what's near (a soft "fog-of-war" reveal over an already-faintly-visible scene).
- **Get the sprites right the first time:** mood lighting, moon lighting, the whole path, and the maze nuances all rendered procedurally on canvas and visually QA'd before commit.

### 0.3 Controls — **joystick**
- Movement is via an **on-screen joystick**. (Floating joystick: touch the lower play area → a base appears → drag the thumb to steer; speed scales with thumb distance. Desktop: arrow keys / WASD also move.)
- Hanuman pads/hops in the steered direction; he **cannot walk through water or hedges** (he slides along their edge) — only across **bridges**.

### 0.4 The map — a maze, **freshly generated every time**
- The map is a **maze of ponds, lotuses, bridges** and other grove elements (hedges/shrubs, rocks, lily pads, garden lamps).
- **Every time the game is opened it is a NEW board** (procedurally generated layout of ponds, bridges, hedges, rakshasis, keepsakes and the chūḍāmaṇi). Solvability is **guaranteed** (a connectivity check + repair ensures a route from start to Sitamma always exists).

### 0.5 The two lights — **the core mechanic**
Hanuman has **two distinct light ranges**:
1. **Lamp light (real):** a **small** circle (≈ **5×5 cells**) from the **diya he carries**. This is the light the player **navigates by** — you take movement decisions inside it. **The lamp WAKES rakshasis** if it falls on them.
2. **Aura light (Rāma nāma):** when the player is **truly lost or waits patiently for a longer time**, Hanuman **sits and says Rāma nāma** (prayer/añjali) and a **larger aura circle** (≈ **8×8 cells**, widening a little per keepsake) blooms, **exposing a bigger circle of the map**. The **aura does NOT wake rakshasis** — it is a gentle, sacred light.
- The strategic loop this creates: **move briefly by the risky little lamp**, and when near sleepers or unsure, **stop and pray** for the **safe, wide** aura to scout the route, then move on. (This makes *stillness/patience* literally reveal the safe path — the contemplative lesson, made mechanical.)

### 0.6 The rakshasis — **sleeping, female, scattered**
- **Female rakshasis** (this is the **Ashoka Vanam**, guarded by Ravana's women) **sleep all across the map at different places**.
- If the **lamp** lingers on a sleeper she **stirs and wakes** (sits up, rubs eyes, looks about) — **never chases, never harms, never a game-over**. Waking is **gradual and forgiving** (a quick pass won't wake her); left in shadow she **yawns and lies back down**.
- A woken rakshasi causes **commotion** that **worries Sitamma** (see §0.7).

### 0.7 Sitamma's mood — **don't startle her**
- Sitamma is **always on screen in dim light**, top-right under her tree.
- **If there is commotion elsewhere** (a rakshasi woken), Sitamma becomes **worried**: her **face changes** (anxious) and the **lighting around her tree changes** (cooler/uneasy).
- **Note to the user (shown):** *"Do not startle Sitamma before you reach her — or she will think it is Ravana's plan."* If you barge up to her while she is frightened, she **recoils and turns away** (thinking you another illusion) — **no failure**, you simply must **let the grove settle / reassure her** and try again. Fear **decays** as the grove quietens.

### 0.8 Items — **collect 3–4 without waking the rakshasis**
- Scattered across the grove are **Rama's keepsakes (gurutulu)** — **3 small glowing tokens** — plus the **chūḍāmaṇi**, the most precious, more **guarded** item near Sitamma's quarter. **Collect all the items without waking the rakshasis.**
- Each keepsake gathered **slightly widens Hanuman's aura** (his devotion/resolve grows), making the later, darker stretch kinder.
- You must be **holding the chūḍāmaṇi** before you can complete the meeting with Sitamma.

### 0.9 The meeting — **toss the chūḍāmaṇi first, then grow**
- **Note to the user (shown) as you approach Sitamma:** *"First **toss the chūḍāmaṇi** to her — let Sitamma be pacified by Rama's keepsake, rather than suspect you."*
- The ceremonial act: a **toss** (a clear tap prompt / gentle flick) lowers/arcs the **chūḍāmaṇi** to her. Seeing Rama's jewel, her **fear dissolves**, recognition blooms (warm light, petals).
- Then Hanuman draws near in **añjali**, and **grows great** (he scales up with a glow), the grove flowers, fog lifts, the moon brightens toward **dawn**. **End on hope:** *"Hope is carried home."* Tap to rest / play again (a **new board**).

### 0.10 Antics — **idle & moving**
- **All of Hanuman's antics** (from §3 below) play **while idle or moving**: walk/hop while guided; while idle he breaks into sweet **Bala-Hanuman antics** (reach-for-the-moon-fruit, tail-chase/spin, head-scratch, curious peek/tilt, little hops, catch-a-firefly, yawn & stretch, paw-splash near a pond) and, left longer or near Sitamma, settles into **añjali (Rāma nāma)** — which is also what triggers the aura.

### 0.11 No-fail, reverent
- Consistent with all of this user's epic-kids work: **the hero never loses to evil**; the only adversary is **doubt/fear**; setbacks merely **delay**. **Telugu names** (Hanumanthudu, Sitamma, Ramudu). **No quizzes.**

### 0.12 Phase-1 coverage checklist (every line of the brief)
- [x] Night search for Sita mata under moonlight; give her the chūḍāmaṇi.
- [x] Hanuman (small monkey) at **bottom-left**; Sita mata at **top-right under a tree**.
- [x] Whole page **moonlit, cloud-covered, foggy, deep dark-blue night** palette.
- [x] Movement via **joystick**.
- [x] Map is a **maze of ponds, lotuses, bridges** (+ more elements).
- [x] **Rakshasas sleeping** all across the map at different places — **female**, Ashoka-vanam.
- [x] **Two light ranges:** real **lamp** (small, used to move, **wakes** rakshasis) and **aura** (bigger, from being lost / patient / **saying Ram naam**, does **not** wake).
- [x] **Antics** of Hanuman (from §3) while **idle or moving**.
- [x] Aim: **don't startle Sita**, reach her, **give the chūḍāmaṇi**, then **grow bigger**.
- [x] **Single screen**, bottom-left → top-right, **collect 3–4 items** without waking rakshasis, **Sita always visible in dim light**.
- [x] If Sita is worried by commotion: **change her face + lighting around her tree**; **note to user** not to startle her before reaching her, lest she think it Ravana's plan.
- [x] Approaching Sita: **note to user — toss the chūḍāmaṇi first** so she is pacified rather than suspicious.
- [x] All written **clearly in the design doc first** (this §0).
- [x] **Good sprites first go** — mood/moon lighting, whole path, maze nuances (rendered + QA'd).
- [x] **New board each open** (dynamic/procedural).
- [x] **Music deferred** — not in Phase 1.
- [x] **Another PWA under the same repo** (`flares/game/ashoka-grove/`); **commit + push**.

---

## 1. Design pillars (non-negotiables)
1. **Mechanic = meaning.** The lamp/aura tension teaches *patience and Rāma-nāma reveal the safe way*; the "don't startle Sitamma" goal teaches *gentleness earns trust*.
2. **Revel in beauty** (*Sundara Kāṇḍa*, "the Beautiful Canto"): contemplative, painterly, moonlit.
3. **The deity never loses; there is no failure.** Doubt/fear only delays.
4. **Telugu-themed names.**
5. **No quizzes.**
6. **Mixed / family audience**, wordless-playable for little ones.

## 2. Narrative arc (Phase 1)
Sorrow → Search → Trust → Dawn. A single unbroken moonlit Ashoka Vatika; Hanuman crosses it to a grieving, fearful Sitamma, proves himself with Rama's chūḍāmaṇi, and carries hope home before any burning of Lanka.

## 3. Bala Hanumanthudu — antics (build target)
Procedurally drawn, small & childlike, fully pose-animated. A small state machine: `walk`, `hop`, `idle-breathe`, and antics — **reach-for-the-moon-fruit** *(signature)*, **tail-chase/spin**, **head-scratch**, **curious peek/tilt**, **little hops**, **catch-a-firefly**, **yawn & stretch**, **paw-splash** (near water), **pray/añjali** (Rāma nāma; triggers the aura), **bow**. Never mocking; always reverent and childlike.

## 4. State machine (scene `grove.js`)
`intro → explore → approach → reunion → dawn → end`.
- **intro:** title + how-to note; tap to begin.
- **explore:** the main loop (joystick move, lamp/aura lighting, rakshasi waking, Sitamma mood, gather keepsakes + chūḍāmaṇi).
- **approach:** holding the chūḍāmaṇi inside Sitamma's zone → toss prompt.
- **reunion:** toss → recognition → Hanuman añjali.
- **dawn:** Hanuman grows great; grove blooms; fog lifts; moon → dawn.
- **end:** "Hope is carried home"; tap → new board.

## 5. Scoring / persistence (minimal, experiential)
- **No win/lose number.** Surface only **keepsakes kept (x/3)** + the chūḍāmaṇi, and a gentle **calm** read of the visit.
- Persist (`localStorage`, `ashokaGrove.save.v2`): `visits`, `bestKeepsakes`, `completed`, `settings {muted}`.

## 6. Art direction
- **Palette:** indigo/violet night (`#0a0a24`→`#1a1747`→`#2a2a66`), silver moon `#dfe7ff`, warm lamp gold `#ffcf6b`, soft Rāma-nāma aura `#9fd0ff`/`#bfe0ff`, ashoka red-orange blossoms, lotus pink, jewel greens; low fog in pale `#9fb0e0` at low alpha.
- **Valmiki similes as visuals:** Sitamma "like the moon veiled by cloud" (a pale veil that lifts as trust grows); the grove revived as hope rises.
- Distant **gold Lanka spires**; the **simsupa tree** bower; lotus ponds; hanging garden lamps; fireflies.

## 7. Files (Phase 1)
- `js/engine.js` — reused (virtual 720×1280 stage, loop, pointer input, particles, math/draw utils; global `DG`).
- `js/audio.js` — reused (gentle SFX hooked; music deferred — not started in Phase 1).
- `js/storage.js` — minimal persistence (§5).
- `js/art_grove.js` — night-grove scenery + Bala Hanumanthudu sprite/antics + rakshasi (sleep/stir/awake) + Sitamma (mood states) + lotus/pond/bridge/hedge + keepsakes + chūḍāmaṇi + moon/fog/fireflies + Lanka spires.
- `js/ui_grove.js` — floating **joystick**, contextual **note/toast** banner, **keepsake HUD**, **toss** prompt, mute toggle, intro & end cards.
- `js/grove.js` — board generation + connectivity, Hanuman controller, **lamp/aura** lighting (fog-of-war), rakshasi waking, Sitamma mood, items, toss, reunion, growth, dawn, end.
- `js/main.js` — splash (tap → unlock audio), boot, service-worker registration.
- `index.html`, `styles.css`, `manifest.webmanifest`, `service-worker.js` — shell (portrait, full-screen canvas, letterbox; offline).
- `assets/` — generated PWA icons (a glowing **diya + lotus** under a **crescent moon**, indigo night) + `generate_icons.py`.

## 8. Research notes (carry-forward)
- **Sundara Kāṇḍa = "the Beautiful Canto"** — centers on Hanuman (selflessness) and Sita (steadfast dharma); its heart is devotion, longing, hope.
- **Token note (myth vs. game):** Traditionally Hanuman gives Sita **Rama's ring (anguliya)** and *receives* her **chūḍāmaṇi** to carry back. This game follows the brief: Hanuman **tosses the chūḍāmaṇi to Sitamma** as the proof-keepsake that calms her. Treated reverently as "Rama's keepsake"; the nuance is noted here intentionally.
- **Bala Hanuman lore:** the child who leapt at the sun/moon thinking it a ripe fruit — basis of the signature "reach for the moon-fruit" antic (charm kept, violence dropped).

## 9. Cross-project notes
- **Divya Gatha** lives in the **same repo** (`flares/game`, root). This game borrows its `engine.js`, art patterns, PWA shell shape, and the PIL-icon + canvas-render/smoke-test verification workflow. Content principles (hero never loses; Telugu names; no quizzes; reverent & gentle) apply.
