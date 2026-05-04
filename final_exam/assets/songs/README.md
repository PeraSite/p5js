# Song assets

Each playable song lives in its own folder:

```text
assets/songs/<song-id>/
  audio.mp3 or audio.ogg
  background.jpg or background.png
  source.osu
  chart.json
```

Add the song to `assets/songs/index.json` so the game can discover it.
Run `node tools/convert-osu.js` after changing `source.osu` or adding a converter entry.
