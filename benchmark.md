# Vāgdhenu — In-Browser Neural Sanskrit TTS Benchmarks & Acoustic Fidelity Report

This document records the end-to-end latency, memory footprint, thread-scaling characteristics, and acoustic fidelity benchmarks for **Vāgdhenu** (`IndicF5` 22-block Flow-Matching DiT + Static `ConvNeXtV2` Conditioner + Fourier-Hann `ConvTranspose1d` Vocos Vocoder) running **100% client-side in the browser** across **ONNX WebGPU (`shader-f16`)** and **CPU-Only WebAssembly SIMD (`MatMulInteger`)**.

---

## 1. Real Physical Android Phone Benchmark (Google Pixel 10 Pro XL)

Tested over local Wi-Fi via **Wireless ADB + Chrome DevTools Protocol (`wifidebugging`)** using `adb reverse tcp:8095 tcp:8095` to establish a loopback Secure Context (`crossOriginIsolated: true`, `SharedArrayBuffer` enabled) and `adb forward tcp:9225 localabstract:chrome_devtools_remote`.

#### Device Hardware & Browser Telemetry
| Property | Measured Value on Device |
| :--- | :--- |
| **Device Model** | **Google Pixel 10 Pro XL** (`product:mustang`) |
| **Operating System** | Android 17 (`API 36`) |
| **SoC / CPU** | **Google Tensor G5** · 8 ARMv9 Cores (`1× Cortex-X4 @ 3.78 GHz` + `5× Cortex-A725 @ 3.05 GHz` + `2× Cortex-A520 @ 2.25 GHz`, `navigator.hardwareConcurrency = 8`) |
| **System RAM** | **16 GB LPDDR5X** (`15,436,024 kB` `/proc/meminfo`, `navigator.deviceMemory = 8`) |
| **Mobile GPU** | **Imagination PowerVR D-Series** (`vendor: "img-tec"`, `architecture: "d-series"`, `shader-f16: true`) |
| **Browser** | Chrome Mobile `154.0.0.0` (`window.crossOriginIsolated = true`) |
| **Test Verse** | *Raghuvaṃśam 1.1* (`वागर्थाविव संपृक्तौ वागर्थप्रतिपत्तये । जगतः पितरौ वन्दे पार्वतीपरमेश्वरौ ॥`, *Anuṣṭubh*, 32 syllables) |

### Physical Pixel 10 Pro XL Execution Results (Live on `h3manth.com/ai/sanskrit-tts/#studio`)
| Execution Mode | Active Provider | Threads / Schedule / Ref | Session Init (`vagdhenu-models-v10`) | Perceived Latency | First Audio Token (TTFA) | Full Verse Total | Generated Audio | Mel Cosine Sim | Crash / OOM |
| :--- | :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: | :---: |
| **1. Initial Mobile Baseline (Screen Locked / Unoptimized)** | `wasm` / `webgpu` | Full Ref (`444f`), Full Hemistich (`dur=933`), `NFE=7` (`12` passes) | `29.20 s` *(no cache)* | `161.67 s` | `161.67 s` | `449.41 s` | `8.87 s` (`24 kHz`) | `0.9595` | **0 OOM** |
| **2. Mobile WebGPU (`optLevel: "disabled"` on PowerVR)** | `webgpu` | PowerVR D-Series (`88` per-step CPU→GPU `Cast` copies) | `25.33 s` | `151.73 s` | `151.73 s` | `303.40 s` | `8.87 s` (`24 kHz`) | `0.9981` | **0 OOM** |
| **3. `v=28` Mobile 6T WASM + TailRef (`162f`) + 4-Pāda Stream (`NFE=6`)** | `wasm` | **6T ARM64 SIMD** (`MatMulInteger` `uint8`), `NFE=6` (`10` passes), `4` chunks | `2.28 s` *(cached)* | `16.07 s` | `16.07 s` | `62.27 s` | `7.80 s` (`24 kHz`) | `0.8987` | **0 OOM** |
| **4. `v=31` Mobile (`6T WASM` + `TailRef` `162f` + `[P1, P2, H2]` + `NFE=5`)** | `wasm` | **6T ARM64 SIMD** (`5× A725 + 1× X4`), `NFE=5` (`8` passes), `3` chunks | `2.09 s` *(cached)* | `12.50 s` | `12.50 s` | `46.59 s` | `7.80 s` (`24 kHz`) | `0.9872` | **0 OOM** |
| **5. `v=33` Production Mobile (`6T WASM` + `MICRO_REF_LUT` `36f` + First-Word Micro-Chunk + Velocity-Collinear `FB/FBB`)** | `wasm` | **6T ARM64 SIMD**, **Chunk 0: `2-Step FB` (`3` passes, `dur=134`) + Chunks 1–3: `3-Step FBB` (`4` passes)** | **`2.15 s` *(cached + `wDur=16` warm)*** | **`< 20 ms` *(Tanpura `Sa–Pa–Sa`)*** | **`1.69 s` *(95.7× faster)*** | **`13.35 s` *(33.7× faster)*** | `6.60 s` (`24 kHz`) | **`0.9471–0.9575`** | **0 OOM** |

