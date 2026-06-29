import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import logo from "./assets/logo.png";
import Mapa from "./Mapa";

export default function Cliente() {
  const socketRef = useRef(null);

  const [nombre, setNombre] = useState("");
  const [pedido, setPedido] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [zona, setZona] = useState("");

  const [coords, setCoords] = useState(null);
  const [repartidor, setRepartidor] = useState(null);
  const [pedidoActual, setPedidoActual] = useState(null);

  const zonas = {
    "Tuxtla Chico": { min: 20, max: 20 },
    "Margaritas": { min: 25, max: 50 },
    "La Toma": { min: 25, max: 50 },
    "Guillén": { min: 25, max: 50 },
    "Camino de la Tierra": { min: 25, max: 50 },
    "Monte Grande": { min: 25, max: 50 },
    "Sección El 12": { min: 25, max: 50 },
    "El Aguacate": { min: 25, max: 50 },
    "Calle Calance": { min: 25, max: 50 }
  };

  // 🔌 SOCKET ULTRA ESTABLE (ESTO ES LO CLAVE)
  useEffect(() => {
    console.log("🔄 Iniciando socket...");

    const socket = io("https://mandaditos-backend.onrender.com", {
      transports: ["polling"], // 🔥 IMPORTANTE: evita fallos en Render/Vercel
      forceNew: true,
      reconnection: true,
      timeout: 20000
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🟢 Cliente conectado:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.log("🔴 Error conexión:", err.message);
    });

    socket.on("pedido-actualizado", (pedido) => {
      console.log("📦 Pedido recibido:", pedido);
      setPedidoActual({ ...pedido });
    });

    socket.on("repartidor-movimiento", (data) => {
      setRepartidor(data);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Cliente desconectado");
    });

    return () => socket.disconnect();
  }, []);

  // 🚀 ENVIAR PEDIDO
  const enviar = () => {
    if (!nombre || !pedido || !ubicacion || !zona) {
      alert("Completa todos los campos");
      return;
    }

    const info = zonas[zona];

    const costo =
      info.min === info.max
        ? `$${info.min}`
        : `$${info.min} - $${info.max}`;

    const ubicacionGPS = coords
      ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
      : "No compartida";

    const nuevoPedido = {
      id: Date.now(),
      nombre,
      pedido,
      ubicacion,
      zona,
      costo,
      gps: ubicacionGPS,
      estado: "pendiente",
      fecha: new Date()
    };

    // 🟢 mostrar instantáneo
    setPedidoActual(nuevoPedido);

    // 📡 enviar al backend
    socketRef.current?.emit("nuevo-pedido", nuevoPedido);

    console.log("📤 Pedido enviado:", nuevoPedido);

    // 📲 WhatsApp
    const mensaje = `🏍️ NUEVO PEDIDO

👤 ${nombre}
🛒 ${pedido}
📍 ${ubicacion}
📌 Zona: ${zona}
💰 Costo envío: ${costo}
📍 GPS: ${ubicacionGPS}`;

    window.open(
      `https://wa.me/529621816603?text=${encodeURIComponent(mensaje)}`,
      "_blank"
    );

    // limpiar
    setNombre("");
    setPedido("");
    setUbicacion("");
    setZona("");
    setCoords(null);
  };

  return (
    <div className="app">
      <div className="card">

        <img src={logo} style={{ width: "90px" }} />
        <h1>🏍️ Mandaditos</h1>

        <Mapa setCoords={setCoords} repartidor={repartidor} />

        {/* 📦 ESTADO DEL PEDIDO */}
        {pedidoActual && pedidoActual.id && (
          <div style={{ marginTop: 15, padding: 10, border: "1px solid #ccc" }}>
            <h3>📦 Tu pedido</h3>

            <p><b>Pedido:</b> {pedidoActual.pedido}</p>
            <p><b>Estado:</b> {pedidoActual.estado}</p>

            {pedidoActual.estado === "pendiente" && <p>🟡 Esperando repartidor...</p>}
            {pedidoActual.estado === "aceptado" && <p>🟢 Repartidor asignado</p>}
            {pedidoActual.estado === "en camino" && <p>🚀 En camino</p>}
            {pedidoActual.estado === "entregado" && <p>✅ Entregado</p>}
          </div>
        )}

        <button className="btn" onClick={enviar}>
          🚀 Enviar pedido
        </button>

      </div>
    </div>
  );
}