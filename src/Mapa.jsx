import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
import { useState, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// ✅ Corrige marcador roto de Leaflet en Vite/React
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function CambiarVista({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 16);
    }
  }, [position, map]);

  return null;
}

function SeguirRepartidor({ repartidor, activo }) {
  const map = useMap();

  useEffect(() => {
    if (activo && repartidor?.lat && repartidor?.lng) {
      map.setView([repartidor.lat, repartidor.lng], 17);
    }
  }, [activo, repartidor?.lat, repartidor?.lng, map]);

  return null;
}

export default function Mapa({ setCoords, repartidor }) {
  const [position, setPosition] = useState([16.75, -93.12]);
  const [marker, setMarker] = useState(null);
  const [seguirRepartidor, setSeguirRepartidor] = useState(false);

  const obtenerUbicacion = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta GPS");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const nuevaPos = [lat, lng];

        setPosition(nuevaPos);
        setMarker(nuevaPos);
        setCoords({ lat, lng });
      },
      (err) => {
        alert("No se pudo obtener ubicación");
        console.log(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const activarSeguimientoRepartidor = () => {
    if (!repartidor?.lat || !repartidor?.lng) {
      alert("Aún no hay ubicación del repartidor.");
      return;
    }

    setSeguirRepartidor((prev) => !prev);
  };

  return (
    <div style={{ marginBottom: "10px" }}>
      <button
        onClick={obtenerUbicacion}
        style={{
          marginBottom: "8px",
          padding: "10px",
          background: "#22c55e",
          color: "white",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
          width: "100%",
          fontWeight: "bold",
        }}
      >
        📍 Usar mi ubicación
      </button>

      <button
        onClick={activarSeguimientoRepartidor}
        style={{
          marginBottom: "8px",
          padding: "10px",
          background: seguirRepartidor ? "#ef4444" : "#2563eb",
          color: "white",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
          width: "100%",
          fontWeight: "bold",
        }}
      >
        {seguirRepartidor
          ? "🛑 Dejar de seguir repartidor"
          : "🛵 Seguir repartidor"}
      </button>

      {!repartidor && (
        <p
          style={{
            fontSize: "12px",
            color: "#666",
            textAlign: "center",
            marginBottom: "8px",
          }}
        >
          La ubicación del repartidor aparecerá cuando inicie su GPS.
        </p>
      )}

      <div style={{ height: "250px", width: "100%" }}>
        <MapContainer
          center={position}
          zoom={16}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* 👁️ CONTROL DE VISTA */}
          <CambiarVista position={position} />

          {/* 🛵 SEGUIR REPARTIDOR EN TIEMPO REAL */}
          <SeguirRepartidor
            repartidor={repartidor}
            activo={seguirRepartidor}
          />

          {/* 📍 TU UBICACIÓN */}
          {marker && (
            <Marker position={marker}>
              <Popup>📍 Tu ubicación actual</Popup>
            </Marker>
          )}

          {/* 🛵 REPARTIDOR EN VIVO */}
          {repartidor && (
            <Marker position={[repartidor.lat, repartidor.lng]}>
              <Popup>🛵 Repartidor en camino</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}