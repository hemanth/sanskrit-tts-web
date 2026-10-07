// vagdhenu-text.js
var SCRIPT_BLOCKS = [
  [2304, 2431, "devanagari", 2304],
  [2432, 2559, "bengali", 2432],
  [2560, 2687, "gurmukhi", 2560],
  [2688, 2815, "gujarati", 2688],
  [2816, 2943, "oriya", 2816],
  [2944, 3071, "tamil", 2944],
  [3072, 3199, "telugu", 3072],
  [3200, 3327, "kannada", 3200],
  [3328, 3455, "malayalam", 3328],
  [70400, 70527, "grantha", 70400]
];
var DEVA_INDEP_VOWELS = {
  "\u0905": "a",
  "\u0906": "A",
  "\u0907": "i",
  "\u0908": "I",
  "\u0909": "u",
  "\u090A": "U",
  "\u090B": "f",
  "\u0960": "F",
  "\u090C": "x",
  "\u0961": "X",
  "\u090F": "e",
  "\u0910": "E",
  "\u0913": "o",
  "\u0914": "O",
  "\u0972": "e",
  "\u0911": "o",
  "\u090E": "e",
  "\u0912": "o"
};
var DEVA_MATRA_TO_SLP1 = {
  "\u093E": "A",
  "\u093F": "i",
  "\u0940": "I",
  "\u0941": "u",
  "\u0942": "U",
  "\u0943": "f",
  "\u0944": "F",
  "\u0962": "x",
  "\u0963": "X",
  "\u0947": "e",
  "\u0948": "E",
  "\u094B": "o",
  "\u094C": "O",
  "\u0945": "e",
  "\u0949": "o",
  "\u0946": "e",
  "\u094A": "o"
};
var DEVA_CONS_TO_SLP1 = {
  "\u0915": "k",
  "\u0916": "K",
  "\u0917": "g",
  "\u0918": "G",
  "\u0919": "N",
  "\u091A": "c",
  "\u091B": "C",
  "\u091C": "j",
  "\u091D": "J",
  "\u091E": "Y",
  "\u091F": "w",
  "\u0920": "W",
  "\u0921": "q",
  "\u0922": "Q",
  "\u0923": "R",
  "\u0924": "t",
  "\u0925": "T",
  "\u0926": "d",
  "\u0927": "D",
  "\u0928": "n",
  "\u092A": "p",
  "\u092B": "P",
  "\u092C": "b",
  "\u092D": "B",
  "\u092E": "m",
  "\u092F": "y",
  "\u0930": "r",
  "\u0932": "l",
  "\u0933": "L",
  "\u0935": "v",
  "\u0936": "S",
  "\u0937": "z",
  "\u0938": "s",
  "\u0939": "h"
};
var DEVA_MISC_TO_SLP1 = {
  "\u0902": "M",
  "\u0903": "H",
  "\u0901": "~",
  "\u093D": "'",
  "\u0950": "oM",
  "\u0964": ".",
  "\u0965": "..",
  "\u0966": "0",
  "\u0967": "1",
  "\u0968": "2",
  "\u0969": "3",
  "\u096A": "4",
  "\u096B": "5",
  "\u096C": "6",
  "\u096D": "7",
  "\u096E": "8",
  "\u096F": "9"
};
var SLP1_INDEP_TO_KAN = {
  "a": "\u0C85",
  "A": "\u0C86",
  "i": "\u0C87",
  "I": "\u0C88",
  "u": "\u0C89",
  "U": "\u0C8A",
  "f": "\u0C8B",
  "F": "\u0CE0",
  "x": "\u0C8C",
  "X": "\u0CE1",
  "e": "\u0C8F",
  "E": "\u0C90",
  "o": "\u0C93",
  "O": "\u0C94"
};
var SLP1_MATRA_TO_KAN = {
  "a": "",
  "A": "\u0CBE",
  "i": "\u0CBF",
  "I": "\u0CC0",
  "u": "\u0CC1",
  "U": "\u0CC2",
  "f": "\u0CC3",
  "F": "\u0CC4",
  "x": "\u0CE2",
  "X": "\u0CE3",
  "e": "\u0CC7",
  "E": "\u0CC8",
  "o": "\u0CCB",
  "O": "\u0CCC"
};
var SLP1_CONS_TO_KAN = {
  "k": "\u0C95",
  "K": "\u0C96",
  "g": "\u0C97",
  "G": "\u0C98",
  "N": "\u0C99",
  "c": "\u0C9A",
  "C": "\u0C9B",
  "j": "\u0C9C",
  "J": "\u0C9D",
  "Y": "\u0C9E",
  "w": "\u0C9F",
  "W": "\u0CA0",
  "q": "\u0CA1",
  "Q": "\u0CA2",
  "R": "\u0CA3",
  "t": "\u0CA4",
  "T": "\u0CA5",
  "d": "\u0CA6",
  "D": "\u0CA7",
  "n": "\u0CA8",
  "p": "\u0CAA",
  "P": "\u0CAB",
  "b": "\u0CAC",
  "B": "\u0CAD",
  "m": "\u0CAE",
  "y": "\u0CAF",
  "r": "\u0CB0",
  "l": "\u0CB2",
  "L": "\u0CB3",
  "v": "\u0CB5",
  "S": "\u0CB6",
  "z": "\u0CB7",
  "s": "\u0CB8",
  "h": "\u0CB9"
};
var SLP1_MISC_TO_KAN = {
  "M": "\u0C82",
  "H": "\u0C83",
  "~": "\u0901",
  "'": "\u0CBD"
};
var SHORT_DRAVIDIAN_OFFSETS = /* @__PURE__ */ new Map([
  [14, 15],
  // short Indep E -> long Indep E
  [18, 19],
  // short Indep O -> long Indep O
  [70, 71],
  // short matra e -> long matra e
  [74, 75]
  // short matra o -> long matra o
]);
function detectScript(text) {
  for (const ch of text) {
    const code = ch.codePointAt(0);
    for (const [lo, hi, scheme] of SCRIPT_BLOCKS) {
      if (code >= lo && code <= hi) return scheme;
    }
  }
  return "devanagari";
}
function toDeva(text) {
  const src = detectScript(text);
  if (src === "devanagari") return text;
  const block = SCRIPT_BLOCKS.find((b) => b[2] === src);
  if (!block) return text;
  const base = block[3];
  let out = "";
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code >= block[0] && code <= block[1]) {
      let offset = code - base;
      if (SHORT_DRAVIDIAN_OFFSETS.has(offset)) {
        offset = SHORT_DRAVIDIAN_OFFSETS.get(offset);
      }
      out += String.fromCodePoint(2304 + offset);
    } else {
      out += ch;
    }
  }
  return out;
}
function devaToSlp1(deva) {
  const chars = Array.from(deva);
  const n = chars.length;
  let out = "";
  let i = 0;
  while (i < n) {
    const c = chars[i];
    if (DEVA_INDEP_VOWELS[c] !== void 0) {
      out += DEVA_INDEP_VOWELS[c];
      i++;
    } else if (DEVA_CONS_TO_SLP1[c] !== void 0) {
      out += DEVA_CONS_TO_SLP1[c];
      const nxt = i + 1 < n ? chars[i + 1] : "";
      if (nxt === "\u094D") {
        i += 2;
      } else if (DEVA_MATRA_TO_SLP1[nxt] !== void 0) {
        out += DEVA_MATRA_TO_SLP1[nxt];
        i += 2;
      } else {
        out += "a";
        i++;
      }
    } else if (DEVA_MATRA_TO_SLP1[c] !== void 0) {
      out += DEVA_MATRA_TO_SLP1[c];
      i++;
    } else if (c === "\u094D") {
      i++;
    } else if (DEVA_MISC_TO_SLP1[c] !== void 0) {
      out += DEVA_MISC_TO_SLP1[c];
      i++;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}
function slp1ToKannada(slp) {
  const chars = Array.from(slp);
  const n = chars.length;
  let out = "";
  let i = 0;
  while (i < n) {
    const c = chars[i];
    if (SLP1_CONS_TO_KAN[c] !== void 0) {
      out += SLP1_CONS_TO_KAN[c];
      const nxt = i + 1 < n ? chars[i + 1] : "";
      if (SLP1_MATRA_TO_KAN[nxt] !== void 0) {
        out += SLP1_MATRA_TO_KAN[nxt];
        i += 2;
      } else {
        out += "\u0CCD";
        i++;
      }
    } else if (SLP1_INDEP_TO_KAN[c] !== void 0) {
      out += SLP1_INDEP_TO_KAN[c];
      i++;
    } else if (SLP1_MISC_TO_KAN[c] !== void 0) {
      out += SLP1_MISC_TO_KAN[c];
      i++;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}
var VISARGA = "\u0903";
var PUNCT_DROP = new Set(Array.from(`\u0964\u0965|/\\\u2014\u2013"'\u201C\u201D\u2018\u2019\u201E\xAB\xBB\u2039\u203A*\u2022\xB7().,;!?\u200C\u200D`));
function fixColon(deva) {
  return deva.replace(/:-/g, VISARGA).replace(/:/g, VISARGA);
}
function stripPunct(deva) {
  const s = fixColon(deva);
  const out = [];
  for (const c of s) {
    if (PUNCT_DROP.has(c) || c >= "0" && c <= "9" || c >= "\u0966" && c <= "\u096F" || c === "-" || c === "\u2013" || c === "\u2014") {
      continue;
    }
    out.push(c);
  }
  return out.join("").replace(/\s+/g, " ").trim();
}
var VS_VOICED = new Set(Array.from("gGjJqQdDbBNYRnmyrlvh"));
var VS_OTHERV = new Set(Array.from("iIuUfFxXeEoO"));
var VS_ALLV = new Set(Array.from("aAiIuUfFxXeEoO"));
var VS_LEN = { a: "A", i: "I", u: "U", f: "F", A: "A", I: "I", U: "U" };
function visargaSandhi(slp) {
  const ws = slp.split(" ");
  const out = [];
  let i = 0;
  while (i < ws.length) {
    const w = ws[i];
    if (w.endsWith("H") && i < ws.length - 1 && w.length >= 2) {
      const V = w[w.length - 2];
      const base = w.slice(0, -1);
      const nxt = ws[i + 1];
      const F = nxt ? nxt[0] : "";
      if (F === "r") {
        out.push(base.slice(0, -1) + (VS_LEN[V] || V));
        i++;
        continue;
      }
      if ((w === "saH" || w === "ezaH") && F !== "a") {
        out.push(base);
        i++;
        continue;
      }
      if (!VS_ALLV.has(F) && !VS_VOICED.has(F)) {
        out.push(w);
        i++;
        continue;
      }
      if (V === "a") {
        if (F === "a") {
          out.push(base.slice(0, -1) + "o");
          ws[i + 1] = "'" + nxt.slice(1);
          i++;
          continue;
        }
        if (VS_VOICED.has(F)) {
          out.push(base.slice(0, -1) + "o");
          i++;
          continue;
        }
        out.push(base);
        i++;
        continue;
      }
      if (V === "A") {
        out.push(base);
        i++;
        continue;
      }
      if (VS_OTHERV.has(V)) {
        out.push(base + "r");
        i++;
        continue;
      }
      out.push(w);
      i++;
    } else {
      out.push(w);
      i++;
    }
  }
  return out.join(" ");
}
function visargaEchoFinal(slp) {
  const ws = slp.split(" ");
  if (ws.length > 0) {
    const last = ws[ws.length - 1];
    if (last.endsWith("H") && last.length >= 2 && VS_ALLV.has(last[last.length - 2])) {
      ws[ws.length - 1] = last.slice(0, -1) + "h" + last[last.length - 2];
    }
  }
  return ws.join(" ");
}
function modelText(srcText) {
  let slp = devaToSlp1(stripPunct(toDeva(srcText)));
  slp = slp.replace(/F/g, "rU");
  return slp1ToKannada(slp);
}
function modelTextSandhi(srcText, echoFinal = true) {
  let slp = devaToSlp1(stripPunct(toDeva(srcText)));
  slp = visargaSandhi(slp);
  if (echoFinal) {
    slp = visargaEchoFinal(slp);
  }
  slp = slp.replace(/F/g, "rU");
  return slp1ToKannada(slp);
}
function alignSlp1(srcText) {
  let slp = devaToSlp1(stripPunct(toDeva(srcText)));
  slp = slp.replace(/['’]/g, "");
  slp = slp.replace(/L/g, "l").replace(/\|/g, "");
  slp = slp.replace(/F/g, "rU");
  return slp.replace(/\s+/g, " ").trim();
}
var VMATRA = new Set(Array.from("\u0CBE\u0CBF\u0CC0\u0CC1\u0CC2\u0CC3\u0CC4\u0CC6\u0CC7\u0CC8\u0CCA\u0CCB\u0CCC"));
var VECHO_SHORT = { "\u0CBF": "\u0CB9\u0CBF", "\u0CC1": "\u0CB9\u0CC1", "\u0CC3": "\u0CB9\u0CC3" };
var VLONG = new Set(Array.from("\u0CBE\u0CC0\u0CC2\u0CC4\u0CC6\u0CC7\u0CC8\u0CCA\u0CCB\u0CCC"));
function dandaFix(s) {
  s = s.trimEnd();
  if (!s) return s;
  if (s.endsWith("\u0C83")) {
    const core = s.slice(0, -1);
    const pv = core ? core[core.length - 1] : "";
    if (VECHO_SHORT[pv] !== void 0) {
      s = core + VECHO_SHORT[pv];
    } else if (VLONG.has(pv)) {
    } else {
      s = core + "\u0CB9";
    }
  } else if (s.endsWith("\u0C82")) {
    s = s.slice(0, -1) + "\u0CAE\u0CCD";
  }
  return s;
}
var AN_KA = new Set(Array.from("\u0C95\u0C96\u0C97\u0C98\u0C99"));
var AN_CA = new Set(Array.from("\u0C9A\u0C9B\u0C9C\u0C9D\u0C9E"));
var AN_TTA = new Set(Array.from("\u0C9F\u0CA0\u0CA1\u0CA2\u0CA3"));
var AN_TA = new Set(Array.from("\u0CA4\u0CA5\u0CA6\u0CA7\u0CA8"));
function anusvaraM(s) {
  const chars = Array.from(s);
  const n = chars.length;
  const res = [];
  for (let i = 0; i < n; i++) {
    const c = chars[i];
    if (c === "\u0C82") {
      let j = i + 1;
      while (j < n && chars[j] === " ") j++;
      const nxt = j < n ? chars[j] : "";
      if (!nxt) res.push("\u0C82");
      else if (AN_KA.has(nxt)) res.push("\u0C99\u0CCD");
      else if (AN_CA.has(nxt)) res.push("\u0C9E\u0CCD");
      else if (AN_TTA.has(nxt)) res.push("\u0CA3\u0CCD");
      else if (AN_TA.has(nxt)) res.push("\u0CA8\u0CCD");
      else res.push("\u0CAE\u0CCD");
    } else {
      res.push(c);
    }
  }
  return res.join("");
}
var SATVA_MAP = { "\u0C9A": "\u0CB6\u0CCD", "\u0C9B": "\u0CB6\u0CCD", "\u0C9F": "\u0CB7\u0CCD", "\u0CA0": "\u0CB7\u0CCD", "\u0CA4": "\u0CB8\u0CCD", "\u0CA5": "\u0CB8\u0CCD" };
function satva(s) {
  const chars = Array.from(s);
  const n = chars.length;
  const out = [];
  let i = 0;
  while (i < n) {
    const c = chars[i];
    if (c === "\u0C83") {
      let j = i + 1;
      while (j < n && chars[j] === " ") j++;
      const nxt = j < n ? chars[j] : "";
      if (SATVA_MAP[nxt] !== void 0) {
        out.push(SATVA_MAP[nxt]);
        i = j;
        continue;
      }
    }
    out.push(c);
    i++;
  }
  return out.join("");
}
var KSHA = "\u0C95\u0CCD\u0CB7";
function visargaKsha(s) {
  const chars = Array.from(s);
  const n = chars.length;
  const out = [];
  let i = 0;
  while (i < n) {
    const c = chars[i];
    if (c === "\u0C83") {
      let j = i + 1;
      while (j < n && chars[j] === " ") j++;
      if (chars.slice(j, j + 3).join("") === KSHA) {
        const pv = out.length > 0 ? out[out.length - 1] : "";
        if (VECHO_SHORT[pv] !== void 0) {
          out.push(VECHO_SHORT[pv]);
          i++;
          continue;
        } else if (VLONG.has(pv)) {
          out.push("\u0C83");
          i++;
          continue;
        } else {
          out.push("\u0CB9");
          i++;
          continue;
        }
      }
    }
    out.push(c);
    i++;
  }
  return out.join("");
}
function hnaMetathesis(s) {
  return s.replace(/ಹ್ಣ/g, "\u0CA3\u0CCD\u0CB9").replace(/ಹ್ನ/g, "\u0CA8\u0CCD\u0CB9");
}
function vocalicL(s) {
  return s.replace(/ೢ/g, "\u0CCD\u0CB2\u0CC3").replace(/ೣ/g, "\u0CCD\u0CB2\u0CC4").replace(/ಌ/g, "\u0CB2\u0CC3").replace(/ೡ/g, "\u0CB2\u0CC4");
}
function nAksharas(s) {
  const chars = Array.from(s);
  const L = chars.length;
  let n = 0;
  for (let i = 0; i < L; i++) {
    const o = chars[i].codePointAt(0);
    const indep = o >= 2309 && o <= 2324 || o >= 3205 && o <= 3220;
    const cons = o >= 2325 && o <= 2361 || o >= 3221 && o <= 3257;
    if (indep) {
      n++;
    } else if (cons) {
      const nxt = i + 1 < L ? chars[i + 1] : "";
      if (nxt !== "\u094D" && nxt !== "\u0CCD") {
        n++;
      }
    }
  }
  return n;
}
function aksharas(s) {
  const chars = Array.from(s);
  const out = [];
  let cur = "";
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const o = c.codePointAt(0);
    const base = o >= 3205 && o <= 3220 || o >= 2309 && o <= 2324 || o >= 3221 && o <= 3257 || o >= 2325 && o <= 2361;
    const prev = i > 0 ? chars[i - 1] : "";
    if (base && prev !== "\u0CCD" && prev !== "\u094D") {
      if (cur) out.push(cur);
      cur = c;
    } else {
      cur += c;
    }
  }
  if (cur) out.push(cur);
  return out;
}
function repDepths(aks) {
  const n = aks.length;
  let mono = 1;
  let i = 0;
  while (i < n) {
    let j = i + 1;
    while (j < n && aks[j] === aks[i]) j++;
    mono = Math.max(mono, j - i);
    i = j > i + 1 ? j : i + 1;
  }
  let di = 1;
  i = 0;
  while (i + 1 < n) {
    if (aks[i] !== aks[i + 1]) {
      let cnt = 1;
      let j = i + 2;
      while (j + 1 < n && aks[j] === aks[i] && aks[j + 1] === aks[i + 1]) {
        cnt++;
        j += 2;
      }
      di = Math.max(di, cnt);
      i = cnt > 1 ? j : i + 1;
    } else {
      i++;
    }
  }
  return [mono, di];
}
function endsHalant(txt) {
  const t = txt.replace(/[ ।॥|.,;:!?‌‍]+$/g, "");
  return t.length > 0 && (t.endsWith("\u094D") || t.endsWith("\u0CCD"));
}
function splitPadas(text) {
  const pieces = [];
  const norm = text.replace(/॥/g, "\u0964").replace(/\|/g, "\u0964");
  for (const line of norm.split(/\r?\n/)) {
    for (const seg of line.split("\u0964")) {
      const s = seg.trim();
      if (s) pieces.push(s);
    }
  }
  if (pieces.length === 0 && text.trim()) {
    return [text.trim()];
  }
  return pieces;
}
function preparePieces(text, noSandhi = false) {
  const padas = Array.isArray(text) ? text : splitPadas(text);
  let pieces = padas.map(
    (p) => !noSandhi ? modelTextSandhi(p, false) : modelText(p)
  );
  if (!noSandhi) {
    pieces = pieces.map((x) => satva(x));
  }
  pieces = pieces.map((x) => dandaFix(visargaKsha(anusvaraM(x))));
  pieces = pieces.map((x) => hnaMetathesis(x));
  pieces = pieces.map((x) => vocalicL(x));
  return { padas, pieces };
}
var SLP_VOWELS = new Set(Array.from("aAiIuUfFxXeEoO"));
var SLP_SEPS = /* @__PURE__ */ new Set([" ", "|"]);
var LONG_VOWELS = new Set(Array.from("AIUFXeEoO"));
function syllabify(slp1) {
  const syllables = [];
  const n = slp1.length;
  let i = 0;
  let onsetBuf = [];
  function attachTrailingToLast(cons) {
    if (syllables.length === 0) return;
    const txt = cons.join("");
    syllables[syllables.length - 1].coda += txt;
    syllables[syllables.length - 1].text += txt;
  }
  while (i < n) {
    const c = slp1[i];
    if (c === "'") {
      i++;
      continue;
    }
    if (SLP_SEPS.has(c)) {
      attachTrailingToLast(onsetBuf);
      onsetBuf = [];
      if (c === "|" && syllables.length > 0) {
        syllables[syllables.length - 1].is_pada_final = true;
        syllables[syllables.length - 1].is_word_final = true;
      } else if (c === " " && syllables.length > 0) {
        syllables[syllables.length - 1].is_word_final = true;
      }
      i++;
      continue;
    }
    if (SLP_VOWELS.has(c)) {
      const syl = {
        text: onsetBuf.join("") + c,
        onset: onsetBuf.join(""),
        vowel: c,
        coda: "",
        is_word_final: false,
        is_pada_final: false
      };
      syllables.push(syl);
      onsetBuf = [];
      i++;
      const consBetween = [];
      while (i < n && !SLP_VOWELS.has(slp1[i]) && !SLP_SEPS.has(slp1[i]) && slp1[i] !== "'") {
        const cc = slp1[i];
        if (cc === "~" && consBetween.length > 0) {
          consBetween[consBetween.length - 1] += "~";
        } else {
          consBetween.push(cc);
        }
        i++;
      }
      if (i < n && SLP_VOWELS.has(slp1[i])) {
        if (consBetween.length >= 2) {
          const codaPart = consBetween.slice(0, -1);
          const onsetPart = consBetween.slice(-1);
          syllables[syllables.length - 1].coda = codaPart.join("");
          syllables[syllables.length - 1].text += syllables[syllables.length - 1].coda;
          onsetBuf = onsetPart;
        } else if (consBetween.length === 1) {
          onsetBuf = consBetween;
        }
      } else {
        syllables[syllables.length - 1].coda = consBetween.join("");
        syllables[syllables.length - 1].text += syllables[syllables.length - 1].coda;
        onsetBuf = [];
      }
      continue;
    }
    if (c === "~" && onsetBuf.length > 0) {
      onsetBuf[onsetBuf.length - 1] += "~";
    } else {
      onsetBuf.push(c);
    }
    i++;
  }
  attachTrailingToLast(onsetBuf);
  if (syllables.length > 0) {
    syllables[syllables.length - 1].is_word_final = true;
    syllables[syllables.length - 1].is_pada_final = true;
  }
  return syllables;
}
function clusterChars(s) {
  return Array.from(s).filter((c) => c !== "~");
}
function tagWeights(syllables) {
  for (let k = 0; k < syllables.length; k++) {
    const s = syllables[k];
    const v = s.vowel;
    if (LONG_VOWELS.has(v)) {
      s.weight = "G";
      s.weight_cause = "long_vowel";
      continue;
    }
    const gap = clusterChars(s.coda);
    if (!s.is_pada_final && k + 1 < syllables.length) {
      gap.push(...clusterChars(syllables[k + 1].onset));
    }
    if (gap.length > 0 && gap[0] === "H") {
      s.weight = "G";
      s.weight_cause = "visarga";
      continue;
    }
    if (gap.length > 0 && gap[0] === "M") {
      s.weight = "G";
      s.weight_cause = "anusvara";
      continue;
    }
    if (gap.length >= 2) {
      s.weight = "G";
      s.weight_cause = "cluster";
      continue;
    }
    if (s.is_pada_final) {
      s.weight = "G";
      s.weight_cause = "pada_final_anceps";
      continue;
    }
    s.weight = "L";
    s.weight_cause = "light";
  }
}
var METERS = [
  ["indravajra", 11, ["GGLGGLLGLGG"]],
  ["upendravajra", 11, ["LGLGGLLGLGG"]],
  ["upajati", 11, ["GGLGGLLGLGG", "LGLGGLLGLGG"]],
  ["vamshastha", 12, ["LGLGGLLGLGLG"]],
  ["indravamsha", 12, ["GGLGGLLGLGLG"]],
  ["vasantatilaka", 14, ["GGLGLLLGLLGLGG"]],
  ["malini", 15, ["LLLLLLGGLGGLGGG"]],
  ["shikharini", 17, ["LGGGGGLLLLLGGGGLG"]],
  ["mandakranta", 17, ["GGGGLLLLLGGLGGLGG"]],
  ["harini", 17, ["LLLLLGGGGGLGLLGLG"]],
  ["prithvi", 17, ["LGLLLGLGLLLGGLGGL"]],
  ["shardulavikridita", 19, ["GGGLLGLGLLLGGGLGGLG"]],
  ["sragdhara", 21, ["GGGGLGGGLLLLLLGGLGGLG"]]
];
var ANUSHTUBH_PADA = 8;
function matchPada(observed, template) {
  if (observed.length !== template.length) return false;
  for (let i = 0; i < template.length - 1; i++) {
    if (observed[i] !== template[i]) return false;
  }
  return true;
}
function matchMeter(pattern, plen, templates) {
  if (pattern.length !== 4 * plen) return false;
  for (let i = 0; i < 4; i++) {
    const pada = pattern.slice(i * plen, (i + 1) * plen);
    if (!templates.some((t) => matchPada(pada, t))) return false;
  }
  return true;
}
function detectMeter(syllables) {
  const pattern = syllables.map((s) => s.weight).join("");
  const n = pattern.length;
  for (const [name, plen, templates] of METERS) {
    if (matchMeter(pattern, plen, templates)) {
      return {
        name,
        pada_length: plen,
        num_padas: 4,
        padas: [0, 1, 2, 3].map((i) => pattern.slice(i * plen, (i + 1) * plen))
      };
    }
  }
  if (n === 4 * ANUSHTUBH_PADA) {
    return {
      name: "anushtubh",
      pada_length: ANUSHTUBH_PADA,
      num_padas: 4,
      padas: [0, 1, 2, 3].map((i) => pattern.slice(i * 8, (i + 1) * 8))
    };
  }
  if (n === 2 * ANUSHTUBH_PADA) {
    return {
      name: "anushtubh_half",
      pada_length: ANUSHTUBH_PADA,
      num_padas: 2,
      padas: [0, 1].map((i) => pattern.slice(i * 8, (i + 1) * 8))
    };
  }
  return {
    name: "unknown",
    pada_length: null,
    num_padas: null,
    padas: [pattern]
  };
}
function detectMeterKey(text) {
  try {
    let d = toDeva(text).replace(/॥/g, "|").replace(/।/g, "|").replace(/\r?\n/g, " | ");
    d = Array.from(d).filter((c) => !(c >= "0" && c <= "9" || c >= "\u0966" && c <= "\u096F") && !`"'\u201C\u201D\u2018\u2019()`.includes(c)).join("");
    const slp = devaToSlp1(d).replace(/\s+/g, " ").trim();
    const syls = syllabify(slp);
    tagWeights(syls);
    const name = detectMeter(syls).name;
    if (name === "anushtubh_half" || name === "anushtubh") return "anushtubh";
    if (!name || name === "unknown") return "";
    return name;
  } catch {
    return "";
  }
}
function analyzeVerse(text, noSandhi = false) {
  let d = toDeva(text).replace(/॥/g, "|").replace(/।/g, "|").replace(/\r?\n/g, " | ");
  d = Array.from(d).filter((c) => !(c >= "0" && c <= "9" || c >= "\u0966" && c <= "\u096F") && !`"'\u201C\u201D\u2018\u2019()`.includes(c)).join("");
  const slp = devaToSlp1(d).replace(/\s+/g, " ").trim();
  const syllables = syllabify(slp);
  tagWeights(syllables);
  const meter = detectMeter(syllables);
  const detectedKey = detectMeterKey(text);
  const { padas, pieces } = preparePieces(text, noSandhi);
  const nSylls = pieces.map((x) => nAksharas(x));
  return {
    script: detectScript(text),
    deva: toDeva(text),
    slp1: slp,
    syllables,
    meter,
    detectedMeterKey: detectedKey || "vasantatilaka",
    isFallbackMeter: !detectedKey,
    padas,
    kannadaPieces: pieces,
    nSylls
  };
}

// vagdhenu-onnx.js
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
var SR = 24e3;
var HOP = 256;
var CACHE_NAME = "vagdhenu-models-v10";
var FP16_TO_FP32 = new Float32Array(65536);
(function initFp16Table() {
  const buf = new ArrayBuffer(4);
  const f32 = new Float32Array(buf);
  const u32 = new Uint32Array(buf);
  for (let i = 0; i < 65536; i++) {
    const s = (i & 32768) << 16;
    let e = i >> 10 & 31;
    let m = i & 1023;
    if (e === 0) {
      if (m === 0) {
        u32[0] = s;
      } else {
        e = 1;
        while ((m & 1024) === 0) {
          m <<= 1;
          e--;
        }
        m &= 1023;
        u32[0] = s | e + (127 - 15) << 23 | m << 13;
      }
    } else if (e === 31) {
      u32[0] = s | 2139095040 | m << 13;
    } else {
      u32[0] = s | e + (127 - 15) << 23 | m << 13;
    }
    FP16_TO_FP32[i] = f32[0];
  }
})();
function decodeFp16Buffer(arrayBuffer, byteOffset, frameCount, channels = 100) {
  const u16 = new Uint16Array(arrayBuffer, byteOffset, frameCount * channels);
  const out = new Float32Array(frameCount * channels);
  for (let i = 0; i < u16.length; i++) {
    out[i] = FP16_TO_FP32[u16[i]];
  }
  return out;
}
function createRng(seed) {
  let a = seed >>> 0;
  return function nextUniform() {
    a |= 0;
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function randnArray(length, seed = 60) {
  const rng = createRng(seed);
  const out = new Float32Array(length);
  for (let i = 0; i < length; i += 2) {
    const u1 = Math.max(1e-7, rng());
    const u2 = rng();
    const r = Math.sqrt(-2 * Math.log(u1));
    const theta = 2 * Math.PI * u2;
    out[i] = r * Math.cos(theta);
    if (i + 1 < length) {
      out[i + 1] = r * Math.sin(theta);
    }
  }
  return out;
}
function gateAudio(au, {
  voice = 0.08,
  sil = 0.012,
  fin = 0.015,
  fout = 0.04,
  lead = 0.03,
  keep = 0.06,
  fade = true,
  fric = false,
  halant = false,
  tailThr = 0.015
} = {}) {
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
    const FR = 6e-3;
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
        const w = Math.cos(Math.PI * i / Math.max(1, fo - 1)) * 0.5 + 0.5;
        out[offset + i] *= w;
      }
    }
  }
  return out;
}
function stitchSegments(segs, gaps, fric = false, halant = false, tailThr = 0.015) {
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
      tailThr
    });
    parts.push(gated);
    totalLen += gated.length;
    if (i < last) {
      const g = gaps[i] !== void 0 ? gaps[i] : gaps[gaps.length - 1];
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
function encodeWavBuffer(samples, sampleRate = SR) {
  const numSamples = samples.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  function writeStr(offset2, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset2 + i, str.charCodeAt(i));
    }
  }
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, numSamples * 2, true);
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 32768 : s * 32767, true);
    offset += 2;
  }
  return buffer;
}
function encodeWavBlob(samples, sampleRate = SR) {
  const buffer = encodeWavBuffer(samples, sampleRate);
  return new Blob([buffer], { type: "audio/wav" });
}
var ORT_CDN_URL = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/ort.all.min.js";
var ortLoadPromise = null;
async function resolveOrt() {
  if (typeof globalThis !== "undefined" && globalThis.ort) {
    return globalThis.ort;
  }
  try {
    const pkgName = "onnxruntime-web";
    const mod = await import(
      /* @vite-ignore */
      pkgName
    );
    const resolved = mod?.default?.InferenceSession ? mod.default : mod;
    if (resolved?.InferenceSession) {
      if (typeof globalThis !== "undefined" && !globalThis.ort) {
        globalThis.ort = resolved;
      }
      return resolved;
    }
  } catch {
  }
  if (typeof document !== "undefined") {
    if (!ortLoadPromise) {
      ortLoadPromise = new Promise((resolve, reject) => {
        if (globalThis.ort) return resolve(globalThis.ort);
        const s = document.createElement("script");
        s.src = ORT_CDN_URL;
        s.async = true;
        s.onload = () => globalThis.ort ? resolve(globalThis.ort) : reject(new Error("ort missing after script load"));
        s.onerror = () => reject(new Error(`Failed to load ONNX Runtime Web from ${ORT_CDN_URL}`));
        document.head.appendChild(s);
      });
    }
    return ortLoadPromise;
  }
  throw new Error("ONNX Runtime Web (onnxruntime-web) is not available.");
}
function isMobileDevice() {
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
    }
  }
}
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
          headers: { "Content-Type": "application/octet-stream", "Content-Length": String(loaded) }
        })
      );
    } catch {
    }
  }
  return full.buffer;
}
var HF_WASM_BASE = "https://huggingface.co/gnumanth/sanskrit-tts-wasm/resolve/main";
var HF_ONNX_BASE = "https://huggingface.co/gnumanth/sanskrit-tts-onnx/resolve/main";
function resolveModelBaseUrl(baseUrl = null, backendMode = "onnx") {
  if (!baseUrl) {
    const isLocal = typeof window !== "undefined" && (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost");
    if (isLocal) return "./models";
    return backendMode === "wasm" ? HF_WASM_BASE : HF_ONNX_BASE;
  }
  if (baseUrl === "wasm") return HF_WASM_BASE;
  if (baseUrl === "onnx" || baseUrl === "webgpu") return HF_ONNX_BASE;
  if (typeof baseUrl === "string" && !baseUrl.startsWith("http://") && !baseUrl.startsWith("https://") && !baseUrl.startsWith(".") && !baseUrl.startsWith("/") && /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(baseUrl)) {
    return `https://huggingface.co/${baseUrl}/resolve/main`;
  }
  return baseUrl;
}
var TAIL_REF_LUT = {
  "anu\u1E63\u1E6Dubh": { frame: 282, tok: 23, sps: 0.24 },
  "pram\u0101\u1E47ik\u0101": { frame: 142, tok: 15, sps: 0.275 },
  "vasantatilak\u0101": { frame: 315, tok: 37, sps: 0.259 },
  "upaj\u0101ti": { frame: 323, tok: 26, sps: 0.24 },
  "indravajr\u0101": { frame: 367, tok: 35, sps: 0.24 },
  "upendravajr\u0101": { frame: 162, tok: 32, sps: 0.269 },
  "va\u1E43\u015Bastha": { frame: 322, tok: 35, sps: 0.24 },
  "rathoddhat\u0101": { frame: 969, tok: 72, sps: 0.24 },
  "\u015B\u0101lin\u012B": { frame: 311, tok: 27, sps: 0.248 },
  "indrava\u1E43\u015B\u0101": { frame: 381, tok: 43, sps: 0.2484 },
  "drutavilambita": { frame: 395, tok: 22, sps: 0.2427 },
  "bhuja\u1E45gapray\u0101ta": { frame: 347, tok: 29, sps: 0.24 },
  "m\u0101lin\u012B": { frame: 508, tok: 48, sps: 0.2575 },
  "\u015B\u0101rd\u016Blavikr\u012B\u1E0Dita": { frame: 731, tok: 67, sps: 0.24 },
  "sragdhar\u0101": { frame: 938, tok: 92, sps: 0.31 },
  "vrutta-1": { frame: 420, tok: 36, sps: 0.2432 },
  "gadya": { frame: 497, tok: 50, sps: 0.26 },
  "gadya_mbtn": { frame: 497, tok: 57, sps: 0.26 },
  "prime_chata": { frame: 517, tok: 43, sps: 0.24 },
  "prime_jaya": { frame: 454, tok: 38, sps: 0.24 }
};
function computeHarmonicCombStd(melFlat, numFrames) {
  if (numFrames <= 0) return 0;
  let sum = 0;
  let sumSq = 0;
  let count = 0;
  for (let f = 0; f < numFrames; f++) {
    const base = f * 100;
    for (let c = 15; c < 80; c++) {
      const c0 = c - 2;
      const c1 = c + 2;
      let env = 0;
      for (let k = c0; k <= c1; k++) {
        env += melFlat[base + k];
      }
      env *= 0.2;
      const det = melFlat[base + c] - env;
      sum += det;
      sumSq += det * det;
      count++;
    }
  }
  if (count <= 1) return 0;
  const mean = sum / count;
  return Math.sqrt(Math.max(0, sumSq / count - mean * mean));
}
var VagdhenuWebEngine = class {
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
      } catch {
      }
      this.condSession = null;
    }
    if (this.stepSession) {
      try {
        this.stepSession.release?.();
      } catch {
      }
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
          message: cached ? "Loaded Baked Reference Bank from browser cache (2.84 MB)" : `Downloading Baked Reference Bank (${(loaded / 1048576).toFixed(1)} MB)...`,
          progress: total ? loaded / total * 5 : 5
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
    const hc = typeof navigator !== "undefined" && navigator.hardwareConcurrency || 4;
    const optimalThreads = this.isMobile ? Math.min(6, hc) : hc <= 12 ? Math.min(4, hc) : 6;
    ort.env.wasm.numThreads = isIsolated ? optimalThreads : 1;
    ort.env.wasm.simd = true;
    const useWasmWeights = this.provider === "wasm";
    const isLocalModels = this.baseUrl === "./models" || this.baseUrl.endsWith("/models");
    const effectiveBaseUrl = !isLocalModels && !this.customBaseUrl ? useWasmWeights ? HF_WASM_BASE : HF_ONNX_BASE : this.baseUrl;
    const stepFile = useWasmWeights && isLocalModels ? "vagdhenu_dit_step_wasm_q8.onnx" : "vagdhenu_dit_step_q8.onnx";
    const condFile = "vagdhenu_cond_q8.onnx";
    const files = [
      { key: "vocos", file: "vagdhenu_vocos_q8.onnx", label: "Vocos Neural Vocoder", weight: 12, sizeMB: 56 },
      {
        key: "cond",
        file: condFile,
        label: "ONNX Static Conditioner",
        weight: 13,
        sizeMB: 19
      },
      {
        key: "step",
        file: stepFile,
        label: useWasmWeights ? "WASM MatMulInteger DiT Backbone" : "ONNX WebGPU DiT Backbone",
        weight: 65,
        sizeMB: useWasmWeights ? 199 : 184
      }
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
              message: cached ? `Loaded ${item.label} from browser cache` : `Downloading ${item.label}: ${(loaded / 1048576).toFixed(1)} / ${((total || item.sizeMB * 1048576) / 1048576).toFixed(1)} MB`,
              progress: Math.min(92, basePct + frac * item.weight)
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
          progress: Math.min(94, basePct + item.weight)
        });
      }
      const optLevel = useGpuForModel && this.isMobile ? "disabled" : "all";
      let sess = null;
      if (useGpuForModel) {
        try {
          sess = await ort.InferenceSession.create(buf, {
            executionProviders: ["webgpu", "wasm"],
            graphOptimizationLevel: optLevel
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
          graphOptimizationLevel: "all"
        });
      }
      buf = null;
      if (this.isMobile) {
        await new Promise((r) => setTimeout(r, 25));
      }
      if (item.key === "vocos") this.vocosSession = sess;
      else if (item.key === "cond") this.condSession = sess;
      else if (item.key === "step") this.stepSession = sess;
      basePct += item.weight;
    }
    if (!this.isWarmedUp) {
      if (onStatus) {
        onStatus({
          stage: "warmup",
          message: `Pre-warming ${this.provider.toUpperCase()} & WASM neural pipelines...`,
          progress: 96
        });
      }
      const wDur = this.isMobile ? 16 : 64;
      const cOut = await this.condSession.run({
        cond_mel: new ort.Tensor("float32", new Float32Array(wDur * 100), [1, wDur, 100]),
        text_in: new ort.Tensor("int64", new BigInt64Array(wDur), [1, wDur])
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
        rope_sin: wRs
      });
      safeDisposeTensor(sOut2.v_out);
      const sOut1 = await this.stepSession.run({
        x: new ort.Tensor("float32", new Float32Array(1 * wDur * 100), [1, wDur, 100]),
        static_bias: new ort.Tensor("float32", new Float32Array(1 * wDur * 1024), [1, wDur, 1024]),
        t: new ort.Tensor("float32", new Float32Array([0.8]), [1]),
        rope_cos: wRc,
        rope_sin: wRs
      });
      safeDisposeTensor(sOut1.v_out);
      safeDisposeTensor(wRc);
      safeDisposeTensor(wRs);
      const vOut = await this.vocosSession.run({
        mel: new ort.Tensor("float32", new Float32Array(100 * 16), [1, 100, 16])
      });
      safeDisposeTensor(vOut.wav);
      this.isWarmedUp = true;
    }
    if (onStatus) {
      onStatus({
        stage: "ready",
        message: `100% In-Browser Neural Engine Ready (${this.provider.toUpperCase()} \xB7 Warm & Cached)`,
        progress: 100
      });
    }
  }
  getRefEntry(meter, monoDepth = 1, diDepth = 1) {
    const m = this.bankManifest;
    const primes = m.primes || {};
    if (diDepth >= 3) {
      for (const k of ["prime_jaya", "prime_chata"]) {
        if (primes[k] && (primes[k].di_max || 0) >= diDepth) return { ...primes[k], _key: k };
      }
    }
    if (monoDepth >= 2 && primes.prime_mono && (primes.prime_mono.mono_max || 0) >= monoDepth) {
      return { ...primes.prime_mono, _key: "prime_mono" };
    }
    const key = (meter || "").toLowerCase().replace(/\.wav$/, "");
    const resolved = m.aliases[key] || m.aliases[m.fallback_meter] || Object.keys(m.entries)[0];
    return { ...m.entries[resolved], _key: resolved };
  }
  async synthesizeInBrowser(text, { meter = "auto", noSandhi = false, nfe = null, cfg = 3, speed = 0.9, seed = 60, onChunk = null } = {}, onProgress) {
    await this.initOnnxSessions(onProgress);
    const ort = this.ort || await resolveOrt();
    let basePadas = Array.isArray(text) ? text : splitPadas(text);
    if (!basePadas.length) throw new Error("Please enter a Sanskrit verse.");
    let firstHemistichSplit = false;
    if (this.isMobile) {
      if (basePadas.length === 2) {
        const firstSplit = splitHemistichAtCaesura(basePadas[0]);
        const secondSplit = splitHemistichAtCaesura(basePadas[1]);
        firstHemistichSplit = firstSplit.length === 2;
        basePadas = [...firstSplit, ...secondSplit];
      }
    } else if (basePadas.length === 4) {
      basePadas = [`${basePadas[0]} ${basePadas[1]}`, `${basePadas[2]} ${basePadas[3]}`];
    }
    const { padas, pieces } = preparePieces(basePadas, noSandhi);
    if (!pieces.length) throw new Error("Please enter a Sanskrit verse.");
    const unitLabel = pieces.length > 2 ? "Part" : "Hemistich";
    const resolvedMeter = !meter || meter === "auto" ? detectMeterKey(text) || "vasantatilaka" : meter;
    let monoMax = 1;
    let diMax = 1;
    for (const x of pieces) {
      const [mo, di] = repDepths(aksharas(x));
      if (mo > monoMax) monoMax = mo;
      if (di > diMax) diMax = di;
    }
    const entry = this.getRefEntry(resolvedMeter, monoMax, diMax);
    const fullRefMel = decodeFp16Buffer(this.bankBin, entry.byte_offset, entry.mel_frames, 100);
    const refLut = this.isMobile || this.provider === "wasm" ? TAIL_REF_LUT[entry._key] : null;
    let refMel = fullRefMel;
    let refMelFrames = entry.mel_frames;
    let refAudioLen = entry.ref_audio_len;
    let refLenSec = entry.ref_len_sec;
    let refTokens = entry.ref_tokens;
    let sps = entry.sec_per_syll;
    if (refLut && entry.mel_frames > refLut.frame + 10 && entry.ref_tokens.length > refLut.tok) {
      refMel = fullRefMel.subarray(refLut.frame * 100);
      refMelFrames = entry.mel_frames - refLut.frame;
      refAudioLen = refMelFrames;
      refLenSec = refMelFrames * HOP / SR;
      refTokens = entry.ref_tokens.slice(refLut.tok);
      sps = refLut.sps;
    }
    const refHarmonicStd = computeHarmonicCombStd(refMel, refMelFrames);
    const vmap = this.bankManifest.vocab_char_map;
    const y0Meta = this.bankManifest.y0_seed60;
    const t12 = new Float32Array(13);
    for (let i = 0; i <= 12; i++) {
      const u = i / 12;
      t12[i] = u - 1 * (Math.cos(Math.PI / 2 * u) - 1 + u);
    }
    const tailThr = 0.035;
    const effectiveNfe = Math.max(3, nfe || (this.isMobile ? 4 : 7));
    const getChunkSchedule = (pIdx = 0) => {
      if (effectiveNfe <= 3 || effectiveNfe === 4 && this.isMobile && pIdx === 0) {
        return {
          tSteps: new Float32Array([t12[0], t12[1], t12[6], 1]),
          stepModes: ["cfg", "cfg", "b1"],
          chunkCfg: cfg
        };
      }
      if (effectiveNfe === 4) {
        return {
          tSteps: new Float32Array([t12[0], t12[1], t12[2], t12[6], 1]),
          stepModes: ["cfg", "cfg", "b1", "b1"],
          chunkCfg: cfg
        };
      }
      if (effectiveNfe === 5) {
        return {
          tSteps: new Float32Array([t12[0], t12[1], t12[2], t12[6], t12[9], 1]),
          stepModes: ["cfg", "cfg", "b1", "b1", "b1"],
          chunkCfg: cfg
        };
      }
      if (effectiveNfe === 6) {
        return {
          tSteps: new Float32Array([t12[0], t12[1], t12[2], t12[4], t12[7], t12[10], 1]),
          stepModes: ["cfg", "cfg", "cfg", "cfg", "b1", "b1"],
          chunkCfg: cfg
        };
      }
      if (effectiveNfe === 7) {
        return {
          tSteps: new Float32Array([t12[0], t12[1], t12[2], t12[3], t12[5], t12[8], t12[10], 1]),
          stepModes: ["cfg", "cfg", "cfg", "cfg", "cfg", "b1", "b1"],
          chunkCfg: cfg
        };
      }
      if (effectiveNfe === 8) {
        return {
          tSteps: new Float32Array([t12[0], t12[1], t12[2], t12[3], t12[4], t12[6], t12[9], t12[11], 1]),
          stepModes: ["cfg", "cfg", "cfg", "cfg", "cfg", "cfg", "b1", "b1"],
          chunkCfg: cfg
        };
      }
      if (effectiveNfe === 9) {
        return {
          tSteps: new Float32Array([t12[0], t12[1], t12[2], t12[3], t12[4], t12[5], t12[7], t12[9], t12[11], 1]),
          stepModes: ["cfg", "cfg", "cfg", "cfg", "cfg", "cfg", "b1", "b1", "b1"],
          chunkCfg: cfg
        };
      }
      const customTSteps = new Float32Array(effectiveNfe + 1);
      const customModes = [];
      const minCfgSteps = Math.max(1, Math.floor(effectiveNfe * 0.65));
      for (let i = 0; i <= effectiveNfe; i++) {
        const u = i / effectiveNfe;
        customTSteps[i] = u - 1 * (Math.cos(Math.PI / 2 * u) - 1 + u);
        if (i < effectiveNfe) {
          customModes.push(cfg > 1e-5 && (customTSteps[i] <= 0.75 || i < minCfgSteps) ? "cfg" : "b1");
        }
      }
      return { tSteps: customTSteps, stepModes: customModes, chunkCfg: cfg };
    };
    const chunkSchedules = pieces.map((_, idx) => getChunkSchedule(idx));
    const totalSteps = chunkSchedules.reduce((acc, s) => acc + s.stepModes.length, 0);
    let completedSteps = 0;
    const gaps = pieces.map((p, idx) => {
      const isIntraHemistich = pieces.length === 4 && (idx === 0 || idx === 2) || pieces.length === 3 && (firstHemistichSplit ? idx === 0 : idx === 1);
      const baseGap = isIntraHemistich ? 0.16 : 0.5;
      return new Float32Array(Math.floor(baseGap * SR) + (endsHalant(p) ? Math.floor(0.2 * SR) : 0));
    });
    const slp0 = alignSlp1(padas[0]);
    const fric = Boolean(slp0) && ["S", "z", "s", "h"].includes(slp0[0]);
    const halant = endsHalant(pieces[pieces.length - 1]);
    const streamedParts = [];
    let streamedTotalLen = 0;
    const isProxyWasm = Boolean(ort?.env?.wasm?.proxy);
    const preparePieceState = async (pIdx) => {
      const piece = pieces[pIdx];
      const cleanPiece = piece.replace(/;/g, ",").replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
      const rawTokens = [...refTokens];
      for (const ch of cleanPiece) {
        rawTokens.push(vmap[ch] !== void 0 ? vmap[ch] : 0);
      }
      const nSyll = nAksharas(piece);
      const speedScale = 0.9 / Math.max(0.3, speed || 0.9);
      const extraBreathSec = nSyll <= 4 ? 0.14 : 0;
      const fixD = refLenSec + (nSyll * sps + extraBreathSec) * speedScale;
      const dur = Math.min(4096, Math.max(rawTokens.length + 1, refAudioLen + 10, Math.floor(fixD * SR / HOP)));
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
        text_in: tTextIn
      });
      safeDisposeTensor(tCondMel);
      safeDisposeTensor(tTextIn);
      const useSplitCfg = this.isMobile && dur > 1100;
      const staticBias2B = new Float32Array(condOut.static_bias.data);
      const staticBiasCond = staticBias2B.slice(0, dur * 1024);
      const staticBiasNull = useSplitCfg ? staticBias2B.slice(dur * 1024, 2 * dur * 1024) : null;
      const sbTensor2B = useSplitCfg || isProxyWasm ? null : new ort.Tensor("float32", staticBias2B, [2, dur, 1024]);
      const sbTensor1B = isProxyWasm ? null : new ort.Tensor("float32", staticBiasCond, [1, dur, 1024]);
      const sbTensorNull1B = !useSplitCfg || isProxyWasm ? null : new ort.Tensor("float32", staticBiasNull, [1, dur, 1024]);
      const rcSlice = new Float32Array(condOut.rope_cos.data.slice(0, dur * 64));
      const rsSlice = new Float32Array(condOut.rope_sin.data.slice(0, dur * 64));
      safeDisposeTensor(condOut.static_bias);
      safeDisposeTensor(condOut.rope_cos);
      safeDisposeTensor(condOut.rope_sin);
      const ropeCos = isProxyWasm ? null : new ort.Tensor("float32", rcSlice, [1, dur, 64]);
      const ropeSin = isProxyWasm ? null : new ort.Tensor("float32", rsSlice, [1, dur, 64]);
      const x = seed === 60 && y0Meta && dur <= y0Meta.frames ? decodeFp16Buffer(this.bankBin, y0Meta.byte_offset, dur, 100) : randnArray(dur * 100, seed);
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
        schedule: chunkSchedules[pIdx]
      };
    };
    const disposePieceState = (st) => {
      safeDisposeTensor(st.sbTensor2B);
      safeDisposeTensor(st.sbTensor1B);
      safeDisposeTensor(st.sbTensorNull1B);
      safeDisposeTensor(st.ropeCos);
      safeDisposeTensor(st.ropeSin);
    };
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
        schedule
      } = st;
      const { tSteps, stepModes, chunkCfg } = schedule;
      const activeSteps = stepModes.length;
      const tCurr = tSteps[s];
      const dt = tSteps[s + 1] - tCurr;
      const mode = chunkCfg > 1e-5 ? stepModes[s] : "b1";
      if (onProgress) {
        const modeLabel = mode === "cfg" ? "Guided CFG" : "Harmonic Refine";
        onProgress({
          stage: "ode",
          message: `${unitLabel} ${st.pIdx + 1}/${pieces.length}: Step ${s + 1}/${activeSteps} (${modeLabel} \xB7 ${this.provider.toUpperCase()})`,
          progress: Math.round((completedSteps + 0.5) / totalSteps * 100)
        });
      }
      if (useSplitCfg || this.provider === "wasm" && st.pIdx > 0) {
        await new Promise((r) => setTimeout(r, 4));
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
          rope_sin: tRs
        });
        const vData = stepOut.v_out.data;
        const offset = dur * 100;
        for (let i = 0; i < offset; i++) {
          const pred = vData[i];
          const diff = pred - vData[offset + i];
          x[i] += (pred + diff * chunkCfg) * dt;
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
          rope_sin: tRs1
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
        if (st.pIdx > 0) {
          await new Promise((r) => setTimeout(r, 4));
        }
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
          rope_sin: tRs2
        });
        const vNull = nullStep.v_out.data;
        const len = dur * 100;
        for (let i = 0; i < len; i++) {
          const pred = vCond[i];
          const diff = pred - vNull[i];
          x[i] += (pred + diff * chunkCfg) * dt;
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
          rope_sin: tRs
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
      completedSteps++;
    };
    const runVocosAndGate = async (st) => {
      const { pIdx, dur, x } = st;
      const genFrames = dur - refAudioLen;
      const genSlice = x.subarray(refAudioLen * 100, dur * 100);
      const curHarmonicStd = computeHarmonicCombStd(genSlice, genFrames);
      const harmonicBoost = curHarmonicStd > 1e-4 && refHarmonicStd > 1e-4 ? Math.min(1.28, Math.max(1, 1.08 * refHarmonicStd / curHarmonicStd)) : 1;
      const genMelT = new Float32Array(100 * genFrames);
      for (let f = 0; f < genFrames; f++) {
        const srcBase = (refAudioLen + f) * 100;
        if (harmonicBoost > 1.001) {
          for (let c = 0; c < 100; c++) {
            const val = x[srcBase + c];
            if (c >= 15 && c < 80) {
              const env = (x[srcBase + c - 2] + x[srcBase + c - 1] + val + x[srcBase + c + 1] + x[srcBase + c + 2]) * 0.2;
              genMelT[c * genFrames + f] = env + (val - env) * harmonicBoost;
            } else {
              genMelT[c * genFrames + f] = val;
            }
          }
        } else {
          for (let c = 0; c < 100; c++) {
            genMelT[c * genFrames + f] = x[srcBase + c];
          }
        }
      }
      const tMel = new ort.Tensor("float32", genMelT, [1, 100, genFrames]);
      const vocOut = await this.vocosSession.run({
        mel: tMel
      });
      const y = new Float32Array(vocOut.wav.data);
      safeDisposeTensor(vocOut.wav);
      safeDisposeTensor(tMel);
      let activeSumSq = 0;
      let activeCount = 0;
      for (let i = 0; i < y.length; i++) {
        const a = Math.abs(y[i]);
        if (a > 0.015) {
          activeSumSq += y[i] * y[i];
          activeCount++;
        }
      }
      const curRms = activeCount > 200 ? Math.sqrt(activeSumSq / activeCount) : 0;
      const targetRms = entry.ref_rms || 0.095;
      const scale = curRms > 1e-4 ? Math.min(2.2, Math.max(0.45, targetRms / curRms)) : entry.ref_rms < entry.target_rms ? entry.ref_rms / entry.target_rms : 1;
      let maxAbs = 0;
      for (let i = 0; i < y.length; i++) {
        y[i] *= scale;
        const a = Math.abs(y[i]);
        if (a > maxAbs) maxAbs = a;
      }
      if (maxAbs > 1) {
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
        keep: 0.06
      });
      const gapChunk = !isLast ? gaps[pIdx] : new Float32Array(0);
      return { pIdx, gatedChunk, gapChunk };
    };
    for (let pIdx = 0; pIdx < pieces.length; pIdx++) {
      if (onProgress) {
        onProgress({
          stage: "condition",
          message: `${unitLabel} ${pIdx + 1}/${pieces.length}: Preparing Prosodic Conditioning...`,
          progress: Math.round(completedSteps / totalSteps * 100)
        });
      }
      if (pIdx > 0) {
        await new Promise((resolve) => setTimeout(resolve, 6));
      }
      const currState = await preparePieceState(pIdx);
      const chunkSteps = currState.schedule.stepModes.length;
      for (let s = 0; s < chunkSteps; s++) {
        await runSingleOdeStep(currState, s);
        if (pIdx > 0 || this.isMobile || this.provider === "wasm") {
          await new Promise((resolve) => setTimeout(resolve, pIdx === 0 ? 2 : 8));
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
        let pos2 = 0;
        for (const p of streamedParts) {
          soFar.set(p, pos2);
          pos2 += p.length;
        }
        await onChunk({
          chunkIndex: pIdx,
          totalChunks: pieces.length,
          gatedSamples: gatedChunk,
          gapSamples: gapChunk,
          samplesSoFar: soFar,
          sampleRate: SR,
          meter: resolvedMeter
        });
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }
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
      pieces
    };
  }
};

