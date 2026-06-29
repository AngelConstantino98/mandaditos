import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import logo from "./assets/logo.png";
import Mapa from "./Mapa";

export default function App() {
  const socketRef = useRef(null);

  const [screen, setScreen] = useState("splash");

  const [nombre, setNombre] = useState("");
  const [pedido, setPedido] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [zona, setZona] = useState("");

  const [coords, setCoords] = useState(null);
  const [repartidor, setRepartidor] = useState(null);

  const [pedidoActual, setPedidoActual] = useState(null);
  const [pedidos, setPedidos] = useState([]);

  const [showCancel, setShowCancel] = useState(null);

  // 🔐 CLIENTE ID FIJO Y SEGURO
  const [clienteId] = useState(() => {
    let id = localStorage.getItem("clienteId");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("clienteId", id);
    }
    return id;
  });

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

  // SPLASH
  useEffect(() => {
    const timer = setTimeout(() => setScreen("home"), 2000);
    return () => clearTimeout(timer);
  }, []);

  // SOCKET
  useEffect(() => {
    socketRef.current = io("https://mandaditos-backend.onrender.com", {
      query: { clienteId }
    });

    socketRef.current.on("pedido-actualizado", (data) => {
      if (data.clienteId !== clienteId) return;

      setPedidoActual(data);

      setPedidos((prev) => {
        const existe = prev.find((p) => p.id === data.id);

        let updated;

        if (existe) {
          updated = prev.map((p) => (p.id === data.id ? data : p));
        } else {
          updated = [data, ...prev];
        }

        return updated.slice(0, 10);
      });

      localStorage.setItem("pedidoActual", JSON.stringify(data));
    });

    socketRef.current.on("repartidor-movimiento", setRepartidor);

    socketRef.current.on("pedidos-iniciales", (data) => {
      const filtrados = data.filter((p) => p.clienteId === clienteId);
      setPedidos(filtrados.slice(0, 10));
    });

    return () => socketRef.current?.disconnect();
  }, [clienteId]);

  // RECUPERAR PEDIDO
  useEffect(() => {
    const saved = localStorage.getItem("pedidoActual");
    if (!saved) return;

    const data = JSON.parse(saved);
    const ahora = Date.now();
    const creado = new Date(data.fecha).getTime();

    if ((ahora - creado) / (1000 * 60 * 60) < 24) {
      setPedidoActual(data);
    } else {
      localStorage.removeItem("pedidoActual");
    }
  }, []);

  // ENVIAR
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

    const pedidoData = {
      id: Date.now(),
      clienteId,
      nombre,
      pedido,
      ubicacion,
      zona,
      costo,
      gps: ubicacionGPS,
      estado: "pendiente",
      fecha: new Date().toISOString()
    };

    socketRef.current.emit("nuevo-pedido", pedidoData);

    setPedidoActual(pedidoData);
    localStorage.setItem("pedidoActual", JSON.stringify(pedidoData));

    const numero = "529621816603";

    const mensaje = `🏍️ NUEVO PEDIDO

👤 ${nombre}
🛒 ${pedido}
📍 ${ubicacion}
📌 Zona: ${zona}
💰 Costo envío: ${costo}
📍 GPS: ${ubicacionGPS}`;

    setTimeout(() => {
      window.open(
        `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`,
        "_blank"
      );
    }, 200);

    setNombre("");
    setPedido("");
    setUbicacion("");
    setZona("");
    setCoords(null);

    setScreen("home");
  };

  // CANCELAR
  const cancelarPedido = (id) => {
    const nuevos = pedidos.map((p) =>
      p.id === id ? { ...p, estado: "cancelado" } : p
    );

    setPedidos(nuevos.slice(0, 10));
    localStorage.setItem("pedidos", JSON.stringify(nuevos));

    socketRef.current.emit("cancelar-pedido", { id });

    setShowCancel(null);
  };

  return (
    <div className="app">

      {screen === "splash" && (
        <div className="splash">
          <div className="box">
            <img src={logo} style={{ width: "140px" }} />
            <h1>Mandaditos</h1>
            <p>Rápido, seguro y confiable</p>
          </div>
        </div>
      )}

      {screen === "home" && (
        <div className="card">

          <img src={logo} style={{ width: "90px" }} />
          <h1>🏍️ Mandaditos</h1>

          <div style={{ height: 250, overflow: "hidden", borderRadius: 10 }}>
            <Mapa setCoords={setCoords} repartidor={repartidor} />
          </div>

          {pedidoActual && (
            <div style={{ marginTop: 10, padding: 10, background: "#eee" }}>
              <p>👤 {pedidoActual.nombre}</p>
              <p>🛒 {pedidoActual.pedido}</p>
              <p>📦 {pedidoActual.estado}</p>
            </div>
          )}

          <div style={{ maxHeight: 220, overflowY: "auto", marginTop: 10 }}>
            {pedidos.map((p) => (
              <div key={p.id} style={{ marginBottom: 10 }}>
                <p>👤 {p.nombre}</p>
                <p>🛒 {p.pedido}</p>
                <p>📦 {p.estado}</p>

                {p.estado !== "cancelado" && (
                  <button onClick={() => setShowCancel(p.id)}>
                    Cancelar
                  </button>
                )}

                {showCancel === p.id && (
                  <div style={{ background: "#fff", padding: 10 }}>
                    <p>¿Cancelar pedido?</p>

                    <button onClick={() => cancelarPedido(p.id)}>
                      Sí
                    </button>

                    <button onClick={() => setShowCancel(null)}>
                      No
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button className="btn" onClick={() => setScreen("form")}>
            Hacer pedido
          </button>
        </div>
      )}

      {screen === "form" && (
        <div className="card">

          <h1>📦 Nuevo pedido</h1>

          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" />
          <input value={pedido} onChange={(e) => setPedido(e.target.value)} placeholder="Pedido" />
          <input value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Ubicación" />

          <select value={zona} onChange={(e) => setZona(e.target.value)}>
            <option value="">Selecciona zona</option>

            {Object.entries(zonas).map(([z, v]) => (
              <option key={z} value={z}>
                {z} (${v.min === v.max ? v.min : `${v.min}-${v.max}`})
              </option>
            ))}
          </select>

          <button className="btn" onClick={enviar}>
            Enviar pedido
          </button>

        </div>
      )}

    </div>
  );
}