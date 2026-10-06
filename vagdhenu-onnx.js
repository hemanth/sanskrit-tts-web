/**
 * Vāgdhenu — Browser & Mobile Neural Synthesis Engine (ONNX Runtime Web + Fast Edge API)
 *
 * Supports two execution backends:
 *   1. "browser" (100% Client-Side WebGPU / WebAssembly SIMD via onnxruntime-web):
 *      - Caches baked_bank.bin (2.45 MB), vagdhenu_vocos_q8.onnx (~18 MB),
 *        vagdhenu_cond_q8.onnx (~20 MB), and vagdhenu_dit_step_q8.onnx (~200 MB)
 *        in the browser Cache API (`vagdhenu-models-v2`).
 *      - Executes Static Conditioner (1x) -> Sway-ODE Loop with Smart CFG Delta Caching -> Vocos (1x)
 *        -> Fricative/Halant-aware Acoustic Gate -> 24kHz WAV encoding entirely in JS.
 *   2. "server" (Fast Local / Edge API via BakedFastEngine):
 *      - Zero weight download on mobile; synthesizes a full shloka in ~5s via /api/chant.
 */

import {
  preparePieces,
  splitPadas,
  toDeva,
  nAksharas,
  aksharas,
  repDepths,
  endsHalant,
  alignSlp1,
  detectMeterKey,
} from "./vagdhenu-text.js";

