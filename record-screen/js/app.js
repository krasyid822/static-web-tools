import { ScreenRecorder } from './recorder.js';
import {
  checkBrowserSupport,
  formatDuration,
  formatFileSize,
  generateFilename,
  revokeMediaUrl,
} from './utils.js';

const APP_STATE = {
  IDLE: 'IDLE',
  RECORDING: 'RECORDING',
  PAUSED: 'PAUSED',
  PREVIEW: 'PREVIEW',
};

const STATE_LABELS = {
  [APP_STATE.IDLE]: 'Siap Merekam',
  [APP_STATE.RECORDING]: 'Sedang Merekam',
  [APP_STATE.PAUSED]: 'Dijeda',
  [APP_STATE.PREVIEW]: 'Pratinjau Hasil',
};

const elements = {
  statusBadge: document.getElementById('status-badge'),
  statusText: document.getElementById('status-text'),
  statusMessage: document.getElementById('status-message'),
  timer: document.getElementById('timer'),
  previewVideo: document.getElementById('preview-video'),
  emptyState: document.getElementById('empty-state'),
  audioOptions: document.getElementById('audio-options'),
  optSystemAudio: document.getElementById('opt-system-audio'),
  optMicAudio: document.getElementById('opt-mic-audio'),
  btnStart: document.getElementById('btn-start'),
  btnPause: document.getElementById('btn-pause'),
  btnResume: document.getElementById('btn-resume'),
  btnStop: document.getElementById('btn-stop'),
  btnDownload: document.getElementById('btn-download'),
  btnReset: document.getElementById('btn-reset'),
  recordingMeta: document.getElementById('recording-meta'),
};

const recorder = new ScreenRecorder();
let currentState = APP_STATE.IDLE;
let currentBlobUrl = null;
let timerInterval = null;
let elapsedSeconds = 0;

/**
 * Display a status or error message banner.
 * @param {string} message
 * @param {'error' | 'info'} [type='info']
 */
