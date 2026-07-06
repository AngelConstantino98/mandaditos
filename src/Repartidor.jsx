import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "https://mandaditos-backend.onrender.com";
// Para subir en línea, usa este y comenta el local:
// const SOCKET_URL = "https://mandaditos-backend.onrender.com";

const GPS_STORAGE_KEY = "gpsRepartidorActivo";
const REPARTIDOR_STORAGE_KEY = "repartidorActivo";

export default function Repartidor() {
  const socketRef = useRef(null);
  const watchId = useRef(null);

  const [activo, setActivo] = useState(false);
  const [pedidos, setPedidos] = useState([]);

  const [repartidor, setRepartidor] = useState(null);
  const [usuarioRepartidor, setUsuarioRepartidor] = useState("");
  const [pinRepartidor, setPinRepartidor] = useState("");
  const [cargandoLogin, setCargandoLogin] = useState(false);
  const [errorLogin, setErrorLogin] = useState("");

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

  const iniciarSesionRepartidor = async (e) => {
    e.preventDefault();

    if (!usuarioRepartidor.trim() || !pinRepartidor.trim()) {
      setErrorLogin("Escribe usuario y PIN.");
      return;
    }

    try {
      setCargandoLogin(true);
      setErrorLogin("");

      const respuesta = await fetch(`${SOCKET_URL}/repartidor/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario: usuarioRepartidor,
          pin: pinRepartidor,
        }),
      });

      const data = await respuesta.json();

      if (!respuesta.ok || !data.ok) {
        setErrorLogin(data.mensaje || "No se pudo iniciar sesión.");
        return;
      }

      localStorage.setItem(
        REPARTIDOR_STORAGE_KEY,
        JSON.stringify(data.repartidor)
      );

      setRepartidor(data.repartidor);
      setUsuarioRepartidor("");
      setPinRepartidor("");
    } catch (error) {
      console.log("Error login repartidor:", error);
      setErrorLogin("No se pudo conectar con el servidor.");
    } finally {
      setCargandoLogin(false);
    }
  };

  const cerrarSesionRepartidor = () => {
    detenerGPS();
    localStorage.removeItem(REPARTIDOR_STORAGE_KEY);
    setRepartidor(null);
    setUsuarioRepartidor("");
    setPinRepartidor("");
    setErrorLogin("");
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
    const repartidorGuardado = localStorage.getItem(REPARTIDOR_STORAGE_KEY);

    if (repartidorGuardado) {
      try {
        setRepartidor(JSON.parse(repartidorGuardado));
      } catch {
        localStorage.removeItem(REPARTIDOR_STORAGE_KEY);
      }
    }

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
    if (!repartidor) {
      alert("Primero inicia sesión como repartidor.");
      return;
    }

    socketRef.current.emit("cambiar-estado", {
      ...pedido,
      estado,
      repartidorId: repartidor.id,
      repartidorNombre: repartidor.nombre,
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

  if (!repartidor) {
    return (
      <div className="app-driver">
        <h1>🏍️ Panel Repartidor</h1>

        <div
          style={{
            maxWidth: 420,
            margin: "30px auto",
            padding: 20,
            border: "1px solid #ddd",
            borderRadius: 12,
            background: "white",
          }}
        >
          <h2>👤 Iniciar sesión</h2>

          <form onSubmit={iniciarSesionRepartidor}>
            <input
              type="text"
              placeholder="Usuario repartidor"
              value={usuarioRepartidor}
              onChange={(e) => setUsuarioRepartidor(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                marginBottom: 10,
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
            />

            <input
              type="password"
              inputMode="numeric"
              placeholder="PIN"
              value={pinRepartidor}
              onChange={(e) => setPinRepartidor(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                marginBottom: 10,
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
            />

            {errorLogin && (
              <p style={{ color: "red", fontWeight: "bold" }}>
                {errorLogin}
              </p>
            )}

            <button type="submit" disabled={cargandoLogin}>
              {cargandoLogin ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-driver">
      <h1>🏍️ Panel Repartidor</h1>

      <div
        style={{
          background: "#eff6ff",
          border: "1px solid #93c5fd",
          borderRadius: 10,
          padding: 10,
          marginBottom: 12,
        }}
      >
        <p style={{ margin: 0, fontWeight: "bold", color: "#1d4ed8" }}>
          👤 Repartidor activo: {repartidor.nombre}
        </p>

        <button onClick={cerrarSesionRepartidor}>Cerrar sesión</button>
      </div>

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

            {p.repartidorNombre && (
              <p>
                <b>🛵 Atendido por:</b> {p.repartidorNombre}
              </p>
            )}

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
