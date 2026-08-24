// Generates the two static decorative SVGs used by the guest page (.decor-arch /
// .decor-hem in app/globals.css). Ported from the procedural flora in
// mockups/list-page-cha-de-bebe.html, but flattened ahead of time: Node has no
// SVGPathElement.getPointAtLength, so cubic Beziers are sampled into a polyline
// and walked by arc length instead. Output is committed to public/decor/ — the
// build never runs this script.

import { mkdirSync, writeFileSync } from 'node:fs'

const YELLOWS = ['#f6d97a', '#fbe8a6', '#f2c85c', '#f9e08c']
const PEACHES = ['#f8d6c0', '#f6c3a8', '#fae0d2']
const GREENS = ['#a7b98d', '#8fa677', '#c6d3ae', '#b7c69c']

// LCG deterministico: o arranjo e identico em qualquer maquina/execucao.
let seed = 20261003
const rnd = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 0x100000000
const f = (n) => Math.round(n * 100) / 100

// Cada segmento e uma cubica [P0, C1, C2, P3]. Coordenadas copiadas de
// mockups/list-page-cha-de-bebe.html (#archPath / #hemPath).
const ARCH = [
  [[74, 760], [46, 520], [62, 300], [176, 176]],
  [[176, 176], [300, 42], [500, 42], [624, 176]],
  [[624, 176], [738, 300], [754, 520], [726, 760]],
]
const HEM = [
  [[-20, 120], [120, 60], [260, 165], [400, 115]],
  [[400, 115], [540, 65], [660, 160], [820, 105]],
]

function flatten(segments, steps = 240) {
  const pts = []
  for (const [p0, c1, c2, p3] of segments) {
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const u = 1 - t
      pts.push({
        x: u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0],
        y: u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1],
      })
    }
  }
  let acc = 0
  pts[0].len = 0
  for (let i = 1; i < pts.length; i++) {
    acc += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
    pts[i].len = acc
  }
  return { pts, total: acc }
}

function pointAt({ pts }, len) {
  let i = 1
  while (i < pts.length - 1 && pts[i].len < len) i++
  const a = pts[i - 1]
  const b = pts[i]
  const t = (len - a.len) / Math.max(b.len - a.len, 1e-6)
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    ang: Math.atan2(b.y - a.y, b.x - a.x),
  }
}

function flower(size, palette) {
  const fill = palette[Math.floor(rnd() * palette.length)]
  let out = ''
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + rnd()
    out +=
      `<ellipse cx="${f(Math.cos(a) * size * 0.6)}" cy="${f(Math.sin(a) * size * 0.6)}"` +
      ` rx="${f(size * 0.55)}" ry="${f(size * 0.45)}" fill="${fill}"` +
      ` opacity="${f(0.62 + rnd() * 0.3)}"/>`
  }
  return out + `<circle r="${f(size * 0.32)}" fill="#e9b95a" opacity=".75"/>`
}

function sprig(size) {
  const len = size * 5
  let out =
    `<path d="M0 0 C ${f(size)} ${f(-len * 0.3)}, ${f(size * 0.4)} ${f(-len * 0.7)}, 0 ${f(-len)}"` +
    ` stroke="#9fb188" stroke-width="${f(Math.max(0.8, size * 0.16))}" fill="none"/>`
  const leaves = 5 + Math.floor(rnd() * 4)
  for (let i = 0; i < leaves; i++) {
    const t = (i + 1) / (leaves + 1)
    const side = i % 2 ? 1 : -1
    const cx = side * size * (0.8 + rnd() * 0.5)
    const cy = -len * t
    out +=
      `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(size * (0.75 + rnd() * 0.4))}"` +
      ` ry="${f(size * 0.36)}" fill="${GREENS[Math.floor(rnd() * GREENS.length)]}"` +
      ` opacity="${f(0.55 + rnd() * 0.35)}"` +
      ` transform="rotate(${f((i % 2 ? 28 : -28) + rnd() * 16)} ${f(side * size)} ${f(cy)})"/>`
  }
  return out
}

function garland(segments, count, spread) {
  const flat = flatten(segments)
  let out = ''
  for (let i = 0; i < count; i++) {
    const at = Math.min((i / count) * flat.total + rnd() * (flat.total / count), flat.total)
    const p = pointAt(flat, at)
    const off = (rnd() - 0.5) * spread // deslocamento perpendicular = espessura
    const x = p.x + Math.cos(p.ang + Math.PI / 2) * off
    const y = p.y + Math.sin(p.ang + Math.PI / 2) * off
    const kind = rnd()
    const body = kind < 0.42 ? sprig(3 + rnd() * 4) : flower(4 + rnd() * 7, kind < 0.82 ? YELLOWS : PEACHES)
    const rot = (p.ang * 180) / Math.PI + (rnd() - 0.5) * 70
    out += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">${body}</g>`
  }
  return out
}

// Laco de fita (mel) — copiado verbatim de
// mockups/list-page-cha-de-bebe.html:216-222.
const BOW = `
      <path d="M395 76C388 104 375 124 356 141" stroke="#f0d489" stroke-width="11" fill="none" stroke-linecap="round"/>
      <path d="M405 76C412 104 425 124 444 141" stroke="#f3dc9a" stroke-width="11" fill="none" stroke-linecap="round"/>
      <path d="M400 70C376 20 332 16 327 45c-4 25 39 33 73 25Z" fill="#eed283"/>
      <path d="M400 70c24-50 68-54 73-25 4 25-39 33-73 25Z" fill="#f5e0a4"/>
      <path d="M400 70c-15-17-31-25-46-26" stroke="#e5c476" stroke-width="1.8" fill="none" opacity=".65"/>
      <path d="M400 70c15-17 31-25 46-26" stroke="#e5c476" stroke-width="1.8" fill="none" opacity=".65"/>
      <ellipse cx="400" cy="71" rx="10" ry="9" fill="#e8c86f"/>
`

const arch = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 760" width="800" height="760">
<defs><filter id="soft"><feGaussianBlur stdDeviation="0.7"/></filter>
<linearGradient id="fadeGrad" x1="0" y1="0" x2="0" y2="1">
<stop offset=".58" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
<mask id="archFade"><rect width="800" height="760" fill="url(#fadeGrad)"/></mask></defs>
<g filter="url(#soft)" mask="url(#archFade)">${garland(ARCH, 190, 96)}</g>
<g filter="url(#soft)">${BOW}</g></svg>
`

const hem = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 190" width="800" height="190">
<defs><filter id="soft"><feGaussianBlur stdDeviation="0.7"/></filter></defs>
<g filter="url(#soft)">${garland(HEM, 120, 92)}</g></svg>
`

mkdirSync('public/decor', { recursive: true })
writeFileSync('public/decor/arch.svg', arch)
writeFileSync('public/decor/hem.svg', hem)
console.log('decor gerado: public/decor/arch.svg, public/decor/hem.svg')
