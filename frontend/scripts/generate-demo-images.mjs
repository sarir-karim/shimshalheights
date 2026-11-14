// Generates clearly-labelled DEMO placeholder art into public/images/demo.
// Replace with real photography (via Cloudinary + admin panel) before launch.
import { writeFileSync, mkdirSync } from "node:fs";

const OUT = "public/images/demo";
mkdirSync(OUT, { recursive: true });

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const skies = {
  dawn: ["#E9D9BF", "#C9B79A", "#8FA39A"],
  noon: ["#BFD3D6", "#9DB8BC", "#7C9BA0"],
  dusk: ["#C8A27E", "#8E7A78", "#4F5E6B"],
  night: ["#2C3B4A", "#233140", "#1B2733"],
};
const ridgeSets = {
  dawn: ["#B9B4A4", "#8E9A8C", "#5F7565", "#2F4A3B"],
  noon: ["#C9D3D2", "#97ADA9", "#5E7D74", "#2B4A3C"],
  dusk: ["#9A8F8F", "#6F7B7E", "#46605B", "#22382D"],
  night: ["#44566A", "#364758", "#27363F", "#18241F"],
};

function ridge(r, baseY, amp, w, color, snow) {
  const pts = [];
  const steps = 18;
  for (let i = 0; i <= steps; i++) {
    const x = (w / steps) * i;
    const peak = i % 2 === 0 ? 1 : 0.35;
    pts.push([x, baseY - amp * (0.3 + r() * 0.7) * peak]);
  }
  let d = `M0 600 L${pts.map(([x, y]) => `${x.toFixed(0)} ${y.toFixed(0)}`).join(" L")} L${w} 600 Z`;
  let caps = "";
  if (snow) {
    pts.forEach(([x, y], i) => {
      if (i % 2 === 0 && y < baseY - amp * 0.55) {
        caps += `<path d="M${x - 46} ${y + 38} L${x} ${y} L${x + 46} ${y + 38} L${x + 20} ${y + 30} L${x} ${y + 44} L${x - 18} ${y + 30} Z" fill="#F7F5F0" opacity=".85"/>`;
      }
    });
  }
  return `<path d="${d}" fill="${color}"/>${caps}`;
}

function label(text) {
  if (!text) return "";
  const w = text.length * 7.4 + 22;
  const x = 600 - w / 2;
  return `<g opacity=".7"><rect x="${x}" y="556" width="${w}" height="26" rx="13" fill="#272B2A" opacity=".55"/><text x="${x + 11}" y="573" font-family="system-ui,sans-serif" font-size="12" fill="#F5F3EE">${text}</text></g>`;
}

function peaks(name, mood, seed, text = "Demo image") {
  const r = rng(seed);
  const [a, b, c] = skies[mood];
  const rs = ridgeSets[mood];
  const sun = mood === "night" ? `<circle cx="${200 + r() * 800}" cy="110" r="26" fill="#F2EEE2" opacity=".9"/>` : `<circle cx="${700 + r() * 300}" cy="${170 + r() * 40}" r="54" fill="#F6E7C6" opacity=".7"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".6" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs><rect width="1200" height="600" fill="url(#g)"/>${sun}${ridge(r, 380, 230, 1200, rs[0], true)}${ridge(r, 440, 190, 1200, rs[1], true)}${ridge(r, 500, 130, 1200, rs[2], false)}${ridge(r, 570, 90, 1200, rs[3], false)}${label(text)}</svg>`;
  writeFileSync(`${OUT}/${name}.svg`, svg);
}

function interior(name, tone, seed, text = "Demo image") {
  const r = rng(seed);
  const wall = tone === "warm" ? "#D9CBB0" : "#C7D1CB";
  const floor = tone === "warm" ? "#8B6B4A" : "#6C5B49";
  const blanket = tone === "warm" ? "#2F5642" : "#A98B55";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice"><rect width="1200" height="600" fill="${wall}"/><rect y="400" width="1200" height="200" fill="${floor}"/><rect x="${760 + r() * 60}" y="90" width="260" height="210" rx="6" fill="#BFD3D6"/><path d="M${760} 300 L880 180 L940 250 L1020 160 L1020 300Z" fill="#7C9BA0" opacity=".7"/><rect x="740" y="80" width="300" height="10" fill="#4A504E"/><rect x="170" y="300" width="470" height="130" rx="14" fill="#F5F3EE"/><rect x="170" y="350" width="470" height="80" rx="10" fill="${blanket}"/><rect x="190" y="305" width="120" height="48" rx="16" fill="#EBE7DD"/><rect x="330" y="305" width="120" height="48" rx="16" fill="#EBE7DD"/><rect x="150" y="270" width="30" height="170" rx="8" fill="#4A3B2C"/><rect x="95" y="360" width="40" height="80" rx="6" fill="#4A3B2C"/><circle cx="115" cy="335" r="22" fill="#E8DABB"/>${label(text)}</svg>`;
  writeFileSync(`${OUT}/${name}.svg`, svg);
}


