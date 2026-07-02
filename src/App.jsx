import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import logo from "./assets/logo.png";
import Mapa from "./Mapa";
import "./App.css";

const SOCKET_URL = "https://mandaditos-backend.onrender.com";
// Para producción después usaremos:
// const SOCKET_URL = "https://mandaditos-backend.onrender.com";

const MENSAJE_GANADOR = `🎉 ¡Felicidades!

Tu pedido será totalmente GRATIS.
El repartidor ya fue notificado.`;

const MENSAJE_PERDEDOR = `😔 Esta vez no ganaste

Gracias por participar.
¡Te deseamos suerte en tu próximo pedido!`;

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

  // 🍀 Estados de promoción
  const [sorteando, setSorteando] = useState(false);
  const [resultadoPromo, setResultadoPromo] = useState(null);

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
    "Tuxtla Chico": { min: 20, max: 60 },
    "Margaritas": { min: 25, max: 60 },
    "La Toma": { min: 25, max: 60 },
    "Guillén": { min: 25, max: 60 },
    "Camino de la Tierra": { min: 25, max: 60 },
    "Monte Grande": { min: 25, max: 60 },
    "Sección El 12": { min: 25, max: 60 },
    "El Aguacate": { min: 25, max: 60 },
    "Otro": { min: 25, max: 0 }
  };

  // SPLASH
  useEffect(() => {
    const timer = setTimeout(() => setScreen("home"), 2000);
    return () => clearTimeout(timer);
  }, []);

  // SOCKET
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      query: { clienteId }
    });

    socketRef.current.on("connect", () => {
      console.log("🟢 Cliente conectado:", socketRef.current.id);
    });

    socketRef.current.on("connect_error", (err) => {
      console.log("🔴 Error de conexión:", err.message);
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

    socketRef.current.on("resultado-promocion", (resultado) => {
      setSorteando(false);

      if (!resultado.ok) {
        setResultadoPromo({
          tipo: "error",
          mensaje: resultado.mensaje || "No se pudo participar en la promoción."
        });
        return;
      }

      if (resultado.ganador) {
        setResultadoPromo({
          tipo: "ganador",
          mensaje: MENSAJE_GANADOR
        });
      } else {
        setResultadoPromo({
          tipo: "perdedor",
          mensaje: MENSAJE_PERDEDOR
        });
      }
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
      ? {
          lat: coords.lat,
          lng: coords.lng,
        }
      : null;

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

    setResultadoPromo(null);
    setSorteando(false);

    const numero = "529621816603";

    const mensaje = `🏍️ NUEVO PEDIDO

👤 ${nombre}
🛒 ${pedido}
📍 ${ubicacion}
📌 Zona: ${zona}
💰 Costo envío: ${costo}
📍 GPS: ${
  coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
    : "No compartida"
}`;

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

  // 🍀 PROBAR SUERTE
  const probarSuerte = () => {
    if (!pedidoActual?.id) {
      alert("Primero realiza un pedido.");
      return;
    }

    if (pedidoActual.estado === "cancelado") {
      setResultadoPromo({
        tipo: "error",
        mensaje: "Los pedidos cancelados no pueden participar."
      });
      return;
    }

    if (pedidoActual.estado === "entregado") {
      setResultadoPromo({
        tipo: "error",
        mensaje: "Esta promoción solo está disponible antes de entregar el pedido."
      });
      return;
    }

    if (pedidoActual.promocion?.participo) {
      setResultadoPromo({
        tipo: pedidoActual.promocion.ganador ? "ganador" : "perdedor",
        mensaje: pedidoActual.promocion.ganador
          ? MENSAJE_GANADOR
          : MENSAJE_PERDEDOR
      });
      return;
    }

    setSorteando(true);
    setResultadoPromo(null);

    socketRef.current
      .timeout(7000)
      .emit("probar-suerte", { pedidoId: pedidoActual.id }, (err, resultado) => {
        setSorteando(false);

        if (err) {
          setResultadoPromo({
            tipo: "error",
            mensaje: "No se recibió respuesta del servidor. Verifica que el backend local esté encendido."
          });
          return;
        }

        if (!resultado?.ok) {
          setResultadoPromo({
            tipo: "error",
            mensaje: resultado?.mensaje || "No se pudo participar en la promoción."
          });
          return;
        }

        if (resultado.ganador) {
          setResultadoPromo({
            tipo: "ganador",
            mensaje: MENSAJE_GANADOR
          });
        } else {
          setResultadoPromo({
            tipo: "perdedor",
            mensaje: MENSAJE_PERDEDOR
          });
        }
      });
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

  const promoParaMostrar =
    resultadoPromo ||
    (pedidoActual?.promocion?.participo
      ? {
          tipo: pedidoActual.promocion.ganador ? "ganador" : "perdedor",
          mensaje: pedidoActual.promocion.ganador
            ? MENSAJE_GANADOR
            : MENSAJE_PERDEDOR
        }
      : null);

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

          <div className="header">
            <img src={logo} />
            <h1>🏍️ Mandaditos Ángel</h1>
            <h1>✨ Pide lo que quieras. Nosotros lo llevamos hasta la puerta de tu hogar. 🏠</h1>
          </div>

          <Mapa
            setCoords={setCoords}
            repartidor={repartidor}
          />

          {pedidoActual && (
            <div style={{ marginTop: 10, padding: 10, background: "#eee", borderRadius: 10 }}>
              <p>👤 {pedidoActual.nombre}</p>
              <p>🛒 {pedidoActual.pedido}</p>
              <p>📦 {pedidoActual.estado}</p>

              {!pedidoActual.promocion?.participo &&
                pedidoActual.estado !== "cancelado" &&
                pedidoActual.estado !== "entregado" && (
                  <button
                    className="btn"
                    onClick={probarSuerte}
                    disabled={sorteando}
                    style={{ marginTop: 10 }}
                  >
                    {sorteando ? "🎁 Revisando tu suerte..." : "🍀 Probar mi suerte"}
                  </button>
                )}

              {promoParaMostrar && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 14,
                    borderRadius: 12,
                    background: "#fef3c7",
                    border: "1px solid #f59e0b",
                    color: "#78350f",
                    textAlign: "center",
                    fontWeight: "bold",
                    whiteSpace: "pre-line",
                    lineHeight: "1.4"
                  }}
                >
                  {promoParaMostrar.mensaje}
                </div>
              )}
            </div>
          )}

          <div className="pedidos-container">
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

          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
          />

          <input
            value={pedido}
            onChange={(e) => setPedido(e.target.value)}
            placeholder="Pedido"
          />

          <input
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            placeholder="Ubicación"
          />

          <p style={{ fontSize: "13px", color: "#666", marginBottom: "5px" }}>
            📌 Los precios se calculan por zonas y pueden variar según la distancia y el tipo de mandado.
            💰 El costo es un aproximado entre $20 y $60 en areas cercanas.
          </p>

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