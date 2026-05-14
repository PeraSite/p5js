# Nose Piano

This project is a fixed 9:16 vertical mobile p5.js/ml5.js faceMesh rhythm game.
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
The mirrored camera-space faceMesh nose landmark.
_Avoid_: hand input, finger x

**Hit window**:
The timing tolerance that decides whether a collision is scored as on-beat.
_Avoid_: catch line, wait zone

## Relationships

- Chart timing controls when notes reach the play area.
- Chart lane data controls each note's x position and assigned pitch.
- The camera request, displayed camera crop, playfield, and faceMesh coordinate mapping all use the same 9:16 stage.
- faceMesh controls the character with the user's nose landmark, so the game works even when only the face is visible.
- Character position is derived from the camera face point only; touch, drag, mouse, and arrow input do not move it.
- A note sounds when it physically collides with the character anywhere in the 9:16 stage.
- On-beat collisions increase score and combo.
- Off-beat collisions still trigger the pitch, but reset combo and count against accuracy so the melody sounds mistimed.
- Fully missed notes reset combo and trigger a short dissonant miss sound.
