/**
 * audio-player.js
 * Web Audio API 播放器 — 零依赖，基于 note 数据播放
 *
 * 用法:
 *   AudioPlayer.play(scoreData)   // 播放整曲
 *   AudioPlayer.stop()            // 停止
 *
 * scoreData 格式来自 notation-converter.js 的 parseScoreData()
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

// MIDI note 60 = C4
const BASE_MIDI = 60;

const AudioPlayer = {
  ctx: null,
  _timeouts: [],

  getCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  },

  play(scoreData) {
    this.stop();
    if (!scoreData || !scoreData.staves) return;

    const ctx = this.getCtx();
    const beatSec = 60 / scoreData.tempo;
    const semitones = KEY_SEMITONES[scoreData.key] || KEY_SEMITONES['C'];
    let offset = 0; // 累积拍数偏移

    scoreData.staves.forEach(stave => {
      stave.measures.forEach(measure => {
        measure.notes.forEach(n => {
          if (n.type === 'note') {
            const semitone = semitones[(n.pitch - 1) % 7];
            const midi = BASE_MIDI + semitone + (n.octave || 0) * 12;
            const freq = 440 * Math.pow(2, (midi - 69) / 12);
            const dur = n.duration * beatSec * 0.85; // 留一点间隙

            const id = setTimeout(() => this._playTone(freq, dur), offset * beatSec * 1000);
            this._timeouts.push(id);
            offset += n.duration;
          } else if (n.type === 'rest') {
            offset += n.duration;
          }
          // tie 忽略（时值已经包含在前一个音符里）
        });
      });
    });
  },

  stop() {
    this._timeouts.forEach(clearTimeout);
    this._timeouts = [];
  },

  _playTone(freq, dur) {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + dur);
    } catch (e) {
      // 静默处理播放错误
    }
  }
};
