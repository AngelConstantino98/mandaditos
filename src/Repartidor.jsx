import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "https://mandaditos-backend.onrender.com";
// Para trabajar local, usa este y comenta el de producción:
// const SOCKET_URL = "http://localhost:3001";

const GPS_STORAGE_KEY = "gpsRepartidorActivo";
const REPARTIDOR_STORAGE_KEY = "repartidorActivo";
const SONIDO_PEDIDOS_STORAGE_KEY = "sonidoPedidosActivo";

// 🛰️ Refuerzo seguro del GPS mientras la app está abierta.
// No reemplaza el tiempo real; solo ayuda a que el backend siempre tenga una ubicación reciente.
const GPS_REFORZAR_MS = 8000;
const GPS_UBICACION_RECIENTE_MS = 2 * 60 * 1000;

export default function Repartidor() {
  const socketRef = useRef(null);
  const watchId = useRef(null);
  const repartidorRef = useRef(null);
  const ultimaUbicacionRef = useRef(null);
  const intervaloGPSRef = useRef(null);

  const [activo, setActivo] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [pestana, setPestana] = useState("todos");
  const [conectado, setConectado] = useState(false);
  const disponibleRef = useRef(true);

  const [disponible, setDisponible] = useState(true);
  const [miFechaCambioServicio, setMiFechaCambioServicio] = useState(null);
  const [servicioGlobal, setServicioGlobal] = useState({
    activo: true,
    repartidores: [],
  });
  const [cambiandoServicio, setCambiandoServicio] = useState(false);
  const [sonidoPedidos, setSonidoPedidos] = useState(() => {
    return localStorage.getItem(SONIDO_PEDIDOS_STORAGE_KEY) === "true";
  });
  const [pedidoParaEntregar, setPedidoParaEntregar] = useState(null);
  const [pedidosActualizando, setPedidosActualizando] = useState({});

  const [repartidor, setRepartidor] = useState(null);
  const [usuarioRepartidor, setUsuarioRepartidor] = useState("");
  const [pinRepartidor, setPinRepartidor] = useState("");
  const [cargandoLogin, setCargandoLogin] = useState(false);
  const [errorLogin, setErrorLogin] = useState("");

  useEffect(() => {
    repartidorRef.current = repartidor;
  }, [repartidor]);

  useEffect(() => {
    disponibleRef.current = disponible;
  }, [disponible]);

  const reproducirSonidoPedido = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;

      if (!AudioContext) return;

      const audioContext = new AudioContext();
      const ahora = audioContext.currentTime;

      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, ahora);

      gain.gain.setValueAtTime(0.001, ahora);
      gain.gain.exponentialRampToValueAtTime(0.25, ahora + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ahora + 0.35);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.start(ahora);
      oscillator.stop(ahora + 0.36);

      setTimeout(() => {
        audioContext.close();
      }, 600);
    } catch (error) {
      console.log("No se pudo reproducir sonido:", error);
    }
  };

  const activarSonidoPedidos = () => {
    localStorage.setItem(SONIDO_PEDIDOS_STORAGE_KEY, "true");
    setSonidoPedidos(true);
    reproducirSonidoPedido();

    if (navigator.vibrate) {
      navigator.vibrate(120);
    }
  };

  const notificarPedidoNuevo = () => {
    if (!disponibleRef.current) {
      return;
    }

    if (navigator.vibrate) {
      navigator.vibrate([250, 100, 250]);
    }

    const sonidoActivo =
      sonidoPedidos ||
      localStorage.getItem(SONIDO_PEDIDOS_STORAGE_KEY) === "true";

    if (sonidoActivo) {
      reproducirSonidoPedido();
    }
  };

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

  const emitirUbicacionRepartidor = (pos, origen = "gps") => {
    const repartidorGPS = obtenerRepartidorActivo();

    if (!repartidorGPS?.id || !pos?.coords) {
      return null;
    }

    const data = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      fecha: new Date().toISOString(),
      repartidorId: repartidorGPS.id,
      repartidorNombre: repartidorGPS.nombre,
      origen,
    };

    ultimaUbicacionRef.current = data;

    console.log(
      "📍 Precisión GPS repartidor:",
      pos.coords.accuracy,
      "metros"
    );

    socketRef.current?.emit("repartidor-ubicacion", data);

    return data;
  };

  const ultimaUbicacionEstaReciente = () => {
    const ultima = ultimaUbicacionRef.current;

    if (!ultima?.fecha) {
      return false;
    }

    const tiempo = new Date(ultima.fecha).getTime();

    if (Number.isNaN(tiempo)) {
      return false;
    }

    return Date.now() - tiempo <= GPS_UBICACION_RECIENTE_MS;
  };

  const reenviarUltimaUbicacionReciente = () => {
    if (!ultimaUbicacionEstaReciente()) {
      return false;
    }

    const ultima = {
      ...ultimaUbicacionRef.current,
      fecha: new Date().toISOString(),
      origen: "ultima-reciente",
    };

    ultimaUbicacionRef.current = ultima;
    socketRef.current?.emit("repartidor-ubicacion", ultima);

    return true;
  };

  const solicitarUbicacionActual = (origen = "solicitud") => {
    const repartidorActivo = obtenerRepartidorActivo();

    if (!repartidorActivo?.id || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        emitirUbicacionRepartidor(pos, origen);
      },
      (error) => {
        console.log("No se pudo reforzar GPS repartidor:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  const iniciarRefuerzoGPS = () => {
    if (intervaloGPSRef.current !== null) {
      return;
    }

    intervaloGPSRef.current = setInterval(() => {
      const gpsActivo = localStorage.getItem(GPS_STORAGE_KEY) === "true";
      const repartidorActivo = obtenerRepartidorActivo();

      if (!gpsActivo || !repartidorActivo?.id) {
        return;
      }

      solicitarUbicacionActual("refuerzo-8s");
    }, GPS_REFORZAR_MS);
  };

  const detenerRefuerzoGPS = () => {
    if (intervaloGPSRef.current !== null) {
      clearInterval(intervaloGPSRef.current);
      intervaloGPSRef.current = null;
    }
  };

  const obtenerEstadoPedido = (pedido) =>
    String(pedido?.estado || "").toLowerCase();

  const pedidoEstaActualizando = (pedidoId) =>
    Boolean(pedidosActualizando[String(pedidoId)]);

  const marcarPedidoActualizando = (pedidoId, valor) => {
    const id = String(pedidoId || "");

    if (!id) return;

    setPedidosActualizando((prev) => {
      if (valor) {
        return {
          ...prev,
          [id]: true,
        };
      }

      const siguiente = { ...prev };
      delete siguiente[id];
      return siguiente;
    });
  };

  const aplicarPedidoActualizadoLocal = (pedidoActualizado) => {
    if (!pedidoActualizado?.id) return;

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
  };

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

  const obtenerTiempoPedido = (pedido) => {
    const fechaPedido =
      pedido?.fecha ||
      pedido?.fechaCreacion ||
      pedido?.createdAt ||
      pedido?.fecha_creacion ||
      null;

    const tiempoPorFecha = fechaPedido ? new Date(fechaPedido).getTime() : NaN;

    if (!Number.isNaN(tiempoPorFecha)) {
      return tiempoPorFecha;
    }

    const tiempoPorId = Number(pedido?.id);

    if (Number.isFinite(tiempoPorId)) {
      return tiempoPorId;
    }

    return NaN;
  };

  const pedidoLlegoAntesDeMiSalida = (pedido) => {
    if (disponible) {
      return true;
    }

    const tiempoSalida = miFechaCambioServicio
      ? new Date(miFechaCambioServicio).getTime()
      : NaN;

    const tiempoPedido = obtenerTiempoPedido(pedido);

    if (Number.isNaN(tiempoSalida) || Number.isNaN(tiempoPedido)) {
      return false;
    }

    return tiempoPedido <= tiempoSalida;
  };

  const puedoAceptarPedido = (pedido) => {
    const estado = obtenerEstadoPedido(pedido);

    return (
      estado === "pendiente" &&
      !pedido?.repartidorId &&
      (disponible || pedidoLlegoAntesDeMiSalida(pedido))
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

  const actualizarServicioDesdeServidor = (estado) => {
    if (!estado) return;

    setServicioGlobal(estado);

    const repartidorActivo = obtenerRepartidorActivo();

    if (!repartidorActivo?.id) return;

    const miEstado = estado.repartidores?.find(
      (item) => String(item.repartidorId) === String(repartidorActivo.id)
    );

    if (miEstado) {
      setDisponible(miEstado.disponible !== false);
      setMiFechaCambioServicio(miEstado.fechaActualizacion || null);
    }
  };

  const cambiarDisponibilidad = () => {
    const repartidorActivo = obtenerRepartidorActivo();

    if (!repartidorActivo?.id) {
      alert("Primero inicia sesión como repartidor.");
      return;
    }

    const nuevoEstado = !disponible;

    setCambiandoServicio(true);

    socketRef.current
      ?.timeout(7000)
      .emit(
        "repartidor-servicio",
        {
          repartidorId: repartidorActivo.id,
          disponible: nuevoEstado,
        },
        (err, respuesta) => {
          setCambiandoServicio(false);

          if (err || !respuesta?.ok) {
            alert(
              respuesta?.mensaje ||
                "No se pudo actualizar tu estado de servicio."
            );
            return;
          }

          actualizarServicioDesdeServidor(respuesta.estado);
        }
      );
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

      socketRef.current?.emit("obtener-servicio", (estado) => {
        actualizarServicioDesdeServidor(estado);
      });

      setUsuarioRepartidor("");
      setPinRepartidor("");
      setPestana("todos");
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
    setPestana("todos");
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
      iniciarRefuerzoGPS();
      solicitarUbicacionActual("gps-ya-activo");
      return;
    }

    setActivo(true);
    localStorage.setItem(GPS_STORAGE_KEY, "true");
    iniciarRefuerzoGPS();
    solicitarUbicacionActual("inicio-gps");

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        emitirUbicacionRepartidor(pos, "watch-position");
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

    detenerRefuerzoGPS();
    ultimaUbicacionRef.current = null;

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
      setConectado(true);

      socketRef.current.emit("repartidor-conectar");

      socketRef.current.emit("obtener-servicio", (estado) => {
        actualizarServicioDesdeServidor(estado);
      });

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
      notificarPedidoNuevo();

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

    socketRef.current.on("servicio-actualizado", (estado) => {
      actualizarServicioDesdeServidor(estado);
    });

    socketRef.current.on("error-repartidor", (data) => {
      if (data?.mensaje) {
        alert(data.mensaje);
      }
    });

    socketRef.current.on("disconnect", () => {
      setConectado(false);
    });

    socketRef.current.on("connect_error", () => {
      setConectado(false);
    });

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }

      detenerRefuerzoGPS();
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

    if (pedidoEstaActualizando(pedido.id)) {
      return;
    }

    const pedidoTieneRepartidor = Boolean(pedido.repartidorId);
    const pedidoEsDeOtroRepartidor =
      pedidoTieneRepartidor &&
      String(pedido.repartidorId) !== String(repartidorActivo.id);

    if (estado === "aceptado" && !disponible && !pedidoLlegoAntesDeMiSalida(pedido)) {
      alert(
        "Estás fuera de servicio. Solo puedes aceptar pedidos que llegaron antes de que terminaras tu jornada."
      );
      return;
    }

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

    if (!socketRef.current?.connected) {
      alert("No estás conectado al servidor. Revisa tu señal antes de intentarlo.");
      return;
    }

    if (["aceptado", "en camino"].includes(estado)) {
      // Si el GPS ya estaba activo, reenviamos una ubicación en ese momento.
      // Así el cliente puede ver al repartidor apenas se acepta el pedido.
      reenviarUltimaUbicacionReciente();
      solicitarUbicacionActual(`estado-${estado}`);
    }

    marcarPedidoActualizando(pedido.id, true);

    socketRef.current
      ?.timeout(7000)
      .emit(
        "cambiar-estado",
        {
          ...pedido,
          estado,
          repartidorId: repartidorActivo.id,
          repartidorNombre: repartidorActivo.nombre,
        },
        (err, respuesta) => {
          marcarPedidoActualizando(pedido.id, false);

          if (err || !respuesta?.ok) {
            alert(
              respuesta?.mensaje ||
                "No se pudo confirmar el cambio con el servidor. Revisa tu señal antes de volver a intentarlo."
            );
            return;
          }

          if (respuesta.pedido) {
            aplicarPedidoActualizadoLocal(respuesta.pedido);
          }

          if (estado === "aceptado" || estado === "en camino") {
            setPestana("mis");
          }

          if (estado === "entregado") {
            setPestana("entregados");
          }
        }
      );
  };

  const cancelarPedidoRepartidor = (pedido) => {
    const repartidorActivo = obtenerRepartidorActivo();

    if (!repartidorActivo) {
      alert("Primero inicia sesión como repartidor.");
      return;
    }

    if (pedidoEstaActualizando(pedido.id)) {
      return;
    }

    const estado = obtenerEstadoPedido(pedido);

    if (estado === "entregado") {
      alert("Este pedido ya está entregado y no se puede cancelar.");
      return;
    }

    if (estado === "cancelado") {
      alert("Este pedido ya está cancelado.");
      return;
    }

    const pedidoTieneRepartidor = Boolean(pedido.repartidorId);
    const pedidoEsDeOtroRepartidor =
      pedidoTieneRepartidor &&
      String(pedido.repartidorId) !== String(repartidorActivo.id);

    if (pedidoEsDeOtroRepartidor) {
      alert(
        `Solo ${pedido.repartidorNombre || "el repartidor asignado"} puede cancelar este pedido.`
      );
      return;
    }

    const confirmar = window.confirm(
      `¿Seguro que quieres cancelar el pedido de ${pedido.nombre || "este cliente"}?`
    );

    if (!confirmar) {
      return;
    }

    if (!socketRef.current?.connected) {
      alert("No estás conectado al servidor. Revisa tu señal antes de cancelar.");
      return;
    }

    marcarPedidoActualizando(pedido.id, true);

    socketRef.current
      ?.timeout(7000)
      .emit(
        "cancelar-pedido",
        {
          id: pedido.id,
          repartidorId: repartidorActivo.id,
          repartidorNombre: repartidorActivo.nombre,
          canceladoPor: "repartidor",
        },
        (err, respuesta) => {
          marcarPedidoActualizando(pedido.id, false);

          if (err || !respuesta?.ok) {
            alert(
              respuesta?.mensaje ||
                "No se pudo confirmar la cancelación con el servidor. Revisa tu señal antes de volver a intentarlo."
            );
            return;
          }

          if (respuesta.pedido) {
            aplicarPedidoActualizadoLocal(respuesta.pedido);
          }

          setPestana("cancelados");
        }
      );
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

  const pedidosNuevos = pedidos.filter((p) => puedoAceptarPedido(p));

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

  const pedidosTomadosPorOtros = pedidos.filter((p) => {
    const estado = obtenerEstadoPedido(p);

    return (
      pedidoEsDeOtro(p) &&
      estado !== "cancelado" &&
      estado !== "entregado"
    );
  });

  const obtenerPedidosPorPestana = () => {
    if (pestana === "todos") return pedidos;
    if (pestana === "mis") return pedidosMios;
    if (pestana === "otros") return pedidosTomadosPorOtros;
    if (pestana === "entregados") return pedidosEntregados;
    if (pestana === "cancelados") return pedidosCancelados;
    return pedidosNuevos;
  };

  const pedidosMostrados = obtenerPedidosPorPestana();

  const pestanas = [
    {
      id: "todos",
      label: "📋 Todos",
      cantidad: pedidos.length,
      descripcion: "Muestra todos los pedidos, como antes.",
    },
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
      id: "otros",
      label: "🔒 Tomados",
      cantidad: pedidosTomadosPorOtros.length,
      descripcion: "Pedidos activos que ya tomó otro repartidor.",
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
      {pedidoParaEntregar && (
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
              maxWidth: 380,
              background: "white",
              borderRadius: 18,
              padding: 18,
              boxShadow: "0 20px 45px rgba(0,0,0,0.25)",
              border: "1px solid #e5e7eb",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                background: "#dcfce7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 10px",
                fontSize: 28,
              }}
            >
              ✅
            </div>

            <h2 style={{ fontSize: 20, marginBottom: 8, color: "#111827" }}>
              Confirmar entrega
            </h2>

            <p
              style={{
                fontSize: 15,
                color: "#374151",
                lineHeight: 1.4,
                marginBottom: 16,
              }}
            >
              ¿Seguro que quieres marcar este pedido como entregado?
            </p>

            <p
              style={{
                fontSize: 14,
                color: "#6b7280",
                marginBottom: 16,
              }}
            >
              Cliente: <strong>{pedidoParaEntregar.nombre}</strong>
            </p>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setPedidoParaEntregar(null)}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: "#e5e7eb",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  const pedidoConfirmado = pedidoParaEntregar;
                  setPedidoParaEntregar(null);
                  cambiarEstado(pedidoConfirmado, "entregado");
                }}
                disabled={pedidoEstaActualizando(pedidoParaEntregar.id) || !conectado}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: "#16a34a",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Sí, entregar
              </button>
            </div>
          </div>
        </div>
      )}

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

        <p
          style={{
            margin: "6px 0 0",
            fontWeight: "bold",
            color: conectado ? "#16a34a" : "#dc2626",
          }}
        >
          {conectado ? "🟢 Conectado al servidor" : "🔴 Sin conexión"}
        </p>

        <p
          style={{
            margin: "6px 0 0",
            fontWeight: "bold",
            color: disponible ? "#16a34a" : "#dc2626",
          }}
        >
          {disponible ? "🟢 En servicio" : "🔴 Fuera de servicio"}
        </p>

        <button
          onClick={cambiarDisponibilidad}
          disabled={cambiandoServicio || !conectado}
          style={{
            marginTop: 8,
            marginRight: 8,
            padding: "7px 10px",
            borderRadius: 8,
            border: "none",
            background: disponible ? "#dc2626" : "#16a34a",
            color: "white",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {cambiandoServicio
            ? "Actualizando..."
            : disponible
              ? "🔴 Ponerme fuera de servicio"
              : "🟢 Volver a servicio"}
        </button>

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

      {!servicioGlobal.activo && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            border: "1px solid #ef4444",
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          ⏰ Todos están fuera de servicio. Los clientes ya no pueden enviar pedidos nuevos.
        </div>
      )}

      {!disponible && (
        <div
          style={{
            background: "#fff7ed",
            color: "#9a3412",
            border: "1px solid #fb923c",
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          🔴 Estás fuera de servicio. Puedes terminar tus pedidos activos y aceptar pedidos que ya habían llegado antes de salir. No puedes aceptar pedidos nuevos que lleguen después.
        </div>
      )}

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

        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 14,
              color: sonidoPedidos ? "#166534" : "#6b7280",
              fontWeight: "bold",
            }}
          >
            {sonidoPedidos
              ? "🔔 Sonido de pedidos activo"
              : "🔕 Sonido de pedidos apagado"}
          </p>

          {!sonidoPedidos && (
            <button
              onClick={activarSonidoPedidos}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "none",
                background: "#f59e0b",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              🔔 Activar sonido
            </button>
          )}
        </div>
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
        const actualizandoPedido = pedidoEstaActualizando(p.id);
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

              {!finalizado && !pedidoTieneRepartidor && puedoAceptarPedido(p) && (
                <button
                  onClick={() => cambiarEstado(p, "aceptado")}
                  disabled={actualizandoPedido || !conectado}
                >
                  {actualizandoPedido ? "Actualizando..." : "✔ Aceptar"}
                </button>
              )}

              {!finalizado &&
                !pedidoTieneRepartidor &&
                !puedoAceptarPedido(p) &&
                !disponible && (
                  <p
                    style={{
                      width: "100%",
                      color: "#9a3412",
                      fontWeight: "bold",
                      marginTop: 6,
                    }}
                  >
                    🔴 Este pedido llegó después de que te pusiste fuera de servicio.
                  </p>
                )}

              {!finalizado && esMio && (
                <>
                  {estado !== "en camino" && (
                    <button
                      onClick={() => cambiarEstado(p, "en camino")}
                      disabled={actualizandoPedido || !conectado}
                    >
                      {actualizandoPedido ? "Actualizando..." : "🚀 En camino"}
                    </button>
                  )}

                  <button
                    onClick={() => setPedidoParaEntregar(p)}
                    disabled={actualizandoPedido || !conectado}
                  >
                    {actualizandoPedido ? "Actualizando..." : "✅ Entregado"}
                  </button>
                </>
              )}

              {!finalizado && (esMio || !pedidoTieneRepartidor) && (
                <button
                  onClick={() => cancelarPedidoRepartidor(p)}
                  disabled={actualizandoPedido || !conectado}
                  style={{
                    background: "#dc2626",
                    color: "white",
                  }}
                >
                  {actualizandoPedido ? "Actualizando..." : "❌ Cancelar pedido"}
                </button>
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
