/**
 * sanskrit-tts-web — 100% In-Browser WebGPU & WASM Sanskrit Śloka-to-Chant Engine (Vāgdhenu)
 *
 * Small. Focused. Functional. The default export IS the thing.
 *
 * ```js
 * import sanskritTts from "sanskrit-tts-web";
 *
 * const voice = await sanskritTts();
 * const { wav, url, meter } = await voice.chant("वागर्थाविव संपृक्तौ वागर्थप्रतिपत्तये ।");
 * ```
 */

import {
  VagdhenuWebEngine,
  encodeWavBuffer,
  encodeWavBlob,
  decodeFp16Buffer,
  gateAudio,
  stitchSegments,
  isMobileDevice,
  resolveOrt,
  resolveModelBaseUrl,
} from "./vagdhenu-onnx.js";

import {
  analyzeVerse,
  detectScript,
  toDeva,
  devaToSlp1,
  slp1ToKannada,
  aksharas,
  nAksharas,
  repDepths,
  endsHalant,
  alignSlp1,
  preparePieces,
  detectMeter,
  detectMeterKey,
  METERS,
} from "./vagdhenu-text.js";

const toDevanagari = toDeva;
const devanagariToSlp1 = devaToSlp1;

/**
 * Create an in-browser Sanskrit TTS voice instance.
 *
 * @param {string | object} [sourceOrOptions] - Backend ('wasm' | 'onnx'), HF repo slug ('gnumanth/sanskrit-tts-wasm' | 'gnumanth/sanskrit-tts-onnx'), URL/path ('./models'), or options object
 * @param {object} [maybeOptions] - Default synthesis options ({ backend, meter, nfe, cfg, speed, seed, lazy, onProgress })
 */
export async function sanskritTts(sourceOrOptions = null, maybeOptions = {}) {
  let baseUrl = null;
  let defaultOptions = {};

  if (typeof sourceOrOptions === "string") {
    defaultOptions = maybeOptions || {};
    if (sourceOrOptions === "wasm" || sourceOrOptions === "onnx") {
      defaultOptions = { ...defaultOptions, backend: sourceOrOptions };
    } else {
      baseUrl = sourceOrOptions;
    }
  } else if (sourceOrOptions && typeof sourceOrOptions === "object") {
    defaultOptions = sourceOrOptions;
    baseUrl = defaultOptions.baseUrl || defaultOptions.modelId || null;
  }

  const backend = defaultOptions.backend === "onnx" ? "onnx" : "wasm";
  const engine = new VagdhenuWebEngine(baseUrl, backend);
  const listeners = {
    chunk: new Set(),
    progress: new Set(),
    status: new Set(),
  };

  function emit(event, payload) {
    const set = listeners[event];
    if (!set) return;
    for (const fn of set) {
      fn(payload);
    }
  }

  const handleProgress = (statusObj) => {
    if (typeof defaultOptions.onProgress === "function") {
      defaultOptions.onProgress(statusObj);
    }
    emit("progress", statusObj);
    emit("status", statusObj);
  };

  if (!defaultOptions.lazy) {
    await engine.initOnnxSessions(handleProgress);
  }

  async function chant(text, options = {}) {
    const merged = { ...defaultOptions, ...options };
    const scansion = analyzeVerse(text);
    const userOnChunk = merged.onChunk;

    const res = await engine.synthesizeInBrowser(
      text,
      {
        meter: merged.meter || scansion.meter?.name || "auto",
        noSandhi: Boolean(merged.noSandhi),
        nfe: merged.nfe ?? null,
        cfg: merged.cfg ?? 3.0,
        speed: merged.speed ?? 0.9,
        seed: merged.seed ?? 60,
        onChunk: async (chunk) => {
          const enriched = {
            ...chunk,
            samples: chunk.gatedSamples,
          };
          emit("chunk", enriched);
          if (typeof userOnChunk === "function") {
            await userOnChunk(enriched);
          }
        },
      },
      merged.onProgress || handleProgress
    );

    return {
      ...res,
      scansion,
      play() {
        if (typeof Audio !== "undefined" && res.url) {
          const audioEl = new Audio(res.url);
          audioEl.play();
          return audioEl;
        }
        return null;
      },
    };
  }

  function stream(text, options = {}) {
    const queue = [];
    let resolveNext = null;
    let done = false;
    let error = null;

    const runPromise = chant(text, {
      ...options,
      onChunk: async (chunk) => {
        if (typeof options.onChunk === "function") {
          await options.onChunk(chunk);
        }
        if (resolveNext) {
          const r = resolveNext;
          resolveNext = null;
          r({ value: chunk, done: false });
        } else {
          queue.push(chunk);
        }
      },
    }).then(
      (finalResult) => {
        done = true;
        if (resolveNext) {
          const r = resolveNext;
          resolveNext = null;
          r({ value: undefined, done: true });
        }
        return finalResult;
      },
      (err) => {
        error = err;
        done = true;
        if (resolveNext) {
          const r = resolveNext;
          resolveNext = null;
          r(Promise.reject(err));
        }
        throw err;
      }
    );

    return {
      result: runPromise,
      then: runPromise.then.bind(runPromise),
      catch: runPromise.catch.bind(runPromise),
      finally: runPromise.finally.bind(runPromise),
      [Symbol.asyncIterator]() {
        return {
          next() {
            if (queue.length > 0) {
              return Promise.resolve({ value: queue.shift(), done: false });
            }
            if (error) {
              return Promise.reject(error);
            }
            if (done) {
              return Promise.resolve({ value: undefined, done: true });
            }
            return new Promise((resolve) => {
              resolveNext = resolve;
            });
          },
        };
      },
    };
  }

  const voice = Object.assign(
    (text, options) => chant(text, options),
    {
      chant,
      speak: chant,
      stream,
      setBackend: (mode) => engine.setBackendMode(mode),
      scan: (text) => analyzeVerse(text),
      on(event, fn) {
        if (!listeners[event]) listeners[event] = new Set();
        listeners[event].add(fn);
        return voice;
      },
      off(event, fn) {
        listeners[event]?.delete(fn);
        return voice;
      },
      engine,
    }
  );

  return voice;
}

export default sanskritTts;

export {
  VagdhenuWebEngine,
  encodeWavBuffer,
  encodeWavBlob,
  decodeFp16Buffer,
  gateAudio,
  stitchSegments,
  isMobileDevice,
  resolveOrt,
  resolveModelBaseUrl,
  analyzeVerse,
  detectScript,
  toDeva,
  toDevanagari,
  devaToSlp1,
  devanagariToSlp1,
  slp1ToKannada,
  aksharas,
  nAksharas,
  repDepths,
  endsHalant,
  alignSlp1,
  preparePieces,
  detectMeter,
  detectMeterKey,
  METERS,
};
