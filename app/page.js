'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import dynamic from 'next/dynamic';

// Dynamically import the map component with no SSR
const WaterLevelMap = dynamic(
  () => import('./components/WaterLevelMap'),
  { 
    ssr: false,
    loading: () => (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        backgroundColor: '#f0f0f0'
      }}>
        <p>Loading map...</p>
      </div>
    )
  }
);

export default function Home() {
  const [stations, setStations] = useState([]);
  const [waterLevels, setWaterLevels] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    fetch('/data/stations.json')
      .then(res => res.json())
      .then(setStations);
    fetch('/data/waterlevels.json')
      .then(res => res.json())
      .then(setWaterLevels);
  }, []);

  const getStationLevels = (stationId) =>
    waterLevels.filter(w => w.station_id === stationId);

  // Format timestamp for display
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isClient) {
    return (
      <div style={{ display: 'flex', height: '100vh' }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <p>Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Left: Map */}
      <div style={{ flex: 1 }}>
        <WaterLevelMap 
          stations={stations} 
          onStationSelect={setSelectedStation} 
        />
      </div>

      {/* Right: Graph */}
      <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
        {selectedStation ? (
          <>
            <h2>{selectedStation.name}</h2>
            <p>{selectedStation.district}, {selectedStation.state}</p>
            
            <div style={{ width: '100%', height: 300, marginTop: 20 }}>
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
                    labelFormatter={(value) => `Date: ${formatDate(value)}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="water_level_m"
                    stroke="#0077cc" 
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{ marginTop: 20 }}>
              <h3>Latest Readings</h3>
              {getStationLevels(selectedStation.id)
                .slice(-5)
                .reverse()
                .map((reading, index) => (
                  <div key={index} style={{ 
                    padding: '8px', 
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span>{formatDate(reading.timestamp)}</span>
                    <span style={{ fontWeight: 'bold' }}>{reading.water_level_m}m</span>
                  </div>
                ))}
            </div>
            
            <p style={{ 
              marginTop: 20, 
              padding: '10px', 
              backgroundColor: getStationLevels(selectedStation.id).some(d => d.water_level_m < 11) ? '#fff3cd' : '#d4edda',
              border: getStationLevels(selectedStation.id).some(d => d.water_level_m < 11) ? '1px solid #ffeaa7' : '1px solid #c3e6cb',
              borderRadius: '4px'
            }}>
              ⚠️ Status:{' '}
              {getStationLevels(selectedStation.id).some(d => d.water_level_m < 11)
                ? 'Low Water Level Alert!'
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
