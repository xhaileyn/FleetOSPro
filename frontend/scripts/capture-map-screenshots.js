const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');

const OUT_DIR = path.join(__dirname, '../public/website/assets/screenshots');

const REGIONS = [
  {
    name: 'britain',
    center: [51.52, -0.10],
    zoom: 10,
    vehicles: [
      { lat: 51.5074, lng: -0.1278, plate: 'LN71 ABC', status: 'active'  },
      { lat: 51.5155, lng: -0.0922, plate: 'LN70 XYZ', status: 'active'  },
      { lat: 51.4994, lng: -0.1743, plate: 'LN69 DEF', status: 'active'  },
      { lat: 51.5289, lng: -0.1047, plate: 'LN72 GHI', status: 'active'  },
      { lat: 51.4879, lng: -0.1560, plate: 'LN68 JKL', status: 'idle'    },
      { lat: 51.5440, lng: -0.0554, plate: 'LN67 MNO', status: 'active'  },
      { lat: 51.4641, lng: -0.1173, plate: 'LN66 PQR', status: 'active'  },
    ],
  },
  {
    name: 'europe',
    center: [50.0, 7.0],
    zoom: 5,
    vehicles: [
      { lat: 48.8566, lng: 2.3522,  plate: 'AB-123-CD', status: 'active' },
      { lat: 48.8742, lng: 2.3470,  plate: 'EF-456-GH', status: 'active' },
      { lat: 52.5200, lng: 13.4050, plate: 'B-AB 1234', status: 'active' },
      { lat: 52.5100, lng: 13.3800, plate: 'B-CD 5678', status: 'active' },
      { lat: 52.3676, lng: 4.9041,  plate: '12-AB-34',  status: 'active' },
      { lat: 40.4168, lng: -3.7038, plate: '1234 ABC',  status: 'active' },
      { lat: 51.5074, lng: -0.1278, plate: 'LN71 ABC',  status: 'active' },
      { lat: 51.5289, lng: -0.1047, plate: 'LN72 GHI',  status: 'active' },
    ],
  },
  {
    name: 'america',
    center: [40.74, -73.99],
    zoom: 10,
    vehicles: [
      { lat: 40.7128, lng: -74.0060, plate: 'NYC 4821', status: 'active' },
      { lat: 40.7580, lng: -73.9855, plate: 'NYC 9143', status: 'active' },
      { lat: 40.6892, lng: -74.0445, plate: 'NYC 3307', status: 'idle'   },
    ],
  },
];

const STATUS_COLOR = { active: '#22c55e', idle: '#f59e0b', offline: '#64748b' };

function buildHTML({ center, zoom, vehicles }) {
  const markers = vehicles.map(v => `
    L.marker([${v.lat}, ${v.lng}], {
      icon: L.divIcon({
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        html: \`<svg width="28" height="34" viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="14" cy="32" rx="7" ry="2" fill="rgba(0,0,0,0.2)"/>
          <path d="M14 0C7.37 0 2 5.37 2 12c0 9 12 22 12 22S26 21 26 12C26 5.37 20.63 0 14 0z" fill="${STATUS_COLOR[v.status] || '#64748b'}" stroke="#fff" stroke-width="2"/>
          <circle cx="14" cy="12" r="5" fill="#fff" opacity="0.9"/>
        </svg>\`
      })
    }).bindTooltip('${v.plate}', { permanent: false, direction: 'top' }).addTo(map);
  `).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 1440px; height: 860px; }
    /* Hide OSM attribution for cleaner screenshot */
    .leaflet-control-attribution { display: none !important; }
  </style>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', { zoomControl: false, attributionControl: false })
                  .setView([${center[0]}, ${center[1]}], ${zoom});

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    ${markers}

    window.__mapReady = false;
    map.on('load', () => { window.__mapReady = true; });
    // Leaflet fires 'load' when tiles load; also set a fallback
    setTimeout(() => { window.__mapReady = true; }, 5000);
  </script>
</body>
</html>`;
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext({ viewport: { width: 1440, height: 860 } });
  const page    = await ctx.newPage();

  for (const region of REGIONS) {
    console.log(`Capturing ${region.name}…`);
    const html = buildHTML(region);

    // Use a fresh page each time so tile cache doesn't interfere
    const p = await ctx.newPage();
    await p.setContent(html, { waitUntil: 'load' });

    // Wait until Leaflet fires the map 'load' event (tiles rendered)
    await p.waitForFunction(() => window.__mapReady === true, { timeout: 15000 })
      .catch(() => console.log('  (mapReady timeout, taking screenshot anyway)'));

    // Extra settle time for last tile paints
    await p.waitForTimeout(3000);

    const file = path.join(OUT_DIR, `map-${region.name}.png`);
    await p.screenshot({ path: file });
    await p.close();
    console.log(`  Saved → ${file}`);
  }

  await browser.close();
  console.log('\nAll 3 screenshots captured ✓');
})();
