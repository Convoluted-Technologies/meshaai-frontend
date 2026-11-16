'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default marker icon in Webpack / Next.js
const customMarkerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface LeafletMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onConfirm?: (coords: { lat: number; lng: number; address: string }) => void;
  onLocationSelected?: (lat: number, lng: number, address: string) => void;
  onCancel?: () => void;
}

// Subcomponent to handle map click events
function MapEvents({ onLocationClick }: { onLocationClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: any) {
      onLocationClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Subcomponent to smoothly pan map when district buttons are tapped
function ChangeMapView({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(coords, 15, { duration: 1 });
  }, [coords, map]);
  return null;
}

const ABUJA_DISTRICTS = [
  { name: 'Wuse 2', lat: 9.0778, lng: 7.4819 },
  { name: 'Maitama', lat: 9.0882, lng: 7.4934 },
  { name: 'Garki', lat: 9.0326, lng: 7.4883 },
  { name: 'Jabi', lat: 9.0722, lng: 7.4265 },
  { name: 'Asokoro', lat: 9.0435, lng: 7.5312 },
];

export default function LeafletMapPicker({
  initialLat = 9.0765,
  initialLng = 7.3986,
  onConfirm,
  onLocationSelected,
  onCancel,
}: LeafletMapPickerProps) {
  const [position, setPosition] = useState<[number, number]>([
    initialLat || 9.0765,
    initialLng || 7.3986,
  ]);
  const [address, setAddress] = useState<string>('Detecting address...');
  const [loadingAddress, setLoadingAddress] = useState<boolean>(false);

  // Reverse geocode via free OpenStreetMap Nominatim API
  async function reverseGeocode(lat: number, lng: number) {
    setLoadingAddress(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          // Format friendly address from components
          const a = data.address || {};
          const road = a.road || a.pedestrian || a.suburb || '';
          const neighbourhood = a.neighbourhood || a.suburb || a.city_district || '';
          const city = a.city || a.town || 'Abuja';
          const clean = [road, neighbourhood, city].filter(Boolean).join(', ');
          setAddress(clean || data.display_name);
        } else {
          setAddress(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        }
      } else {
        setAddress(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }
    } catch {
      setAddress(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    } finally {
      setLoadingAddress(false);
    }
  }

  // Initial geocode
  useEffect(() => {
    reverseGeocode(position[0], position[1]);
  }, []);

  function handleMapClick(lat: number, lng: number) {
    setPosition([lat, lng]);
    reverseGeocode(lat, lng);
  }

  function handleQuickDistrict(lat: number, lng: number) {
    setPosition([lat, lng]);
    reverseGeocode(lat, lng);
  }

  return (
    <div className="rounded-3xl border-2 border-red-200 bg-white overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
            <span>🗺️</span> Pick Delivery Spot on Map
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click anywhere on the map to drop your delivery pin.
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center text-sm transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Quick Jump Districts */}
      <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
          Quick Jump:
        </span>
        {ABUJA_DISTRICTS.map((d) => (
          <button
            key={d.name}
            type="button"
            onClick={() => handleQuickDistrict(d.lat, d.lng)}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-red-400 hover:text-red-600 font-semibold text-slate-700 shrink-0 transition-colors shadow-2xs"
          >
            {d.name}
          </button>
        ))}
      </div>

      {/* Interactive Leaflet Map */}
      <div className="relative w-full h-72 sm:h-80 z-0">
        <MapContainer
          center={position}
          zoom={14}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} icon={customMarkerIcon} />
          <MapEvents onLocationClick={handleMapClick} />
          <ChangeMapView coords={position} />
        </MapContainer>
      </div>

      {/* Selected Location Info & Confirm Button */}
      <div className="p-4 bg-white border-t border-slate-100 space-y-3">
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Selected Address
          </p>
          <p className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 line-clamp-2">
            {loadingAddress ? '📍 Pinpointing address...' : address}
          </p>
          <p className="text-[10px] text-slate-400 font-mono mt-1">
            Coordinates: {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </p>
        </div>

        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-1/3 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (onConfirm) onConfirm({ lat: position[0], lng: position[1], address });
              if (onLocationSelected) onLocationSelected(position[0], position[1], address);
            }}
            disabled={loadingAddress}
            className={`${onCancel ? 'w-2/3' : 'w-full'} py-3 rounded-xl bg-[#e31b23] hover:bg-[#c9151c] disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all`}
          >
            ✓ Confirm This Location
          </button>
        </div>
      </div>
    </div>
  );
}
