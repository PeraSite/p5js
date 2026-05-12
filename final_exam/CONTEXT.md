# Nose Piano

This project is a vertical mobile p5.js/ml5.js bodyPose rhythm game.
Falling notes use chart timing, but no backing audio is played.
When the face-controlled character touches a falling note inside the timing window, the game plays that note's assigned piano pitch.
If the player misses notes, the intended melody becomes sparse or wrong.

## Language

**Note**:
A falling rhythm object generated from chart timing.
_Avoid_: fruit, block

**Character**:
The cat face controlled by the player's nose or head position.
_Avoid_: basket, catcher, finger

**Face point**:
The mirrored camera-space nose position, falling back to eyes/ears if nose confidence is low.
_Avoid_: hand input, finger x

**Hit window**:
The time and distance tolerance where a note can trigger its piano pitch.
_Avoid_: catch line, wait zone

## Relationships

- Chart timing controls when notes reach the play area.
- Chart lane data controls each note's x position and assigned pitch.
- bodyPose controls the character with the user's nose first, then eye/ear fallback.
- Touch, mouse, and arrow keys are only fallback controls for testing.
- On-beat collisions increase score and combo and trigger the note's piano pitch.
- Off-beat collisions still trigger the pitch, but reset combo and count against accuracy so the melody sounds mistimed.
- Fully missed notes reset combo and trigger a short dissonant miss sound.
