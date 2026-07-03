import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
import { useState, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ✅ Marcador personalizado para cliente, sin usar imágenes de Leaflet
const clienteIcon = L.divIcon({
  className: "custom-marker-cliente",
  html: `
    <div style="
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #22c55e;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    ">
      📍
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
});

// ✅ Marcador personalizado para repartidor, sin usar imágenes de Leaflet
const repartidorIcon = L.divIcon({
  className: "custom-marker-repartidor",
  html: `
    <div style="
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #2563eb;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    ">
      🛵
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
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

          <CambiarVista position={position} />

          <SeguirRepartidor
            repartidor={repartidor}
            activo={seguirRepartidor}
          />

          {marker && (
            <Marker position={marker} icon={clienteIcon}>
              <Popup>📍 Tu ubicación actual</Popup>
            </Marker>
          )}

          {repartidor && (
            <Marker
              position={[repartidor.lat, repartidor.lng]}
              icon={repartidorIcon}
            >
              <Popup>🛵 Repartidor en camino</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}