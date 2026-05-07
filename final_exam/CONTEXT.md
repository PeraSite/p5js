# Catch the Fruit

This project is a two-index-finger camera rhythm game inspired by osu!catch.
Fruit falls from the top on beat timings, and the player catches it by moving a bottom basket character under the fruit.
Only the x coordinates of the index fingertips matter; fingertip y coordinates are ignored.

## Language

**Fruit**:
A falling object generated from chart timing.
_Avoid_: note block, key

**Basket**:
The bottom catcher controlled by the two index fingertip x positions.
_Avoid_: lane button, wait zone

**Finger x**:
The mirrored camera-space x coordinate of an index fingertip.
_Avoid_: lift input, y position

**Catch line**:
The fixed bottom y position where fruit is judged.
_Avoid_: hit button, wait line

**Falling approach**:
The visual movement of fruit from the top of the screen down into the catch line.
_Avoid_: radial approach

## Relationships

- Chart timing controls when fruit reaches the catch line.
- Chart lane data only influences fruit x placement across the screen.
- The two detected index fingertips are sorted left to right and mapped to two separate bottom baskets.
- If fruit reaches the catch line while its x position is inside either basket, score and combo increase.
- Map selection chooses between harder two-basket fruit charts with different basket widths, timing windows, and fall speeds.
- If no hand is detected, mouse and arrow-key fallback input moves a test basket.
