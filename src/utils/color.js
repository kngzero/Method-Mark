/**
 * Color parser with OKLCH/OKLAB auto-conversion to sRGB.
 * Exports: parseColor, sanitizeColor, isSupportedColor
 * Returns structured objects and never throws for unknown formats.
 */

/** @typedef {{r:number,g:number,b:number,a:number}} RGBA */

export function isSupportedColor(input) {
  return _detectFormat(input) !== "unsupported";
}

/** @returns { {ok:true, format:string, rgba:RGBA, hex:string, rgbString:string} | {ok:false, reason:string, message:string, suggestion?:string} } */
export function parseColor(input) {
  const trimmed = (input || "").trim();
  if (!trimmed) return _fail(input, "InvalidColor", "Empty color string.");
  const fmt = _detectFormat(trimmed);
  if (fmt !== "unsupported") {
    try {
      const rgba = _toRGBA(trimmed, fmt);
      return _buildOutputs(trimmed, fmt, rgba);
    } catch (e) {
      return _fail(trimmed, "InvalidColor", "Could not parse " + fmt.toUpperCase());
    }
  }
  const converted = _convertViaBrowser(trimmed);
  if (converted) {
    const f2 = _detectFormat(converted);
    if (f2 !== "unsupported") {
      const rgba = _toRGBA(converted, f2);
      return _buildOutputs(converted, f2, rgba);
    }
    return _fail(trimmed, "BrowserConversionFailed", "Browser returned unknown color.");
  }
  return _fail(trimmed, "UnsupportedFormat", "Unsupported color: " + trimmed, "Use hex, rgb[a], hsl[a], oklch, or oklab.");
}

export function sanitizeColor(input) {
  const res = parseColor(input);
  if (res.ok) return { ok: true, value: res.rgbString, source: "direct" };
  const converted = _convertViaBrowser(input);
  if (converted) {
    const r2 = parseColor(converted);
    if (r2.ok) return { ok: true, value: r2.rgbString, source: "browser-converted" };
  }
  return { ok:false, reason: res.reason, message: res.message, suggestion: res.suggestion };
}

