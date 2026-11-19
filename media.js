// Images stored inside Firestore (free Spark plan, no Cloud Storage).
// Each image = two documents with the same id:
//   images/{id}  full picture, max 1600 px, WebP (JPEG where WebP can't be encoded), < 1 MB
//   thumbs/{id}  small preview, max 480 px
// The option / variant keeps only a list of file descriptions: {id, name, w, h, size, mime}.
import { doc, setDoc, getDoc, serverTimestamp, Bytes } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

export const MAX_INPUT = 15 * 1024 * 1024;   // largest file accepted from the user
const FULL_PX = 1600, FULL_MAX = 950_000;     // rules allow 1,000,000 bytes
const THUMB_PX = 480, THUMB_MAX = 120_000;    // rules allow 150,000 bytes

let db = null, getUser = () => null;
export function initMedia(o) { db = o.db; getUser = o.getUser; }

const newId = () => (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Date.now().toString(36) + Math.random().toString(36).slice(2)).slice(0, 24);

/* ---------- compress in the browser ---------- */
async function decode(file) {
  if (window.createImageBitmap) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { /* fall back */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image(); img.decoding = 'async'; img.src = url;
    await img.decode(); return img;
  } finally { URL.revokeObjectURL(url); }
}
let webpOk = null;
function canWebp() {
  if (webpOk === null) { const c = document.createElement('canvas'); c.width = c.height = 1; webpOk = c.toDataURL('image/webp').startsWith('data:image/webp'); }
  return webpOk;
}
const toBlob = (c, type, q) => new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error('encode')), type, q));
async function encode(src, maxPx, maxBytes) {
  const W = src.width, H = src.height, type = canWebp() ? 'image/webp' : 'image/jpeg';
  let scale = Math.min(1, maxPx / Math.max(W, H));
  for (let round = 0; round < 6; round++) {
    const w = Math.max(1, Math.round(W * scale)), h = Math.max(1, Math.round(H * scale));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); // transparent drawings get a white background (readable in dark mode too)
    g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, w, h);
    for (const q of [0.82, 0.72, 0.62, 0.52]) {
      const b = await toBlob(c, type, q);
      if (b.size <= maxBytes) return { blob: b, w, h, mime: type };
    }
    scale *= 0.8;
  }
  throw new Error('too-big');
}

/* ---------- upload ---------- */
export class MediaError extends Error { constructor(code) { super(code); this.code = code; } }

/** Compress and save one image. onProgress(0..100). Returns the file description. */
export async function uploadImage(file, onProgress = () => {}) {
  if (!file.type.startsWith('image/')) throw new MediaError(file.type === 'application/pdf' ? 'pdf' : 'type');
  if (file.size > MAX_INPUT) throw new MediaError('size');
  onProgress(5);
  let src;
  try { src = await decode(file); } catch (e) { throw new MediaError('decode'); }
  onProgress(25);
  const full = await encode(src, FULL_PX, FULL_MAX);
  onProgress(50);
  const thumb = await encode(src, THUMB_PX, THUMB_MAX);
  if (src.close) src.close();
  onProgress(60);
  const id = newId(), u = getUser();
  const base = { createdBy: u.email, createdAt: serverTimestamp() };
  const bytes = async b => Bytes.fromUint8Array(new Uint8Array(await b.arrayBuffer()));
  await setDoc(doc(db, 'thumbs', id), { ...base, data: await bytes(thumb.blob), mime: thumb.mime, w: thumb.w, h: thumb.h });
  onProgress(75);
  await setDoc(doc(db, 'images', id), { ...base, data: await bytes(full.blob), mime: full.mime, w: full.w, h: full.h });
  onProgress(100);
  thumbCache.set(id, URL.createObjectURL(thumb.blob));
  return { id, name: String(file.name || 'image').slice(0, 200), w: full.w, h: full.h, size: full.blob.size, mime: full.mime };
}

/** Add deletes for these files to a write batch (2 documents per image). */
export function deleteFilesIn(batch, files) {
  (files || []).forEach(f => { if (f && f.id) { batch.delete(doc(db, 'images', f.id)); batch.delete(doc(db, 'thumbs', f.id)); } });
}

/* ---------- read (cached object URLs) ---------- */
const thumbCache = new Map(), fullCache = new Map(), loading = new Map();
async function load(coll, id, cache) {
  if (cache.has(id)) return cache.get(id);
  const key = coll + '/' + id;
  if (!loading.has(key)) loading.set(key, (async () => {
    try {
      const s = await getDoc(doc(db, coll, id));
      if (!s.exists()) return null;
      const d = s.data(), url = URL.createObjectURL(new Blob([d.data.toUint8Array()], { type: d.mime }));
      cache.set(id, url);
      if (cache === fullCache && cache.size > 30) { const [k, v] = cache.entries().next().value; URL.revokeObjectURL(v); cache.delete(k); }
      return url;
    } finally { loading.delete(key); }
  })());
  return loading.get(key);
}
export const cachedThumb = id => thumbCache.get(id) || '';
export const loadThumb = id => load('thumbs', id, thumbCache);
export const loadFull = id => load('images', id, fullCache);

/** Fill <img data-thumb="id"> elements inside root. */
export function hydrateThumbs(root) {
  (root || document).querySelectorAll('img[data-thumb]:not([src])').forEach(img => {
    loadThumb(img.dataset.thumb).then(u => { if (u) img.src = u; else img.classList.add('missing'); }, () => img.classList.add('missing'));
  });
}

