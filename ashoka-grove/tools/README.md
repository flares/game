# Ashoka Grove — verification harness

Headless rendering + a smoke test for the game, using [`node-canvas`].
These mock a tiny browser env (`window`/`document`/`localStorage`/`AudioContext`)
and run the game's classic scripts under Node so we can render scenes to PNGs
and drive the scene through every state with no runtime errors.

```bash
cd tools
npm install        # builds node-canvas (needs system Cairo libs)
npm run smoke      # drive intro→explore→approach→toss→reunion→dawn→end; assert solvability
npm run render     # write QA PNGs to ./out (grove_*, sprites, intro, end, reunion_clean)
```

`smoke.js` also stress-generates 300 boards and asserts Sitamma, the chūḍāmaṇi
and every keepsake stay reachable (the maze is always solvable).
Neither `out/` nor `node_modules/` is committed.

[`node-canvas`]: https://github.com/Automattic/node-canvas
