class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.bgmInterval = null;
        this.initialized = false;
        this.muted = false;
        this._currentBGM = null;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.25;
            this.masterGain.connect(this.ctx.destination);
            this.initialized = true;
        } catch(e) { console.warn('Web Audio not supported'); }
    }

    _playOsc(freq, duration, type = 'square', vol = 0.3, delay = 0) {
        if (!this.initialized || this.muted) return;
        const t = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(g); g.connect(this.masterGain);
        osc.start(t); osc.stop(t + duration + 0.01);
    }

    _sweep(f1, f2, duration, type = 'square', vol = 0.3, delay = 0) {
        if (!this.initialized || this.muted) return;
        const t = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(f1, t);
        osc.frequency.exponentialRampToValueAtTime(f2, t + duration);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(g); g.connect(this.masterGain);
        osc.start(t); osc.stop(t + duration + 0.01);
    }

    playSFX(name) {
        if (!this.initialized || this.muted) return;
        switch(name) {
            case 'jump':        this._sweep(280, 560, 0.12, 'square', 0.25); break;
            case 'double_jump': this._sweep(480, 900, 0.12, 'square', 0.3); break;
            case 'coin':
                this._playOsc(1047, 0.08, 'sine', 0.35);
                this._playOsc(1319, 0.12, 'sine', 0.35, 0.07);
                break;
            case 'stomp':       this._sweep(200, 50, 0.18, 'sawtooth', 0.5); break;
            case 'die':         this._sweep(440, 110, 0.55, 'square', 0.4); break;
            case 'level_clear':
                [523, 659, 784, 1047].forEach((f, i) => this._playOsc(f, 0.18, 'sine', 0.4, i * 0.14));
                break;
            case 'boss_hit':    this._sweep(120, 40, 0.22, 'sawtooth', 0.55); break;
            case 'boss_die':
                [80,120,160,220,180,260].forEach((f,i) => this._playOsc(f, 0.1, 'sawtooth', 0.5, i*0.08));
                break;
            case 'spike':       this._sweep(600, 200, 0.15, 'square', 0.4); break;
            case 'time_up':
                [330, 294, 262].forEach((f, i) => this._playOsc(f, 0.25, 'square', 0.5, i * 0.22));
                break;
        }
    }

    playBGM(level) {
        if (level === this._currentBGM) return;
        this.stopBGM();
        this._currentBGM = level;
        if (!this.initialized || this.muted) return;

        const MELODIES = {
            menu:   { notes:[262,330,392,262,349,294,330,262], tempo:360, type:'sine'     },
            forest: { notes:[262,330,392,440,523,392,330,294], tempo:280, type:'square'   },
            desert: { notes:[220,261,294,330,349,330,294,261], tempo:380, type:'triangle' },
            ocean:  { notes:[174,220,261,349,440,523,440,349], tempo:480, type:'sine'     },
            boss:   { notes:[147,175,220,147,196,233,196,175], tempo:190, type:'sawtooth' },
        };
        const m = MELODIES[level] || MELODIES.menu;
        let idx = 0;
        const tick = () => {
            if (!this.initialized || this.muted) return;
            this._playOsc(m.notes[idx % m.notes.length], m.tempo / 1000 * 0.75, m.type, 0.12);
            idx++;
        };
        tick();
        this.bgmInterval = setInterval(tick, m.tempo);
    }

    stopBGM() {
        if (this.bgmInterval) { clearInterval(this.bgmInterval); this.bgmInterval = null; }
        this._currentBGM = null;
    }

    toggle() {
        this.muted = !this.muted;
        if (this.muted) this.stopBGM();
        return this.muted;
    }
}
window.audioManager = new AudioManager();
