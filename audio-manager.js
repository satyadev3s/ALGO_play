(function () {
  'use strict';

  const STORAGE_KEY = 'algoplay_audio_preferences';
  const TRACKS = {
    click: 'music/game_click.mp3',
    start: 'music/game_start.mp3',
    win: 'music/game_win.mp3',
    over: 'music/game_over.mp3',
    music1: 'music/game_music1.mp3',
    music2: 'music/game_music2.mp3'
  };
  const defaults = { enabled: true, effectsVolume: 0.75, musicVolume: 0.3 };
  const state = {
    preferences: loadPreferences(),
    effects: {},
    music: null,
    started: false,
    completedEvents: new Set(),
    pendingMusic: null
  };

  function loadPreferences() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        enabled: stored.enabled !== false,
        effectsVolume: clampNumber(stored.effectsVolume, defaults.effectsVolume),
        musicVolume: clampNumber(stored.musicVolume, defaults.musicVolume)
      };
    } catch (error) {
      return { ...defaults };
    }
  }

  function clampNumber(value, fallback) {
    return Number.isFinite(value) && value >= 0 && value <= 1 ? value : fallback;
  }

  function savePreferences() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.preferences));
    } catch (error) {
      // Audio remains usable when storage is unavailable.
    }
    updateControls();
  }

  function createAudio(name, loop) {
    const audio = new Audio(TRACKS[name]);
    audio.preload = 'auto';
    audio.loop = loop;
    audio.addEventListener('error', function () {
      audio.dataset.failed = 'true';
    });
    return audio;
  }

  function effect(name) {
    if (!state.preferences.enabled) return;
    const audio = state.effects[name] || (state.effects[name] = createAudio(name, false));
    if (audio.dataset.failed === 'true') return;
    audio.volume = state.preferences.effectsVolume;
    audio.currentTime = 0;
    const result = audio.play();
    if (result && typeof result.catch === 'function') result.catch(function () {});
  }

  function stopMusic() {
    if (!state.music) return;
    state.music.pause();
    state.music.currentTime = 0;
    state.music = null;
    state.pendingMusic = null;
  }

  function playMusic(name) {
    if (!state.preferences.enabled || !TRACKS[name]) return;
    if (state.music && state.music.dataset.track === name && !state.music.paused) return;
    stopMusic();
    const audio = createAudio(name, true);
    audio.dataset.track = name;
    audio.volume = state.preferences.musicVolume;
    state.music = audio;
    state.pendingMusic = name;
    const result = audio.play();
    if (result && typeof result.catch === 'function') {
      result.catch(function () {
        // The next user gesture retries the requested track.
      });
    }
  }

  function retryMusic() {
    if (state.pendingMusic && state.preferences.enabled) playMusic(state.pendingMusic);
  }

  function startGame(musicTrack) {
    if (state.started) return;
    state.started = true;
    effect('start');
    if (musicTrack) playMusic(musicTrack);
  }

  function win(eventKey) {
    const key = eventKey || 'default';
    if (state.completedEvents.has(key)) return;
    state.completedEvents.add(key);
    effect('win');
  }

  function over() {
    effect('over');
    stopMusic();
  }

  function inferMusicTrack() {
    const page = location.pathname.toLowerCase();
    if (/math_bubble|game2|videogame|manbattle|fraction_mission|sciencegame/.test(page)) return 'music2';
    if (/mathq|sciq|techq|takeexam|student_portal|questiongeneration/.test(page)) return 'music1';
    return null;
  }

  function addControls() {
    if (!document.body || document.getElementById('algoplay-audio-controls')) return;
    const wrapper = document.createElement('div');
    wrapper.id = 'algoplay-audio-controls';
    wrapper.innerHTML =
      '<button type="button" id="algoplay-audio-toggle" aria-expanded="false" aria-controls="algoplay-audio-panel">' +
      '🔊 Sound</button>' +
      '<div id="algoplay-audio-panel" hidden>' +
      '<label><input id="algoplay-audio-enabled" type="checkbox"> Sound on</label>' +
      '<label>Effects <input id="algoplay-effects-volume" type="range" min="0" max="1" step="0.05"></label>' +
      '<label>Music <input id="algoplay-music-volume" type="range" min="0" max="1" step="0.05"></label>' +
      '</div>';
    document.body.appendChild(wrapper);
    document.getElementById('algoplay-audio-toggle').addEventListener('click', function () {
      const panel = document.getElementById('algoplay-audio-panel');
      const expanded = panel.hidden;
      panel.hidden = !expanded;
      this.setAttribute('aria-expanded', String(expanded));
    });
    document.getElementById('algoplay-audio-enabled').addEventListener('change', function () {
      state.preferences.enabled = this.checked;
      if (!this.checked) stopMusic();
      savePreferences();
    });
    document.getElementById('algoplay-effects-volume').addEventListener('input', function () {
      state.preferences.effectsVolume = Number(this.value);
      savePreferences();
    });
    document.getElementById('algoplay-music-volume').addEventListener('input', function () {
      state.preferences.musicVolume = Number(this.value);
      if (state.music) state.music.volume = state.preferences.musicVolume;
      savePreferences();
    });
    updateControls();
  }

  function updateControls() {
    const toggle = document.getElementById('algoplay-audio-toggle');
    const enabled = document.getElementById('algoplay-audio-enabled');
    const effects = document.getElementById('algoplay-effects-volume');
    const music = document.getElementById('algoplay-music-volume');
    if (!toggle || !enabled || !effects || !music) return;
    toggle.textContent = state.preferences.enabled ? '🔊 Sound' : '🔇 Sound';
    enabled.checked = state.preferences.enabled;
    effects.value = String(state.preferences.effectsVolume);
    music.value = String(state.preferences.musicVolume);
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent =
      '#algoplay-audio-controls{position:fixed;right:16px;bottom:16px;z-index:10000;font:600 12px/1.4 system-ui,sans-serif;color:#f8fafc}' +
      '#algoplay-audio-toggle{border:1px solid rgba(148,163,184,.35);border-radius:999px;padding:9px 13px;background:rgba(15,23,42,.94);color:inherit;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.28)}' +
      '#algoplay-audio-panel{margin-top:8px;padding:12px;border:1px solid rgba(148,163,184,.3);border-radius:14px;background:rgba(15,23,42,.97);box-shadow:0 8px 24px rgba(0,0,0,.3)}' +
      '#algoplay-audio-panel label{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:7px 0;white-space:nowrap}' +
      '#algoplay-audio-panel input[type=range]{width:100px;accent-color:#818cf8}' +
      '@media (max-width:640px){#algoplay-audio-controls{right:10px;bottom:10px}}';
    document.head.appendChild(style);
  }

  document.addEventListener('click', function (event) {
    const target = event.target.closest('button, a, [role="button"], .option-btn, .btn');
    if (target && !target.closest('#algoplay-audio-controls')) effect('click');
    retryMusic();
  }, true);
  document.addEventListener('keydown', retryMusic, true);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopMusic();
  });

  window.AlgoPlayAudio = { effect, playMusic, stopMusic, startGame, win, over };

  function initialize() {
    injectStyles();
    addControls();
    const track = document.body.dataset.audioMusic || inferMusicTrack();
    if (track) {
      document.addEventListener('pointerdown', function () {
        startGame(track);
      }, { once: true, passive: true });
      document.addEventListener('keydown', function () {
        startGame(track);
      }, { once: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();
