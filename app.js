import { analyzeVerse } from "./vagdhenu-text.js?v=27";
import { VagdhenuWebEngine, isMobileDevice } from "./vagdhenu-onnx.js?v=27";

const PRESETS = [
  {
    title: "Raghuvaṃśam 1.1 (anuṣṭubh)",
    meter: "auto",
    sandhi: true,
    text: "वागर्थाविव संपृक्तौ वागर्थप्रतिपत्तये ।\nजगतः पितरौ वन्दे पार्वतीपरमेश्वरौ ॥",
  },
  {
    title: "Kṛṣṇa · Vasudevasutaṃ",
    meter: "auto",
    sandhi: true,
    text: "वसुदेवसुतं देवं कंसचाणूरमर्दनम् ।\nदेवकीपरमानन्दं कृष्णं वन्दे जगद्गुरुम् ॥",
  },
  {
    title: "Viṣṇu · Śuklāmbaradharaṃ",
    meter: "auto",
    sandhi: true,
    text: "शुक्लाम्बरधरं विष्णुं शशिवर्णं चतुर्भुजम् ।\nप्रसन्नवदनं ध्यायेत् सर्वविघ्नोपशान्तये ॥",
  },
  {
    title: "Sarasvatī · śārdūlavikrīḍita",
    meter: "auto",
    sandhi: true,
    text: "या कुन्देन्दुतुषारहारधवला या शुभ्रवस्त्रावृता\nया वीणावरदण्डमण्डितकरा या श्वेतपद्मासना ।\nया ब्रह्माच्युतशङ्करप्रभृतिभिर्देवैः सदा पूजिता\nसा मां पातु सरस्वती भगवती निःशेषजाड्यापहा ॥",
  },
  {
    title: "Narasiṃha · mālinī (Retroflex)",
    meter: "mālinī",
    sandhi: true,
    text: "हठलुठ दल घिष्टोत्कण्ठदष्टोष्ठ विद्युत्\nसटशठ कठिनोरः पीठभित्सुष्ठुनिष्ठाम् ।\nपठतिनुतव कण्ठाधिष्ठ घोरान्त्रमाला\nदह दह नरसिंहासह्यवीर्याहितं मे ॥",
  },
  {
    title: "Karāgre Vasate (Jihvāmūlīya)",
    meter: "auto",
    sandhi: true,
    text: "कराग्रे वसते लक्ष्मीः करमध्ये सरस्वती ।\nकरमूले तु गोविन्दः प्रभाते करदर्शनम् ॥",
  },
  {
    title: "Gururbrahmā (Kannada Script)",
    meter: "auto",
    sandhi: true,
    text: "ಗುರುರ್ಬ್ರಹ್ಮಾ ಗುರುರ್ವಿಷ್ಣುಃ ಗುರುರ್ದೇವೋ ಮಹೇಶ್ವರಃ ।\nಗುರುಃ ಸಾಕ್ಷಾತ್ ಪರಂ ಬ್ರಹ್ಮ ತಸ್ಮೈ ಶ್ರೀಗುರವೇ ನಮಃ ॥",
  },
  {
    title: "Sarasvatī (Telugu Script)",
    meter: "auto",
    sandhi: true,
    text: "సరస్వతి నమస్తుభ్యం వరదే కామరూపిణి ।\nవిద్యారంభం కరిష్యామి సిద్ధిర్భవతు మే సదా ॥",
  },
];

const webEngine = new VagdhenuWebEngine(null, isMobileDevice() ? "wasm" : "onnx");
if (typeof window !== "undefined") {
  window.webEngine = webEngine;
}

// DOM Elements
const shlokaInput = document.getElementById("shlokaInput");
const presetChips = document.getElementById("presetChips");
const backendSelect = document.getElementById("backendSelect");
const meterSelect = document.getElementById("meterSelect");
const nfeRange = document.getElementById("nfeRange");
const nfeVal = document.getElementById("nfeVal");
const speedRange = document.getElementById("speedRange");
const speedVal = document.getElementById("speedVal");
const sandhiToggle = document.getElementById("sandhiToggle");
const chantBtn = document.getElementById("chantBtn");
const statusText = document.getElementById("statusText");
const statusTimer = document.getElementById("statusTimer");
const progressFill = document.getElementById("progressFill");
const playerCard = document.getElementById("playerCard");
const audioPlayer = document.getElementById("audioPlayer");
const downloadLink = document.getElementById("downloadLink");
const waveformCanvas = document.getElementById("waveformCanvas");

