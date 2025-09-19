'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

export default function StationDetail() {
  const params = useParams();
  const router = useRouter();
  const [station, setStation] = useState(null);
  const [waterLevels, setWaterLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stations data
        const stationsRes = await fetch('/data/stations.json');
        const stationsData = await stationsRes.json();
        const currentStation = stationsData.find(s => s.id === params.id);
        
        if (!currentStation) {
          router.push('/dashboard');
          return;
        }
        
        setStation(currentStation);

        // Fetch water levels data
        const levelsRes = await fetch('/data/waterlevels.json');
        const levelsData = await levelsRes.json();
        const stationLevels = levelsData
          .filter(w => w.station_id === params.id)
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        setWaterLevels(stationLevels);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  const getStatusColor = (level) => {
    if (level < 11) return '#ff4757';
    if (level < 12) return '#ffa502';
    return '#2ed573';
  };

  const getStatusText = (level) => {
    if (level < 11) return 'Critical';
    if (level < 12) return 'Warning';
    return 'Normal';
  };

  if (loading) {
    return (
      <div className="station-detail-container">
        <div style={{ textAlign: 'center' }}>Loading station data...</div>
      </div>
    );
  }

  if (!station) {
    return (
      <div className="station-detail-container">
        <div style={{ textAlign: 'center' }}>Station not found</div>
        <Link href="/dashboard" className="back-link">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const latestReading = waterLevels.length > 0 
    ? waterLevels[waterLevels.length - 1] 
    : null;

  return (
    <div className="station-detail-container">
      {/* Header */}
      <div className="station-header">
        <Link href="/dashboard" className="back-link">
          ← Back to Dashboard
        </Link>
        <h1>{station.name}</h1>
        <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
          {station.district}, {station.state} • Lat: {station.lat}, Lon: {station.lon}
        </p>
        
        {latestReading && (
          <div className="station-status">
            <div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Current Water Level</div>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold',
                color: getStatusColor(latestReading.water_level_m)
              }}>
                {latestReading.water_level_m}m
              </div>
            </div>
            <div className={`status-badge ${
              getStatusText(latestReading.water_level_m) === 'Critical' ? 'status-critical' :
              getStatusText(latestReading.water_level_m) === 'Warning' ? 'status-warning' :
              'status-normal'
            }`}>
              {getStatusText(latestReading.water_level_m)}
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Last Updated</div>
              <div style={{ fontSize: '0.9rem', color: '#333' }}>
                {new Date(latestReading.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Water Level Chart */}
      <div style={{ marginBottom: '2rem' }}>
        <h2>Water Level Trends</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={waterLevels}>
              <CartesianGrid stroke="#f5f5f5" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
                fontSize={12}
              />
              <YAxis 
                label={{ value: 'Water Level (m)', angle: -90, position: 'insideLeft' }}
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
              />
              <Tooltip 
                formatter={(value) => [`${value}m`, 'Water Level']}
                labelFormatter={(value) => new Date(value).toLocaleString()}
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
      </div>

      {/* Recent Readings Table */}
      <div>
        <h2>Recent Readings</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Water Level (m)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {waterLevels.slice(-10).reverse().map((reading, index) => (
              <tr key={index}>
                <td>{new Date(reading.timestamp).toLocaleString()}</td>
                <td style={{ fontWeight: 'bold' }}>{reading.water_level_m}m</td>
                <td>
                  <span className={`status-badge ${
                    getStatusText(reading.water_level_m) === 'Critical' ? 'status-critical' :
                    getStatusText(reading.water_level_m) === 'Warning' ? 'status-warning' :
                    'status-normal'
                  }`} style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>
                    {getStatusText(reading.water_level_m)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
