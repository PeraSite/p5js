const fs = require("fs");
const path = require("path");

const STANDARD_MIN_GAP_MS = 245;
const MAX_NOTES = 190;
const LANE_MARGIN = 0.14;
const TARGET_Y_MIN = 0.18;
const TARGET_Y_MAX = 0.82;

const charts = [
  {
    id: "game-over",
    title: "GAME OVER ?",
    artist: "HANRORO",
    mapper: "Rarry",
    version: "HATE",
    modeLabel: "osu!standard",
    source: "assets/songs/game-over/source.osu",
    audio: "assets/songs/game-over/audio.mp3",
    cover: "assets/songs/game-over/background.png",
    output: "assets/songs/game-over/chart.json",
  },
  {
    id: "mirror",
    title: "MIRROR",
    artist: "HANRORO",
    mapper: "iPhone 10",
    version: "SHAKING",
    modeLabel: "osu!standard",
    source: "assets/songs/mirror/source.osu",
    audio: "assets/songs/mirror/audio.ogg",
    cover: "assets/songs/mirror/background.jpg",
    output: "assets/songs/mirror/chart.json",
  },
  {
    id: "attitude",
    title: "ATTITUDE",
    artist: "IVE",
    mapper: "KyZzo",
    version: "Normal",
    modeLabel: "osu!standard",
    source: "assets/songs/attitude/source.osu",
    audio: "assets/songs/attitude/audio.ogg",
    cover: "assets/songs/attitude/background.jpg",
    output: "assets/songs/attitude/chart.json",
  },
];

function parseOsu(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const sections = {};
  let current = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("//")) continue;

    const section = line.match(/^\[(.+)]$/);
    if (section) {
      current = section[1];
      sections[current] = [];
      continue;
    }

    if (current) sections[current].push(line);
  }

  return sections;
}

