# Neon Runner

A modern, web-native spiritual successor to the classic Flash game **N**. This version keeps the tight, expressive platforming and adds a dash mechanic, reactive hazards, glow-heavy visuals, and punchy synth SFX.

## Run

Click the link: https://prithvi-moonshot.github.io/neon-runner/

Or to run locally,from this folder, start a local server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Controls
- `A/D` or `←/→` Move
- `W/Space/↑` Jump (wall jump supported)
- `Shift` Dash (short burst with cooldown)
- `R` Restart level
- `N/P` Next/Previous level

## Objective
Collect all gold and reach the exit before the timer runs out while evading snipers, rockets, and mines.

## Powerups
- Shield: blocks one lethal hit.
- Slow Time: slows the world briefly.
- Sword: lets you destroy enemies and rockets on contact.

## Lives
You can take 3 hits before a full death reset.

## Notes
Snipers and rocket launchers now hunt the player, so stay mobile and break line-of-sight.

This is a pure Canvas/Web Audio implementation—no external libraries required.