### Exact Per-Step Latency Scaling on Physical Google Pixel 10 Pro XL (`6T WASM SIMD MatMulInteger`)
Measured directly on the Tensor G5 (`1× Cortex-X4 + 5× Cortex-A725`) across sequence lengths `dur = 80..353` frames:

| Sequence Length `dur` (frames) | `condSession` (`1×` per chunk) | `1× B=1` DiT Step (`ms`) | `1× B=2` Guided CFG Step (`ms`) | `vocosSession` (`1×` per chunk) | `2-Step FB` Total (`1 CFG + 1 B1`) |
| ---: | ---: | ---: | ---: | ---: | ---: |
| **`80 frames`** | `47 ms` | **`295 ms`** | **`552 ms`** | `16 ms` | **`910 ms` (`0.91 s`)** |
| **`96 frames`** | `22 ms` | **`393 ms`** | **`849 ms`** | `18 ms` | **`1,282 ms` (`1.28 s`)** |
| **`112 frames`** | `23 ms` | **`412 ms`** | **`807 ms`** | `22 ms` | **`1,264 ms` (`1.26 s`)** |
| **`128 frames`** | `27 ms` | **`480 ms`** | **`942 ms`** | `28 ms` | **`1,477 ms` (`1.48 s`)** |
| **`134 frames` (`Chunk 0`)** | `29 ms` | **`510 ms`** | **`1,010 ms`** | `30 ms` | **`1,579 ms` (`~1.69 s` E2E)** |
| **`160 frames`** | `34 ms` | **`654 ms`** | **`1,203 ms`** | `36 ms` | **`1,927 ms` (`1.93 s`)** |
| **`353 frames` (`v=31` Chunk 0)** | `74 ms` | `1,519 ms` | `3,010 ms` | `95 ms` | `12,500 ms` *(8 passes)* |

### Seven Mobile Engineering Optimizations Verified on Pixel 10 Pro XL (`161.67s → 12.50s → 1.69s` First Audio)
1. **Exploiting Velocity Collinearity in Sway Flow-Matching (`2-Step FB` & `3-Step FBB` Schedules)**:
   - Computing the $7 \times 7$ cosine similarity matrix of conditional velocities $v_{\text{cond}}(x_t, t)$ across the Sway-ODE trajectory (`t12[[0, 1, 2, 3, 5, 8, 10, 12]]`) revealed a fundamental structural property of the trained Vāgdhenu DiT:
     - At **Step 0 (`t = 0.0000`)**, $x_0$ is pure Gaussian noise and only `static_bias` carries text/speaker conditioning (`||pred - uncond|| = 279.97`, `93%` of `||pred||`), so **Classifier-Free Guidance (`B=2`) is essential at Step 0**.
     - Once Step 0 advances $x_t$ to $t \in [0.0086, 0.020]$, $x_t$ carries the phonetic/prosodic structure into self-attention, and **all subsequent conditional velocities from $t = 0.0086$ to $t = 1.000$ are `99.2%–99.87%` collinear (`cos_sim = 0.9920–0.9987`) with constant norm (`521.68 → 518.71`)**!
   - Therefore, **Chunk 0** uses a **`2-Step FB` schedule (`[0.0, 0.018, 1.0]`, `["cfg", "b1"]`, `3` B1-eq passes, `0.9471` Mel cosine similarity)** to deliver the first audio token in **`1.69 s`**, while **Chunks 1–3** stream in the background using **`3-Step FBB` (`[0.0, 0.0086, 0.1340, 1.0]`, `["cfg", "b1", "b1"]`, `4` B1-eq passes, `0.9548–0.9575` Mel cosine similarity)**.
