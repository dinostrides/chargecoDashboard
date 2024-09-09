import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-cluster';

const markers = [
  { lat: 1.345, lng: 103.7, popup: "Marker 1" },
  { lat: 1.346, lng: 103.8, popup: "Marker 2" },
  { lat: 1.347, lng: 103.85, popup: "Marker 3" },
];

function ClusterMap({ data }) {
  return (
    <MapContainer center={[1.3521, 103.8198]} zoom={13} style={{ height: '500px', width: '100%' }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png"
      />
      <MarkerClusterGroup>
        {markers.map((marker, idx) => (
          <Marker key={idx} position={[marker.lat, marker.lng]}>
            <Popup>{"hi"}</Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}

export default ClusterMap;
