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

// LeafletMap component
const LeafletMap = ({ lat = [], lon = [], color = [] }) => {

  // Ensure lat, lon, and color are valid arrays and have the same length
  if (!Array.isArray(lat) || !Array.isArray(lon) || !Array.isArray(color) ||
      lat.length !== lon.length || lat.length !== color.length) {
    console.error('Invalid data provided for lat, lon, or color.');
    return null;
  }

  const markers = lat.map((latitude, index) => ({
    position: [latitude, lon[index]],
    color: color[index],
  }));

  return (
    <MapContainer center={[1.3521, 103.8198]} zoom={13} style={{ height: '100%', width: '100%', minHeight: '600px' }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png"
      />
      {markers.map((marker, index) => (
        <Marker
          key={index}
          position={marker.position}
          icon={L.divIcon({
            className: 'custom-icon',
            html: `<div style="background-color: ${marker.color}; width: 20px; height: 20px; border-radius: 50%;"></div>`,
            iconSize: [20, 20],
          })}
        >
          {/* <Popup>
            Marker {index + 1}
          </Popup> */}
        </Marker>
      ))}
    </MapContainer>
  );
};

export default LeafletMap;