function splitHemistichAtCaesura(line) {
  const words = line.trim().split(/\s+/);
  if (words.length < 2) return [line];
  const totalSylls = nAksharas(toDeva(line));
  if (totalSylls < 14) return [line];
  const target = Math.round(totalSylls / 2);
  let bestIdx = -1;
  let bestDiff = 999;
  let acc = 0;
  for (let i = 0; i < words.length - 1; i++) {
    acc += nAksharas(toDeva(words[i]));
    const diff = Math.abs(acc - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  if (bestIdx >= 0 && bestDiff <= 2) {
    return [words.slice(0, bestIdx + 1).join(" "), words.slice(bestIdx + 1).join(" ")];
  }
  return [line];
}

const SR = 24000;
const HOP = 256;
const CACHE_NAME = "vagdhenu-models-v10";

// ── IEEE-754 Float16 -> Float32 fast conversion table ──
const FP16_TO_FP32 = new Float32Array(65536);
(function initFp16Table() {
  const buf = new ArrayBuffer(4);
  const f32 = new Float32Array(buf);
  const u32 = new Uint32Array(buf);
  for (let i = 0; i < 65536; i++) {
    const s = (i & 0x8000) << 16;
    let e = (i >> 10) & 0x1f;
    let m = i & 0x03ff;
    if (e === 0) {
      if (m === 0) {
        u32[0] = s;
      } else {
        e = 1;
        while ((m & 0x0400) === 0) {
          m <<= 1;
          e--;
        }
        m &= 0x03ff;
        u32[0] = s | ((e + (127 - 15)) << 23) | (m << 13);
      }
    } else if (e === 31) {
      u32[0] = s | 0x7f800000 | (m << 13);
    } else {
      u32[0] = s | ((e + (127 - 15)) << 23) | (m << 13);
    }
    FP16_TO_FP32[i] = f32[0];
  }
})();

export function decodeFp16Buffer(arrayBuffer, byteOffset, frameCount, channels = 100) {
  const u16 = new Uint16Array(arrayBuffer, byteOffset, frameCount * channels);
  const out = new Float32Array(frameCount * channels);
  for (let i = 0; i < u16.length; i++) {
    out[i] = FP16_TO_FP32[u16[i]];
  }
  return out;
}

// ── Deterministic PRNG (Mulberry32 + Box-Muller Gaussian) for reproducible browser seeds ──
function createRng(seed) {
  let a = seed >>> 0;
  return function nextUniform() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randnArray(length, seed = 60) {
  const rng = createRng(seed);
  const out = new Float32Array(length);
  for (let i = 0; i < length; i += 2) {
    const u1 = Math.max(1e-7, rng());
    const u2 = rng();
    const r = Math.sqrt(-2.0 * Math.log(u1));
    const theta = 2.0 * Math.PI * u2;
    out[i] = r * Math.cos(theta);
    if (i + 1 < length) {
      out[i + 1] = r * Math.sin(theta);
    }
  }
  return out;
}

// ── Exact Port of Vāgdhenu's Acoustic Gate (src/render_core.py:gate) ──
export function gateAudio(
  au,
  {
    voice = 0.08,
    sil = 0.012,
    fin = 0.015,
    fout = 0.04,
    lead = 0.03,
    keep = 0.06,
    fade = true,
    fric = false,
    halant = false,
    tailThr = 0.015,
  } = {}
) {
  const win = Math.floor(0.02 * SR);
  if (au.length <= win) return au;
  const r = [];
  for (let i = 0; i <= au.length - win; i += win) {
    let sumSq = 0;
    for (let j = i; j < i + win; j++) sumSq += au[j] * au[j];
    r.push(Math.sqrt(sumSq / win));
  }
  const n = r.length;
  if (n === 0) return au;

  let maxIdx = 0;
  for (let i = 1; i < n; i++) {
    if (r[i] > r[maxIdx]) maxIdx = i;
  }

  let s = maxIdx;
  let vdef = maxIdx;
  if (fric) {
    const FR = 0.006;
    let found = -1;
    for (let i = 0; i < n - 1; i++) {
      if (r[i] > FR && r[i + 1] > FR) {
        found = i;
        break;
      }
    }
    s = found >= 0 ? found : maxIdx;
    while (s > 0 && r[s - 1] > FR) s--;
    vdef = s;
  } else {
    let found = -1;
    for (let i = 0; i < n - 1; i++) {
      if (r[i] > voice && r[i + 1] > sil) {
        found = i;
        break;
      }
    }
    const vs = found >= 0 ? found : maxIdx;
    s = vs;
    while (s > 0 && r[s - 1] > sil) s--;
    vdef = vs;
  }

  const veThr = halant ? 0.012 : tailThr;
  let ve = vdef;
  for (let i = 0; i < n; i++) {
    if (r[i] > veThr) ve = i;
  }

  const keepS = halant ? 0.12 : keep;
  const start = Math.max(0, s * win - Math.floor(lead * SR));
  const end = Math.min(au.length, ve * win + Math.floor(keepS * SR));
  const out = au.slice(start, end);

  if (fade) {
    const fi = fric ? 0 : Math.floor(fin * SR);
    const fo = Math.floor((halant ? 0.018 : fout) * SR);
    if (fi > 0 && out.length > fi) {
      for (let i = 0; i < fi; i++) {
        out[i] *= i / Math.max(1, fi - 1);
      }
    }
    if (fo > 0 && out.length > fo) {
      const offset = out.length - fo;
      for (let i = 0; i < fo; i++) {
        const w = Math.cos((Math.PI * i) / Math.max(1, fo - 1)) * 0.5 + 0.5;
        out[offset + i] *= w;
      }
    }
  }
  return out;
}

export function stitchSegments(segs, gaps, fric = false, halant = false, tailThr = 0.015) {
  if (segs.length === 1) {
    return gateAudio(segs[0], { fric, halant, tailThr });
  }
  const parts = [];
  const last = segs.length - 1;
  let totalLen = 0;
  for (let i = 0; i < segs.length; i++) {
    const gated = gateAudio(segs[i], {
      fric: fric && i === 0,
      halant: halant && i === last,
      tailThr,
    });
    parts.push(gated);
    totalLen += gated.length;
    if (i < last) {
      const g = gaps[i] !== undefined ? gaps[i] : gaps[gaps.length - 1];
      parts.push(g);
      totalLen += g.length;
    }
  }
  const merged = new Float32Array(totalLen);
  let pos = 0;
  for (const p of parts) {
    merged.set(p, pos);
    pos += p.length;
  }
  return merged;
}

export function encodeWavBuffer(samples, sampleRate = SR) {
  const numSamples = samples.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  function writeStr(offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, numSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return buffer;
}

export function encodeWavBlob(samples, sampleRate = SR) {
  const buffer = encodeWavBuffer(samples, sampleRate);
  return new Blob([buffer], { type: "audio/wav" });
}

const ORT_CDN_URL = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/ort.all.min.js";
let ortLoadPromise = null;

export async function resolveOrt() {
  if (typeof globalThis !== "undefined" && globalThis.ort) {
    return globalThis.ort;
  }
  try {
    const pkgName = "onnxruntime-web";
    const mod = await import(/* @vite-ignore */ pkgName);
    const resolved = mod?.default?.InferenceSession ? mod.default : mod;
    if (resolved?.InferenceSession) {
      if (typeof globalThis !== "undefined" && !globalThis.ort) {
        globalThis.ort = resolved;
      }
      return resolved;
    }
  } catch {
    // Fall back to CDN script injection in browser environments
  }
  if (typeof document !== "undefined") {
    if (!ortLoadPromise) {
      ortLoadPromise = new Promise((resolve, reject) => {
        if (globalThis.ort) return resolve(globalThis.ort);
        const s = document.createElement("script");
        s.src = ORT_CDN_URL;
        s.async = true;
        s.onload = () => (globalThis.ort ? resolve(globalThis.ort) : reject(new Error("ort missing after script load")));
        s.onerror = () => reject(new Error(`Failed to load ONNX Runtime Web from ${ORT_CDN_URL}`));
        document.head.appendChild(s);
      });
    }
    return ortLoadPromise;
  }
  throw new Error("ONNX Runtime Web (onnxruntime-web) is not available.");
}

// ── Mobile & Constrained Device Detection ──
export function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return true;
  if (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua)) return true;
  if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(max-width: 820px)").matches) {
    return true;
  }
  return false;
}

function safeDisposeTensor(t) {
  if (t && typeof t.dispose === "function") {
    try {
      t.dispose();
    } catch {
      // ignore already disposed tensor
    }
  }
}

// ── Cached Fetch with Zero-Copy Streaming Progress ──
async function fetchWithCache(url, onProgress, { skipCacheWrite = false } = {}) {
  let cache = null;
  if (typeof caches !== "undefined") {
    try {
      cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(url);
      if (cached) {
        const buf = await cached.arrayBuffer();
        if (onProgress) onProgress(buf.byteLength, buf.byteLength, true);
        return buf;
      }
    } catch {
      cache = null;
    }
  }

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to fetch ${url} (${resp.status})`);
  }
  const total = Number(resp.headers.get("content-length")) || 0;
  if (!resp.body) {
    const buf = await resp.arrayBuffer();
    if (onProgress) onProgress(buf.byteLength, total || buf.byteLength, false);
    return buf;
  }

  const reader = resp.body.getReader();
  let full = total > 0 ? new Uint8Array(total) : null;
  const chunks = full ? null : [];
  let loaded = 0;
  let lastReportTime = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (full) {
      if (loaded + value.byteLength <= full.byteLength) {
        full.set(value, loaded);
      } else {
        const grown = new Uint8Array(loaded + value.byteLength);
        grown.set(full.subarray(0, loaded), 0);
        grown.set(value, loaded);
        full = grown;
      }
    } else {
      chunks.push(value);
    }
    loaded += value.byteLength;
    if (onProgress) {
      const now = performance.now();
      if (loaded === total || now - lastReportTime >= 50) {
        lastReportTime = now;
        onProgress(loaded, total, false);
      }
    }
  }

  if (!full) {
    full = new Uint8Array(loaded);
    let pos = 0;
    for (const c of chunks) {
      full.set(c, pos);
      pos += c.byteLength;
    }
  } else if (loaded < full.byteLength) {
    full = full.slice(0, loaded);
  }

  if (cache && !skipCacheWrite) {
    try {
      await cache.put(
        url,
        new Response(full.buffer, {
          headers: { "Content-Type": "application/octet-stream", "Content-Length": String(loaded) },
        })
      );
    } catch {
      // quota exceeded on mobile; ignore cache put error
    }
  }
  return full.buffer;
}

export const HF_WASM_BASE = "https://huggingface.co/gnumanth/sanskrit-tts-wasm/resolve/main";
export const HF_ONNX_BASE = "https://huggingface.co/gnumanth/sanskrit-tts-onnx/resolve/main";
const HF_MODEL_BASE = HF_ONNX_BASE;

export function resolveModelBaseUrl(baseUrl = null, backendMode = "onnx") {
  if (!baseUrl) {
    const isLocal =
      typeof window !== "undefined" &&
      (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost");
    if (isLocal) return "./models";
    return backendMode === "wasm" ? HF_WASM_BASE : HF_ONNX_BASE;
  }
  if (baseUrl === "wasm") return HF_WASM_BASE;
  if (baseUrl === "onnx" || baseUrl === "webgpu") return HF_ONNX_BASE;
  if (
    typeof baseUrl === "string" &&
    !baseUrl.startsWith("http://") &&
    !baseUrl.startsWith("https://") &&
    !baseUrl.startsWith(".") &&
    !baseUrl.startsWith("/") &&
    /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(baseUrl)
  ) {
    return `https://huggingface.co/${baseUrl}/resolve/main`;
  }
  return baseUrl;
}