2. **First-Word Instant-Start Micro-Chunking (`splitFirstWordForInstantStart`) + Single-Syllable Reference (`MICRO_REF_LUT`)**:
   - Splitting Pāda 1 after its first word (`2–6` akṣaras, e.g. `वागर्थाविव` = `5` akṣaras) and pairing it with **`MICRO_REF_LUT`** (an exact syllable-aligned `36–80` frame phrase-final reference slice ending with `.  `, e.g. `anuṣṭubh: { frame: 408, tok: 40, sps: 0.21 }`, `ref = 36` frames = `'कम्.  '`) reduces **Chunk 0 sequence length `dur` from `933` frames (`v=1`) and `353` frames (`v=31`) down to `134` frames** (`402` frame-passes total vs `2,824` in `v=31` — a **`7.0×` compute reduction on Chunk 0**).
3. **Active Voice RMS Calibration Before `gateAudio`**:
   - At `2–3` ODE steps, raw Vocos waveform amplitude is slightly lower (`RMS ≈ 0.075`) than 12-step trajectories (`RMS ≈ 0.14`). Calibrating each chunk's active voice RMS (`|y[i]| > 0.015`) to `entry.ref_rms` (`~0.095`) *before* `gateAudio` (`voice = 0.08`) ensures zero clipped leading/trailing syllables and seamless loudness continuity between `2-Step FB` Chunk 0 and `3-Step FBB` Chunks 1–3.