function keyValueSection(lines = []) {
  const values = {};
  for (const line of lines) {
    const index = line.indexOf(":");
    if (index === -1) continue;
    values[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return values;
}

function positiveTimingPoints(lines = []) {
  return lines
    .map((line) => {
      const parts = line.split(",");
      return {
        time: Number(parts[0]),
        beatLength: Number(parts[1]),
      };
    })
    .filter((point) => Number.isFinite(point.time) && point.beatLength > 0)
    .sort((a, b) => a.time - b.time);
}

function timingAt(points, time) {
  let selected = points[0] || { beatLength: 500 };
  for (const point of points) {
    if (point.time > time) break;
    selected = point;
  }
  return selected;
}

function convertChart(config) {
  const sections = parseOsu(config.source);
  const general = keyValueSection(sections.General);
  const metadata = keyValueSection(sections.Metadata);
  const difficulty = keyValueSection(sections.Difficulty);
  const mode = Number(general.Mode || 0);
  const timingPoints = positiveTimingPoints(sections.TimingPoints);
  const sliderMultiplier = Number(difficulty.SliderMultiplier || 1.4);
  const objects = (sections.HitObjects || []).map(parseHitObject).filter(Boolean);
  if (mode === 3) {
    throw new Error(`${config.source} is not osu!standard; only standard charts are supported`);
  }

  const rawNotes = convertStandard(objects, timingPoints, sliderMultiplier);
  const notes = foldPlayable(rawNotes, STANDARD_MIN_GAP_MS);
  const lastTime = notes.reduce((latest, note) => Math.max(latest, note.time + (note.duration || 0)), 0);

  return {
    id: config.id,
    title: metadata.TitleUnicode || metadata.Title || config.title,
    titleAscii: metadata.Title || config.title,
    artist: metadata.ArtistUnicode || metadata.Artist || config.artist,
    artistAscii: metadata.Artist || config.artist,
    mapper: metadata.Creator || config.mapper,
    version: metadata.Version || config.version,
    mode: "standard",
    modeLabel: config.modeLabel,
    beatmapId: metadata.BeatmapID || null,
    beatmapSetId: metadata.BeatmapSetID || null,
    audio: config.audio,
    cover: config.cover,
    sourceOsu: config.source,
    firstNoteTime: notes[0]?.time || 0,
    lastNoteTime: lastTime,
    noteCount: notes.length,
    notes,
  };
}

function parseHitObject(line, index) {
  const parts = line.split(",");
  const x = Number(parts[0]);
  const y = Number(parts[1]);
  const time = Number(parts[2]);
  const type = Number(parts[3]);
  if (![x, y, time, type].every(Number.isFinite)) return null;

  return {
    index,
    x,
    y,
    time,
    type,
    params: parts.slice(5),
    raw: line,
  };
}

function convertStandard(objects, timingPoints, sliderMultiplier) {
  return objects.flatMap((object) => {
    const isCircle = Boolean(object.type & 1);
    const isSlider = Boolean(object.type & 2);
    const target = standardTarget(object.x, object.y);

    if (isCircle) {
      return [
        {
          type: "tap",
          time: object.time,
          targets: [target],
          source: "standard-circle",
        },
      ];
    }

    if (!isSlider) return [];

    const curve = object.params[0] || "";
    const repeat = Math.max(1, Number(object.params[1] || 1));
    const pixelLength = Number(object.params[2] || 80);
    const beatLength = timingAt(timingPoints, object.time).beatLength;
    const duration = clamp((pixelLength / (100 * sliderMultiplier)) * beatLength * repeat, 360, 1700);
    const points = sliderPoints(object, curve);

    return [
      {
        type: "slider",
        time: object.time,
        duration: Math.round(duration),
        points,
        source: "standard-slider",
      },
    ];
  });
}

function sliderPoints(object, curve) {
  const ownerSide = osuSide(object.x);
  const coordinates = [{ x: object.x, y: object.y }];
  for (const point of curve.split("|").slice(1)) {
    const [x, y] = point.split(":").map(Number);
    if (Number.isFinite(x) && Number.isFinite(y)) coordinates.push({ x, y });
  }

  const start = coordinates[0];
  const middle = coordinates[Math.floor((coordinates.length - 1) / 2)] || start;
  const end = coordinates[coordinates.length - 1] || start;
  return [start, middle, end].map((point) => standardTarget(point.x, point.y, ownerSide));
}

function standardTarget(osuX, osuY, forcedSide = osuSide(osuX)) {
  const side = forcedSide;
  const sideX = foldedSideX(osuX, side);
  return {
    side,
    x: clamp(sideX, LANE_MARGIN, 1 - LANE_MARGIN),
    y: clamp(osuY / 384, TARGET_Y_MIN, TARGET_Y_MAX),
  };
}

function osuSide(osuX) {
  return osuX < 256 ? "left" : "right";
}

function foldedSideX(osuX, side) {
  if (side === "left") {
    return osuX < 256 ? osuX / 256 : (512 - osuX) / 256;
  }

  return osuX >= 256 ? (osuX - 256) / 256 : (256 - osuX) / 256;
}

function foldPlayable(rawNotes, minGapMs) {
  const sorted = rawNotes.sort((a, b) => a.time - b.time);
  const byTime = new Map();

  for (const note of sorted) {
    const bucket = Math.round(note.time / 24) * 24;
    if (!byTime.has(bucket)) byTime.set(bucket, []);
    byTime.get(bucket).push(note);
  }

  const result = [];
  const lastBySide = { left: -Infinity, right: -Infinity };

  for (const [bucket, group] of [...byTime.entries()].sort((a, b) => a[0] - b[0])) {
    const candidates = pickGroup(group);
    const usable = candidates.filter((note) => {
      const sides = noteTargets(note).map((target) => target.side);
      return sides.every((side) => bucket - lastBySide[side] >= minGapMs);
    });

    if (usable.length === 0) continue;

    const dualTargets = dualFrom(usable);
    if (dualTargets) {
      result.push({
        id: `dual-${bucket}-${result.length}`,
        type: "dual",
        time: bucket,
        targets: dualTargets,
      });
      lastBySide.left = bucket;
      lastBySide.right = bucket;
    } else {
      const note = usable[0];
      const normalized = normalizeNote(note, bucket, result.length);
      result.push(normalized);
      for (const side of noteTargets(normalized).map((target) => target.side)) {
        lastBySide[side] = bucket;
      }
    }

    if (result.length >= MAX_NOTES) break;
  }

  return result;
}

function pickGroup(group) {
  const sliders = group.filter((note) => note.type === "slider");
  if (sliders.length > 0) return sliders.slice(0, 2);
  return group.slice(0, 4);
}

function dualFrom(notes) {
  const taps = notes.filter((note) => note.type === "tap");
  const left = taps.find((note) => note.targets[0].side === "left");
  const right = taps.find((note) => note.targets[0].side === "right");
  if (!left || !right) return null;
  return [left.targets[0], right.targets[0]];
}

function normalizeNote(note, time, index) {
  if (note.type === "slider") {
    return {
      id: `slider-${time}-${index}`,
      type: "slider",
      time,
      duration: Math.round(note.duration),
      points: note.points,
    };
  }

  return {
    id: `tap-${time}-${index}`,
    type: "tap",
    time,
    targets: note.targets,
  };
}

function noteTargets(note) {
  return note.type === "slider" ? [note.points[0]] : note.targets;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const manifest = {
  version: 1,
  songs: charts.map((chart) => ({
    id: chart.id,
    title: chart.title,
    artist: chart.artist,
    mapper: chart.mapper,
    version: chart.version,
    modeLabel: chart.modeLabel,
    chart: `assets/songs/${chart.id}/chart.json`,
    audio: chart.audio,
    cover: chart.cover,
  })),
};

for (const config of charts) {
  fs.mkdirSync(path.dirname(config.output), { recursive: true });
  const chart = convertChart(config);
  fs.writeFileSync(config.output, `${JSON.stringify(chart, null, 2)}\n`);
  console.log(`${config.output}: ${chart.noteCount} notes, first ${chart.firstNoteTime}ms, last ${chart.lastNoteTime}ms`);
}

fs.writeFileSync("assets/songs/index.json", `${JSON.stringify(manifest, null, 2)}\n`);
console.log("assets/songs/index.json");
