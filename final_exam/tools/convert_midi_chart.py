#!/usr/bin/env python3
"""Convert a Standard MIDI File melody track into a mellow beat chart."""

from __future__ import annotations

import argparse
import json
import math
import struct
from dataclasses import dataclass
from pathlib import Path


NOTE_NAMES = ("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")
DRUM_PATTERN = ("kick", None, "hihat", None, "snare", None, "hihat", None)


@dataclass(frozen=True)
class MidiNote:
    track: int
    channel: int
    start_tick: int
    end_tick: int
    pitch: int
    velocity: int


@dataclass
class TrackData:
    name: str
    notes: list[MidiNote]
    tempos: list[tuple[int, int]]
    programs: dict[int, set[int]]
    pitch_bends: dict[int, int]


def read_vlq(data: bytes, index: int) -> tuple[int, int]:
    value = 0
    while True:
        byte = data[index]
        index += 1
        value = (value << 7) | (byte & 0x7F)
        if byte & 0x80 == 0:
            return value, index


def decode_text(payload: bytes) -> str:
    for encoding in ("utf-8", "cp949", "latin1"):
        try:
            return payload.decode(encoding).strip("\x00")
        except UnicodeDecodeError:
            continue
    return ""


def parse_track(data: bytes, track_index: int) -> TrackData:
    index = 0
    tick = 0
    running_status: int | None = None
    name = ""
    tempos: list[tuple[int, int]] = []
    programs: dict[int, set[int]] = {}
    pitch_bends: dict[int, int] = {}
    active: dict[tuple[int, int], list[tuple[int, int]]] = {}
    notes: list[MidiNote] = []

    while index < len(data):
        delta, index = read_vlq(data, index)
        tick += delta
        status = data[index]

        if status < 0x80:
            if running_status is None:
                raise ValueError(f"Track {track_index} has data without running status")
            status = running_status
        else:
            index += 1
            if status < 0xF0:
                running_status = status

        if status == 0xFF:
            meta_type = data[index]
            index += 1
            length, index = read_vlq(data, index)
            payload = data[index : index + length]
            index += length
            if meta_type in (0x03, 0x04) and payload and not name:
                name = decode_text(payload)
            elif meta_type == 0x51 and length == 3:
                tempos.append((tick, int.from_bytes(payload, "big")))
            elif meta_type == 0x2F:
                break
        elif status in (0xF0, 0xF7):
            length, index = read_vlq(data, index)
            index += length
        else:
            event_type = status & 0xF0
            channel = (status & 0x0F) + 1
            if event_type in (0xC0, 0xD0):
                value = data[index]
                index += 1
                if event_type == 0xC0:
                    programs.setdefault(channel, set()).add(value + 1)
            else:
                first = data[index]
                second = data[index + 1]
                index += 2
                if event_type == 0x90 and second > 0:
                    active.setdefault((channel, first), []).append((tick, second))
                elif event_type == 0x80 or (event_type == 0x90 and second == 0):
                    queue = active.get((channel, first))
                    if queue:
                        start_tick, velocity = queue.pop(0)
                        notes.append(
                            MidiNote(track_index, channel, start_tick, tick, first, velocity)
                        )
                elif event_type == 0xE0:
                    pitch_bends[channel] = pitch_bends.get(channel, 0) + 1

    return TrackData(name, notes, tempos, programs, pitch_bends)


def parse_midi(path: Path) -> tuple[int, list[TrackData]]:
    data = path.read_bytes()
    index = 0
    if data[index : index + 4] != b"MThd":
        raise ValueError(f"{path} is not a Standard MIDI File")
    index += 4
    header_length = struct.unpack(">I", data[index : index + 4])[0]
    index += 4
    _format_type, track_count, division = struct.unpack(">HHH", data[index : index + 6])
    if division & 0x8000:
        raise ValueError("SMPTE MIDI timing is not supported")
    index += header_length

    tracks: list[TrackData] = []
    for track_index in range(track_count):
        if data[index : index + 4] != b"MTrk":
            raise ValueError(f"Missing MTrk chunk at track {track_index}")
        index += 4
        length = struct.unpack(">I", data[index : index + 4])[0]
        index += 4
        tracks.append(parse_track(data[index : index + length], track_index))
        index += length

    return division, tracks


def build_tick_converter(ppq: int, tempos: list[tuple[int, int]]):
    tempo_map = sorted(set(tempos)) or [(0, 500000)]
    if tempo_map[0][0] != 0:
        tempo_map.insert(0, (0, 500000))

    def to_seconds(tick: int) -> float:
        seconds = 0.0
        last_tick, last_tempo = tempo_map[0]
        for next_tick, next_tempo in tempo_map[1:]:
            if tick < next_tick:
                return seconds + (tick - last_tick) * last_tempo / 1_000_000 / ppq
            seconds += (next_tick - last_tick) * last_tempo / 1_000_000 / ppq
            last_tick, last_tempo = next_tick, next_tempo
        return seconds + (tick - last_tick) * last_tempo / 1_000_000 / ppq

    return to_seconds


