import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MapComponent = ({ location, setLocation}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null); // Store the map instance
  const [originalView, setOriginalView] = useState(null);
  const markerRef = useRef(null); // Add this at the top, next to mapRef

  useEffect(() => {
    if (
      mapContainerRef.current &&
      !mapRef.current &&
      location &&
      typeof location.lat === "number" &&
      typeof location.lon === "number"
    ) {
      const map = L.map(mapContainerRef.current, {
        center: [location.lat, location.lon],
        zoom: 19,
        maxZoom: 19,
        minZoom: 3,
        dragging: true,
        scrollWheelZoom: true,
        touchZoom: true,
        doubleClickZoom: true,
      });
  
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);
  
      const customIcon = L.icon({
        iconUrl: "/svgs/marker.svg",
        iconSize: [50, 50],
        iconAnchor: [25, 50],
        popupAnchor: [0, -32],
      });
  
      const marker = L.marker([location.lat, location.lon], { icon: customIcon }).addTo(map);
      markerRef.current = marker; // Save marker to ref
  
      setOriginalView({ lat: location.lat, lon: location.lon, zoom: 19 });
      mapRef.current = map;
  
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        setLocation({ lat, lon: lng });
        marker.setLatLng([lat, lng]);
      });
  
      return () => {
        map.remove();
        mapRef.current = null;
        markerRef.current = null;
      };
    }
  }, [location]);
  
  const handleResetView = () => {
    if (mapRef.current && originalView) {
      mapRef.current.flyTo([originalView.lat, originalView.lon], originalView.zoom, {
        animate: true,
        duration: 1.2,
      });
  
      setLocation({ lat: originalView.lat, lon: originalView.lon });
  
      // Update marker position
      if (markerRef.current) {
        markerRef.current.setLatLng([originalView.lat, originalView.lon]);
      }
    }
  };

  return (
    <div>
      <div
        ref={mapContainerRef}
        className="map"
      />
      <button
        onClick={handleResetView}
        className="small-button"
        style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          zIndex: 50,
        }}
      >
        Reset View
      </button>
    </div>
  );
};

export default MapComponent;