const condPillLabel = document.getElementById("condPillLabel");
const ditPillLabel = document.getElementById("ditPillLabel");
const scansionSpeedBadge = document.getElementById("scansionSpeedBadge");
const runtimeProviderBadge = document.getElementById("runtimeProviderBadge");
const scriptDetectedLabel = document.getElementById("scriptDetectedLabel");
const syllableCountLabel = document.getElementById("syllableCountLabel");
const detectedMeterTitle = document.getElementById("detectedMeterTitle");
const hemistichSyllsBadge = document.getElementById("hemistichSyllsBadge");
const scansionContainer = document.getElementById("scansionContainer");
const kannadaPiecesContainer = document.getElementById("kannadaPiecesContainer");
const slp1Preview = document.getElementById("slp1Preview");

function updateHardwareBadge() {
  const hasWebGpu = typeof navigator !== "undefined" && "gpu" in navigator;
  const hc = (typeof navigator !== "undefined" && navigator.hardwareConcurrency) || 4;
  const isMob = isMobileDevice();
  const pCoreThreads = isMob ? Math.min(6, Math.max(4, hc - 2)) : hc <= 12 ? Math.min(4, hc) : 6;
  const threads =
    typeof window !== "undefined" && window.crossOriginIsolated
      ? pCoreThreads
      : 1;
  const mode = backendSelect ? backendSelect.value : webEngine.backendMode || "onnx";

  if (mode === "onnx") {
    if (runtimeProviderBadge) {
      runtimeProviderBadge.textContent = hasWebGpu
        ? `ONNX WebGPU + ${threads}T WASM · 265 MB`
        : `${threads}T WASM MatMulInteger Fallback · 279 MB`;
    }
    if (condPillLabel) condPillLabel.innerHTML = "<strong>Conditioner:</strong> 18.8 MB ONNX FP16-Cast";
    if (ditPillLabel) ditPillLabel.innerHTML = "<strong>22-Block DiT:</strong> 191 MB ONNX WebGPU";
  } else {
    if (runtimeProviderBadge) {
      runtimeProviderBadge.textContent = `${threads}T WASM SIMD · MatMulInteger · 279 MB`;
    }
    if (condPillLabel) condPillLabel.innerHTML = "<strong>Conditioner:</strong> 19.8 MB WASM QUInt8";
    if (ditPillLabel) ditPillLabel.innerHTML = "<strong>22-Block DiT:</strong> 203 MB WASM MatMulInteger";
  }
}

function renderPresets() {
  presetChips.innerHTML = "";
  PRESETS.forEach((p, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip-btn" + (idx === 0 ? " active" : "");
    btn.textContent = p.title;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".chip-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      shlokaInput.value = p.text;
      meterSelect.value = p.meter;
      sandhiToggle.checked = p.sandhi;
      updateLiveAnalysis();
    });
    presetChips.appendChild(btn);
  });
}

function updateLiveAnalysis() {
  const t0 = performance.now();
  const text = shlokaInput.value;
  const noSandhi = !sandhiToggle.checked;
  const info = analyzeVerse(text, noSandhi);
  const dtMs = (performance.now() - t0).toFixed(2);

  const scriptName = info.script ? info.script.charAt(0).toUpperCase() + info.script.slice(1) : "Devanagari";
  scansionSpeedBadge.textContent = `JS Scansion: ${dtMs} ms`;
  scriptDetectedLabel.textContent = `Script: ${scriptName}`;
  syllableCountLabel.textContent = `${info.syllables.length} syllables`;

  if (info.isFallbackMeter) {
    detectedMeterTitle.textContent = `${info.detectedMeterKey} (general fit for partial / custom verse)`;
  } else {
    detectedMeterTitle.textContent = `${info.meter.name} (${info.meter.pada_length} syl × ${info.meter.num_padas} pādas)`;
  }
  hemistichSyllsBadge.textContent = `${info.nSylls.join(" + ") || 0} akṣaras`;

  // Render syllable scansion grouped by pada
  scansionContainer.innerHTML = "";
  let currentRow = document.createElement("div");
  currentRow.className = "scansion-row";

  info.syllables.forEach((s) => {
    const pill = document.createElement("div");
    const isGuru = s.weight === "G";
    pill.className = `syl-pill ${isGuru ? "guru" : "laghu"}`;
    pill.title = `${s.text} · ${isGuru ? "Guru (Heavy)" : "Laghu (Light)"} [${s.weight_cause}]`;

    const mark = document.createElement("span");
    mark.className = "syl-mark";
    mark.textContent = isGuru ? "ˉ" : "˘";

    const txt = document.createElement("span");
    txt.className = "syl-txt";
    txt.textContent = s.text;

    pill.appendChild(mark);
    pill.appendChild(txt);
    currentRow.appendChild(pill);

    if (s.is_pada_final) {
      scansionContainer.appendChild(currentRow);
      currentRow = document.createElement("div");
      currentRow.className = "scansion-row";
    }
  });
  if (currentRow.childNodes.length > 0) {
    scansionContainer.appendChild(currentRow);
  }

  // Render Kannada phonetic pieces
  kannadaPiecesContainer.innerHTML = "";
  info.kannadaPieces.forEach((kp, i) => {
    const div = document.createElement("div");
    div.className = "routing-piece";
    div.textContent = `[Hemistich ${i + 1} · ${info.nSylls[i]} akṣaras]  ${kp}`;
    kannadaPiecesContainer.appendChild(div);
  });

  slp1Preview.textContent = `SLP1: ${info.slp1}`;
}

