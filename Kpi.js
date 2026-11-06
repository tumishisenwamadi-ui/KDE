// Shared simulated data + KPI calculations. Replace the generators with real API calls later;
// every page reads KPIs only through Fleet.fuel() / Fleet.hazards().
document.documentElement.setAttribute('data-theme', localStorage.getItem('dashboard-theme') || 'light');

const Fleet = (() => {
  // Seeded RNG so every page shows the same numbers
  let s = 42;
  const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const r = (a, b) => a + rnd() * (b - a);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const DIESEL_PRICE = 22; // R/L, assumed - edit to match your fleet

  // ---------- Intelligence Fuel Guard ----------
  // Rule: a drop >12 L inside 5 min beyond expected burn, while the truck is parked = theft alert.
  // Driving fuel slosh is ignored, which is what keeps false alarms low.
  function fuel() {
    s = 42;
    const truth = [{ m: 190, l: 55 }, { m: 1100, l: 80 }];
    const moving = (m) => (m >= 360 && m < 660) || (m >= 780 && m < 1020);
    const level = []; let lv = 420;
    for (let m = 0; m < 1440; m++) {
      if (moving(m)) lv -= 0.35;
      if (m === 720) lv += 200;                        // legitimate refuel
      truth.forEach(t => { if (m >= t.m && m < t.m + 5) lv -= t.l / 5; });
      level.push(lv + r(-0.4, 0.4) + (moving(m) ? r(-1.5, 1.5) : 0));
    }
    const alerts = []; let quiet = 0;
    for (let m = 5; m < 1440; m++) {
      if (m < quiet) continue;
      if (!moving(m) && level[m - 5] - level[m] > 12) { alerts.push(m); quiet = m + 15; }
    }
    const hits = truth.filter(t => alerts.some(a => a >= t.m && a <= t.m + 10));
    const ttas = hits.map(t => alerts.find(a => a >= t.m) - t.m + 1);
    const falseAlarms = alerts.length - hits.length;
    const litresLost = truth.reduce((n, t) => n + t.l, 0);
    return {
      level, truth, alerts, moving,
      kpi: {
        thefts: alerts.length,
        litresLost,
        costR: litresLost * DIESEL_PRICE,
        detectionRate: Math.round(hits.length / truth.length * 100),
        falseAlarms,
        avgAlertMin: ttas.length ? +(ttas.reduce((a, b) => a + b) / ttas.length).toFixed(1) : 0,
      },
    };
  }

  // ---------- Fleet Learning ----------
  const ROAD = ['Pothole', 'Flooding', 'Road debris', 'Accident', 'Roadworks'];
  const ENV = ['Heavy rain', 'Dense fog', 'Smoke / veld fire', 'Extreme heat', 'Poor air quality'];
  function hazards() {
    s = 7;
    const list = [];
    for (let i = 0; i < 64; i++) {
      const road = rnd() < 0.62;
      const reports = 1 + Math.floor(rnd() * rnd() * 6);
      list.push({
        id: i, group: road ? 'Road' : 'Environmental', type: pick(road ? ROAD : ENV),
        lat: -25.7479 + r(-0.09, 0.09), lng: 28.2293 + r(-0.12, 0.12),
        reports, verified: reports >= 2, latency: Math.round(r(4, 45)),
        minsAgo: Math.floor(r(2, 1440)),
      });
    }
    const road = list.filter(h => h.group === 'Road').length;
    const ver = list.filter(h => h.verified).length;
    return {
      list,
      kpi: {
        total: list.length, road, env: list.length - road,
        verifiedPct: Math.round(ver / list.length * 100),
        avgLatency: Math.round(list.reduce((n, h) => n + h.latency, 0) / list.length),
        coverageKm: 412,
      },
    };
  }


  // ---------- Predictive Maintenance ----------
  function maintenance() {
    s = 11;
    const parts = ['Engine', 'Brakes', 'Tyres', 'Battery'];
    const trucks = Array.from({ length: 12 }, (_, i) => {
      const h = {}; parts.forEach(p => h[p] = Math.round(r(25, 98)));
      const worst = parts.reduce((a, b) => h[a] <= h[b] ? a : b);
      return { name: 'Truck ' + (i + 1), h, worst, min: h[worst], days: Math.round(h[worst] * 0.6) };
    });
    const risk = trucks.filter(t => t.min < 45).length;
    return { trucks, parts, kpi: {
      atRisk: risk, health: Math.round(trucks.reduce((n, t) => n + parts.reduce((a, p) => a + t.h[p], 0) / 4, 0) / trucks.length),
      predicted: risk + 3, downtimeH: (risk + 3) * 14, accuracy: 87 } };
  }

  // ---------- Healthiest Route Navigation ----------
  function routes() {
    s = 23;
    const trips = Array.from({ length: 40 }, (_, i) => ({
      id: i + 1, extraPct: +r(1, 9).toFixed(1), exposureCut: Math.round(r(12, 48)),
      hazardsAvoided: Math.floor(r(0, 4)), aqi: Math.round(r(28, 85)) }));
    const avg = k => trips.reduce((n, t) => n + t[k], 0) / trips.length;
    return { trips, kpi: { trips: trips.length, exposureCut: Math.round(avg('exposureCut')),
      extraPct: +avg('extraPct').toFixed(1), hazardsAvoided: trips.reduce((n, t) => n + t.hazardsAvoided, 0), aqi: Math.round(avg('aqi')) } };
  }

  // ---------- UI helpers ----------
  const fmtTime = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  function kpiCards(el, cards) {
    el.innerHTML = cards.map(c => `
      <div class="stat-card">
        <div class="stat-card-header"><div class="stat-card-title">${c.title}</div>
          <div class="stat-card-icon ${c.tone || 'primary'}"><span class="material-symbols-rounded">${c.icon}</span></div></div>
        <div class="stat-card-value">${c.value}</div>
        <div class="stat-card-change ${c.good === false ? 'negative' : 'positive'}"><span>${c.note}</span></div>
      </div>`).join('');
  }
  return { fuel, hazards, maintenance, routes, fmtTime, kpiCards, DIESEL_PRICE };
})();
