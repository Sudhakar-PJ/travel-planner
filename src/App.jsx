import React, { useState, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";



// --- EMOJI ICONS ---
const iconHotel = L.divIcon({
  html: "🏨",
  className: "emoji-marker hotel",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const iconRestaurant = L.divIcon({
  html: "🍽️",
  className: "emoji-marker restaurant",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const iconLandmark = L.divIcon({
  html: "🏛️",
  className: "emoji-marker landmark",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const GEOAPIFY_API_KEY = "992a4d3be8344087bb31ee899442f0b6";

// --- GEOAPIFY SEARCH COMPONENT ---
const GeoSearch = ({ setPlaces, setLoading, filters }) => {
  const timeoutRef = useRef(null);

  const map = useMapEvents({
    moveend: async () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(async () => {
        try {
          setLoading(true);
          const center = map.getCenter();
          const lat = center.lat;
          const lon = center.lng;
          const radius = map.getBounds().getNorthEast().distanceTo(map.getBounds().getSouthWest()) / 2;

          const categories = [];
          if (filters.hotels) categories.push("accommodation.hotel");
          if (filters.restaurants) categories.push("catering.restaurant");
          if (filters.landmarks) categories.push("tourism.attraction");

          if (categories.length === 0) {
            setPlaces([]);
            setLoading(false);
            return;
          }

          const url = `https://api.geoapify.com/v2/places?categories=${categories.join(",")}&filter=circle:${lon},${lat},${radius}&bias=proximity:${lon},${lat}&limit=50&apiKey=${GEOAPIFY_API_KEY}`;

          const res = await fetch(url);
          if (!res.ok) throw new Error(`API Error: ${res.statusText}`);

          const data = await res.json();
          setPlaces(data.features || []);
        } catch (error) {
          console.error("Error fetching places:", error);
          setPlaces([]);
        } finally {
          setLoading(false);
        }
      }, 500);
    },
  });

  return null;
};



const App = () => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    hotels: true,
    restaurants: true,
    landmarks: true,
  });

  const iconMap = useMemo(
    () => ({
      accommodation: iconHotel,
      restaurant: iconRestaurant,
      default: iconLandmark,
    }),
    []
  );

  const getIcon = (categories) => {
    const cat = categories.join(",");
    if (cat.includes("accommodation")) return iconMap.accommodation;
    if (cat.includes("restaurant")) return iconMap.restaurant;
    return iconMap.default;
  };

  const toggleFilter = (filterName) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
  };

  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      <style>{`
        .emoji-marker {
          font-size: 24px;
          text-align: center;
          line-height: 30px;
        }
        .emoji-marker.hotel {
          filter: drop-shadow(0 0 2px #ff4b4b);
        }
        .emoji-marker.restaurant {
          filter: drop-shadow(0 0 2px #ffa500);
        }
        .emoji-marker.landmark {
          filter: drop-shadow(0 0 2px #4488ff);
        }
        .control-panel {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 1000;
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          min-width: 200px;
        }
        .control-panel h3 {
          margin: 0 0 10px 0;
          font-size: 16px;
          font-weight: 600;
        }
        .filter-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 8px 0;
          cursor: pointer;
          user-select: none;
        }
        .filter-item input[type="checkbox"] {
          cursor: pointer;
          width: 18px;
          height: 18px;
        }
        .filter-item label {
          cursor: pointer;
          font-size: 14px;
        }
        .loading-indicator {
          position: absolute;
          top: 70px;
          right: 10px;
          z-index: 1000;
          background: #2196F3;
          color: white;
          padding: 8px 15px;
          border-radius: 4px;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .stats {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #e0e0e0;
          font-size: 13px;
          color: #666;
        }
        .leaflet-popup-content {
          margin: 10px;
        }
        .leaflet-popup-content b {
          font-size: 14px;
          color: #333;
        }
      `}</style>

      <div className="control-panel">
        <h3>Filter Places</h3>
        <div className="filter-item" onClick={() => toggleFilter("hotels")}>
          <input
            type="checkbox"
            checked={filters.hotels}
            onChange={() => toggleFilter("hotels")}
          />
          <label>🏨 Hotels</label>
        </div>
        <div className="filter-item" onClick={() => toggleFilter("restaurants")}>
          <input
            type="checkbox"
            checked={filters.restaurants}
            onChange={() => toggleFilter("restaurants")}
          />
          <label>🍽️ Restaurants</label>
        </div>
        <div className="filter-item" onClick={() => toggleFilter("landmarks")}>
          <input
            type="checkbox"
            checked={filters.landmarks}
            onChange={() => toggleFilter("landmarks")}
          />
          <label>🏛️ Landmarks</label>
        </div>
        <div className="stats">
          Showing {places.length} place{places.length !== 1 ? "s" : ""}
        </div>
      </div>

      {loading && (
        <div className="loading-indicator">Loading places...</div>
      )}

      <MapContainer
        center={[12.9716, 77.5946]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <GeoSearch setPlaces={setPlaces} setLoading={setLoading} filters={filters} />
        {places.map((p) => (
          <Marker
            key={p.properties.place_id}
            position={[p.properties.lat, p.properties.lon]}
            icon={getIcon(p.properties.categories)}
          >
            <Popup>
              <div>
                <b>{p.properties.name || "Unnamed Place"}</b>
                <br />
                <span style={{ fontSize: "12px", color: "#666" }}>
                  {p.properties.categories[0]?.replace(/\./g, " › ")}
                </span>
                {p.properties.formatted && (
                  <div style={{ marginTop: "5px", fontSize: "11px", color: "#999" }}>
                    📍 {p.properties.formatted}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default App;