// index.js
var toDevanagari = toDeva;
var devanagariToSlp1 = devaToSlp1;
async function sanskritTts(sourceOrOptions = null, maybeOptions = {}) {
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
    chunk: /* @__PURE__ */ new Set(),
    progress: /* @__PURE__ */ new Set(),
    status: /* @__PURE__ */ new Set()
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
        cfg: merged.cfg ?? 3,
        speed: merged.speed ?? 0.9,
        seed: merged.seed ?? 60,
        onChunk: async (chunk) => {
          const enriched = {
            ...chunk,
            samples: chunk.gatedSamples
          };
          emit("chunk", enriched);
          if (typeof userOnChunk === "function") {
            await userOnChunk(enriched);
          }
        }
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
      }
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
      }
    }).then(
      (finalResult) => {
        done = true;
        if (resolveNext) {
          const r = resolveNext;
          resolveNext = null;
          r({ value: void 0, done: true });
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
              return Promise.resolve({ value: void 0, done: true });
            }
            return new Promise((resolve) => {
              resolveNext = resolve;
            });
          }
        };
      }
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
        if (!listeners[event]) listeners[event] = /* @__PURE__ */ new Set();
        listeners[event].add(fn);
        return voice;
      },
      off(event, fn) {
        listeners[event]?.delete(fn);
        return voice;
      },
      engine
    }
  );
  return voice;
}
var index_default = sanskritTts;
export {
  METERS,
  VagdhenuWebEngine,
  aksharas,
  alignSlp1,
  analyzeVerse,
  decodeFp16Buffer,
  index_default as default,
  detectMeter,
  detectMeterKey,
  detectScript,
  devaToSlp1,
  devanagariToSlp1,
  encodeWavBlob,
  encodeWavBuffer,
  endsHalant,
  gateAudio,
  isMobileDevice,
  nAksharas,
  preparePieces,
  repDepths,
  resolveModelBaseUrl,
  resolveOrt,
  sanskritTts,
  slp1ToKannada,
  stitchSegments,
  toDeva,
  toDevanagari
};