export class VagdhenuWebEngine {
  constructor(baseUrl = null, backendMode = null) {
    this.customBaseUrl = baseUrl;
    this.isMobile = isMobileDevice();
    const defaultMode = this.isMobile ? "wasm" : "onnx";
    const effectiveMode = backendMode || defaultMode;
    this.backendMode = effectiveMode === "wasm" ? "wasm" : "onnx";
    const resolvedBase = resolveModelBaseUrl(baseUrl, this.backendMode);
    this.baseUrl = resolvedBase.replace(/\/$/, "");
    this.bankManifest = null;
    this.bankBin = null;
    this.condSession = null;
    this.stepSession = null;
    this.vocosSession = null;
    this.provider = "wasm";
    this.isWarmedUp = false;
    this.initPromise = null;
    this.ort = null;
  }

  setBackendMode(mode) {
    const normalized = mode === "wasm" ? "wasm" : "onnx";
    if (normalized === this.backendMode && this.condSession && this.stepSession) {
      return;
    }
    this.backendMode = normalized;
    const resolvedBase = resolveModelBaseUrl(this.customBaseUrl, this.backendMode);
    this.baseUrl = resolvedBase.replace(/\/$/, "");
    if (this.condSession) {
      try {
        this.condSession.release?.();
      } catch {}
      this.condSession = null;
    }
    if (this.stepSession) {
      try {
        this.stepSession.release?.();
      } catch {}
      this.stepSession = null;
    }
    this.isWarmedUp = false;
    this.initPromise = null;
  }

  async loadBank(onProgress) {
    if (this.bankManifest && this.bankBin) return this.bankManifest;
    try {
      const probe = await fetch(`${this.baseUrl}/baked_bank.json?v=23`);
      if (!probe.ok) throw new Error(`HTTP ${probe.status}`);
      this.bankManifest = await probe.json();
    } catch {
      this.baseUrl = this.backendMode === "wasm" ? HF_WASM_BASE : HF_ONNX_BASE;
      const fallbackResp = await fetch(`${this.baseUrl}/baked_bank.json?v=23`);
      this.bankManifest = await fallbackResp.json();
    }
    this.bankBin = await fetchWithCache(`${this.baseUrl}/baked_bank.bin?v=23`, onProgress);
    return this.bankManifest;
  }

  async initOnnxSessions(onStatus) {
    if (this.condSession && this.stepSession && this.vocosSession && this.isWarmedUp) {
      return;
    }
    if (this.initPromise) {
      return this.initPromise;
    }
    this.initPromise = this._doInitOnnxSessions(onStatus).finally(() => {
      this.initPromise = null;
    });
    return this.initPromise;
  }

