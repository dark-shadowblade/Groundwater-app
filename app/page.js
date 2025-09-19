'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import L from 'leaflet';

// ✅ Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ✅ Dynamically load Leaflet components (fixes "window is not defined")
const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then(mod => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then(mod => mod.Popup),
  { ssr: false }
);

export default function Home() {
  const [stations, setStations] = useState([]);
  const [waterLevels, setWaterLevels] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);

  useEffect(() => {
    fetch('/data/stations.json')
      .then(res => res.json())
      .then(setStations);
    fetch('/data/waterlevels.json')
      .then(res => res.json())
      .then(setWaterLevels);
  }, []);

  const getStationLevels = (stationId) =>
    waterLevels.filter(w => w.station_id === stationId);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Left: Map */}
      <div style={{ flex: 1 }}>
        <MapContainer
          center={[25.5, 82]}
          zoom={6}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {stations.map(station => (
            <Marker
              key={station.id}
              position={[station.lat, station.lng]}
              eventHandlers={{ click: () => setSelectedStation(station) }}
            >
              <Popup>
                <b>{station.name}</b><br />
                {station.district}, {station.state}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Right: Graph */}
      <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
        {selectedStation ? (
          <>
            <h2>{selectedStation.name}</h2>
            <LineChart
              width={400}
              height={300}
              data={getStationLevels(selectedStation.id)}
            >
              <CartesianGrid stroke="#ccc" />
              <XAxis dataKey="timestamp" hide />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="water_level" stroke="#0077cc" />
            </LineChart>
            <p>
              ⚠️ Alerts:{' '}
              {getStationLevels(selectedStation.id).some(d => d.water_level < 10)
                ? 'Low Water Detected!'
                : 'Normal'}
            </p>
          </>
        ) : (
          <p>Click on a station marker to see details</p>
        )}
      </div>
    </div>
  );
}