def midi_note_name(pitch: int) -> str:
    if not 0 <= pitch <= 127:
        raise ValueError(f"Invalid MIDI pitch: {pitch}")
    return f"{NOTE_NAMES[pitch % 12]}{pitch // 12 - 1}"


def group_notes(tracks: list[TrackData]) -> dict[tuple[int, int], list[MidiNote]]:
    groups: dict[tuple[int, int], list[MidiNote]] = {}
    for track in tracks:
        for note in track.notes:
            groups.setdefault((note.track, note.channel), []).append(note)
    return groups


def choose_group(
    tracks: list[TrackData],
    groups: dict[tuple[int, int], list[MidiNote]],
    track: int | None,
    channel: int | None,
) -> tuple[int, int]:
    if track is not None and channel is not None:
        key = (track, channel)
        if key not in groups:
            raise ValueError(f"No notes found for track {track}, channel {channel}")
        return key

    named = [
        key
        for key in groups
        if "melody guide" in tracks[key[0]].name.lower() and key[1] != 10
    ]
    if named:
        return max(named, key=lambda key: len(groups[key]))

    program_66 = [
        key
        for key in groups
        if key[1] != 10 and 66 in tracks[key[0]].programs.get(key[1], set())
    ]
    if program_66:
        return max(program_66, key=lambda key: len(groups[key]))

    playable = [
        key
        for key, notes in groups.items()
        if key[1] != 10 and 20 <= len(notes) <= 220
    ]
    if playable:
        return max(playable, key=lambda key: len(groups[key]))

    raise ValueError("Could not choose a melody track automatically")


def collapse_polyphony(notes: list[MidiNote]) -> list[MidiNote]:
    by_start: dict[int, list[MidiNote]] = {}
    for note in notes:
        by_start.setdefault(note.start_tick, []).append(note)
    return [max(group, key=lambda note: (note.pitch, note.velocity)) for group in by_start.values()]


def filter_min_gap(notes: list[MidiNote], to_seconds, min_gap_ms: int) -> list[MidiNote]:
    result: list[MidiNote] = []
    last_time_ms = -math.inf
    for note in sorted(notes, key=lambda item: (item.start_tick, -item.pitch)):
        time_ms = round(to_seconds(note.start_tick) * 1000)
        if time_ms - last_time_ms >= min_gap_ms:
            result.append(note)
            last_time_ms = time_ms
    return result


def build_chart(
    source: Path,
    title: str,
    notes: list[MidiNote],
    to_seconds,
    lead_in_ms: int,
    min_gap_ms: int,
    track_name: str,
    bpm: int,
) -> dict:
    filtered = filter_min_gap(collapse_polyphony(notes), to_seconds, min_gap_ms)
    if not filtered:
        raise ValueError("Selected MIDI group produced no chart notes")

    first_start = min(note.start_tick for note in filtered)
    pitches = [note.pitch for note in filtered]
    min_pitch = min(pitches)
    max_pitch = max(pitches)
    pitch_span = max(1, max_pitch - min_pitch)

    chart_notes = []
    for index, note in enumerate(filtered):
        start = to_seconds(note.start_tick) - to_seconds(first_start)
        end = to_seconds(note.end_tick) - to_seconds(first_start)
        duration = max(0.06, end - start)
        x = (note.pitch - min_pitch) / pitch_span
        chart_note = {
            "time": round(start * 1000 + lead_in_ms),
            "x": round(x, 3),
            "note": midi_note_name(note.pitch),
            "midiPitch": note.pitch,
            "duration": round(duration, 3),
        }
        drum = DRUM_PATTERN[index % len(DRUM_PATTERN)]
        if drum:
            chart_note["drum"] = drum
        chart_notes.append(chart_note)

    return {
        "title": title,
        "bpm": bpm,
        "source": source.name,
        "midiTrack": track_name,
        "notes": chart_notes,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--title", required=True)
    parser.add_argument("--track", type=int)
    parser.add_argument("--channel", type=int)
    parser.add_argument("--lead-in-ms", type=int, default=1200)
    parser.add_argument("--min-gap-ms", type=int, default=120)
    args = parser.parse_args()

    ppq, tracks = parse_midi(args.input)
    groups = group_notes(tracks)
    track_index, channel = choose_group(tracks, groups, args.track, args.channel)
    all_tempos = [tempo for track in tracks for tempo in track.tempos]
    bpm = round(60_000_000 / (sorted(all_tempos)[0][1] if all_tempos else 500000))
    to_seconds = build_tick_converter(ppq, all_tempos)
    track = tracks[track_index]
    chart = build_chart(
        args.input,
        args.title,
        groups[(track_index, channel)],
        to_seconds,
        args.lead_in_ms,
        args.min_gap_ms,
        f"track {track_index}, channel {channel}, {track.name or 'unnamed'}",
        bpm,
    )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(chart, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    bend_count = track.pitch_bends.get(channel, 0)
    warning = f", pitch-bend events ignored: {bend_count}" if bend_count else ""
    print(
        f"Wrote {args.output} ({len(chart['notes'])} notes, "
        f"track {track_index}, channel {channel}{warning})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