  async _doInitOnnxSessions(onStatus) {
    const ort = await resolveOrt();
    this.ort = ort;
    this.isMobile = isMobileDevice();

    await this.loadBank((loaded, total, cached) => {
      if (onStatus) {
        onStatus({
          stage: "bank",
          message: cached
            ? "Loaded Baked Reference Bank from browser cache (2.84 MB)"
            : `Downloading Baked Reference Bank (${(loaded / 1048576).toFixed(1)} MB)...`,
          progress: total ? (loaded / total) * 5 : 5,
        });
      }
    });

    let hasWebGpu = false;
    if (this.backendMode === "onnx" && typeof navigator !== "undefined" && navigator.gpu) {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter) {
          const device = await adapter.requestDevice();
          hasWebGpu = Boolean(device);
          device?.destroy?.();
        }
      } catch {
        hasWebGpu = false;
      }
    }

    const isIsolated = typeof window !== "undefined" && Boolean(window.crossOriginIsolated);
    this.provider = this.backendMode === "onnx" && hasWebGpu ? "webgpu" : "wasm";
    const hc = (typeof navigator !== "undefined" && navigator.hardwareConcurrency) || 4;
    const optimalThreads = this.isMobile
      ? Math.min(6, Math.max(4, hc - 2))
      : hc <= 12
        ? Math.min(4, hc)
        : 6;
    ort.env.wasm.numThreads = isIsolated ? optimalThreads : 1;
    ort.env.wasm.simd = true;

    // If running on WASM (either user selected 'wasm' or WebGPU is unavailable), use the fast MatMulInteger WASM weights
    const useWasmWeights = this.provider === "wasm";
    const isLocalModels = this.baseUrl === "./models" || this.baseUrl.endsWith("/models");
    const effectiveBaseUrl =
      !isLocalModels && !this.customBaseUrl
        ? useWasmWeights
          ? HF_WASM_BASE
          : HF_ONNX_BASE
        : this.baseUrl;

    const stepFile =
      useWasmWeights && isLocalModels
        ? "vagdhenu_dit_step_wasm_q8.onnx"
        : "vagdhenu_dit_step_q8.onnx";
    const condFile = "vagdhenu_cond_q8.onnx";

    const files = [
      { key: "vocos", file: "vagdhenu_vocos_q8.onnx", label: "Vocos Neural Vocoder", weight: 12, sizeMB: 56 },
      {
        key: "cond",
        file: condFile,
        label: "ONNX Static Conditioner",
        weight: 13,
        sizeMB: 19,
      },
      {
        key: "step",
        file: stepFile,
        label: useWasmWeights ? "WASM MatMulInteger DiT Backbone" : "ONNX WebGPU DiT Backbone",
        weight: 65,
        sizeMB: useWasmWeights ? 199 : 184,
      },
    ];

    let basePct = 5;
    for (const item of files) {
      if (item.key === "vocos" && this.vocosSession) {
        basePct += item.weight;
        continue;
      }
      let buf = await fetchWithCache(
        `${effectiveBaseUrl}/${item.file}`,
        (loaded, total, cached) => {
          if (onStatus) {
            const frac = total ? loaded / total : 0.5;
            onStatus({
              stage: `download_${item.key}`,
              message: cached
                ? `Loaded ${item.label} from browser cache`
                : `Downloading ${item.label}: ${(loaded / 1048576).toFixed(1)} / ${((total || item.sizeMB * 1048576) / 1048576).toFixed(1)} MB`,
              progress: Math.min(92, basePct + frac * item.weight),
            });
          }
        },
        { skipCacheWrite: false }
      );

      const useGpuForModel = this.backendMode === "onnx" && item.key === "step" && hasWebGpu;
      if (onStatus) {
        onStatus({
          stage: `compile_${item.key}`,
          message: `Initializing ${item.label} (${useGpuForModel ? "ONNX WEBGPU" : `WASM SIMD ${ort.env.wasm.numThreads}T`})...`,
          progress: Math.min(94, basePct + item.weight),
        });
      }

      // WASM MatMulInteger uses native uint8 weights without ConstantFolding expansion (~270ms init, ~280MB RAM).
      // Desktop WebGPU uses ConstantFolding ('all') so Cast(INT8 -> FP16) * scale is folded once into GPU FP16 buffers;
      // on mobile GPUs (e.g. PowerVR D-Series), ConstantFolding 368MB FP16 hangs the driver, so disable if mobile WebGPU is forced.
      const optLevel = useGpuForModel && this.isMobile ? "disabled" : "all";

      let sess = null;
      if (useGpuForModel) {
        try {
          sess = await ort.InferenceSession.create(buf, {
            executionProviders: ["webgpu", "wasm"],
            graphOptimizationLevel: optLevel,
          });
          this.provider = "webgpu";
        } catch (gpuErr) {
          console.warn(`WebGPU session creation failed for ${item.key}, falling back to WASM SIMD:`, gpuErr);
          if (item.key === "step") this.provider = "wasm";
        }
      }
      if (!sess) {
        sess = await ort.InferenceSession.create(buf, {
          executionProviders: ["wasm"],
          graphOptimizationLevel: "all",
        });
      }
      // Release JS ArrayBuffer reference immediately so GC can reclaim 192 MB before next model
      buf = null;
      if (this.isMobile) {
        await new Promise((r) => setTimeout(r, 25));
      }

      if (item.key === "vocos") this.vocosSession = sess;
      else if (item.key === "cond") this.condSession = sess;
      else if (item.key === "step") this.stepSession = sess;

      basePct += item.weight;
    }

    // Pre-compile WebGPU WGSL shaders on desktop using a compact wDur=64 pass (skip on mobile/WASM to save RAM & time)
    if (!this.isWarmedUp) {
      if (!this.isMobile && this.provider === "webgpu") {
        if (onStatus) {
          onStatus({
            stage: "warmup",
            message: `Pre-warming ${this.provider.toUpperCase()} & WASM neural pipelines...`,
            progress: 96,
          });
        }
        const wDur = 64;
        const cOut = await this.condSession.run({
          cond_mel: new ort.Tensor("float32", new Float32Array(wDur * 100), [1, wDur, 100]),
          text_in: new ort.Tensor("int64", new BigInt64Array(wDur), [1, wDur]),
        });
        safeDisposeTensor(cOut.static_bias);
        safeDisposeTensor(cOut.rope_cos);
        safeDisposeTensor(cOut.rope_sin);

        const wRc = new ort.Tensor("float32", new Float32Array(wDur * 64), [1, wDur, 64]);
        const wRs = new ort.Tensor("float32", new Float32Array(wDur * 64), [1, wDur, 64]);
        const sOut2 = await this.stepSession.run({
          x: new ort.Tensor("float32", new Float32Array(2 * wDur * 100), [2, wDur, 100]),
          static_bias: new ort.Tensor("float32", new Float32Array(2 * wDur * 1024), [2, wDur, 1024]),
          t: new ort.Tensor("float32", new Float32Array([0.1, 0.1]), [2]),
          rope_cos: wRc,
          rope_sin: wRs,
        });
        safeDisposeTensor(sOut2.v_out);

        const sOut1 = await this.stepSession.run({
          x: new ort.Tensor("float32", new Float32Array(1 * wDur * 100), [1, wDur, 100]),
          static_bias: new ort.Tensor("float32", new Float32Array(1 * wDur * 1024), [1, wDur, 1024]),
          t: new ort.Tensor("float32", new Float32Array([0.8]), [1]),
          rope_cos: wRc,
          rope_sin: wRs,
        });
        safeDisposeTensor(sOut1.v_out);
        safeDisposeTensor(wRc);
        safeDisposeTensor(wRs);

        const vOut = await this.vocosSession.run({
          mel: new ort.Tensor("float32", new Float32Array(100 * 32), [1, 100, 32]),
        });
        safeDisposeTensor(vOut.wav);
      }
      this.isWarmedUp = true;
    }

    if (onStatus) {
      onStatus({
        stage: "ready",
        message: `100% In-Browser Neural Engine Ready (${this.provider.toUpperCase()} · Warm & Cached)`,
        progress: 100,
      });
    }
  }

  getRefEntry(meter, monoDepth = 1, diDepth = 1) {
    const m = this.bankManifest;
    const primes = m.primes || {};
    if (diDepth >= 3) {
      for (const k of ["prime_jaya", "prime_chata"]) {
        if (primes[k] && (primes[k].di_max || 0) >= diDepth) return primes[k];
      }
    }
    if (monoDepth >= 2 && primes.prime_mono && (primes.prime_mono.mono_max || 0) >= monoDepth) {
      return primes.prime_mono;
    }
    const key = (meter || "").toLowerCase().replace(/\.wav$/, "");
    const resolved = m.aliases[key] || m.aliases[m.fallback_meter] || Object.keys(m.entries)[0];
    return m.entries[resolved];
  }

  async synthesizeInBrowser(
    text,
    { meter = "auto", noSandhi = false, nfe = 7, cfg = 3.0, speed = 0.9, seed = 60, onChunk = null } = {},
    onProgress
  ) {
    await this.initOnnxSessions(onProgress);
    const ort = this.ort || (await resolveOrt());

    const basePadas = Array.isArray(text) ? text : splitPadas(text);
    if (!basePadas.length) throw new Error("Please enter a Sanskrit verse.");

    const { padas, pieces: rawPieces } = preparePieces(basePadas, noSandhi);
    if (!rawPieces.length) throw new Error("Please enter a Sanskrit verse.");

    // Synthesize full hemistichs (2 pieces per standard verse) to preserve natural sandhi & prosodic breath contour
    const pieces =
      rawPieces.length === 4
        ? [`${rawPieces[0]} ${rawPieces[1]}`, `${rawPieces[2]} ${rawPieces[3]}`]
        : rawPieces;
    const unitLabel = pieces.length > 2 ? "Pāda" : "Hemistich";

    const resolvedMeter = !meter || meter === "auto" ? detectMeterKey(text) || "vasantatilaka" : meter;
    let monoMax = 1;
    let diMax = 1;
    for (const x of pieces) {
      const [mo, di] = repDepths(aksharas(x));
      if (mo > monoMax) monoMax = mo;
      if (di > diMax) diMax = di;
    }

    const entry = this.getRefEntry(resolvedMeter, monoMax, diMax);
    const refMel = decodeFp16Buffer(this.bankBin, entry.byte_offset, entry.mel_frames, 100);
    const refMelFrames = entry.mel_frames;
    const refAudioLen = entry.ref_audio_len;
    const refLenSec = entry.ref_len_sec;
    const refTokens = entry.ref_tokens;
    const sps = entry.sec_per_syll;
    const vmap = this.bankManifest.vocab_char_map;
    const y0Meta = this.bankManifest.y0_seed60;

    // Precompute canonical NFE=12 sway grid for smooth multi-stage trajectory integration
    const t12 = new Float32Array(13);
    for (let i = 0; i <= 12; i++) {
      const u = i / 12;
      t12[i] = u - 1.0 * (Math.cos((Math.PI / 2) * u) - 1.0 + u);
    }

    // Build smooth ODE time schedule & step modes (default NFE=7: 24.12 dB Mel SNR, 0.9981 cosine similarity)
    let tSteps;
    let stepModes;
    const tailThr = 0.035;
    const effectiveNfe = Math.max(5, nfe || 7);
    if (effectiveNfe <= 5) {
      tSteps = new Float32Array([t12[0], t12[1], t12[2], t12[5], t12[8], 1.0]);
      stepModes = ["cfg", "cfg", "cfg", "b1", "b1"];
    } else if (effectiveNfe <= 6) {
      tSteps = new Float32Array([t12[0], t12[1], t12[2], t12[4], t12[7], t12[10], 1.0]);
      stepModes = ["cfg", "cfg", "cfg", "cfg", "b1", "b1"];
    } else if (effectiveNfe === 7) {
      // Smooth 7-step sway [0,1,2,3,5,8,10,12] FFFFFBB: 24.12 dB Mel SNR, 0.9981 cosine similarity
      tSteps = new Float32Array([t12[0], t12[1], t12[2], t12[3], t12[5], t12[8], t12[10], 1.0]);
      stepModes = ["cfg", "cfg", "cfg", "cfg", "cfg", "b1", "b1"];
    } else if (effectiveNfe === 8 || effectiveNfe === 9) {
      tSteps = new Float32Array([t12[0], t12[1], t12[2], t12[3], t12[4], t12[6], t12[9], t12[11], 1.0]);
      stepModes = ["cfg", "cfg", "cfg", "cfg", "cfg", "cfg", "b1", "b1"];
    } else {
      tSteps = new Float32Array(effectiveNfe + 1);
      stepModes = [];
      const minCfgSteps = Math.max(1, Math.floor(effectiveNfe * 0.65));
      for (let i = 0; i <= effectiveNfe; i++) {
        const u = i / effectiveNfe;
        tSteps[i] = u - 1.0 * (Math.cos((Math.PI / 2) * u) - 1.0 + u);
        if (i < effectiveNfe) {
          stepModes.push(cfg > 1e-5 && (tSteps[i] <= 0.75 || i < minCfgSteps) ? "cfg" : "b1");
        }
      }
    }

    const activeSteps = stepModes.length;
    const waves = [];
    const totalSteps = pieces.length * activeSteps;
    let completedSteps = 0;

    // Studio mid-verse caesura pause matching src/render_core.py (gap=0.55s, gap_halant=0.20s)
    const gaps = pieces.map(
      (p) => new Float32Array(Math.floor(0.55 * SR) + (endsHalant(p) ? Math.floor(0.20 * SR) : 0))
    );
    const slp0 = alignSlp1(padas[0]);
    const fric = Boolean(slp0) && ["S", "z", "s", "h"].includes(slp0[0]);
    const halant = endsHalant(pieces[pieces.length - 1]);
    const streamedParts = [];
    let streamedTotalLen = 0;

    const isProxyWasm = Boolean(ort?.env?.wasm?.proxy);

    // Helper: prepare inputs and run StaticConditioner for piece pIdx
    const preparePieceState = async (pIdx) => {
      const piece = pieces[pIdx];
      const cleanPiece = piece.replace(/;/g, ",").replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
      const rawTokens = [...refTokens];
      for (const ch of cleanPiece) {
        rawTokens.push(vmap[ch] !== undefined ? vmap[ch] : 0);
      }

      const nSyll = nAksharas(piece);
      const speedScale = 0.9 / Math.max(0.3, speed || 0.9);
      const fixD = refLenSec + nSyll * sps * speedScale;
      const dur = Math.min(4096, Math.max(rawTokens.length + 1, refAudioLen + 10, Math.floor((fixD * SR) / HOP)));

      const condMelArr = new Float32Array(dur * 100);
      const copyFrames = Math.min(refMelFrames, dur);
      condMelArr.set(refMel.subarray(0, copyFrames * 100), 0);

      const textInArr = new BigInt64Array(dur);
      const tokLimit = Math.min(rawTokens.length, dur);
      for (let i = 0; i < tokLimit; i++) {
        textInArr[i] = BigInt(rawTokens[i] + 1);
      }

      const tCondMel = new ort.Tensor("float32", condMelArr, [1, dur, 100]);
      const tTextIn = new ort.Tensor("int64", textInArr, [1, dur]);
      const condOut = await this.condSession.run({
        cond_mel: tCondMel,
        text_in: tTextIn,
      });
      safeDisposeTensor(tCondMel);
      safeDisposeTensor(tTextIn);

      // Use batched B=2 CFG for standard sequences (<=1100 frames); only split on mobile for long meters (>1100 frames)
      const useSplitCfg = this.isMobile && dur > 1100;
      const staticBias2B = new Float32Array(condOut.static_bias.data);
      const staticBiasCond = staticBias2B.slice(0, dur * 1024);
      const staticBiasNull = useSplitCfg ? staticBias2B.slice(dur * 1024, 2 * dur * 1024) : null;
      const sbTensor2B = useSplitCfg || isProxyWasm ? null : new ort.Tensor("float32", staticBias2B, [2, dur, 1024]);
      const sbTensor1B = isProxyWasm ? null : new ort.Tensor("float32", staticBiasCond, [1, dur, 1024]);
      const sbTensorNull1B =
        !useSplitCfg || isProxyWasm ? null : new ort.Tensor("float32", staticBiasNull, [1, dur, 1024]);

      const rcSlice = new Float32Array(condOut.rope_cos.data.slice(0, dur * 64));
      const rsSlice = new Float32Array(condOut.rope_sin.data.slice(0, dur * 64));
      safeDisposeTensor(condOut.static_bias);
      safeDisposeTensor(condOut.rope_cos);
      safeDisposeTensor(condOut.rope_sin);

      const ropeCos = isProxyWasm ? null : new ort.Tensor("float32", rcSlice, [1, dur, 64]);
      const ropeSin = isProxyWasm ? null : new ort.Tensor("float32", rsSlice, [1, dur, 64]);

      const x =
        seed === 60 && y0Meta && dur <= y0Meta.frames
          ? decodeFp16Buffer(this.bankBin, y0Meta.byte_offset, dur, 100)
          : randnArray(dur * 100, seed);
      const xBoth = useSplitCfg ? null : new Float32Array(2 * dur * 100);

      return {
        pIdx,
        dur,
        useSplitCfg,
        staticBias2B,
        staticBiasCond,
        staticBiasNull,
        rcSlice,
        rsSlice,
        sbTensor2B,
        sbTensor1B,
        sbTensorNull1B,
        ropeCos,
        ropeSin,
        x,
        xBoth,
        nextStep: 0,
      };
    };

    const disposePieceState = (st) => {
      safeDisposeTensor(st.sbTensor2B);
      safeDisposeTensor(st.sbTensor1B);
      safeDisposeTensor(st.sbTensorNull1B);
      safeDisposeTensor(st.ropeCos);
      safeDisposeTensor(st.ropeSin);
    };

    // Helper: run a single ODE step s on state st
    const runSingleOdeStep = async (st, s) => {
      const {
        dur,
        useSplitCfg,
        staticBias2B,
        staticBiasCond,
        staticBiasNull,
        rcSlice,
        rsSlice,
        sbTensor2B,
        sbTensor1B,
        sbTensorNull1B,
        ropeCos,
        ropeSin,
        x,
        xBoth,
      } = st;
      const tCurr = tSteps[s];
      const dt = tSteps[s + 1] - tCurr;
      const mode = cfg > 1e-5 ? stepModes[s] : "b1";

      if (onProgress) {
        const modeLabel = mode === "cfg" ? "Guided CFG" : "Harmonic Refine";
        onProgress({
          stage: "ode",
          message: `${unitLabel} ${st.pIdx + 1}/${pieces.length}: Step ${s + 1}/${activeSteps} (${modeLabel} · ${this.provider.toUpperCase()})`,
          progress: Math.round(((completedSteps + 0.5) / totalSteps) * 100),
        });
      }

      if (useSplitCfg || this.provider === "wasm") {
        // Let the browser paint the progress update and timer before WASM execution
        await new Promise((r) => setTimeout(r, 12));
      }

      if (mode === "cfg" && !useSplitCfg) {
        let xBuf;
        if (isProxyWasm) {
          xBuf = new Float32Array(2 * dur * 100);
          xBuf.set(x, 0);
          xBuf.set(x, dur * 100);
        } else {
          xBoth.set(x, 0);
          xBoth.set(x, dur * 100);
          xBuf = xBoth;
        }
        const tX = new ort.Tensor("float32", xBuf, [2, dur, 100]);
        const tT = new ort.Tensor("float32", new Float32Array([tCurr, tCurr]), [2]);
        const tSb = isProxyWasm ? new ort.Tensor("float32", staticBias2B.slice(), [2, dur, 1024]) : sbTensor2B;
        const tRc = isProxyWasm ? new ort.Tensor("float32", rcSlice.slice(), [1, dur, 64]) : ropeCos;
        const tRs = isProxyWasm ? new ort.Tensor("float32", rsSlice.slice(), [1, dur, 64]) : ropeSin;
        const stepOut = await this.stepSession.run({
          x: tX,
          static_bias: tSb,
          t: tT,
          rope_cos: tRc,
          rope_sin: tRs,
        });
        const vData = stepOut.v_out.data;
        const offset = dur * 100;
        for (let i = 0; i < offset; i++) {
          const pred = vData[i];
          const diff = pred - vData[offset + i];
          x[i] += (pred + diff * cfg) * dt;
        }
        safeDisposeTensor(stepOut.v_out);
        safeDisposeTensor(tX);
        safeDisposeTensor(tT);
        if (isProxyWasm) {
          safeDisposeTensor(tSb);
          safeDisposeTensor(tRc);
          safeDisposeTensor(tRs);
        }
      } else if (mode === "cfg" && useSplitCfg) {
        // Low-Memory / Responsive Split-CFG: run two B=1 passes with an event-loop yield between them
        const tX1 = new ort.Tensor("float32", isProxyWasm ? x.slice() : x, [1, dur, 100]);
        const tT1 = new ort.Tensor("float32", new Float32Array([tCurr]), [1]);
        const tSb1 = isProxyWasm ? new ort.Tensor("float32", staticBiasCond.slice(), [1, dur, 1024]) : sbTensor1B;
        const tRc1 = isProxyWasm ? new ort.Tensor("float32", rcSlice.slice(), [1, dur, 64]) : ropeCos;
        const tRs1 = isProxyWasm ? new ort.Tensor("float32", rsSlice.slice(), [1, dur, 64]) : ropeSin;
        const condStep = await this.stepSession.run({
          x: tX1,
          static_bias: tSb1,
          t: tT1,
          rope_cos: tRc1,
          rope_sin: tRs1,
        });
        const vCond = new Float32Array(condStep.v_out.data);
        safeDisposeTensor(condStep.v_out);
        safeDisposeTensor(tX1);
        safeDisposeTensor(tT1);
        if (isProxyWasm) {
          safeDisposeTensor(tSb1);
          safeDisposeTensor(tRc1);
          safeDisposeTensor(tRs1);
        }

        await new Promise((r) => setTimeout(r, 12));

        const tX2 = new ort.Tensor("float32", isProxyWasm ? x.slice() : x, [1, dur, 100]);
        const tT2 = new ort.Tensor("float32", new Float32Array([tCurr]), [1]);
        const tSb2 = isProxyWasm ? new ort.Tensor("float32", staticBiasNull.slice(), [1, dur, 1024]) : sbTensorNull1B;
        const tRc2 = isProxyWasm ? new ort.Tensor("float32", rcSlice.slice(), [1, dur, 64]) : ropeCos;
        const tRs2 = isProxyWasm ? new ort.Tensor("float32", rsSlice.slice(), [1, dur, 64]) : ropeSin;
        const nullStep = await this.stepSession.run({
          x: tX2,
          static_bias: tSb2,
          t: tT2,
          rope_cos: tRc2,
          rope_sin: tRs2,
        });
        const vNull = nullStep.v_out.data;
        const len = dur * 100;
        for (let i = 0; i < len; i++) {
          const pred = vCond[i];
          const diff = pred - vNull[i];
          x[i] += (pred + diff * cfg) * dt;
        }
        safeDisposeTensor(nullStep.v_out);
        safeDisposeTensor(tX2);
        safeDisposeTensor(tT2);
        if (isProxyWasm) {
          safeDisposeTensor(tSb2);
          safeDisposeTensor(tRc2);
          safeDisposeTensor(tRs2);
        }
      } else {
        const tX = new ort.Tensor("float32", isProxyWasm ? x.slice() : x, [1, dur, 100]);
        const tT = new ort.Tensor("float32", new Float32Array([tCurr]), [1]);
        const tSb = isProxyWasm ? new ort.Tensor("float32", staticBiasCond.slice(), [1, dur, 1024]) : sbTensor1B;
        const tRc = isProxyWasm ? new ort.Tensor("float32", rcSlice.slice(), [1, dur, 64]) : ropeCos;
        const tRs = isProxyWasm ? new ort.Tensor("float32", rsSlice.slice(), [1, dur, 64]) : ropeSin;
        const stepOut = await this.stepSession.run({
          x: tX,
          static_bias: tSb,
          t: tT,
          rope_cos: tRc,
          rope_sin: tRs,
        });
        const vData = stepOut.v_out.data;
        for (let i = 0; i < dur * 100; i++) {
          x[i] += vData[i] * dt;
        }
        safeDisposeTensor(stepOut.v_out);
        safeDisposeTensor(tX);
        safeDisposeTensor(tT);
        if (isProxyWasm) {
          safeDisposeTensor(tSb);
          safeDisposeTensor(tRc);
          safeDisposeTensor(tRs);
        }
      }
      st.nextStep = s + 1;
      completedSteps++;
    };

    // Helper: run Vocos + Cross-Chunk RMS Continuity + Smooth Caesura Gate
    const runVocosAndGate = async (st) => {
      const { pIdx, dur, x } = st;
      const genFrames = dur - refAudioLen;
      const genMelT = new Float32Array(100 * genFrames);
      for (let f = 0; f < genFrames; f++) {
        const srcBase = (refAudioLen + f) * 100;
        for (let c = 0; c < 100; c++) {
          genMelT[c * genFrames + f] = x[srcBase + c];
        }
      }

      const tMel = new ort.Tensor("float32", genMelT, [1, 100, genFrames]);
      const vocOut = await this.vocosSession.run({
        mel: tMel,
      });
      const y = new Float32Array(vocOut.wav.data);
      safeDisposeTensor(vocOut.wav);
      safeDisposeTensor(tMel);

      const scale = entry.ref_rms < entry.target_rms ? entry.ref_rms / entry.target_rms : 1.0;
      let maxAbs = 0;
      for (let i = 0; i < y.length; i++) {
        y[i] *= scale;
        const a = Math.abs(y[i]);
        if (a > maxAbs) maxAbs = a;
      }
      if (maxAbs > 1.0) {
        const norm = 0.97 / maxAbs;
        for (let i = 0; i < y.length; i++) {
          y[i] *= norm;
        }
      }

      const isLast = pIdx === pieces.length - 1;
      const gatedChunk = gateAudio(y, {
        fric: fric && pIdx === 0,
        halant: halant && isLast,
        tailThr,
        fin: 0.015,
        fout: 0.04,
        keep: 0.06,
      });
      waves[pIdx] = gatedChunk;

      const gapChunk = !isLast ? gaps[pIdx] : new Float32Array(0);
      return { pIdx, gatedChunk, gapChunk };
    };

    // Stream each chunk immediately: Part 1 starts playing with ZERO Part-2 pre-delay,
    // and Part 2+ synthesizes in the background with paced yields while Part 1 plays!
    for (let pIdx = 0; pIdx < pieces.length; pIdx++) {
      if (onProgress) {
        onProgress({
          stage: "condition",
          message: `${unitLabel} ${pIdx + 1}/${pieces.length}: Preparing Prosodic Conditioning...`,
          progress: Math.round((completedSteps / totalSteps) * 100),
        });
      }
      await new Promise((resolve) => setTimeout(resolve, 12));
      const currState = await preparePieceState(pIdx);

      for (let s = 0; s < activeSteps; s++) {
        await runSingleOdeStep(currState, s);
        if (pIdx > 0 || this.isMobile || this.provider === "wasm") {
          // Yield so browser UI & Web Audio hardware thread stay 100% glitch-free
          await new Promise((resolve) => setTimeout(resolve, this.isMobile || this.provider === "wasm" ? 16 : 4));
        }
      }

      const { gatedChunk, gapChunk } = await runVocosAndGate(currState);
      disposePieceState(currState);

      streamedParts.push(gatedChunk);
      streamedTotalLen += gatedChunk.length;
      if (gapChunk.length > 0) {
        streamedParts.push(gapChunk);
        streamedTotalLen += gapChunk.length;
      }

      if (onChunk) {
        const soFar = new Float32Array(streamedTotalLen);
        let pos = 0;
        for (const p of streamedParts) {
          soFar.set(p, pos);
          pos += p.length;
        }
        await onChunk({
          chunkIndex: pIdx,
          totalChunks: pieces.length,
          gatedSamples: gatedChunk,
          gapSamples: gapChunk,
          samplesSoFar: soFar,
          sampleRate: SR,
          meter: resolvedMeter,
        });
        // Give Web Audio hardware buffer 45ms to prime cleanly before background work starts
        await new Promise((resolve) => setTimeout(resolve, 45));
      }
    }

    // 4. Final stitched waveform (identical to streamedParts concatenation)
    const finalSamples = new Float32Array(streamedTotalLen);
    let pos = 0;
    for (const p of streamedParts) {
      finalSamples.set(p, pos);
      pos += p.length;
    }
    const wavBuffer = encodeWavBuffer(finalSamples, SR);
    const wavBlob = typeof Blob !== "undefined" ? new Blob([wavBuffer], { type: "audio/wav" }) : null;
    const url = wavBlob && typeof URL !== "undefined" && URL.createObjectURL ? URL.createObjectURL(wavBlob) : null;

    return {
      wav: wavBuffer,
      audio: finalSamples,
      blob: wavBlob,
      url,
      durationSec: finalSamples.length / SR,
      sampleRate: SR,
      sampling_rate: SR,
      meter: resolvedMeter,
      pieces,
    };
  }
}
