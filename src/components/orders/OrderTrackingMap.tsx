'use client';

import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapPin, Truck, AlertCircle, Sparkles } from 'lucide-react';

interface OrderTrackingMapProps {
  orderNumber: string;
  recipientCity: string;
  recipientState: string;
  orderStatus: string;
  partnerName?: string;
  vehicleType?: string;
  partnerLat?: number | null;
  partnerLng?: number | null;
}

export default function OrderTrackingMap({
  orderNumber,
  recipientCity,
  recipientState,
  orderStatus,
  partnerName,
  vehicleType,
  partnerLat,
  partnerLng,
}: OrderTrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;

      // Clean up previous map instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Default Coordinates: New Delhi Boutique Flagship
      const boutiqueCoords: [number, number] = [28.6010, 77.1950]; // Chanakyapuri Maison
      const destinationCoords: [number, number] = [28.6289, 77.2065]; // Customer destination in Delhi
      const courierCoords: [number, number] = [
        partnerLat || 28.6145,
        partnerLng || 28.2010 ? (partnerLng || 77.2010) : 77.2010,
      ];

      const map = L.map(mapContainerRef.current, {
        center: boutiqueCoords,
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      mapInstanceRef.current = map;

      // Tile Layer: OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Custom SVG Icons
      const boutiqueIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div style="background-color: #000; color: #fff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid #C5A059;">
            <span style="font-family: serif; font-size: 11px; font-weight: bold; letter-spacing: 1px;">HVN</span>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const destinationIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div style="background-color: #fff; color: #000; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid #000;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const courierIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div style="background-color: #C5A059; color: #fff; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(197,160,89,0.5); border: 2px solid #fff;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      // Add Boutique Flagship Marker
      L.marker(boutiqueCoords, { icon: boutiqueIcon })
        .addTo(map)
        .bindPopup('<strong>HEAVEN Maison Flagship</strong><br>Chanakyapuri Atelier &amp; Vaults');

      // Add Destination Marker
      L.marker(destinationCoords, { icon: destinationIcon })
        .addTo(map)
        .bindPopup(`<strong>Delivery Destination</strong><br>${recipientCity}, ${recipientState}`);

      // Add Courier Marker if Assigned or in transit
      if (partnerName || orderStatus === 'OUT_FOR_DELIVERY' || orderStatus === 'PICKED_UP') {
        L.marker(courierCoords, { icon: courierIcon })
          .addTo(map)
          .bindPopup(`<strong>White-Glove Courier:</strong> ${partnerName || 'Premier Dispatch'}<br>Vehicle: ${vehicleType || 'Climate-Controlled Van'}`);

        // Route Polyline
        const latlngs: [number, number][] = [boutiqueCoords, courierCoords, destinationCoords];
        L.polyline(latlngs, {
          color: '#000000',
          weight: 2.5,
          dashArray: '6, 8',
          opacity: 0.7,
        }).addTo(map);

        // Fit bounds around both markers
        const bounds = L.latLngBounds([boutiqueCoords, courierCoords, destinationCoords]);
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        const bounds = L.latLngBounds([boutiqueCoords, destinationCoords]);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [recipientCity, recipientState, orderStatus, partnerName, vehicleType, partnerLat, partnerLng]);

  return (
    <div className="space-y-4">
      {/* Honest Tracking Notice */}
      <div className="bg-neutral-50 border border-neutral-200 p-4 flex items-start gap-3 text-xs text-neutral-600">
        <Sparkles className="w-4 h-4 text-[#C5A059] flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-neutral-900 block uppercase tracking-wider text-[11px]">
            Demonstration Map Simulation Notice
          </span>
          <p className="leading-relaxed">
            This live map displays the route between the HEAVEN Chanakyapuri Atelier and your delivery destination in {recipientCity}. Live vehicle telemetry and driver location tracking will integrate in Module 5.
          </p>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[420px] bg-neutral-100 border border-neutral-300 overflow-hidden shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Courier Card */}
        {partnerName && (
          <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md border border-neutral-200 p-3.5 shadow-lg max-w-xs text-xs space-y-1">
            <div className="flex items-center gap-2 text-black font-semibold uppercase tracking-wider text-[11px]">
              <Truck className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Assigned White-Glove Courier</span>
            </div>
            <div className="text-neutral-900 font-medium">{partnerName}</div>
            <div className="text-[11px] text-neutral-500">
              {vehicleType || 'Executive Van'} &bull; Climate-Controlled
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
