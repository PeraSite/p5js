#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const input = process.argv[2];
const outputDir = process.argv[3] || "assets/mania";

if (!input) {
  console.error("Usage: node tools/import-mania-osz.js /path/to/map.osz [output-dir]");
  process.exit(1);
}

const oszPath = path.resolve(input);
const outPath = path.resolve(outputDir);
const tempDir = fs.mkdtempSync(path.join(process.cwd(), ".mania-import-"));

try {
  fs.rmSync(outPath, { recursive: true, force: true });
  fs.mkdirSync(outPath, { recursive: true });
  execFileSync("unzip", ["-qq", oszPath, "-d", tempDir]);

  const files = fs.readdirSync(tempDir);
  const osuFile = files.find((file) => file.toLowerCase().endsWith(".osu"));
  if (!osuFile) throw new Error("No .osu file found in osz");

  const osuText = fs.readFileSync(path.join(tempDir, osuFile), "utf8");
  const sections = parseSections(osuText);
  const general = parseKeyValueSection(sections.General || []);
  const metadata = parseKeyValueSection(sections.Metadata || []);
  const difficulty = parseKeyValueSection(sections.Difficulty || []);

  if (Number(general.Mode) !== 3) {
    throw new Error(`Expected osu!mania mode 3, got mode ${general.Mode || "unknown"}`);
  }

  const keyCount = Number(difficulty.CircleSize || 4);
  if (keyCount !== 4) {
    throw new Error(`Expected a 4K mania map, got ${keyCount}K`);
  }

  const backgroundFile = findBackgroundFile(sections.Events || []) || "BG.jpg";
  const audioFile = general.AudioFilename || "audio.mp3";
  copyIfExists(path.join(tempDir, audioFile), path.join(outPath, "audio.mp3"));
  copyIfExists(path.join(tempDir, backgroundFile), path.join(outPath, "background.jpg"));

  const rawNotes = parseHitObjects(sections.HitObjects || [], keyCount);
  const { notes, droppedNotes } = makeTwoHandPlayable(rawNotes);
  const manifest = {
    title: metadata.TitleUnicode || metadata.Title || "Imported mania map",
    artist: metadata.ArtistUnicode || metadata.Artist || "",
    creator: metadata.Creator || "",
    version: metadata.Version || "",
    source: path.basename(oszPath),
    audio: "assets/mania/audio.mp3",
    background: "assets/mania/background.jpg",
    keyCount,
    noteCount: notes.length,
    originalNoteCount: rawNotes.length,
    droppedNotes,
    notes,
  };

  fs.writeFileSync(path.join(outPath, "chart.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Imported ${notes.length}/${rawNotes.length} notes to ${path.relative(process.cwd(), outPath)}`);
  if (droppedNotes > 0) {
    console.log(`Dropped ${droppedNotes} notes from impossible same-hand chords.`);
  }
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function parseSections(text) {
  const sections = {};
  let current = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("//")) continue;
    const match = line.match(/^\[(.+)]$/);
    if (match) {
      current = match[1];
      sections[current] = [];
      continue;
    }
    if (current) sections[current].push(line);
  }
  return sections;
}

function parseKeyValueSection(lines) {
  const values = {};
  for (const line of lines) {
    const index = line.indexOf(":");
    if (index === -1) continue;
    values[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return values;
}

function findBackgroundFile(lines) {
  for (const line of lines) {
    const parts = splitCsv(line);
    if (parts[0] === "0" && parts[1] === "0" && parts[2]) {
      return parts[2].replace(/^"|"$/g, "");
    }
  }
  return null;
}

function parseHitObjects(lines, keyCount) {
  const notes = [];
  for (let i = 0; i < lines.length; i += 1) {
    const parts = lines[i].split(",");
    if (parts.length < 5) continue;

    const x = Number(parts[0]);
    const time = Number(parts[2]);
    const type = Number(parts[3]);
    const lane = Math.min(keyCount - 1, Math.max(0, Math.floor((x * keyCount) / 512)));
    const endTime = (type & 128) === 128 ? Number((parts[5] || "").split(":")[0]) : time;

    notes.push({
      id: `${time}-${lane}-${i}`,
      lane,
      hand: lane < 2 ? "left" : "right",
      sector: lane % 2 === 0 ? 3 : 1,
      time,
      endTime: Number.isFinite(endTime) && endTime > time ? endTime : time,
    });
  }
  return notes.sort((a, b) => a.time - b.time || a.lane - b.lane);
}

function makeTwoHandPlayable(notes) {
  const byTime = new Map();
  for (const note of notes) {
    const bucket = byTime.get(note.time) || [];
    bucket.push(note);
    byTime.set(note.time, bucket);
  }

  const playable = [];
  let droppedNotes = 0;
  for (const time of [...byTime.keys()].sort((a, b) => a - b)) {
    const bucket = byTime.get(time);
    const usedHands = new Set();
    bucket
      .sort((a, b) => duration(b) - duration(a) || a.lane - b.lane)
      .forEach((note) => {
        if (usedHands.has(note.hand)) {
          droppedNotes += 1;
          return;
        }
        usedHands.add(note.hand);
        playable.push(note);
      });
  }

  return {
    notes: playable.sort((a, b) => a.time - b.time || a.lane - b.lane),
    droppedNotes,
  };
}

function duration(note) {
  return note.endTime - note.time;
}

function splitCsv(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (const char of line) {
    if (char === "\"") quoted = !quoted;
    if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function copyIfExists(from, to) {
  if (!fs.existsSync(from)) throw new Error(`Missing asset ${from}`);
  fs.copyFileSync(from, to);
}
