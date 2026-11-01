/**
 * audio-player.js
 * Web Audio API 播放器 — 零依赖
 *
 * 两条播放路径：
 *   AudioPlayer.play(scoreData, opts)     // 简谱/五线谱（note 数据）
 *   AudioPlayer.playStream(src, opts)     // 打印谱（Scribe 的 events 数据，含和弦）
 *
 * opts 回调：onNote(index, beat, totalBeats) / onEnd()
 */

// 各调式音级 → 半音偏移 (C=0)
const KEY_SEMITONES = {
  'C':  [0, 2, 4, 5, 7, 9, 11],
  'G':  [7, 9, 11, 0, 2, 4, 6],
  'D':  [2, 4, 6, 7, 9, 11, 1],
  'A':  [9, 11, 1, 2, 4, 6, 8],
  'E':  [4, 6, 8, 9, 11, 1, 3],
  'B':  [11, 1, 3, 4, 6, 8, 10],
  'F#': [6, 8, 10, 11, 1, 3, 5],
  'F':  [5, 7, 9, 10, 0, 2, 4],
  'Bb': [10, 0, 2, 3, 5, 7, 9],
  'Eb': [3, 5, 7, 8, 10, 0, 2],
  'Ab': [8, 10, 0, 1, 3, 5, 7],
  'Db': [1, 3, 5, 6, 8, 10, 0],
};

// 和弦符号 → 半音间隔（够听即可，不是配器还原）
const CHORD_SHAPES = [
  ['ø',    [0, 3, 6, 10]],
  ['∆',    [0, 4, 7, 11]],
  ['7sus', [0, 5, 7, 10]],
  ['7alt', [0, 4, 8, 10]],
  ['7',    [0, 4, 7, 10]],
  ['-',    [0, 3, 7]],
  ['m',    [0, 3, 7]],
  ['dim',  [0, 3, 6]],
  ['aug',  [0, 4, 8]],
  ['sus',  [0, 5, 7]],
];

const NOTE_OFFSETS = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };

