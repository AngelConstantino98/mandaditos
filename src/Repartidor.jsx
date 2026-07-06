import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "https://mandaditos-backend.onrender.com";

const GPS_STORAGE_KEY = "gpsRepartidorActivo";

export default function Repartidor() {
  const socketRef = useRef(null);
  const watchId = useRef(null);

  const [activo, setActivo] = useState(false);
  const [pedidos, setPedidos] = useState([]);

  const obtenerTelefonoPedido = (pedido) => {
    return String(
      pedido?.telefonoCliente ||
        pedido?.telefono ||
        pedido?.clienteTelefono ||
        ""
    ).replace(/\D/g, "");
  };

  const llamarCliente = (pedido) => {
    const telefono = obtenerTelefonoPedido(pedido);

    if (!telefono) {
      alert("Este pedido no tiene teléfono del cliente.");
      return;
    }

    window.location.href = `tel:${telefono}`;
  };

  // 🟢 GPS
  const iniciarGPS = () => {
    if (!navigator.geolocation) {
      alert("Tu dispositivo no soporta GPS");
      return;
    }

    // Evita iniciar varios GPS al mismo tiempo
    if (watchId.current !== null) {
      setActivo(true);
      localStorage.setItem(GPS_STORAGE_KEY, "true");
      return;
    }

    setActivo(true);
    localStorage.setItem(GPS_STORAGE_KEY, "true");

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const data = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          fecha: new Date().toISOString(),
        };

        console.log(
          "📍 Precisión GPS repartidor:",
          pos.coords.accuracy,
          "metros"
        );

        if (socketRef.current) {
          socketRef.current.emit("repartidor-ubicacion", data);
        }
      },
      (error) => {
        console.log("Error GPS repartidor:", error);
        alert("No se pudo obtener la ubicación del repartidor.");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const detenerGPS = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    setActivo(false);
    localStorage.setItem(GPS_STORAGE_KEY, "false");
  };

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on("connect", () => {
      console.log("🟢 Repartidor conectado:", socketRef.current.id);

      socketRef.current.emit("repartidor-conectar");

      // ✅ Si el GPS estaba activo antes de recargar, se vuelve a iniciar solo
      const gpsGuardado = localStorage.getItem(GPS_STORAGE_KEY);

      if (gpsGuardado === "true") {
        iniciarGPS();
      }
    });

    // 📦 HISTORIAL INICIAL
    socketRef.current.on("pedidos-iniciales", (data) => {
      console.log("📦 historial repartidor:", data);

      setPedidos(() => [...data]);
    });

    // 📦 NUEVOS PEDIDOS
    socketRef.current.on("nuevo-pedido-repartidor", (nuevoPedido) => {
      setPedidos((prev) => {
        const existe = prev.find(
          (p) => String(p.id) === String(nuevoPedido.id)
        );

        if (existe) {
          return prev.map((p) =>
            String(p.id) === String(nuevoPedido.id) ? nuevoPedido : p
          );
        }

        return [nuevoPedido, ...prev];
      });

      console.log("📦 nuevo pedido:", nuevoPedido);
    });

    // 🔄 ACTUALIZACIÓN DE PEDIDOS
    socketRef.current.on("pedido-actualizado", (pedidoActualizado) => {
      setPedidos((prev) => {
        const existe = prev.find(
          (p) => String(p.id) === String(pedidoActualizado.id)
        );

        if (existe) {
          return prev.map((p) =>
            String(p.id) === String(pedidoActualizado.id)
              ? pedidoActualizado
              : p
          );
        }

        return [pedidoActualizado, ...prev];
      });

      console.log("🔄 actualización:", pedidoActualizado);
    });

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }

      socketRef.current?.disconnect();
    };
  }, []);

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

      {activo && (
        <p style={{ color: "green", fontWeight: "bold" }}>
          🛰️ GPS activo. Tu ubicación se está compartiendo.
        </p>
      )}

      <hr />

      <h2>📦 Pedidos</h2>

      {pedidos.length === 0 && <p>No hay pedidos</p>}

      {pedidos.map((p) => {
        const telefonoCliente = obtenerTelefonoPedido(p);

        return (
          <div
            key={p.id}
            style={{
              border: p.promocion?.ganador
                ? "3px solid #10b981"
                : "1px solid #ccc",
              padding: 10,
              marginBottom: 10,
              borderRadius: 10,
              opacity: p.estado === "cancelado" ? 0.5 : 1,
              background: p.promocion?.ganador ? "#ecfdf5" : "#fff",
            }}
          >
            {p.promocion?.ganador && (
              <div
                style={{
                  background: "#10b981",
                  color: "white",
                  padding: "12px",
                  borderRadius: "10px",
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "18px",
                  marginBottom: "10px",
                }}
              >
                🎁 PEDIDO GRATIS
                <br />
                🚫 NO COBRAR AL CLIENTE
              </div>
            )}

            {p.recompensa?.usada && (
              <div
                style={{
                  background: "#fef3c7",
                  color: "#92400e",
                  padding: "12px",
                  borderRadius: "10px",
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "16px",
                  marginBottom: "10px",
                  border: "1px solid #f59e0b",
                }}
              >
                🎁 CUPÓN DE RECOMPENSA
                <br />
                Descontar $20 del envío
              </div>
            )}

            <p>
              <b>👤 Cliente:</b> {p.nombre}
            </p>

            {telefonoCliente && (
              <p>
                <b>📞 Teléfono:</b> {telefonoCliente}
              </p>
            )}

            <p style={{ whiteSpace: "pre-line" }}>
              <b>🛒 Pedido:</b> {p.pedido}
            </p>

            <p>
              <b>📍 Zona:</b> {p.zona}
            </p>

            <p>
              <b>💰 Costo:</b>{" "}
              {p.promocion?.ganador ? (
                <span style={{ color: "green", fontWeight: "bold" }}>
                  GRATIS POR PROMOCIÓN
                </span>
              ) : (
                p.costo || "No especificado"
              )}
            </p>

            <p>
              <b>📦 Estado:</b> {p.estado}
            </p>

            <p>
              <b>📍 Ubicación:</b> {p.ubicacion || "No proporcionada"}
            </p>

            {p.promocion?.participo && !p.promocion?.ganador && (
              <p style={{ color: "#92400e", fontWeight: "bold" }}>
                🍀 Participó en la promoción, pero no ganó.
              </p>
            )}

            <button onClick={() => abrirMapa(p)}>📍 Ver ubicación</button>

            {telefonoCliente && (
              <button onClick={() => llamarCliente(p)}>📞 Llamar cliente</button>
            )}

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
        );
      })}
    </div>
  );
}
