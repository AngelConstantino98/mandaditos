import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "https://mandaditos-backend.onrender.com";
// Para trabajar local, usa este y comenta el de producción:
// const SOCKET_URL = "http://localhost:3001";

const GPS_STORAGE_KEY = "gpsRepartidorActivo";
const REPARTIDOR_STORAGE_KEY = "repartidorActivo";

export default function Repartidor() {
  const socketRef = useRef(null);
  const watchId = useRef(null);
  const repartidorRef = useRef(null);

  const [activo, setActivo] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [pestana, setPestana] = useState("nuevos");

  const [repartidor, setRepartidor] = useState(null);
  const [usuarioRepartidor, setUsuarioRepartidor] = useState("");
  const [pinRepartidor, setPinRepartidor] = useState("");
  const [cargandoLogin, setCargandoLogin] = useState(false);
  const [errorLogin, setErrorLogin] = useState("");

  useEffect(() => {
    repartidorRef.current = repartidor;
  }, [repartidor]);

  const obtenerRepartidorActivo = () => {
    if (repartidorRef.current) {
      return repartidorRef.current;
    }

    try {
      const guardado = localStorage.getItem(REPARTIDOR_STORAGE_KEY);
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  };

  const obtenerEstadoPedido = (pedido) =>
    String(pedido?.estado || "").toLowerCase();

  const pedidoEstaFinalizado = (pedido) => {
    const estado = obtenerEstadoPedido(pedido);
    return estado === "cancelado" || estado === "entregado";
  };

  const pedidoEsMio = (pedido) => {
    if (!repartidor?.id) return false;

    return (
      Boolean(pedido?.repartidorId) &&
      String(pedido.repartidorId) === String(repartidor.id)
    );
  };

  const pedidoEsDeOtro = (pedido) => {
    if (!repartidor?.id) return false;

    return (
      Boolean(pedido?.repartidorId) &&
      String(pedido.repartidorId) !== String(repartidor.id)
    );
  };

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

      repartidorRef.current = data.repartidor;
      setRepartidor(data.repartidor);
      setUsuarioRepartidor("");
      setPinRepartidor("");
      setPestana("nuevos");
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
    repartidorRef.current = null;
    setRepartidor(null);
    setUsuarioRepartidor("");
    setPinRepartidor("");
    setErrorLogin("");
    setPestana("nuevos");
  };

  // 🟢 GPS
  const iniciarGPS = () => {
    const repartidorActivo = obtenerRepartidorActivo();

    if (!repartidorActivo?.id) {
      alert("Primero inicia sesión como repartidor.");
      return;
    }

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
        const repartidorGPS = obtenerRepartidorActivo();

        if (!repartidorGPS?.id) {
          return;
        }

        const data = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          fecha: new Date().toISOString(),
          repartidorId: repartidorGPS.id,
          repartidorNombre: repartidorGPS.nombre,
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
        const repartidorParseado = JSON.parse(repartidorGuardado);
        repartidorRef.current = repartidorParseado;
        setRepartidor(repartidorParseado);
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

    socketRef.current.on("error-repartidor", (data) => {
      if (data?.mensaje) {
        alert(data.mensaje);
      }
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
    const repartidorActivo = obtenerRepartidorActivo();

    if (!repartidorActivo) {
      alert("Primero inicia sesión como repartidor.");
      return;
    }

    const pedidoTieneRepartidor = Boolean(pedido.repartidorId);
    const pedidoEsDeOtroRepartidor =
      pedidoTieneRepartidor &&
      String(pedido.repartidorId) !== String(repartidorActivo.id);

    if (estado === "aceptado" && pedidoEsDeOtroRepartidor) {
      alert(
        `Este pedido ya fue aceptado por ${pedido.repartidorNombre || "otro repartidor"}.`
      );
      return;
    }

    if (["en camino", "entregado"].includes(estado)) {
      if (!pedidoTieneRepartidor) {
        alert("Primero debes aceptar el pedido.");
        return;
      }

      if (pedidoEsDeOtroRepartidor) {
        alert(
          `Solo ${pedido.repartidorNombre || "el repartidor asignado"} puede actualizar este pedido.`
        );
        return;
      }
    }

    socketRef.current.emit("cambiar-estado", {
      ...pedido,
      estado,
      repartidorId: repartidorActivo.id,
      repartidorNombre: repartidorActivo.nombre,
    });

    if (estado === "aceptado" || estado === "en camino") {
      setPestana("mis");
    }

    if (estado === "entregado") {
      setPestana("entregados");
    }
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

  const abrirRuta = (p) => {
    const gps = p.ubicacionGPS || p.gps;

    if (gps) {
      const { lat, lng } = gps;
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
        "_blank"
      );
    } else {
      alert("Este pedido no tiene ubicación GPS para abrir ruta.");
    }
  };

  const pedidosNuevos = pedidos.filter((p) => {
    const estado = obtenerEstadoPedido(p);

    return (
      estado === "pendiente" &&
      !p.repartidorId
    );
  });

  const pedidosMios = pedidos.filter((p) => {
    const estado = obtenerEstadoPedido(p);

    return (
      pedidoEsMio(p) &&
      estado !== "cancelado" &&
      estado !== "entregado"
    );
  });

  const pedidosEntregados = pedidos.filter((p) => {
    return pedidoEsMio(p) && obtenerEstadoPedido(p) === "entregado";
  });

  const pedidosCancelados = pedidos.filter((p) => {
    return obtenerEstadoPedido(p) === "cancelado";
  });

  const obtenerPedidosPorPestana = () => {
    if (pestana === "mis") return pedidosMios;
    if (pestana === "entregados") return pedidosEntregados;
    if (pestana === "cancelados") return pedidosCancelados;
    return pedidosNuevos;
  };

  const pedidosMostrados = obtenerPedidosPorPestana();

  const pestanas = [
    {
      id: "nuevos",
      label: "📦 Nuevos",
      cantidad: pedidosNuevos.length,
      descripcion: "Pedidos pendientes sin repartidor asignado.",
    },
    {
      id: "mis",
      label: "🛵 Mis pedidos",
      cantidad: pedidosMios.length,
      descripcion: "Pedidos aceptados por ti o en camino.",
    },
    {
      id: "entregados",
      label: "✅ Entregados",
      cantidad: pedidosEntregados.length,
      descripcion: "Pedidos que tú ya marcaste como entregados.",
    },
    {
      id: "cancelados",
      label: "❌ Cancelados",
      cantidad: pedidosCancelados.length,
      descripcion: "Pedidos cancelados por clientes.",
    },
  ];

  const descripcionPestana =
    pestanas.find((item) => item.id === pestana)?.descripcion || "";

  const totalEntregasHoyMias = pedidosEntregados.length;
  const totalComisionHoyMia = totalEntregasHoyMias * 10;

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

  const estiloBotonPestana = (id) => ({
    padding: "10px 12px",
    borderRadius: 999,
    border: pestana === id ? "2px solid #2563eb" : "1px solid #d1d5db",
    background: pestana === id ? "#eff6ff" : "white",
    color: pestana === id ? "#1d4ed8" : "#111827",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow:
      pestana === id ? "0 3px 8px rgba(37, 99, 235, 0.18)" : "none",
  });

  return (
    <div
      className="app-driver"
      style={{
        padding: 10,
        background: "#f3f4f6",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ marginBottom: 10 }}>🏍️ Panel Repartidor</h1>

      <div
        style={{
          background: "#eff6ff",
          border: "1px solid #93c5fd",
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
        }}
      >
        <p style={{ margin: 0, fontWeight: "bold", color: "#1d4ed8" }}>
          👤 Repartidor activo: {repartidor.nombre}
        </p>

        <button
          onClick={cerrarSesionRepartidor}
          style={{
            marginTop: 8,
            padding: "7px 10px",
            borderRadius: 8,
            border: "none",
            background: "#e5e7eb",
            cursor: "pointer",
          }}
        >
          Cerrar sesión
        </button>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          padding: 12,
          marginBottom: 12,
        }}
      >
        {!activo ? (
          <button
            onClick={iniciarGPS}
            style={{
              padding: "9px 12px",
              borderRadius: 10,
              border: "none",
              background: "#16a34a",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            ▶️ Iniciar GPS
          </button>
        ) : (
          <button
            onClick={detenerGPS}
            style={{
              padding: "9px 12px",
              borderRadius: 10,
              border: "none",
              background: "#dc2626",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            ⏹️ Detener GPS
          </button>
        )}

        {activo && (
          <p style={{ color: "green", fontWeight: "bold", marginTop: 8 }}>
            🛰️ GPS activo. Tu ubicación se comparte solo con tus pedidos asignados.
          </p>
        )}
      </div>

      <div
        style={{
          background: "#111827",
          color: "white",
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>
            Mis entregas
          </p>
          <strong style={{ fontSize: 22 }}>{totalEntregasHoyMias}</strong>
        </div>

        <div>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>
            Comisión dueño
          </p>
          <strong style={{ fontSize: 22 }}>${totalComisionHoyMia}</strong>
        </div>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          padding: 10,
          marginBottom: 12,
        }}
      >
        <h2 style={{ marginBottom: 8 }}>📦 Pedidos</h2>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 10,
          }}
        >
          {pestanas.map((item) => (
            <button
              key={item.id}
              onClick={() => setPestana(item.id)}
              style={estiloBotonPestana(item.id)}
            >
              {item.label} ({item.cantidad})
            </button>
          ))}
        </div>

        <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
          {descripcionPestana}
        </p>
      </div>

      {pedidosMostrados.length === 0 && (
        <div
          style={{
            background: "white",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            padding: 18,
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          No hay pedidos en esta sección.
        </div>
      )}

      {pedidosMostrados.map((p) => {
        const telefonoCliente = obtenerTelefonoPedido(p);
        const pedidoTieneRepartidor = Boolean(p.repartidorId);
        const esMio = pedidoEsMio(p);
        const esDeOtro = pedidoEsDeOtro(p);
        const finalizado = pedidoEstaFinalizado(p);
        const estado = obtenerEstadoPedido(p);

        return (
          <div
            key={p.id}
            style={{
              border: p.promocion?.ganador
                ? "3px solid #10b981"
                : esMio
                  ? "3px solid #2563eb"
                  : esDeOtro
                    ? "2px solid #f59e0b"
                    : "1px solid #ccc",
              padding: 12,
              marginBottom: 10,
              borderRadius: 14,
              opacity: estado === "cancelado" ? 0.6 : 1,
              background: p.promocion?.ganador
                ? "#ecfdf5"
                : esMio
                  ? "#eff6ff"
                  : esDeOtro
                    ? "#fffbeb"
                    : "#fff",
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.06)",
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
                🎁 ENVÍO GRATIS
                <br />
                🚫 NO COBRAR ENVÍO AL CLIENTE
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

            {esMio && !finalizado && (
              <div
                style={{
                  background: "#2563eb",
                  color: "white",
                  padding: "10px",
                  borderRadius: "10px",
                  textAlign: "center",
                  fontWeight: "bold",
                  marginBottom: "10px",
                }}
              >
                🛵 Este pedido está asignado a ti
              </div>
            )}

            {esDeOtro && !finalizado && (
              <div
                style={{
                  background: "#f59e0b",
                  color: "white",
                  padding: "10px",
                  borderRadius: "10px",
                  textAlign: "center",
                  fontWeight: "bold",
                  marginBottom: "10px",
                }}
              >
                🔒 Pedido tomado por {p.repartidorNombre || "otro repartidor"}
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
                  ENVÍO GRATIS POR PROMOCIÓN
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

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 10,
              }}
            >
              <button onClick={() => abrirMapa(p)}>📍 Ver ubicación</button>

              <button onClick={() => abrirRuta(p)}>🧭 Ruta</button>

              {telefonoCliente && (
                <button onClick={() => llamarCliente(p)}>📞 Llamar cliente</button>
              )}

              {!finalizado && !pedidoTieneRepartidor && (
                <button onClick={() => cambiarEstado(p, "aceptado")}>
                  ✔ Aceptar
                </button>
              )}

              {!finalizado && esMio && (
                <>
                  {estado !== "en camino" && (
                    <button onClick={() => cambiarEstado(p, "en camino")}>
                      🚀 En camino
                    </button>
                  )}

                  <button onClick={() => cambiarEstado(p, "entregado")}>
                    ✅ Entregado
                  </button>
                </>
              )}
            </div>

            {estado === "cancelado" && (
              <p style={{ color: "red", fontWeight: "bold", marginTop: 10 }}>
                ❌ Pedido cancelado por cliente
              </p>
            )}

            {estado === "entregado" && (
              <p style={{ color: "green", fontWeight: "bold", marginTop: 10 }}>
                ✅ Pedido entregado
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