function dining(name, seed, text = "Demo image") {
  const r = rng(seed);
  const lamps = [300, 600, 900].map((x) => `<line x1="${x}" y1="0" x2="${x}" y2="${120 + r() * 20}" stroke="#4A504E" stroke-width="3"/><path d="M${x - 40} 160 Q${x} 100 ${x + 40} 160 Z" fill="#C9AE7C"/><circle cx="${x}" cy="165" r="9" fill="#F6E7C6"/>`).join("");
  const plates = [330, 520, 710, 880].map((x) => `<ellipse cx="${x}" cy="400" rx="52" ry="12" fill="#F5F3EE"/><ellipse cx="${x}" cy="397" rx="30" ry="6" fill="#B9763C"/>`).join("");
  const chairs = [260, 470, 680, 890].map((x) => `<rect x="${x}" y="430" width="80" height="14" rx="5" fill="#4A3B2C"/><rect x="${x + 6}" y="444" width="8" height="90" fill="#4A3B2C"/><rect x="${x + 66}" y="444" width="8" height="90" fill="#4A3B2C"/><rect x="${x}" y="340" width="10" height="94" rx="4" fill="#4A3B2C"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice"><rect width="1200" height="600" fill="#D6C4A3"/><rect y="440" width="1200" height="160" fill="#6E533B"/><rect x="60" y="150" width="190" height="200" rx="6" fill="#BFD3D6"/><path d="M60 350 L130 240 L170 290 L210 220 L250 350Z" fill="#7C9BA0" opacity=".7"/>${lamps}${chairs}<rect x="220" y="410" width="760" height="20" rx="6" fill="#8B6B4A"/><rect x="250" y="430" width="14" height="110" fill="#6A4F36"/><rect x="936" y="430" width="14" height="110" fill="#6A4F36"/>${plates}${label(text)}</svg>`;
  writeFileSync(`${OUT}/${name}.svg`, svg);
}

function dish(name, seed, text = "Demo image") {
  const r = rng(seed);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice"><rect width="1200" height="600" fill="#6B4F36"/><rect y="0" width="1200" height="600" fill="#000" opacity=".08"/><circle cx="600" cy="300" r="230" fill="#F5F3EE"/><circle cx="600" cy="300" r="190" fill="#EBE7DD"/><circle cx="600" cy="300" r="120" fill="#B9763C"/><circle cx="${560 + r() * 40}" cy="${270 + r() * 30}" r="46" fill="#7E9A55"/><circle cx="${620 + r() * 40}" cy="${320 + r() * 30}" r="38" fill="#D9A24B"/><circle cx="520" cy="330" r="30" fill="#A24B33"/>${label(text)}</svg>`;
  writeFileSync(`${OUT}/${name}.svg`, svg);
}

peaks("hero-valley", "dawn", 11);
peaks("fallback-hero", "dawn", 12, "");
peaks("fallback-about", "noon", 22, "");
peaks("fallback-about-2", "dusk", 72, "");
peaks("fallback-cta", "night", 122, "");
peaks("fallback-map", "noon", 132, "");
peaks("placeholder", "noon", 201, "Photo coming soon");
interior("placeholder-room", "warm", 202, "Photo coming soon");
dish("placeholder-food", 203, "Photo coming soon");
peaks("about-valley", "noon", 21);
peaks("exp-peaks", "noon", 31);
peaks("exp-trek", "dawn", 41);
peaks("exp-culture", "dusk", 51);
peaks("exp-attractions", "dusk", 61);
peaks("gallery-exterior", "dusk", 71);
peaks("gallery-nature-1", "dawn", 81);
peaks("gallery-nature-2", "night", 91);
peaks("gallery-valley-1", "noon", 101);
peaks("gallery-valley-2", "dawn", 111);
peaks("cta-valley", "night", 121);
peaks("map-bg", "noon", 131, "Map placeholder");
interior("room-standard", "warm", 3);
interior("room-deluxe", "cool", 5);
interior("room-family", "warm", 7);
interior("room-suite", "cool", 9);
dining("restaurant-interior", 13);
interior("gallery-room-1", "cool", 15);
dish("food-1", 17);
dish("food-2", 19);
dish("food-3", 23);
console.log("Demo images written to", OUT);
