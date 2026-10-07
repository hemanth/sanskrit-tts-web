export interface ChantOptions {
  /** Execution backend & weight repo: 'wasm' (default, fastest MatMulInteger) or 'onnx' (WebGPU Shader-FP16) */
  backend?: "wasm" | "onnx";
  /** Classical Sanskrit meter name or 'auto' (default: 'auto') */
  meter?: string;
  /** Disable internal sandhi assimilation (default: false) */
  noSandhi?: boolean;
  /** Number of Rectified Flow ODE steps (default: 7) */
  nfe?: number;
  /** Classifier-Free Guidance scale (default: 3.0) */
  cfg?: number;
  /** Recitation tempo multiplier (default: 0.9) */
  speed?: number;
  /** Deterministic PRNG seed (default: 60) */
  seed?: number;
  /** Defer ONNX session initialization until first chant call (default: false) */
  lazy?: boolean;
  /** Custom base URL or Hugging Face repo slug */
  baseUrl?: string;
  /** Progress callback during weight download and ODE steps */
  onProgress?: (status: ProgressStatus) => void;
  /** Chunk callback invoked after each hemistich/pāda completes */
  onChunk?: (chunk: ChunkEvent) => void | Promise<void>;
}

export interface ProgressStatus {
  stage: string;
  message: string;
  progress: number;
}

export interface ChunkEvent {
  chunkIndex: number;
  totalChunks: number;
  samples: Float32Array;
  gatedSamples: Float32Array;
  gapSamples: Float32Array;
  samplesSoFar: Float32Array;
  sampleRate: number;
  meter: string;
}

export interface PadaScansion {
  index: number;
  text: string;
  slp1: string;
  pattern: string;
  syllables: Array<{ text: string; weight: "L" | "G" }>;
}

export interface VerseScansion {
  script: string;
  normalizedDevanagari: string;
  slp1: string;
  padas: PadaScansion[];
  meter: {
    name: string;
    sanskritName?: string;
    confidence?: number;
    pattern?: string;
  };
}

export interface ChantResult {
  /** 24 kHz 16-bit mono PCM WAV file as an ArrayBuffer */
  wav: ArrayBuffer;
  /** Raw 24 kHz mono Float32Array samples */
  audio: Float32Array;
  /** Browser Blob ('audio/wav') when running in browser */
  blob: Blob | null;
  /** Object URL for <audio> playback when running in browser */
  url: string | null;
  /** Duration in seconds */
  durationSec: number;
  /** Audio sample rate (24000) */
  sampleRate: number;
  /** Alias for sampleRate (24000) for webml-kit compatibility */
  sampling_rate: number;
  /** Resolved Chandas meter key */
  meter: string;
  /** Pāṇinian Guru/Laghu scansion result */
  scansion: VerseScansion;
  /** Phonetic hemistich/pāda pieces */
  pieces: string[];
  /** Play audio directly in the browser via HTMLAudioElement */
  play(): HTMLAudioElement | null;
}

export interface SanskritVoice {
  /** Synthesize a Sanskrit śloka into 24 kHz chant audio */
  (text: string, options?: ChantOptions): Promise<ChantResult>;
  /** Synthesize a Sanskrit śloka into 24 kHz chant audio */
  chant(text: string, options?: ChantOptions): Promise<ChantResult>;
  /** Alias for chant() */
  speak(text: string, options?: ChantOptions): Promise<ChantResult>;
  /** Stream hemistich/pāda audio chunks as an AsyncIterable */
  stream(text: string, options?: ChantOptions): AsyncIterable<ChunkEvent> & Promise<ChantResult>;
  /** Switch runtime backend between 'wasm' (gnumanth/sanskrit-tts-wasm) and 'onnx' (gnumanth/sanskrit-tts-onnx) */
  setBackend(mode: "wasm" | "onnx"): Promise<void>;
  /** Run synchronous Pāṇinian Guru/Laghu scansion and Chandas detection (<1ms) */
  scan(text: string): VerseScansion;
  /** Subscribe to 'chunk', 'progress', or 'status' events */
  on(event: "chunk", listener: (chunk: ChunkEvent) => void): SanskritVoice;
  on(event: "progress" | "status", listener: (status: ProgressStatus) => void): SanskritVoice;
  /** Unsubscribe from events */
  off(event: "chunk" | "progress" | "status", listener: (...args: any[]) => void): SanskritVoice;
  /** Underlying ONNX Runtime Web engine instance */
  engine: VagdhenuWebEngine;
}

export declare class VagdhenuWebEngine {
  baseUrl: string;
  backendMode: "wasm" | "onnx";
  provider: "webgpu" | "wasm";
  isMobile: boolean;
  constructor(baseUrl?: string | null, backendMode?: "wasm" | "onnx");
  setBackendMode(mode: "wasm" | "onnx"): Promise<void>;
  initOnnxSessions(onStatus?: (status: ProgressStatus) => void): Promise<void>;
  synthesizeInBrowser(
    text: string,
    options?: ChantOptions,
    onProgress?: (status: ProgressStatus) => void
  ): Promise<Omit<ChantResult, "scansion" | "play">>;
}

/**
 * Initialize the in-browser Sanskrit śloka-to-chant neural engine.
 *
 * @param sourceOrOptions - Optional backend ('wasm' | 'onnx'), HF repo ('gnumanth/sanskrit-tts-wasm' | 'gnumanth/sanskrit-tts-onnx'), base URL, or options object
 * @param options - Synthesis & initialization options
 */
export declare function sanskritTts(
  sourceOrOptions?: string | ChantOptions | null,
  options?: ChantOptions
): Promise<SanskritVoice>;

export declare function analyzeVerse(text: string): VerseScansion;
export declare function detectScript(text: string): string;
export declare function toDevanagari(text: string, script?: string): string;
export declare function devanagariToSlp1(text: string): string;
export declare function aksharas(slp1: string): string[];
export declare function preparePieces(text: string, noSandhi?: boolean): { padas: string[]; pieces: string[] };
export declare function detectMeterKey(text: string): string;
export declare function encodeWavBuffer(samples: Float32Array, sampleRate?: number): ArrayBuffer;
export declare function encodeWavBlob(samples: Float32Array, sampleRate?: number): Blob;

export default sanskritTts;
