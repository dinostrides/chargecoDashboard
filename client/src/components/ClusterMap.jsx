import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-cluster';

const markers = [
  { lat: 51.505, lng: -0.09, popup: "Marker 1" },
  { lat: 51.515, lng: -0.1, popup: "Marker 2" },
  { lat: 51.52, lng: -0.12, popup: "Marker 3" },
  // Add more markers as needed
];

function ClusterMap() {
  return (
    <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '500px', width: '100%' }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png"
      />
      <MarkerClusterGroup>
        {markers.map((marker, idx) => (
          <Marker key={idx} position={[marker.lat, marker.lng]}>
            <Popup>{marker.popup}</Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}

export default ClusterMap;