function _detectFormat(input) {
  const s = (input || "").toLowerCase().trim();
  if (/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s)) return "hex";
  if (/^rgba?\(/i.test(s)) return /rgba\(/i.test(s) || /\/\s*[\d.]+/.test(s) ? "rgba":"rgb";
  if (/^hsla?\(/i.test(s)) return /hsla\(/i.test(s) || /\/\s*[\d.]+/.test(s) ? "hsla":"hsl";
  if (/^oklch\(/i.test(s)) return "oklch";
  if (/^oklab\(/i.test(s)) return "oklab";
  return "unsupported";
}

/** @returns {RGBA} */
function _toRGBA(input, fmt) {
  switch(fmt) {
    case "hex": return _hexToRGBA(input);
    case "rgb":
    case "rgba": return _rgbFuncToRGBA(input);
    case "hsl":
    case "hsla": return _hslFuncToRGBA(input);
    case "oklch": return _oklchFuncToRGBA(input);
    case "oklab": return _oklabFuncToRGBA(input);
  }
}

function _hexToRGBA(hex) {
  const s = hex.replace("#","");
  if (s.length === 3 || s.length === 4) {
    const r = parseInt(s[0]+s[0], 16);
    const g = parseInt(s[1]+s[1], 16);
    const b = parseInt(s[2]+s[2], 16);
    const a = s.length === 4 ? parseInt(s[3]+s[3], 16) / 255 : 1;
    return { r, g, b, a };
  }
  if (s.length === 6 || s.length === 8) {
    const r = parseInt(s.slice(0,2),16);
    const g = parseInt(s.slice(2,4),16);
    const b = parseInt(s.slice(4,6),16);
    const a = s.length === 8 ? parseInt(s.slice(6,8),16) / 255 : 1;
    return { r, g, b, a };
  }
  throw new Error("Invalid hex length");
}

function _rgbFuncToRGBA(str) {
  const body = str.trim().slice(str.indexOf("(")+1, str.lastIndexOf(")"));
  let r=0,g=0,b=0,a=1;
  if (body.includes(",")) {
    const parts = body.split(",").map(s=>s.trim());
    r = _parseRGBPart(parts[0]); g = _parseRGBPart(parts[1]); b = _parseRGBPart(parts[2]);
    if (parts[3]!=null) a = _parseAlpha(parts[3]);
  } else {
    const [rgbPart, alphaPart] = body.split("/").map(s=>s.trim());
    const nums = rgbPart.split(/\s+/);
    r = _parseRGBPart(nums[0]); g = _parseRGBPart(nums[1]); b = _parseRGBPart(nums[2]);
    if (alphaPart) a = _parseAlpha(alphaPart);
  }
  return { r, g, b, a };
}
function _parseRGBPart(token) {
  if (token.endsWith("%")) {
    const p = Math.max(0, Math.min(100, parseFloat(token)));
    return Math.round((p/100)*255);
  }
  return Math.max(0, Math.min(255, parseInt(token,10)));
}
function _parseAlpha(token) {
  if (token.endsWith("%")) return Math.max(0, Math.min(1, parseFloat(token)/100));
  return Math.max(0, Math.min(1, parseFloat(token)));
}

function _hslFuncToRGBA(str) {
  const body = str.trim().slice(str.indexOf("(")+1, str.lastIndexOf(")"));
  const [hslPart, alphaPart] = body.split("/").map(s=>s.trim());
  const parts = hslPart.split(/[\s,]+/).filter(Boolean);
  const h = parseFloat(parts[0]);
  const s = _pct(parts[1]);
  const l = _pct(parts[2]);
  const a = alphaPart ? _parseAlpha(alphaPart) : 1;
  const C = (1 - Math.abs(2*l - 1)) * s;
  const Hp = ((h % 360) + 360) % 360 / 60;
  const X = C * (1 - Math.abs((Hp % 2) - 1));
  let r1=0, g1=0, b1=0;
  if (0 <= Hp && Hp < 1) [r1,g1,b1] = [C,X,0];
  else if (1 <= Hp && Hp < 2) [r1,g1,b1] = [X,C,0];
  else if (2 <= Hp && Hp < 3) [r1,g1,b1] = [0,C,X];
  else if (3 <= Hp && Hp < 4) [r1,g1,b1] = [0,X,C];
  else if (4 <= Hp && Hp < 5) [r1,g1,b1] = [X,0,C];
  else if (5 <= Hp && Hp < 6) [r1,g1,b1] = [C,0,X];
  const m = l - C/2;
  const r = Math.round((r1+m)*255);
  const g = Math.round((g1+m)*255);
  const b = Math.round((b1+m)*255);
  return { r:clamp(r,0,255), g:clamp(g,0,255), b:clamp(b,0,255), a };
}
function _pct(token) {
  if (!token || !token.endsWith("%")) throw new Error("Expected percentage (e.g., 50%).");
  return Math.max(0, Math.min(1, parseFloat(token)/100));
}

/* OKLCH / OKLAB parsing + conversion */
function _oklchFuncToRGBA(str) {
  const body = str.trim().slice(str.indexOf("(")+1, str.lastIndexOf(")"));
  const [lchPart, alphaPart] = body.split("/").map(s=>s.trim());
  const parts = lchPart.split(/[\s,]+/).filter(Boolean);
  if (parts.length < 3) throw new Error("OKLCH expects 3 components");
  const L = parts[0].endsWith("%") ? clamp(parseFloat(parts[0])/100,0,1): clamp(parseFloat(parts[0]),0,1);
  const C = parseFloat(parts[1]);
  const h = parseFloat(parts[2]);
  const a = alphaPart ? _parseAlpha(alphaPart) : 1;
  const rgb = _oklchToSrgb255(L, C, h);
  return { ...rgb, a };
}
function _oklabFuncToRGBA(str) {
  const body = str.trim().slice(str.indexOf("(")+1, str.lastIndexOf(")"));
  const [labPart, alphaPart] = body.split("/").map(s=>s.trim());
  const parts = labPart.split(/[\s,]+/).filter(Boolean);
  if (parts.length < 3) throw new Error("OKLAB expects 3 components");
  const L = parts[0].endsWith("%") ? clamp(parseFloat(parts[0])/100,0,1): clamp(parseFloat(parts[0]),0,1);
  const a_ = parseFloat(parts[1]);
  const b_ = parseFloat(parts[2]);
  const alpha = alphaPart ? _parseAlpha(alphaPart) : 1;
  const rgb = _oklabToSrgb255(L, a_, b_);
  return { ...rgb, a: alpha };
}

function _oklchToSrgb255(L, C, hDeg) {
  const hRad = (hDeg * Math.PI)/180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);
  return _oklabToSrgb255(L, a, b);
}
function _oklabToSrgb255(L, a_, b_) {
  const l_ = L + 0.3963377774 * a_ + 0.2158037573 * b_;
  const m_ = L - 0.1055613458 * a_ - 0.0638541728 * b_;
  const s_ = L - 0.0894841775 * a_ - 1.2914855480 * b_;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  let rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const toSrgb = (x) => x <= 0.0031308 ? 12.92 * x : 1.055 * (Math.max(x,0) ** (1/2.4)) - 0.055;
  const r8 = clamp(Math.round(clamp(toSrgb(rLin), 0, 1) * 255), 0, 255);
  const g8 = clamp(Math.round(clamp(toSrgb(gLin), 0, 1) * 255), 0, 255);
  const b8 = clamp(Math.round(clamp(toSrgb(bLin), 0, 1) * 255), 0, 255);
  return { r: r8, g: g8, b: b8 };
}

function _rgbaToHex({r,g,b,a}) {
  const toHex = (n) => n.toString(16).padStart(2,'0');
  const base = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  if (a >= 1) return base;
  return `${base}${toHex(Math.round(a*255))}`;
}
function _rgbaToRgbString({r,g,b,a}) {
  if (a >= 1) return `rgb(${r} ${g} ${b})`;
  return `rgb(${r} ${g} ${b} / ${a.toFixed(3)})`;
}

function _buildOutputs(input, fmt, rgba) {
  return { ok:true, input, format:fmt, rgba, hex:_rgbaToHex(rgba), rgbString:_rgbaToRgbString(rgba) };
}
function _fail(input, reason, message, suggestion) {
  return { ok:false, input, reason, message, suggestion };
}
function _convertViaBrowser(input) {
  if (typeof document === "undefined" || typeof window === "undefined") return null;
  try {
    const el = document.createElement("span");
    el.style.color = input;
    document.body.appendChild(el);
    const computed = getComputedStyle(el).color;
    document.body.removeChild(el);
    return /^rgb(a)?\(/i.test(computed) ? computed : null;
  } catch { return null; }
}
function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

// Tiny tests (vitest will import this and run)
export function _test_examples() {
  const ok = [];
  const res1 = parseColor("oklch(62% 0.19 244)");
  ok.push(!!res1.ok);
  const res2 = parseColor("#ff00aa");
  ok.push(!!res2.ok);
  const res3 = parseColor("hsl(120 50% 50% / 50%)");
  ok.push(!!res3.ok);
  return ok.every(Boolean);
}