'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
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
          center={[19.8762, 75.3433]}
          zoom={6}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer 
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          />
          {stations.map(station => (
            <Marker
              key={station.id}
              position={[station.lat, station.lon]}  // Fixed: changed lng to lon
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
            <p>{selectedStation.district}, {selectedStation.state}</p>
            
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={getStationLevels(selectedStation.id)}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid stroke="#f5f5f5" />
                  <XAxis 
                    dataKey="timestamp" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis 
                    label={{ value: 'Water Level (m)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} m`, 'Water Level']}
                    labelFormatter={(value) => `Date: ${new Date(value).toLocaleString()}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="water_level_m"  // Fixed: changed water_level to water_level_m
                    stroke="#0077cc" 
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <p>
              ⚠️ Alerts:{' '}
              {getStationLevels(selectedStation.id).some(d => d.water_level_m < 11)
                ? 'Low Water Level Detected!'
                : 'Normal Water Levels'}
            </p>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <p>Click on a station marker to see water level data</p>
          </div>
        )}
      </div>
    </div>
  );
}
