# mellow beat

This project is a fixed 9:16 vertical mobile p5.js/ml5.js faceMesh rhythm game.
Falling marshmallows use chart timing, but no backing audio is played.
The player's nose controls the tip of a vertical skewer that stretches up from the bottom fire.
When the skewer tip touches a roasted marshmallow before it crosses the guide line, the game plays that note's assigned piano pitch.
If the player misses marshmallows, the intended melody becomes sparse or wrong.

## Language

**Note**:
A falling marshmallow generated from chart timing.
_Avoid_: fruit, block, music note

**Skewer**:
The vertical rod controlled by the player's nose position. Only the tip can score.
_Avoid_: basket, catcher, finger

**Face point**:
The mirrored camera-space faceMesh nose landmark.
_Avoid_: hand input, finger x

**Roast guide**:
The timing line that marks when marshmallows become properly roasted.
_Avoid_: catch line, wait zone

## Relationships

- Chart timing controls when notes reach the play area.
- Chart lane data controls each note's x position and assigned pitch.
- The camera request, displayed camera crop, playfield, and faceMesh coordinate mapping all use the same 9:16 stage.
- faceMesh controls the skewer tip with the user's nose landmark, so the game works even when only the face is visible.
- Skewer position is derived from the camera face point only; touch, drag, mouse, and arrow input do not move it.
- A marshmallow sounds when the skewer tip hits it inside the pre-line roast window.
- Tip hits on roasted marshmallows increase score and combo.
- Side collisions, under-roasted hits, and burnt hits eject the marshmallow and count against accuracy.
- Fully missed marshmallows reset combo.
