"use client";

import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation, Clock, User } from "lucide-react";
import ReactDOMServer from "react-dom/server";

// We need to render the Lucide icon to an HTML string for Leaflet's divIcon
const createCustomIcon = (imageUrl?: string) => {
  const iconHtml = ReactDOMServer.renderToString(
    <div className="relative group cursor-pointer">
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-[#e98016] overflow-hidden group-hover:scale-110 transition-transform">
        {imageUrl ? (
          <img src={imageUrl} alt="food" className="w-full h-full object-cover" />
        ) : (
          <MapPin size={24} className="text-[#e98016]" fill="#fad7b1" />
        )}
      </div>
      <div className="w-3 h-3 bg-[#e98016] rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 shadow-sm rounded-[2px]" />
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: "custom-leaflet-icon",
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48],
  });
};

const CurrentLocationMarker = ({ position }: { position: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 14, { animate: true, duration: 1.5 });
    }
  }, [map, position]);

  if (!position) return null;

  const currentIconHtml = ReactDOMServer.renderToString(
    <div className="relative">
      <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-xl animate-pulse" />
    </div>
  );

  const icon = L.divIcon({
    html: currentIconHtml,
    className: "current-location-icon",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  return <Marker position={position} icon={icon} />;
};

interface MapComponentProps {
  items: any[];
  userLocation: [number, number] | null;
  onLocationUpdate?: (lat: number, lng: number) => void;
  interactiveSelect?: boolean;
  selectedLocation?: [number, number] | null;
}

export default function MapComponent({ items, userLocation, onLocationUpdate, interactiveSelect, selectedLocation }: MapComponentProps) {
  // If no user location is available yet, default to a generic wide view (e.g., center of US or a specific known city)
  const defaultCenter: [number, number] = [37.7749, -122.4194]; // SF

  // Map events for picking a location
  const MapEvents = () => {
    useMapEvents({
      click(e: any) {
        if (interactiveSelect && onLocationUpdate) {
          onLocationUpdate(e.latlng.lat, e.latlng.lng);
        }
      },
    });
    return null;
  };
  
  // Need to dynamically import useMapEvents as it requires context
  const { useMapEvents } = require("react-leaflet");

  return (
    <div className="w-full h-full relative border border-gray-200 overflow-hidden rounded-[40px] shadow-sm z-0">
      <MapContainer
        style={{ height: "100%", width: "100%", position: "absolute", inset: 0, minHeight: "300px" }}
        center={userLocation || defaultCenter}
        zoom={userLocation ? 14 : 3}
        minZoom={2}
        maxBounds={[
          [-90, -180],
          [90, 180]
        ]}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          noWrap={true}
        />

        <MapEvents />

        <CurrentLocationMarker position={userLocation} />

        {interactiveSelect && selectedLocation && (
          <Marker position={selectedLocation} icon={createCustomIcon()} />
        )}

        {!interactiveSelect && items.map((item) => (
          <Marker 
            key={item.id} 
            position={[item.lat, item.lng]} 
            icon={createCustomIcon(item.imageUrl)}
          >
            <Popup className="foodprint-popup" closeButton={false}>
              <div className="p-1 w-[260px]">
                {item.imageUrl && (
                  <div className="w-full h-32 rounded-xl mb-3 overflow-hidden bg-gray-100">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <h3 className="text-xl font-bold text-bordeaux-800 mb-1 leading-tight">{item.title}</h3>
                <p className="text-sm font-medium text-gray-500 mb-4 line-clamp-2 leading-snug">{item.description}</p>
                
                <div className="flex items-center justify-between text-xs font-bold text-apricot-600 mb-2 bg-apricot-50 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-1">
                    <User size={12} /> {item.userName || "Neighbor"}
                  </div>
                  <div className="flex items-center gap-1 text-bordeaux-800">
                    {item.price || "Free"}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-4 px-1">
                  <div className="flex items-center gap-1">
                    <Clock size={12} /> 
                    {item.createdAt ? new Date(item.createdAt.toDate ? item.createdAt.toDate() : item.createdAt).toLocaleDateString() : "Just now"}
                  </div>
                </div>

                <button className="w-full py-3 bg-bordeaux-800 hover:bg-[#cf3053] text-white rounded-xl font-bold tracking-widest uppercase text-xs transition-colors">
                  Request Item
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Global styles for the Leaflet popup to match our theme */}
      <style dangerouslySetInnerHTML={{__html: `
        .foodprint-popup .leaflet-popup-content-wrapper {
          border-radius: 20px;
          padding: 4px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          border: 1px solid #fce8d5;
        }
        .foodprint-popup .leaflet-popup-tip {
          background: white;
          border: 1px solid #fce8d5;
          margin-top: -1px;
        }
        .foodprint-popup .leaflet-popup-content {
          margin: 10px;
        }
        /* Hide default focus outlines on map */
        .leaflet-container {
          outline: none !important;
        }
      `}} />
    </div>
  );
}