const AudioPlayer = {
  ctx: null,
  _timeouts: [],
  playing: false,
  totalBeats: 0,

  getCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },

  // ── 简谱 / 五线谱：按 note 数据播放 ──────────────────────────
  play(scoreData, opts = {}) {
    this.stop();
    if (!scoreData || !scoreData.staves) return 0;

    const beatSec = 60 / scoreData.tempo;
    const semitones = KEY_SEMITONES[scoreData.key] || KEY_SEMITONES['C'];
    const events = [];
    let offset = 0;
    let index = 0;

    scoreData.staves.forEach(stave => {
      stave.measures.forEach(measure => {
        measure.notes.forEach(n => {
          if (n.type === 'note') {
            const semitone = semitones[(n.pitch - 1) % 7];
            const midi = 60 + semitone + (n.octave || 0) * 12;
            events.push({ beat: offset, dur: n.duration, index: index++, midi });
            offset += n.duration;
          } else if (n.type === 'rest') {
            offset += n.duration;
          }
        });
      });
    });

    this._schedule(events, beatSec, opts, offset, midi => [midi]);
    return offset;
  },

  // ── 打印谱：按 Scribe 的 events 播放（和弦 + 旋律）────────────
  playStream(src, opts = {}) {
    this.stop();
    this._fetching = fetch(src)
      .then(r => r.json())
      .then(data => {
        const meter = (data.events || []).find(e => e[1] === 'meter');
        const beatsPerBar = meter ? meter[2] : 4;
        const evs = ((data.sequences && data.sequences[0] && data.sequences[0].events) || data.events || [])
          .filter(e => e[1] === 'chord' || e[1] === 'note');

        const beatSec = 60 / (opts.tempo || 100);
        let total = 0;
        const events = evs.map((e, i) => {
          const beat = e[0];
          const dur = e[4] || 1;
          total = Math.max(total, beat + dur);
          if (e[1] === 'chord') {
            return { beat, dur, index: i, midis: this._chordMidis(e[2], e[3]), beatsPerBar };
          }
          return { beat, dur, index: i, midis: [e[2]], beatsPerBar };
        });

        this._schedule(events, beatSec, opts, total, ev => ev.midis);
      })
      .catch(err => {
        console.warn('[AudioPlayer] 打印谱数据加载失败', err);
        if (opts.onEnd) opts.onEnd();
      });
    return this._fetching;
  },


  // ── ABC 音符序列播放（abc-score.js 解析出的 {midi,start,dur}）─────
  playNotes(notes, bpm, opts = {}) {
    this.stop();
    if (!notes || !notes.length) return 0;
    const beatSec = 60 / (bpm || 100);
    const events = notes.map((n, i) => ({ beat: n.start, dur: n.dur, index: i, midi: n.midi }));
    const total = notes.reduce((m, n) => Math.max(m, n.start + n.dur), 0);
    this._schedule(events, beatSec, opts, total, ev => [ev.midi]);
    return total;
  },

  // ── 可调速顺序播放：每次只排下一个音符，所以拖动 BPM 立刻生效 ──
  // 用「理论时间 + 实测时间」补偿漂移，避免 setTimeout 累积误差
  playSequence(notes, opts = {}) {
    this.stop();
    if (!notes || !notes.length) return;
    this.playing = true;

    const total = notes.reduce((m, n) => Math.max(m, n.start + n.dur), 0);
    this.totalBeats = total;

    const getBpm = opts.getBpm || (() => 100);
    let i = 0;
    let nextAt = performance.now();

    const step = () => {
      if (!this.playing) return;
      if (i >= notes.length) {
        this.playing = false;
        if (opts.onEnd) opts.onEnd();
        return;
      }
      const n = notes[i];
      const beatSec = 60 / getBpm();
      const durMs = n.dur * beatSec * 1000;

      this._playTone(this._midiToFreq(n.midi), durMs / 1000 * 0.92, 1);
      if (opts.onNote) opts.onNote(i, n);

      i += 1;
      nextAt += durMs;
      const delay = Math.max(0, nextAt - performance.now());
      this._seqTimer = setTimeout(step, delay);
    };

    step();
  },

  _midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  },

  // 统一调度：事件按 beat 排布，到点发声并回调
  _schedule(events, beatSec, opts, totalBeats, midiOf) {
    this.playing = true;
    this.totalBeats = totalBeats;

    events.forEach(ev => {
      const id = setTimeout(() => {
        const midis = midiOf(ev);
        this._playChord(midis.map(m => 440 * Math.pow(2, (m - 69) / 12)), ev.dur * beatSec * 0.9);
        if (opts.onNote) opts.onNote(ev.index, ev.beat, totalBeats);
      }, ev.beat * beatSec * 1000);
      this._timeouts.push(id);
    });

    const end = setTimeout(() => {
      this.playing = false;
      if (opts.onEnd) opts.onEnd();
    }, totalBeats * beatSec * 1000 + 400);
    this._timeouts.push(end);
  },

  // 和弦符号（如 C∆ / E7alt / B♭-）→ MIDI
  _chordMidis(root, quality) {
    const m = /^([A-G])([b#♭♯]?)/.exec(root || 'C');
    if (!m) return [60];
    let base = NOTE_OFFSETS[m[1]];
    const acc = m[2];
    if (acc === 'b' || acc === '♭') base -= 1;
    if (acc === '#' || acc === '♯') base += 1;

    const q = quality || '';
    const shape = CHORD_SHAPES.find(([sym]) => q.includes(sym));
    const intervals = shape ? shape[1] : [0, 4, 7];
    // 和弦根音落在 C4(60) 附近，太低的往上抬一个八度
    let rootMidi = 48 + base;
    if (rootMidi < 52) rootMidi += 12;
    return intervals.map(iv => rootMidi + iv);
  },

  stop() {
    this._timeouts.forEach(clearTimeout);
    this._timeouts = [];
    if (this._seqTimer) { clearTimeout(this._seqTimer); this._seqTimer = null; }
    this.playing = false;
  },

  _playChord(freqs, dur) {
    // 和弦音越多每个音越轻，避免削顶
    const amp = 0.85 / Math.max(1, freqs.length);
    freqs.forEach(freq => this._playTone(freq, dur, amp));
  },

  _playTone(freq, dur, amp = 1) {
    try {
      const ctx = this.getCtx();
      const now = ctx.currentTime;
      const d = Math.max(dur, 0.08);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.24 * amp, now + 0.015);   // 起音
      gain.gain.exponentialRampToValueAtTime(0.0001, now + d);
      gain.connect(ctx.destination);

      // 三角波给主体，正弦倍频加亮度，听起来没那么"电子"
      const o1 = ctx.createOscillator();
      o1.type = 'triangle';
      o1.frequency.value = freq;
      o1.connect(gain);
      o1.start(now);
      o1.stop(now + d + 0.05);

      const o2 = ctx.createOscillator();
      o2.type = 'sine';
      o2.frequency.value = freq * 2;
      const g2 = ctx.createGain();
      g2.gain.value = 0.35;
      o2.connect(g2);
      g2.connect(gain);
      o2.start(now);
      o2.stop(now + d + 0.05);
    } catch (e) {
      // 播放失败静默处理
    }
  }
};
