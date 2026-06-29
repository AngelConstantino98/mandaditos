import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function Admin() {
  const socketRef = useRef(null);
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    socketRef.current = io("https://mandaditos-backend.onrender.com");

    socketRef.current.on("connect", () => {
      console.log("🟢 Admin conectado");
    });

    // 📦 recibir pedidos nuevos
    socketRef.current.on("pedido-actualizado", (pedido) => {
      setPedidos((prev) => [pedido, ...prev]);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>📦 Panel de Administración</h1>

      {pedidos.length === 0 ? (
        <p>⚠️ No hay pedidos todavía</p>
      ) : (
        pedidos.map((pedido, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: 15,
              marginBottom: 15,
              background: "#f9f9f9"
            }}
          >
            <h3>👤 {pedido.nombre}</h3>

            <p><b>🛒 Pedido:</b> {pedido.pedido}</p>
            <p><b>📍 Dirección:</b> {pedido.ubicacion}</p>
            <p><b>📌 Zona:</b> {pedido.zona}</p>
            <p><b>💰 Costo:</b> {pedido.costo}</p>

            <a
              href={pedido.gps}
              target="_blank"
              rel="noreferrer"
            >
              📍 Ver ubicación en Google Maps
            </a>
          </div>
        ))
      )}
    </div>
  );
}