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

      socketRef.current.emit("repartidor-conectar");
    });

    // 📦 HISTORIAL INICIAL (CORREGIDO)
    socketRef.current.on("pedidos-iniciales", (data) => {
      console.log("📦 historial repartidor:", data);

      // 🔥 evita duplicados al reconectar
      setPedidos(() => [...data]);
    });

    // 📦 NUEVOS PEDIDOS (SIN DUPLICAR)
    socketRef.current.on("nuevo-pedido-repartidor", (nuevoPedido) => {
      setPedidos((prev) => {
        const existe = prev.find((p) => p.id === nuevoPedido.id);

        if (existe) {
          return prev.map((p) =>
            p.id === nuevoPedido.id ? nuevoPedido : p
          );
        }

        return [nuevoPedido, ...prev];
      });

      console.log("📦 nuevo pedido:", nuevoPedido);
    });

    // 🔄 ACTUALIZACIÓN DE PEDIDOS
    socketRef.current.on("pedido-actualizado", (pedidoActualizado) => {
      setPedidos((prev) =>
        prev.map((p) =>
          p.id === pedidoActualizado.id ? pedidoActualizado : p
        )
      );

      console.log("🔄 actualización:", pedidoActualizado);
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
  const abrirMapa = (p) => {
  const gps = p.ubicacionGPS || p.gps;

  if (gps) {
    const { lat, lng } = gps;
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  } else {
    alert("Este pedido no tiene ubicación GPS");
  }
};

  return (
  <div className="app-driver">
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
            opacity: p.estado === "cancelado" ? 0.5 : 1,
          }}
        >
          <p><b>👤 Cliente:</b> {p.nombre}</p>
          <p><b>🛒 Pedido:</b> {p.pedido}</p>
          <p><b>📍 Zona:</b> {p.zona}</p>
          <p><b>📦 Estado:</b> {p.estado}</p>
          <p><b>📍 Ubicación:</b> {p.ubicacion || "No proporcionada"}</p>
          <button onClick={() => abrirMapa(p)}>
  📍 Ver ubicación
</button>

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