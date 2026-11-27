import { getSupportedMimeType } from './utils.js';

/**
 * Manages screen, system audio, and microphone capture via MediaRecorder.
 */
export class ScreenRecorder {
  constructor() {
    /** @type {MediaStream | null} */
    this.displayStream = null;
    /** @type {MediaStream | null} */
    this.micStream = null;
    /** @type {MediaStream | null} */
    this.combinedStream = null;
    /** @type {AudioContext | null} */
    this.audioContext = null;
    /** @type {MediaRecorder | null} */
    this.mediaRecorder = null;
    /** @type {BlobPart[]} */
    this.chunks = [];
    /** @type {string} */
    this.mimeType = '';
  }

  /**
   * Start capturing screen and optional audio sources.
   * @param {object} options
   * @param {boolean} options.includeSystemAudio
   * @param {boolean} options.includeMicAudio
   * @param {(result: { blob: Blob, mimeType: string }) => void} options.onStop
   * @param {(error: Error) => void} options.onError
   * @returns {Promise<MediaStream>} Display stream for muted live preview.
   */
  async start({ includeSystemAudio, includeMicAudio, onStop, onError }) {
    this.cleanup();
    this.chunks = [];

    this.displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: includeSystemAudio,
    });

    if (includeMicAudio) {
      try {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
      } catch (err) {
        this.cleanup();
        throw err;
      }
    }

    this.combinedStream = this.#buildCombinedStream();
    this.mimeType = getSupportedMimeType();

    const recorderOptions = this.mimeType ? { mimeType: this.mimeType } : undefined;
    this.mediaRecorder = new MediaRecorder(this.combinedStream, recorderOptions);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    this.mediaRecorder.onerror = (event) => {
      const error = event.error || new Error('Terjadi kesalahan saat merekam.');
      this.cleanup();
      if (typeof onError === 'function') {
        onError(error);
      }
    };

    this.mediaRecorder.onstop = () => {
      const finalMimeType = this.mediaRecorder?.mimeType || this.mimeType || 'video/webm';
      const blob = new Blob(this.chunks, { type: finalMimeType });
      this.chunks = [];
      this.cleanup();

      if (typeof onStop === 'function') {
        onStop({ blob, mimeType: finalMimeType });
      }
    };

    // Ensure browser's native "Stop sharing" button cleanly stops recording
    const [videoTrack] = this.displayStream.getVideoTracks();
    if (videoTrack) {
      videoTrack.addEventListener('ended', () => {
        this.stop();
      });
    }

    this.mediaRecorder.start();
    return this.displayStream;
  }

  /**
   * Pause the active recording.
   */
  pause() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  /**
   * Resume a paused recording.
   */
  resume() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  /**
   * Stop the recording and trigger onStop callback.
   */
  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    } else {
      this.cleanup();
    }
  }

  /**
   * Release all media tracks and AudioContext resources.
   */
  cleanup() {
    const stopStream = (stream) => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };

    stopStream(this.displayStream);
    stopStream(this.micStream);
    stopStream(this.combinedStream);

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }

    this.displayStream = null;
    this.micStream = null;
    this.combinedStream = null;
    this.audioContext = null;
  }

  /**
   * Combine video and audio tracks, mixing system + mic audio via AudioContext when both exist.
   * @returns {MediaStream}
   */
  #buildCombinedStream() {
    const videoTracks = this.displayStream ? this.displayStream.getVideoTracks() : [];
    const displayAudioTracks = this.displayStream ? this.displayStream.getAudioTracks() : [];
    const micAudioTracks = this.micStream ? this.micStream.getAudioTracks() : [];

    if (displayAudioTracks.length > 0 && micAudioTracks.length > 0) {
      this.audioContext = new AudioContext();
      const destination = this.audioContext.createMediaStreamDestination();

      const displaySource = this.audioContext.createMediaStreamSource(
        new MediaStream(displayAudioTracks)
      );
      const micSource = this.audioContext.createMediaStreamSource(
        new MediaStream(micAudioTracks)
      );

      displaySource.connect(destination);
      micSource.connect(destination);

      return new MediaStream([...videoTracks, ...destination.stream.getAudioTracks()]);
    }

    return new MediaStream([...videoTracks, ...displayAudioTracks, ...micAudioTracks]);
  }
}
