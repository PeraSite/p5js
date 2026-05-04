# Camera Rhythm Game

This context describes how osu beatmaps become playable two-hand camera charts.
The language focuses on player movement boundaries rather than osu editor fidelity.

## Language

**Hand lane**:
One side of the playable screen owned by a single hand.
_Avoid_: half, region, side

**Center buffer**:
The unplayable space between the two hand lanes.
_Avoid_: middle, center line

**Slider ownership**:
The rule that a slider belongs entirely to the hand lane of its starting point.
_Avoid_: cross-hand slider, shared slider

**Lane margin**:
The inner playable padding that keeps converted targets away from hand lane edges.
_Avoid_: dead zone, clamp

**Hand cooldown**:
The minimum time a hand needs before receiving another playable note.
_Avoid_: debounce, gap

**Three-point slider**:
A converted slider represented by start, middle, and end targets.
_Avoid_: full curve, raw osu slider

## Relationships

- A **Hand lane** is separated from the other **Hand lane** by exactly one **Center buffer**
- A slider has exactly one **Slider ownership**
- **Slider ownership** keeps every point of the slider inside one **Hand lane**
- A converted target preserves its osu-side position only within the **Lane margin**
- A note that violates **Hand cooldown** is removed rather than reassigned to the other **Hand lane**
- A **Three-point slider** keeps all three points under the same **Slider ownership**

## Example Dialogue

> **Dev:** "If an osu slider starts on the right and curves into the left side, should the player cross hands?"
> **Domain expert:** "No — **Slider ownership** means the whole slider is folded into the starting **Hand lane** and never enters the **Center buffer**."
> **Dev:** "Should we preserve notes at the extreme edge of the osu playfield?"
> **Domain expert:** "Only after applying the **Lane margin**, because camera play needs room for hand jitter and target size."
> **Dev:** "If the left hand receives two fast notes, should we move one to the right hand?"
> **Domain expert:** "No — respect **Hand cooldown** by removing the extra note instead of changing its **Hand lane**."
> **Dev:** "Should we preserve every control point from osu sliders?"
> **Domain expert:** "No — use a **Three-point slider** so the game can keep its current camera-friendly tracking model."

## Flagged Ambiguities

- "map center" means the **Center buffer**, not the osu editor's x=256 line by itself.
