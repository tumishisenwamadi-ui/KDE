const TrackingMap = (() => {
  let map;
  const markers = {};   // one marker per tracked item, keyed by ID
  const trails = {};    // one trail line per tracked item

  function init(containerId, center = [-25.7479, 28.2293], zoom = 13) {
    map = L.map(containerId).setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Keep the map correct when its card resizes (sidebar toggle, window resize)
    new ResizeObserver(() => map.invalidateSize())
      .observe(document.getElementById(containerId));
  }

  // Call for every position update, for any vehicle/device/person
  function update(id, lat, lng, label = id) {
    const pos = [lat, lng];
    if (!markers[id]) {
      markers[id] = L.marker(pos).addTo(map).bindPopup(label);
      trails[id] = L.polyline([pos], { color: '#d1495b', weight: 3 }).addTo(map);
      map.setView(pos, map.getZoom());
    } else {
      markers[id].setLatLng(pos);
      trails[id].addLatLng(pos);
    }
  }

  function remove(id) {
    if (markers[id]) { map.removeLayer(markers[id]); delete markers[id]; }
    if (trails[id])  { map.removeLayer(trails[id]);  delete trails[id]; }
  }

  // Zoom to show everything being tracked
  function fitAll() {
    const pts = Object.values(markers).map(m => m.getLatLng());
    if (pts.length) map.fitBounds(L.latLngBounds(pts), { padding: [40, 40] });
  }

  // Refresh size after the map's tab becomes visible
  function invalidate() { if (map) map.invalidateSize(); }

  return { init, update, remove, fitAll, invalidate };
})();