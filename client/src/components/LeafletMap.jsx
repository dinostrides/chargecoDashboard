import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Import the marker images using ES6 import
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix marker icon issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Function to generate random coordinates around Singapore
const getRandomCoordinates = () => {
  const lat = 1.3521 + (Math.random() - 0.5) * 0.1; // Roughly within 0.05 degrees latitude of Singapore
  const lng = 103.8198 + (Math.random() - 0.5) * 0.1; // Roughly within 0.05 degrees longitude of Singapore
  return [lat, lng];
};

// Generate 10 random markers
const markers = Array.from({ length: 10 }, () => getRandomCoordinates());

const LeafletMap = () => {
  return (
    <MapContainer center={[1.3521, 103.8198]} zoom={13} style={{ height: '100%', width: '100%', minHeight: '600px' }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png"
      />
      {markers.map((position, index) => (
        <Marker key={index} position={position}>
          <Popup>
            Marker {index + 1}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default LeafletMap;