function showMessage(message, type = 'info') {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status-message status-message--${type}`;
  elements.statusMessage.hidden = false;
}

/**
 * Hide the status/error message banner.
 */
function clearMessage() {
  elements.statusMessage.textContent = '';
  elements.statusMessage.hidden = true;
}

/**
 * Start or resume the recording duration timer.
 */
function startTimer() {
  stopTimer();
  timerInterval = window.setInterval(() => {
    elapsedSeconds += 1;
    elements.timer.textContent = formatDuration(elapsedSeconds);
  }, 1000);
}

/**
 * Pause the recording duration timer.
 */
function stopTimer() {
  if (timerInterval !== null) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }
}

/**
 * Update UI elements to match the target application state.
 * @param {string} nextState
 */
function setState(nextState) {
  currentState = nextState;

  elements.statusBadge.className = `status-badge status-badge--${nextState.toLowerCase()}`;
  elements.statusText.textContent = STATE_LABELS[nextState];

  const isIdle = nextState === APP_STATE.IDLE;
  const isRecording = nextState === APP_STATE.RECORDING;
  const isPaused = nextState === APP_STATE.PAUSED;
  const isPreview = nextState === APP_STATE.PREVIEW;

  elements.btnStart.hidden = !isIdle;
  elements.btnPause.hidden = !isRecording;
  elements.btnResume.hidden = !isPaused;
  elements.btnStop.hidden = !(isRecording || isPaused);
  elements.btnDownload.hidden = !isPreview;
  elements.btnReset.hidden = !isPreview;

  elements.audioOptions.disabled = !(isIdle || isPreview);
  elements.emptyState.hidden = !isIdle;

  if (isIdle) {
    elements.recordingMeta.hidden = true;
    elements.recordingMeta.textContent = '';
  }
}

/**
 * Map MediaDevices/MediaRecorder errors to user-friendly Indonesian messages.
 * @param {Error} error
 * @returns {string}
 */
function getFriendlyErrorMessage(error) {
  switch (error.name) {
    case 'NotAllowedError':
      return 'Izin perekaman layar atau mikrofon ditolak atau dibatalkan oleh pengguna.';
    case 'NotFoundError':
      return 'Perangkat audio atau video yang diminta tidak ditemukan.';
    case 'NotSupportedError':
      return 'Browser Anda tidak mendukung fitur perekaman layar ini.';
    default:
      return `Gagal memulai perekaman: ${error.message || 'Terjadi kesalahan tidak dikenal.'}`;
  }
}

/**
 * Handle Start Recording button click.
 */
async function handleStart() {
  clearMessage();
  revokeMediaUrl(currentBlobUrl);
  currentBlobUrl = null;

  elements.previewVideo.srcObject = null;
  elements.previewVideo.removeAttribute('src');
  elements.previewVideo.controls = false;
  elements.previewVideo.muted = true;

  elapsedSeconds = 0;
  elements.timer.textContent = formatDuration(0);

  try {
    const liveStream = await recorder.start({
      includeSystemAudio: elements.optSystemAudio.checked,
      includeMicAudio: elements.optMicAudio.checked,
      onStop: ({ blob, mimeType }) => {
        stopTimer();
        currentBlobUrl = URL.createObjectURL(blob);

        elements.previewVideo.srcObject = null;
        elements.previewVideo.src = currentBlobUrl;
        elements.previewVideo.muted = false;
        elements.previewVideo.controls = true;

        const filename = generateFilename(mimeType);
        elements.btnDownload.href = currentBlobUrl;
        elements.btnDownload.download = filename;

        elements.recordingMeta.textContent = `File siap: ${filename} (${formatFileSize(blob.size)})`;
        elements.recordingMeta.hidden = false;

        setState(APP_STATE.PREVIEW);
      },
      onError: (error) => {
        stopTimer();
        showMessage(getFriendlyErrorMessage(error), 'error');
        setState(APP_STATE.IDLE);
      },
    });

    elements.previewVideo.srcObject = liveStream;
    await elements.previewVideo.play().catch(() => {});

    setState(APP_STATE.RECORDING);
    startTimer();
  } catch (error) {
    stopTimer();
    showMessage(getFriendlyErrorMessage(error), 'error');
    setState(APP_STATE.IDLE);
  }
}

/**
 * Handle Pause button click.
 */
function handlePause() {
  if (currentState !== APP_STATE.RECORDING) {
    return;
  }
  recorder.pause();
  stopTimer();
  setState(APP_STATE.PAUSED);
}

/**
 * Handle Resume button click.
 */
function handleResume() {
  if (currentState !== APP_STATE.PAUSED) {
    return;
  }
  recorder.resume();
  startTimer();
  setState(APP_STATE.RECORDING);
}

/**
 * Handle Stop button click.
 */
function handleStop() {
  if (currentState !== APP_STATE.RECORDING && currentState !== APP_STATE.PAUSED) {
    return;
  }
  stopTimer();
  recorder.stop();
}

/**
 * Handle Reset / New Recording button click.
 */
function handleReset() {
  clearMessage();
  stopTimer();
  revokeMediaUrl(currentBlobUrl);
  currentBlobUrl = null;

  elements.previewVideo.pause();
  elements.previewVideo.srcObject = null;
  elements.previewVideo.removeAttribute('src');
  elements.previewVideo.controls = false;
  elements.previewVideo.load();

  elapsedSeconds = 0;
  elements.timer.textContent = formatDuration(0);
  setState(APP_STATE.IDLE);
}

/**
 * Initialize application event listeners and browser support check.
 */
function init() {
  const support = checkBrowserSupport();
  if (!support.supported) {
    showMessage(support.message, 'error');
    elements.btnStart.disabled = true;
    return;
  }

  elements.btnStart.addEventListener('click', handleStart);
  elements.btnPause.addEventListener('click', handlePause);
  elements.btnResume.addEventListener('click', handleResume);
  elements.btnStop.addEventListener('click', handleStop);
  elements.btnReset.addEventListener('click', handleReset);

  window.addEventListener('beforeunload', () => {
    recorder.cleanup();
    revokeMediaUrl(currentBlobUrl);
  });

  setState(APP_STATE.IDLE);
}

init();