4. **Instant `<20 ms` Perceived Latency via WebAudio Vedic Tanpura / Śruti Intonation Pluck (`138.59 Hz` `C#3`)**:
   - On button tap, `startInstantTanpuraPluck()` synchronously synthesizes a gentle `Sa–Pa–Sa` harmonic pluck at `138.59 Hz` (`C#3`, matching the Vāgdhenu speaker's exact tonic pitch `ādhāra-ṣaḍja`), giving `<20 ms` tactile-auditory feedback while unlocking the mobile hardware DAC, and crossfading (`45 ms` ramp) into Chunk 0 the instant it resolves at `1.69 s`.
5. **Default Mobile to 6-Thread `WASM SIMD` (`MatMulInteger`) + `wDur = 16` PThread Pool Pre-Warm**:
   - Benchmarking synthetic 88-MatMul models (`task-4671`) on the Pixel 10 Pro XL proved that `6T WASM SIMD MatMulInteger` (`181 ms` at `L=96`) is **`10.5×` faster** than native `WebGPU FP16` (`1,916 ms`) and **`14.0×` faster** than `WebGPU Q4` (`2,538 ms`) on the Imagination PowerVR D-Series GPU. Pre-warming the sessions with a compact `wDur = 16` pass during `initOnnxSessions` wakes the 6 ARMv9 worker threads ahead of time, saving `~350 ms` on the first click.
6. **Hybrid `[Word 1, Rest of Pāda 1, Pāda 2, Hemistich 2]` Live WebAudio Streaming (`streamedLive = true`)**:
   - Streams all 4 parts live through `AudioContext({ latencyHint: "playback" })` with calibrated caesura pauses (`0.06 s` intra-pāda micro-breath after Word 1, `0.18 s` after Pāda 1, `0.55 s` daṇḍa pause after Pāda 2), finishing the entire 32-syllable śloka in **`13.35 s`** (`33.7×` faster than baseline).
7. **Browser Cache API Enabled on Mobile (`vagdhenu-models-v10`) + Screen Wake Lock**:
   - Enabled `Cache.put()` on mobile (`skipCacheWrite: false` in `web/vagdhenu-onnx.js`) while releasing temporary `ArrayBuffer` references immediately after `InferenceSession.create()`, eliminating the `255 MB` (`29.2 s`) re-download on reloads (`warmMs = 2.15 s`).
   - Added `navigator.wakeLock.request("screen")` during synthesis, and documented two critical Wireless ADB pitfalls in `wifidebugging`:
     - When an Android screen locks on battery over Wireless ADB, `PowerManagerService` throttles all 8 Tensor G5 cores down to `400 MHz` (`9×` slower, turning `16s` into `161.67s`).
     - Enabling `cmd power set-fixed-performance-mode-enabled true` caps Cortex-A725/X4 `scaling_max_freq` to `1.78 GHz / 2.07 GHz` (`55%` of turbo). Always use `cmd power set-fixed-performance-mode-enabled false` with `dumpsys battery set usb 1 && svc power stayon true`.

---

## 2. Desktop Apple Silicon Benchmark (macOS Chrome 154)

Measured on Apple Silicon (`arm64`, macOS Chrome `154.0.0.0`, `crossOriginIsolated: true`) across WebGPU and CPU-only WASM SIMD modes.

| Backend Mode | Provider | Threads / Kernel Path | Warm Session Init | First Hemistich (TTFA) | Full Śloka Total (`~9.2s` audio) | Real-Time Factor (TTFA / Audio) |
| :--- | :--- | :--- | ---: | ---: | ---: | ---: |
| **ONNX WebGPU (`sanskrit-tts-onnx`)** | `webgpu` | Apple GPU `shader-f16` Tiled GEMM (`Int8StoredLinear`) | `1.35 s` | **1.85 s** | **3.72 s** | **0.40× RTF** *(2.5× faster than real-time)* |
| **WASM SIMD 4T (`sanskrit-tts-wasm`)** | `wasm` | 4-Thread ARM64 WASM SIMD (`MatMulInteger` `uint8`) | `0.30 s` | **8.90 s** | **17.85 s** | **0.97× RTF** *(streams seamlessly)* |
| **WASM SIMD 1T (Unisolated Fallback)** | `wasm` | 1-Thread ARM64 WASM SIMD (`crossOriginIsolated: false`) | `0.28 s` | **21.40 s** | **42.80 s** | **2.32× RTF** |

### WASM SIMD Thread-Scaling & Barrier Contention Study (`dur = 932`)
On multi-core CPUs running `onnxruntime-web` WASM PThreads (`MatMulInteger`), spawning too many threads (`8T–10T`) causes spin-lock barrier contention across the `88 × 7 = 616` integer GEMM dispatches per hemistich and competes with big/efficiency cores:

| WASM `numThreads` | `B=2` CFG Step (`dur=932`) | `B=1` Refine Step (`dur=932`) | Full ODE Trajectory (`NFE=7`) | Speedup vs `1T` |
| :---: | ---: | ---: | ---: | ---: |
| **1 Thread** | `3,840 ms` | `1,960 ms` | `23.12 s` | `1.00×` |
| **2 Threads** | `2,310 ms` | `1,190 ms` | `13.93 s` | `1.66×` |
| **4 Threads (Optimal `hc <= 12`)** | **`1,520 ms`** | **`790 ms`** | **`9.18 s`** | **`2.52×`** |
| **6 Threads (Optimal `hc > 12`)** | `1,490 ms` | `775 ms` | `9.00 s` | `2.57×` |
| **8 Threads** | `1,740 ms` | `910 ms` | `10.52 s` | `2.20×` *(barrier contention)* |
| **10 Threads** | `2,180 ms` | `1,140 ms` | `13.18 s` | `1.75×` *(E-core + lock contention)* |

**Rule Implemented in `web/vagdhenu-onnx.js`**:
```js
const hc = (typeof navigator !== "undefined" && navigator.hardwareConcurrency) || 4;
const optimalThreads = hc <= 12 ? Math.min(4, hc) : 6;
ort.env.wasm.numThreads = isIsolated ? optimalThreads : 1;
```

---

## 3. Constrained & Budget CPU-Only Device Tiers (CDP Throttling)

Verified in headless Chrome (`390×844` mobile viewport) using Chrome DevTools Protocol `Emulation.setCPUThrottlingRate` to simulate mid-range and budget CPU-only phones without WebGPU:

| Device Tier Profile | CPU Throttle | Active Provider | Peak JS + WASM RAM | First Chunk Latency | Total Synthesis | Status |
| :--- | :---: | :--- | ---: | ---: | ---: | :--- |
| **Flagship Mobile CPU** | `1×` | `wasm` (`4T SIMD`) | `~410 MB` | `8.9 s` | `17.8 s` | **PASS (0 OOM)** |
| **Mid-Range Android CPU** | `2×` | `wasm` (`4T SIMD`) | `~410 MB` | `17.9 s` | `35.8 s` | **PASS (0 OOM)** |
| **Budget / Low-End CPU-Only** | `4×` | `wasm` (`4T SIMD`) | `~410 MB` | `35.4 s` | `70.8 s` | **PASS (0 OOM)** |

---

## 4. Acoustic Fidelity & Quantization Ablation (`Why Bad Audio Happened & How We Fixed It`)

To guarantee studio-grade Sanskrit recitation across both `ONNX WebGPU` and `WASM SIMD`, we benchmarked every stage of the browser pipeline against the **Studio Reference (`NFE=12` Full-Reference G2P Kannada-Phonetic Pipeline, `src/render_core.py`)** on *Bhagavad Gītā 4.7* (`यदा यदा हि धर्मस्य ग्लानिर्भवति भारत`, prepared G2P: `ಯದಾ ಯದಾ ಹಿ ಧರ್ಮಸ್ಯ ಗ್ಲಾನಿರ್ಭವತಿ ಭಾರತ`, `16 akṣaras`, `dur = 932 frames`).

### End-to-End Mel SNR, Cosine Similarity & Log-Spectral Distance (LSD) Ablation
| Configuration | Reference Prompt | Chunking Unit | ODE Schedule | Mel Cosine Sim | Mel SNR (dB) | Spectrogram Corr | Log-Spectral Dist (LSD) | Perceptual Quality |
| :--- | :--- | :--- | :--- | ---: | ---: | ---: | ---: | :--- |
| **1. `ONNX Q8` (`Int8StoredLinear`)** | Full 2-Pāda (`444f`) | Full Hemistich (`16 syl`) | **`NFE=7` Smooth Sway (`5C+2B`)** | **`0.9981`** | **`+24.12 dB`** | **`0.9557`** | **`5.61 dB`** | **Studio Gold (Indistinguishable)** |
| **2. `ONNX Q8` (`Int8StoredLinear`)** | Full 2-Pāda (`444f`) | Full Hemistich (`16 syl`) | `NFE=5` (`3C+2B`) | `0.9668` | `+11.65 dB` | `0.8120` | `11.40 dB` | Noticeable harmonic roughness (`-12.5 dB`) |
| **3. `WASM Q8` (`SmoothQuant + Per-Col`)** | Full 2-Pāda (`444f`) | Full Hemistich (`16 syl`) | **`NFE=7` Smooth Sway (`5C+2B`)** | **`0.9595`** | **`+10.98 dB`** *(Full) / **`33.1 dB`** (Step)* | **`0.7850`** | **`12.40 dB`** | **Clean, natural CPU recitation** |
| **4. `WASM Q8` (Legacy Scalar + `SlicedRef`)** | Sliced 1-Pāda (`161f`) | Full Hemistich (`16 syl`) | `NFE=7` (`5C+2B`) | `0.7967` | `+4.13 dB` | `0.5810` | `18.90 dB` | Severe prosodic/phoneme slurring |
| **5. Previous Broken Mobile/WASM Path** | Sliced 1-Pāda (`161f`) | Split 8-Syl Pāda (`8 syl`) | `NFE=5` (`3C+2B`) + `0.82` Tanh Clip | **`0.2364`** | **`-2.96 dB`** | **`0.3996`** | **`24.64 dB`** | **Severely distorted / clipped (`peak=1.0`)** |

### Root Causes of Previous Audio Degradation (Fixed)
1. **Dynamic Reference-Mel Slicing (`SlicedRef`, `-14.7 dB` SNR Collapse)**:
   - Slicing the 2-pāda reference mel (`444 frames -> 161 frames`) and estimating the character split index linearly in `ref_tokens` misaligned the reference text tokens against the reference audio frames in `StaticConditioner`. Because Flow-Matching DiT cross-attention relies on exact frame-to-character alignment in the prompt prefix, slicing the reference prompt caused severe phoneme slurring (`Mel SNR` dropped from `+18.85 dB` to `+4.13 dB`).
   - **Fix**: Removed reference-mel slicing completely; all devices now use the exact, pre-aligned `444`-frame reference prompt from `baked_bank.bin`.
2. **Intra-Hemistich 8-Syllable Splitting (`splitHemistichAtCaesura`, `-7.1 dB` SNR Drop)**:
   - Splitting a 16-syllable *Anuṣṭubh* hemistich (`यदा यदा हि धर्मस्य ग्लानिर्भवति भारत`) into two isolated 8-syllable generations broke continuous sandhi and prosodic phrasing across the pāda boundary (`+4.13 dB -> -2.96 dB`).
   - **Fix**: Restored full-hemistich synthesis (`2 pieces` per verse) matching `src/render_core.py`.
3. **Forced `NFE=5` Truncation (`-12.47 dB` SNR Drop)**:
   - Forcing `effectiveNfe = Math.min(nfe, 5)` (`3 CFG + 2 B1` steps) took oversized Euler steps (`t = 0.06 -> 0.22 -> 0.50 -> 1.0`), losing `12.47 dB` of Mel SNR compared to the 7-step Smooth Sway schedule (`5 CFG + 2 B1`, `24.12 dB` Mel SNR).
   - **Fix**: Restored `NFE=7` Smooth Sway (`[t12[0], t12[1], t12[2], t12[3], t12[5], t12[8], t12[10], 1.0]`) as the default across all devices.
4. **AdaLN Activation Outliers & Fused QKV Scalar Weight Scales in `vagdhenu_dit_step_wasm_q8.onnx` (`+1.10 to +4.08 dB` Per-Step Velocity SNR Gain)**:
   - Probing internal activations of the 22 DiT blocks revealed up to **`50.0×` channel outlier ratios** after AdaLN modulation (`norm1_0 max = 32.57` vs `median = 1.76`, `18.5×`; `norm2_0 max = 36.03` vs `median = 0.72`, `50.0×`).
   - Furthermore, fusing `[Q, K, V]` into `qkv_projs.{i}` (`1024 × 3072`) with a single scalar `weight_scale` (`max |K| = 4.02` vs `max |V| = 0.31`) crushed the entire `V` projection into just `±10` integer quantization levels out of `[-127, +127]`.
   - **Fix**: Applied **Zero-Node SmoothQuant channel balancing** (absorbing per-channel activation scales $s_c$ directly into `w_all_mods` / `b_all_mods` and `V` projections with zero extra ONNX graph nodes) + **Per-Column Symmetric `uint8` `weight_scale` vectors (`(3072,)`, `(1024,)`, `(2048,)`)**:

| ODE Step ($t$) | Baseline `step_wasm_q8` Velocity SNR | **SmoothQuant + Per-Column `step_wasm_q8`** | Velocity SNR Gain |
| :--- | ---: | ---: | ---: |
| **Step 0 (`t = 0.000`)** | `25.86 dB` | **`26.96 dB`** | **`+1.10 dB`** |
| **Step 1 (`t = 0.009`)** | `30.93 dB` | **`33.06 dB`** | **`+2.13 dB`** |
| **Step 2 (`t = 0.034`)** | `24.97 dB` | **`29.05 dB`** | **`+4.08 dB`** |
| **Step 3 (`t = 0.076`)** | `29.68 dB` | **`31.36 dB`** | **`+1.68 dB`** |
| **Step 4 (`t = 0.207`)** | `30.29 dB` | **`31.78 dB`** | **`+1.49 dB`** |
| **Step 5 (`t = 0.500`)** | `27.65 dB` | **`29.95 dB`** | **`+2.30 dB`** |
| **Step 6 (`t = 0.741`)** | `24.93 dB` | **`28.19 dB`** | **`+3.26 dB`** |

5. **Mobile Web Audio DAC Resampling & Adaptive Gapless Playback**:
   - Replaced `new AudioContext({ sampleRate: 24000 })` (which caused Android hardware DACs locked at `48 kHz` to crackle under heavy CPU/GPU load) with `new AudioContext({ latencyHint: "playback" })` + `createBuffer(1, len, 24000)`, and added adaptive gapless buffering so mobile devices never stall or crackle mid-verse while Hemistich 2 is computing.
