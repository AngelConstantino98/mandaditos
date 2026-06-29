import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function Repartidor() {
  const socketRef = useRef(null);
  const watchId = useRef(null);

  const [activo, setActivo] = useState(false);
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    socketRef.current = io("https://mandaditos-backend.onrender.com");

    socketRef.current.on("connect", () => {
      console.log("🟢 Repartidor conectado:", socketRef.current.id);
    });

    // 📦 historial inicial
    socketRef.current.on("pedidos-iniciales", (data) => {
      setPedidos(data);
    });

    // 🔄 actualización GLOBAL (IMPORTANTE)
    socketRef.current.on("pedido-actualizado", (pedidoActualizado) => {
      setPedidos((prev) => {
        const existe = prev.find((p) => p.id === pedidoActualizado.id);

        if (existe) {
          return prev.map((p) =>
            p.id === pedidoActualizado.id ? pedidoActualizado : p
          );
        }

        return [...prev, pedidoActualizado];
      });
    });

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
      socketRef.current.disconnect();
    };
  }, []);

  // 🟢 GPS
  const iniciarGPS = () => {
    if (!navigator.geolocation) {
      alert("Tu dispositivo no soporta GPS");
      return;
    }

    setActivo(true);

    watchId.current = navigator.geolocation.watchPosition((pos) => {
      const data = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };

      socketRef.current.emit("repartidor-ubicacion", data);
    });
  };

  const detenerGPS = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
    }
    setActivo(false);
  };

  // 📦 cambiar estado
  const cambiarEstado = (pedido, estado) => {
    socketRef.current.emit("cambiar-estado", {
      ...pedido,
      estado,
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🏍️ Panel Repartidor</h1>

      {!activo ? (
        <button onClick={iniciarGPS}>▶️ Iniciar GPS</button>
      ) : (
        <button onClick={detenerGPS}>⏹️ Detener GPS</button>
      )}

      <hr />

      <h2>📦 Pedidos</h2>

      {pedidos.length === 0 && <p>No hay pedidos</p>}

      {pedidos.map((p) => (
        <div
          key={p.id}
          style={{
            border: "1px solid #ccc",
            padding: 10,
            marginBottom: 10,
            borderRadius: 10,
            opacity: p.estado === "cancelado" ? 0.5 : 1
          }}
        >
          <p><b>👤 Cliente:</b> {p.nombre}</p>
          <p><b>🛒 Pedido:</b> {p.pedido}</p>
          <p><b>📍 Zona:</b> {p.zona}</p>
          <p><b>📦 Estado:</b> {p.estado}</p>

          {/* ❌ si está cancelado no permitir acciones */}
          {p.estado !== "cancelado" && (
            <>
              <button onClick={() => cambiarEstado(p, "aceptado")}>
                ✔ Aceptar
              </button>

              <button onClick={() => cambiarEstado(p, "en camino")}>
                🚀 En camino
              </button>

              <button onClick={() => cambiarEstado(p, "entregado")}>
                ✅ Entregado
              </button>
            </>
          )}

          {p.estado === "cancelado" && (
            <p style={{ color: "red" }}>❌ Pedido cancelado por cliente</p>
          )}
        </div>
      ))}
    </div>
  );
}