function drawWaveformFromSamples(data, fractionComplete = 1.0) {
  try {
    const ctx = waveformCanvas.getContext("2d");
    const W = waveformCanvas.width;
    const H = waveformCanvas.height;
    ctx.clearRect(0, 0, W, H);

    const totalBars = 128;
    const activeBars = Math.max(1, Math.round(totalBars * Math.min(1, Math.max(0.1, fractionComplete))));
    const step = Math.max(1, Math.floor(data.length / activeBars));
    const barW = W / totalBars;

    for (let i = 0; i < totalBars; i++) {
      const x = i * barW;
      if (i < activeBars) {
        let peak = 0;
        const start = i * step;
        for (let j = 0; j < step && start + j < data.length; j++) {
          const a = Math.abs(data[start + j]);
          if (a > peak) peak = a;
        }
        const h = Math.max(4, peak * (H * 0.86));
        const y = (H - h) / 2;
        const grad = ctx.createLinearGradient(0, y, 0, y + h);
        grad.addColorStop(0, "#7a1f0d");
        grad.addColorStop(0.55, "#a8330d");
        grad.addColorStop(1, "#bd8a2d");
        ctx.fillStyle = grad;
        ctx.fillRect(x + 1, y, Math.max(2, barW - 2), h);
      } else {
        const h = 4;
        const y = (H - h) / 2;
        ctx.fillStyle = "rgba(122, 31, 13, 0.16)";
        ctx.fillRect(x + 1, y, Math.max(2, barW - 2), h);
      }
    }
  } catch {
    // ignore canvas errors
  }
}

let activeStreamCtx = null;
let activeStreamSources = [];

function stopActiveStream() {
  for (const src of activeStreamSources) {
    try {
      src.stop();
    } catch {
      // ignore already stopped
    }
  }
  activeStreamSources = [];
}

nfeRange.addEventListener("input", () => {
  nfeVal.textContent = nfeRange.value;
});
speedRange.addEventListener("input", () => {
  speedVal.textContent = `${Number(speedRange.value).toFixed(2)}×`;
});
shlokaInput.addEventListener("input", updateLiveAnalysis);
sandhiToggle.addEventListener("change", updateLiveAnalysis);

if (backendSelect) {
  backendSelect.addEventListener("change", async () => {
    const mode = backendSelect.value === "onnx" ? "onnx" : "wasm";
    updateHardwareBadge();
    await webEngine.setBackendMode(mode);
    const repoLabel = mode === "wasm" ? "gnumanth/sanskrit-tts-wasm (WASM SIMD)" : "gnumanth/sanskrit-tts-onnx (ONNX WebGPU)";
    if (statusText && (!chantBtn || !chantBtn.disabled)) {
      statusText.textContent = `Switched to ${repoLabel} · ready to load on next chant.`;
      if (progressFill) progressFill.style.width = "12%";
    }
  });
}

// Stop live Web Audio stream if user manually plays the <audio> element
audioPlayer.addEventListener("play", () => {
  stopActiveStream();
});

