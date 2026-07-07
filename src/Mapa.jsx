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
  const [avisoMapa, setAvisoMapa] = useState(null);

  const mostrarAvisoMapa = (
    titulo,
    mensaje,
    icono = "📍",
    colorFondoIcono = "#ecfdf5"
  ) => {
    setAvisoMapa({
      titulo,
      mensaje,
      icono,
      colorFondoIcono,
    });
  };

  const cerrarAvisoMapa = () => {
    setAvisoMapa(null);
  };

  const obtenerUbicacion = () => {
    if (!navigator.geolocation) {
      mostrarAvisoMapa(
        "GPS no disponible",
        "Tu navegador no soporta GPS. Escribe tu ubicación manualmente.",
        "📍"
      );
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
        mostrarAvisoMapa(
          "Ubicación no disponible",
          "No se pudo obtener tu ubicación. Revisa que el permiso de ubicación esté activado e intenta nuevamente.",
          "📍"
        );
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
      mostrarAvisoMapa(
        "Ubicación no disponible",
        "Aún no hay ubicación del repartidor. Intenta nuevamente cuando el repartidor inicie su GPS.",
        "🛵"
      );
      return;
    }

    setSeguirRepartidor((prev) => !prev);
  };

  return (
    <div style={{ marginBottom: "10px" }}>
      {avisoMapa && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 390,
              background: "white",
              borderRadius: 22,
              padding: 22,
              boxShadow: "0 20px 45px rgba(0,0,0,0.25)",
              border: "1px solid #e5e7eb",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: avisoMapa.colorFondoIcono || "#ecfdf5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
                fontSize: 32,
              }}
            >
              {avisoMapa.icono || "📍"}
            </div>

            <h2
              style={{
                fontSize: 22,
                marginBottom: 10,
                color: "#111827",
                lineHeight: 1.15,
              }}
            >
              {avisoMapa.titulo}
            </h2>

            <p
              style={{
                fontSize: 16,
                color: "#374151",
                whiteSpace: "pre-line",
                lineHeight: 1.45,
                marginBottom: 18,
              }}
            >
              {avisoMapa.mensaje}
            </p>

            <button
              type="button"
              className="btn"
              onClick={cerrarAvisoMapa}
              style={{
                background: "#16a34a",
                color: "white",
                marginTop: 0,
                width: "100%",
                borderRadius: 14,
                padding: 13,
                fontSize: 16,
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

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
