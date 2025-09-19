
'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function WaterLevelMap({ stations, onStationSelect }) {
  return (
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
          position={[station.lat, station.lon]}
          eventHandlers={{ click: () => onStationSelect(station) }}
        >
          <Popup>
            <b>{station.name}</b><br />
            {station.district}, {station.state}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