chantBtn.addEventListener("click", async () => {
  const text = shlokaInput.value.trim();
  if (!text) return;

  stopActiveStream();
  audioPlayer.pause();

  // Ensure iOS plays audio even if hardware Ring/Silent switch is on Silent
  if (typeof navigator !== "undefined" && "audioSession" in navigator && navigator.audioSession) {
    try {
      navigator.audioSession.type = "playback";
    } catch {
      // ignore if unsupported
    }
  }

  // Initialize & unlock AudioContext synchronously inside user tap gesture (required for iOS/Android)
  // Use native hardware sampleRate + 'playback' latencyHint so mobile DACs never crackle; createBuffer handles 24kHz.
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!activeStreamCtx && AudioCtx) {
    try {
      activeStreamCtx = new AudioCtx({ latencyHint: "playback" });
    } catch {
      activeStreamCtx = new AudioCtx();
    }
  }
  if (activeStreamCtx) {
    if (activeStreamCtx.state !== "running") {
      activeStreamCtx.resume().catch(() => {});
    }
    try {
      const silentBuf = activeStreamCtx.createBuffer(1, 1, 24000);
      const silentSrc = activeStreamCtx.createBufferSource();
      silentSrc.buffer = silentBuf;
      silentSrc.connect(activeStreamCtx.destination);
      silentSrc.start(0);
    } catch {
      // ignore unlock errors
    }
  }

  chantBtn.disabled = true;
  progressFill.style.width = "8%";

  let startTime = performance.now();
  let firstAudioSec = null;
  let nextPlayTime = 0;
  let streamedLive = true;
  const chantBtnLabel = chantBtn.querySelector(".chant-btn-label");

  let timerInterval = setInterval(() => {
    if (firstAudioSec === null) {
      statusTimer.textContent = `${((performance.now() - startTime) / 1000).toFixed(1)}s`;
    }
  }, 100);

  try {
    const meterChoice = meterSelect.value;
    const noSandhi = !sandhiToggle.checked;
    const nfe = Number(nfeRange.value);
    const speed = Number(speedRange.value);

    if (backendSelect && webEngine.backendMode !== backendSelect.value) {
      await webEngine.setBackendMode(backendSelect.value);
    }

    // Ensure sessions & WebGPU shaders are warm before starting the chant timer
    await webEngine.initOnnxSessions((st) => {
      statusText.textContent = st.message;
      progressFill.style.width = `${Math.max(5, Math.min(100, st.progress))}%`;
    });
    startTime = performance.now();

    // 100% Client-Side Browser ONNX Execution with Immediate Hemistich Audio Streaming
    const res = await webEngine.synthesizeInBrowser(
      text,
      {
        meter: meterChoice,
        noSandhi,
        nfe,
        speed,
        onChunk: async (chunk) => {
          const chunkElapsedMs = performance.now() - startTime;
          if (firstAudioSec === null) {
            firstAudioSec = (chunkElapsedMs / 1000).toFixed(2);
            statusTimer.textContent = `${firstAudioSec}s`;
          }
          if (chantBtnLabel && chunk.chunkIndex + 1 < chunk.totalChunks) {
            chantBtnLabel.textContent = `Playing Part ${chunk.chunkIndex + 1}/${chunk.totalChunks} · Rendering Part ${chunk.chunkIndex + 2}...`;
          }
          playerCard.hidden = false;
          const frac = (chunk.chunkIndex + 1) / chunk.totalChunks;
          drawWaveformFromSamples(chunk.samplesSoFar, frac);

          if (activeStreamCtx) {
            if (activeStreamCtx.state === "suspended" || activeStreamCtx.state === "interrupted") {
              activeStreamCtx.resume().catch(() => {});
            }
            const totalChunkLen = chunk.gatedSamples.length + chunk.gapSamples.length;
            const audioBuf = activeStreamCtx.createBuffer(1, totalChunkLen, chunk.sampleRate);
            const ch = audioBuf.getChannelData(0);
            ch.set(chunk.gatedSamples, 0);
            if (chunk.gapSamples.length > 0) {
              ch.set(chunk.gapSamples, chunk.gatedSamples.length);
            }
            const src = activeStreamCtx.createBufferSource();
            src.buffer = audioBuf;
            src.connect(activeStreamCtx.destination);
            const startAt = Math.max(activeStreamCtx.currentTime + 0.05, nextPlayTime);
            src.start(startAt);
            nextPlayTime = startAt + audioBuf.duration;
            activeStreamSources.push(src);
          } else {
            streamedLive = false;
          }
        },
      },
      (st) => {
        const prefix = firstAudioSec && streamedLive
          ? `🔊 Playing Part 1 (${firstAudioSec}s) · `
          : "";
        statusText.textContent = prefix + st.message;
        progressFill.style.width = `${Math.max(5, Math.min(100, st.progress))}%`;
      }
    );
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    const ttfa = firstAudioSec || elapsed;
    statusTimer.textContent = `${ttfa}s`;
    progressFill.style.width = "100%";
    statusText.textContent = `100% In-Browser (${webEngine.provider.toUpperCase()}) · First chunk ${ttfa}s (Total ${elapsed}s) · Meter: ${res.meter} (${res.durationSec.toFixed(1)}s audio)`;
    playerCard.hidden = false;
    audioPlayer.src = res.url;
    downloadLink.href = res.url;
    if (!streamedLive) {
      if (activeStreamCtx) {
        if (activeStreamCtx.state === "suspended" || activeStreamCtx.state === "interrupted") {
          activeStreamCtx.resume().catch(() => {});
        }
        const audioBuf = activeStreamCtx.createBuffer(1, res.audio.length, res.sampleRate);
        audioBuf.getChannelData(0).set(res.audio);
        const src = activeStreamCtx.createBufferSource();
        src.buffer = audioBuf;
        src.connect(activeStreamCtx.destination);
        src.start(activeStreamCtx.currentTime + 0.05);
        activeStreamSources.push(src);
      } else {
        audioPlayer.play().catch(() => {});
      }
    }
  } catch (err) {
    statusText.textContent = `In-browser synthesis failed: ${err.message || err}`;
    progressFill.style.width = "0%";
  } finally {
    clearInterval(timerInterval);
    if (chantBtnLabel) {
      chantBtnLabel.textContent = "Chant Śloka in Browser";
    }
    chantBtn.disabled = false;
  }
});

