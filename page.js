"use client"
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

// Dynamically import leaflet components (avoid SSR errors)
const Map = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

export default function Home() {
  const [stations, setStations] = useState([]);
  const [waterLevels, setWaterLevels] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);

  useEffect(() => {
    fetch("/data/stations.json")
      .then(res => res.json())
      .then(data => setStations(data));

    fetch("/data/waterlevels.json")
      .then(res => res.json())
      .then(data => setWaterLevels(data));
  }, []);

  const stationData = selectedStation
    ? waterLevels.filter(d => d.station_id === selectedStation.id)
    : [];

  return (
    <div className="p-4 grid gap-6">
      <h1 className="text-2xl font-bold">Groundwater Monitoring Prototype</h1>

      {/* Map Section */}
      <div className="h-[400px] w-full border rounded-lg overflow-hidden">
        <Map center={[19.5, 75.5]} zoom={6} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {stations.map(st => (
            <Marker key={st.id} position={[st.lat, st.lon]}>
              <Popup>
                <div>
                  <b>{st.name}</b><br />
                  {st.district}, {st.state}<br />
                  <button
                    className="mt-2 px-2 py-1 bg-blue-600 text-white rounded"
                    onClick={() => setSelectedStation(st)}
                  >
                    View Data
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </Map>
      </div>

      {/* Chart Section */}
      {selectedStation && (
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">
            Water Level Trend - {selectedStation.name}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" hide={true} />
              <YAxis domain={[8, 16]} />
              <Tooltip />
              <Line type="monotone" dataKey="water_level_m" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>

          {/* Alerts */}
          {stationData.some(d => d.water_level_m < 10) && (
            <div className="mt-4 p-2 bg-red-100 text-red-600 rounded">
              ⚠️ Alert: Water level has dropped below 10m at this station.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
