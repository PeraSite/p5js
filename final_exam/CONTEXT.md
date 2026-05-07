# Lift Mania

This project is a two-hand camera rhythm game for osu!mania maps.
The player rests each index finger in the bottom wait zone, then lifts the correct finger upward when a falling note reaches the hit line.

## Language

**Lane**:
One vertical falling-note track owned by a hand.
_Avoid_: wheel sector, radial slice

**Wait zone**:
The bottom area where a resting finger should stay before a note is due.
_Avoid_: off center, button

**Lift input**:
The frame where an index finger leaves the wait zone upward.
_Avoid_: hover, hold position

**Playable chord**:
A set of simultaneous notes that requires no more than one lane per hand.
_Avoid_: raw chord, impossible chord

**Falling approach**:
The visual movement of a note from the top of a lane down into the hit line.
_Avoid_: radial approach

## Relationships

- An 8K mania lane maps to exactly one hand and one lane.
- The left hand owns lanes 1-4; the right hand owns lanes 5-8.
- A tap note is hit only when the correct index finger lifts upward out of the wait zone during the timing window.
- A hold note starts with a lift input, then passes while the same finger stays in the matching lane above the wait zone.
- The importer removes extra same-hand simultaneous notes to keep every chord playable with two index fingers.