// IntersectionObserver Scroll-Entry Choreography (Zero scroll-event listeners)
function initScrollReveal() {
  const items = document.querySelectorAll(".reveal-item");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -24px 0px" }
  );
  items.forEach((el, idx) => {
    el.style.transitionDelay = `${Math.min(idx * 45, 220)}ms`;
    obs.observe(el);
  });
}

async function detectBestBackendAndPrewarm() {
  if (
    typeof window !== "undefined" &&
    !window.crossOriginIsolated &&
    "serviceWorker" in navigator &&
    window.isSecureContext
  ) {
    try {
      const reg = await navigator.serviceWorker.register("./coi-sw.js");
      if (reg && !sessionStorage.getItem("vagdhenu_coi_reloaded")) {
        sessionStorage.setItem("vagdhenu_coi_reloaded", "1");
        window.location.reload();
        return;
      }
    } catch {
      // Ignore if Service Worker registration is blocked in iframe
    }
  }
  const isMob = isMobileDevice();
  let hasWebGpu = false;
  if (!isMob && typeof navigator !== "undefined" && navigator.gpu) {
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

  if (isMob || !hasWebGpu) {
    if (backendSelect) {
      backendSelect.value = "wasm";
      const onnxOpt = backendSelect.querySelector('option[value="onnx"]');
      if (onnxOpt && !hasWebGpu && !isMob) {
        onnxOpt.textContent = "🖥️ ONNX WebGPU (No GPU detected · auto-falls back to WASM)";
      }
    }
    await webEngine.setBackendMode("wasm");
  }
  if (isMob && nfeRange && nfeVal) {
    nfeRange.value = "6";
    nfeVal.textContent = "6";
  }
  updateHardwareBadge();

  if (typeof window !== "undefined" && window.location.search.includes("noprewarm=1")) return;
  const tryWarm = () => {
    if (!window.ort) {
      setTimeout(tryWarm, 50);
      return;
    }
    webEngine
      .initOnnxSessions((st) => {
        if (chantBtn && !chantBtn.disabled) {
          statusText.textContent = st.message;
          progressFill.style.width = `${Math.max(5, Math.min(100, st.progress))}%`;
        }
      })
      .catch((err) => {
        console.warn("Background pre-warm deferred:", err);
      });
  };
  tryWarm();
}

updateHardwareBadge();
renderPresets();
updateLiveAnalysis();
initScrollReveal();
detectBestBackendAndPrewarm();
