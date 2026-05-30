# Divya Gatha · దివ్య గాథ

**Epic adventures of the Ramayana & Mahabharata — a beautiful, gentle, offline play-app for children.**

Divya Gatha ("Divine Saga") is an installable Progressive Web App with three
hand-crafted mini-games drawn from our epics. There are **no quizzes** — children
*learn by playing and exploring*. The deities and heroes always succeed; there is
never a moment where the divine is lost to evil. It is calm, ad-free, and works
fully offline once installed.

Everything — art, characters, animation, music and sound — is generated in code
(HTML5 Canvas + Web Audio). There are no external libraries and no tracking.

---

## The three games

### 1. 🐒 Hanumanthudu's Leap · హనుమంతుడి లంఘనం  *(Ramayana)*
A serene flight across the great ocean to Lanka to find Sitamma.
**Hold** anywhere to rise, **release** to glide. Gather golden blessings and
Rama-nama orbs. Storm clouds and rocks only cost a little *devotion* — when it
runs low, Hanumanthudu simply pauses to breathe and flies on. **He never loses.**
The only ending is reaching Lanka and finding Sitamma safe.

### 2. 🌉 Setu Bandhanam · సేతు బంధనం  *(Ramayana)*
Build Ramudu's floating bridge of stones to Lanka. A glowing **"రామ"** stone
drifts up and down — **tap** to drop it in line. A clean line is a "Perfect!".
Miss badly, and the famous little squirrel rushes in to patch the gap, because
*every effort, big or small, matters* — so the bridge always reaches Lanka.

### 3. 🎯 Arjunudu's Lakshyam · అర్జునుడి లక్ష్యం  *(Mahabharata)*
The Matsya-Yantra: pierce the eye of the spinning golden fish, the way Arjunudu
did. **Hold** to draw the bow and gather focus — the world quietly dims until
only the eye remains, and the wheel slows as your concentration deepens.
**Release** to loose the arrow. The calmer and fuller your focus, the truer it
flies. Missed shots just land in the petals — breathe and try again.
*Focus on one point, and you cannot miss.*

A shared **hub** ties them together: every game earns **blessings** and up to
**3 stars**, all saved on your device. Stars light up the *lamps of devotion*
around the home temple.

---

## Also in this repo: 🪔 A Light in the Ashoka Grove · అభయం  *(Sundara Kāṇḍa)*

A separate, **standalone PWA** living in [`ashoka-grove/`](ashoka-grove/) — a
contemplative, single-screen **night search**. Guide tiny **Bala Hanumanthudu**
with a joystick across a moonlit, fog-veiled maze of ponds, lotuses and bridges
to a grieving **Sitamma** under her tree. His little **lamp** lights the way —
but it **wakes the sleeping rakshasis**; pause and say **Rāma-nāma** and a wider,
**safe aura** reveals the path. Gather Rama's keepsakes and the **chūḍāmaṇi**,
don't startle Sitamma, **toss her the jewel** so she knows you are no illusion of
Ravana — then Hanuman **grows great** and hope dawns. A **new board every visit**.
It has its own installable manifest/service-worker (served at `/ashoka-grove/`).
See [`ashoka-grove/GAME_DESIGN.md`](ashoka-grove/GAME_DESIGN.md).

---

## Install it on your phone (PWA)

The game is served over HTTPS so it can be **installed to your home screen** and
played offline like a normal app.

- **Android (Chrome):** open the site, then menu **⋮ → Add to Home screen / Install app**.
- **iPhone/iPad (Safari):** open the site, tap **Share → Add to Home Screen**.

Once added, launch it from the icon — it runs full-screen, in portrait, and works
with no internet connection.

> Tip: it plays best held upright (portrait). Tap once on the opening screen to
> begin — this also turns on the gentle background music (there's a 🔊 toggle on
> the home screen).

## Run it locally (for development)

Service workers and "install" require the files to be *served* (not opened as a
`file://` path). Any static server works:

```bash
cd game
python3 -m http.server 8000
# then open http://localhost:8000/
```

## Privacy

No accounts, no ads, no analytics, no network calls. Progress (stars, blessings)
is stored only in this browser via `localStorage`.

---

## A note of respect

This little app is made with affection for our epics and the values they carry —
courage and devotion (Hanumanthudu), humility and teamwork (the bridge, and the
squirrel), and single-pointed focus (Arjunudu). The stories are simplified for
small children and the heroes are always honoured. Telugu-themed names are used
throughout (Hanumanthudu, Ramudu, Sitamma, Arjunudu).

## Project layout

```
game/
├── index.html              # PWA shell
├── manifest.webmanifest    # installable app metadata
├── service-worker.js       # offline caching
├── styles.css
├── assets/                 # generated icons (+ generate_icons.py)
└── js/
    ├── engine.js           # virtual-res stage, loop, input, scenes, particles
    ├── audio.js            # synthesized music + SFX (Web Audio)
    ├── storage.js          # cross-game stats/progress
    ├── art.js              # all scenery & characters, drawn in code
    ├── ui.js               # buttons, panels, story/result cards
    ├── scene_home.js       # the hub
    ├── game_hanuman.js     # Game 1
    ├── game_setu.js        # Game 2
    ├── game_arjuna.js      # Game 3
    └── main.js             # registry, flow, bootstrap

ashoka-grove/                # standalone PWA — A Light in the Ashoka Grove
├── index.html  styles.css  manifest.webmanifest  service-worker.js
├── GAME_DESIGN.md           # full Phase-1 gameplay spec
├── assets/                  # generated icons (+ generate_icons.py)
├── tools/                   # headless render + smoke harness (node-canvas)
└── js/  engine.js  audio.js  storage.js  art_grove.js  ui_grove.js  grove.js  main.js
```

*Jai Shri Ram. 🙏*
