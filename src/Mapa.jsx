import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
import { useState, useEffect } from "react";

function CambiarVista({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 16);
    }
  }, [position, map]);

  return null;
}

export default function Mapa({ setCoords, repartidor }) {
  const [position, setPosition] = useState([16.75, -93.12]);
  const [marker, setMarker] = useState(null);

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
        timeout: 10000,
        maximumAge: 0
      }
    );
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
          fontWeight: "bold"
        }}
      >
        📍 Usar mi ubicación
      </button>

      <div style={{ height: "250px", width: "100%" }}>
        <MapContainer
          center={position}
          zoom={16}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* 👁️ CONTROL DE VISTA */}
          <CambiarVista position={position} />

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