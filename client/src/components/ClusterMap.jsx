import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';

// Fixing the default icon issue in Leaflet
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerIconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIconRetinaUrl,
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
});

const ClusterMap = ({ data }) => {
  // Function to dynamically create custom icons based on utilization rate
  const createCustomIcon = (utilisationRate) => {
    return new L.DivIcon({
      className: 'leaflet-div-icon',
      html: `<div style="background-color: rgba(0, 128, 0, 0.6); color: white; text-align: center; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 12px;">${Math.round(utilisationRate)}%</div>`,
      iconSize: [30, 30],
    });
  };

  return (
    <MapContainer center={[1.3521, 103.8198]} zoom={13} style={{ height: '600px', width: '100%' }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png"
      />
      <MarkerClusterGroup>
        {data.map((item, idx) => (
          <Marker
            key={idx}
            position={[item.latitude, item.longitude]}
            icon={createCustomIcon(item.utilisation_rate)}
          >
            <Popup>
              <strong>Charger ID:</strong> {item.charger_id}<br />
              <strong>Utilisation Rate:</strong> {item.utilisation_rate}%
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
};

export default ClusterMap;