/* ---------- full-screen viewer with zoom ---------- */
let V = null, items = [], idx = 0, z = { s: 1, x: 0, y: 0 };
function build() {
  V = document.createElement('div');
  V.className = 'viewer'; V.setAttribute('role', 'dialog'); V.setAttribute('aria-modal', 'true'); V.hidden = true;
  V.innerHTML = `<div class="vstage"><img alt=""></div>
    <div class="vcap"></div>
    <button class="vbtn vx" aria-label="დახურვა">×</button>
    <button class="vbtn vprev" aria-label="წინა">‹</button><button class="vbtn vnext" aria-label="შემდეგი">›</button>
    <a class="vbtn vopen" target="_blank" rel="noopener" aria-label="ახალ ფანჯარაში">↗</a>`;
  document.body.appendChild(V);
  const stage = V.querySelector('.vstage'), img = V.querySelector('img');
  V.querySelector('.vx').onclick = close;
  V.querySelector('.vprev').onclick = () => go(-1);
  V.querySelector('.vnext').onclick = () => go(1);
  stage.addEventListener('click', e => { if (e.target === stage && z.s === 1) close(); });
  stage.addEventListener('dblclick', e => zoomAt(z.s > 1 ? 1 : 2.5, e.clientX, e.clientY));
  stage.addEventListener('wheel', e => { e.preventDefault(); zoomAt(z.s * (e.deltaY < 0 ? 1.2 : 1 / 1.2), e.clientX, e.clientY); }, { passive: false });
  // pointers: pan when zoomed, pinch with two fingers, swipe to change image
  const P = new Map(); let start = null, pinch = null, lastTap = 0;
  stage.addEventListener('pointerdown', e => {
    stage.setPointerCapture(e.pointerId); P.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (P.size === 1) start = { x: e.clientX, y: e.clientY, zx: z.x, zy: z.y, t: Date.now() };
    if (P.size === 2) { const [a, b] = [...P.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: z.s }; }
  });
  stage.addEventListener('pointermove', e => {
    if (!P.has(e.pointerId)) return; P.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (P.size === 2 && pinch) { const [a, b] = [...P.values()]; zoomAt(pinch.s * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, (a.x + b.x) / 2, (a.y + b.y) / 2); }
    else if (P.size === 1 && start && z.s > 1) { z.x = start.zx + e.clientX - start.x; z.y = start.zy + e.clientY - start.y; apply(); }
  });
  const up = e => {
    if (!P.has(e.pointerId)) return; P.delete(e.pointerId);
    if (P.size < 2) pinch = null;
    if (P.size === 0 && start) {
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (z.s === 1 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
      else if (e.pointerType === 'touch' && Math.hypot(dx, dy) < 10) { // double tap
        if (Date.now() - lastTap < 300) { zoomAt(z.s > 1 ? 1 : 2.5, e.clientX, e.clientY); lastTap = 0; } else lastTap = Date.now();
      }
      start = null;
    }
  };
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
  document.addEventListener('keydown', e => {
    if (V.hidden) return;
    if (e.key === 'Escape') { e.stopImmediatePropagation(); close(); }
    else if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'ArrowRight') go(1);
  }, true);
  img.addEventListener('load', () => V.classList.remove('busy'));
}
function apply() {
  const img = V.querySelector('img');
  if (z.s <= 1) { z = { s: 1, x: 0, y: 0 }; }
  img.style.transform = `translate(${z.x}px,${z.y}px) scale(${z.s})`;
  V.classList.toggle('zoomed', z.s > 1);
}
function zoomAt(s, cx, cy) {
  s = Math.min(6, Math.max(1, s));
  const r = V.querySelector('.vstage').getBoundingClientRect(), ox = cx - r.left - r.width / 2, oy = cy - r.top - r.height / 2;
  z.x = ox - (ox - z.x) * s / z.s; z.y = oy - (oy - z.y) * s / z.s; z.s = s; apply();
}
async function show() {
  const it = items[idx], img = V.querySelector('img');
  z = { s: 1, x: 0, y: 0 }; apply();
  V.querySelector('.vcap').textContent = `${it.caption || ''}${items.length > 1 ? `  ·  ${idx + 1} / ${items.length}` : ''}`;
  V.querySelector('.vprev').hidden = V.querySelector('.vnext').hidden = items.length < 2;
  const t = cachedThumb(it.id); img.removeAttribute('src'); if (t) img.src = t;
  V.classList.add('busy');
  const want = it.id, url = await loadFull(it.id).catch(() => null);
  if (items[idx] && items[idx].id === want) {
    if (url) { img.src = url; V.querySelector('.vopen').href = url; } else { V.classList.remove('busy'); V.querySelector('.vcap').textContent += '  ·  ვერ ჩაიტვირთა'; }
  }
}
function go(d) { if (items.length < 2) return; idx = (idx + d + items.length) % items.length; show(); }
let lastFocus = null;
function close() { V.hidden = true; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
/** items: [{id, caption}] */
export function openViewer(list, start = 0) {
  if (!V) build();
  items = list; idx = start; lastFocus = document.activeElement;
  V.hidden = false; document.body.style.overflow = 'hidden';
  V.querySelector('.vx').focus(); show();
}
