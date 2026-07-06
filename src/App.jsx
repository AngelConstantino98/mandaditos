import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import logo from "./assets/logo.png";
import Mapa from "./Mapa";
import negocios from "./negocios";
import "./App.css";

const SOCKET_URL = "https://mandaditos-backend.onrender.com";
// Para producción después usaremos:
// const SOCKET_URL = "https://mandaditos-backend.onrender.com";

const MENSAJE_GANADOR = `🎉 ¡Felicidades!

Tu envío será totalmente GRATIS.
El repartidor ya fue notificado.`;

const MENSAJE_PERDEDOR = `😔 Esta vez no ganaste

Gracias por participar.
¡Te deseamos suerte en tu próximo pedido!`;

export default function App() {
  const socketRef = useRef(null);
  const pedidoActualRef = useRef(null);
  const screenRef = useRef("splash");
  const navegandoConBotonAtrasRef = useRef(false);

  const [screen, setScreenBase] = useState("splash");

  // 💬 Alerta formal dentro de la app para no mostrar el nombre del dominio del navegador.
  const [alertaApp, setAlertaApp] = useState(null);

  const mostrarAlerta = (mensaje, titulo = "MandaPlus") => {
    setAlertaApp({
      titulo,
      mensaje,
    });
  };

  const cerrarAlerta = () => {
    setAlertaApp(null);
  };

  // 📱 Navegación interna para que el botón "atrás" del teléfono funcione dentro de la app.
  const setScreen = (nuevaPantalla, opciones = {}) => {
    const pantallaFinal =
      typeof nuevaPantalla === "function"
        ? nuevaPantalla(screenRef.current)
        : nuevaPantalla;

    if (!pantallaFinal) return;

    const pantallaAnterior = screenRef.current;

    screenRef.current = pantallaFinal;
    setScreenBase(pantallaFinal);

    const puedeUsarHistorial =
      typeof window !== "undefined" &&
      !opciones.sinHistorial &&
      !navegandoConBotonAtrasRef.current;

    if (!puedeUsarHistorial) return;

    const state = {
      mandaPlusScreen: pantallaFinal,
    };

    if (opciones.reemplazar || pantallaAnterior === "splash") {
      window.history.replaceState(state, "", window.location.href);
      return;
    }

    if (pantallaFinal !== pantallaAnterior) {
      window.history.pushState(state, "", window.location.href);
    }
  };

  // 📲 Instalación PWA
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const [nombre, setNombre] = useState("");
  const [pedido, setPedido] = useState("");
  const [notaPedido, setNotaPedido] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [zona, setZona] = useState("");

  const [coords, setCoords] = useState(null);
  const [repartidor, setRepartidor] = useState(null);

  const [pedidoActual, setPedidoActual] = useState(null);
  const [pedidos, setPedidos] = useState([]);

  const [showCancel, setShowCancel] = useState(null);

  // 🍽️ Negocios locales
  const [negocioSeleccionado, setNegocioSeleccionado] = useState(null);

  // 🛒 Carrito visual de negocios locales
  const [carrito, setCarrito] = useState([]);

  // 🌮 Selector de guisos
  const [productoParaGuisos, setProductoParaGuisos] = useState(null);
  const [guisosSeleccionados, setGuisosSeleccionados] = useState([]);
  const [cantidadProductoGuisos, setCantidadProductoGuisos] = useState(1);

  // 🧀 Selector de extras
  const [productoParaExtras, setProductoParaExtras] = useState(null);
  const [extrasSeleccionados, setExtrasSeleccionados] = useState([]);
  const [cantidadProductoExtras, setCantidadProductoExtras] = useState(1);

  // 📋 Selector de opciones
  const [productoParaOpciones, setProductoParaOpciones] = useState(null);

  // 🍓 Selector de toppings y jarabes
  const [productoParaToppings, setProductoParaToppings] = useState(null);
  const [toppingsSeleccionados, setToppingsSeleccionados] = useState([]);
  const [jarabesSeleccionados, setJarabesSeleccionados] = useState([]);
  const [cantidadProductoToppings, setCantidadProductoToppings] = useState(1);
  const [mostrarSelectorJarabes, setMostrarSelectorJarabes] = useState(false);

  // 🍀 Estados de promoción
  const [sorteando, setSorteando] = useState(false);
  const [resultadoPromo, setResultadoPromo] = useState(null);
  const [ocultarPromoInicio, setOcultarPromoInicio] = useState(false);

  // ⭐ Estado de recompensas
  const [recompensa, setRecompensa] = useState({
    pedidosCompletados: 0,
    meta: 10,
    recompensaDisponible: false,
    faltan: 10
  });

  // 🟢 Servicio disponible si al menos un repartidor está trabajando
  const [servicio, setServicio] = useState({
    activo: true,
    repartidores: [],
    mensaje: "Servicio disponible."
  });

  // 👤 Cliente con cuenta opcional: teléfono + PIN
  const [cliente, setCliente] = useState(() => {
    try {
      const guardado = localStorage.getItem("cliente");
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  });

  // 🔐 CLIENTE ID FIJO Y SEGURO
  const [clienteId, setClienteId] = useState(() => {
    try {
      const clienteGuardado = localStorage.getItem("cliente");
      if (clienteGuardado) {
        const clienteParsed = JSON.parse(clienteGuardado);
        if (clienteParsed?.clienteId) {
          localStorage.setItem("clienteId", clienteParsed.clienteId);
          return clienteParsed.clienteId;
        }
      }
    } catch {
      // continúa con clienteId local
    }

    let id = localStorage.getItem("clienteId");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("clienteId", id);
    }
    return id;
  });

  // 🔐 Formulario de acceso
  const [authModo, setAuthModo] = useState("login"); // login | registro
  const [authNombre, setAuthNombre] = useState("");
  const [authTelefono, setAuthTelefono] = useState("");
  const [authPin, setAuthPin] = useState("");
  const [authMensaje, setAuthMensaje] = useState("");
  const [authCargando, setAuthCargando] = useState(false);

  // 👑 Panel dueño
  const [dueno, setDueno] = useState(() => {
    try {
      const guardado = localStorage.getItem("duenoActivo");
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  });
  const [duenoUsuario, setDuenoUsuario] = useState("");
  const [duenoPin, setDuenoPin] = useState("");
  const [duenoMensaje, setDuenoMensaje] = useState("");
  const [duenoCargando, setDuenoCargando] = useState(false);
  const [duenoResumen, setDuenoResumen] = useState(null);
  const [duenoFecha, setDuenoFecha] = useState(() => {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Mexico_City",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(new Date());
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
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

  // 📱 Mantener referencia de pantalla actual
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  // 📱 Botón físico "atrás" de Android / botón atrás del navegador
  useEffect(() => {
    window.history.replaceState(
      { mandaPlusScreen: screenRef.current },
      "",
      window.location.href
    );

    const manejarBotonAtras = (event) => {
      const pantallaAnterior = event.state?.mandaPlusScreen;

      if (!pantallaAnterior) {
        return;
      }

      navegandoConBotonAtrasRef.current = true;

      setShowCancel(null);
      setProductoParaGuisos(null);
      setProductoParaExtras(null);
      setProductoParaOpciones(null);
      setProductoParaToppings(null);

      screenRef.current = pantallaAnterior;
      setScreenBase(pantallaAnterior);

      setTimeout(() => {
        navegandoConBotonAtrasRef.current = false;
      }, 0);
    };

    window.addEventListener("popstate", manejarBotonAtras);

    return () => {
      window.removeEventListener("popstate", manejarBotonAtras);
    };
  }, []);

  // 📲 Detectar si la app se puede instalar
  useEffect(() => {
    const ua = window.navigator.userAgent || "";

    const ios =
      /iPhone|iPad|iPod/i.test(ua) ||
      (window.navigator.platform === "MacIntel" &&
        window.navigator.maxTouchPoints > 1);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    setIsIOS(ios);
    setIsStandalone(standalone);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    const installedHandler = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const instalarApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();

      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("📲 MandaPlus instalada");
      } else {
        console.log("Instalación cancelada");
      }

      setDeferredPrompt(null);
      setCanInstall(false);
      return;
    }

    if (isIOS) {
      mostrarAlerta(
        "Para instalar MandaPlus en iPhone:\n\n1. Abre esta app en Safari\n2. Toca el botón Compartir\n3. Elige 'Agregar a pantalla de inicio'"
      );
      return;
    }

    mostrarAlerta(
      "Para instalar MandaPlus, abre el menú del navegador y elige 'Instalar app' o 'Agregar a pantalla principal'."
    );
  };

  // SPLASH
  useEffect(() => {
    const timer = setTimeout(() => {
      const accesoDueno = window.location.hash === "#dueno";

      if (accesoDueno) {
        const duenoGuardado = localStorage.getItem("duenoActivo");
        setScreen(duenoGuardado ? "dueno-panel" : "dueno-login", { reemplazar: true });
        return;
      }

      const clienteGuardado = localStorage.getItem("cliente");
      setScreen(clienteGuardado ? "home" : "auth", { reemplazar: true });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // 👑 Acceso oculto al Panel Dueño con #dueno
  useEffect(() => {
    const abrirPanelDuenoPorHash = () => {
      if (window.location.hash === "#dueno") {
        setScreen(dueno ? "dueno-panel" : "dueno-login");
      }
    };

    abrirPanelDuenoPorHash();

    window.addEventListener("hashchange", abrirPanelDuenoPorHash);

    return () => {
      window.removeEventListener("hashchange", abrirPanelDuenoPorHash);
    };
  }, [dueno]);

  // 📦 Mantener referencia actual del pedido para filtrar GPS del repartidor correcto
  useEffect(() => {
    pedidoActualRef.current = pedidoActual;
  }, [pedidoActual]);

  // SOCKET
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      query: { clienteId }
    });

    socketRef.current.on("connect", () => {
      console.log("🟢 Cliente conectado:", socketRef.current.id);

      socketRef.current.emit("obtener-recompensa", (data) => {
        if (data) {
          setRecompensa(data);
        }
      });

      socketRef.current.emit("obtener-servicio", (data) => {
        if (data) {
          setServicio(data);
        }
      });
    });

    socketRef.current.on("connect_error", (err) => {
      console.log("🔴 Error de conexión:", err.message);
    });

    socketRef.current.on("pedido-actualizado", (data) => {
      if (data.clienteId !== clienteId) return;

      setPedidoActual(data);

      const estadoPedido = String(data.estado || "").toLowerCase();

      if (estadoPedido === "cancelado" || estadoPedido === "entregado") {
        setRepartidor(null);
      }

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
      setOcultarPromoInicio(false);

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

    socketRef.current.on("recompensa-actualizada", (data) => {
      if (data) {
        setRecompensa(data);
      }
    });

    socketRef.current.on("servicio-actualizado", (data) => {
      if (data) {
        setServicio(data);
      }
    });

    socketRef.current.on("pedido-rechazado", (data) => {
      mostrarAlerta(
        data?.mensaje || "Por el momento estamos fuera de servicio. Intenta más tarde.",
        "Fuera de servicio"
      );
    });

    socketRef.current.on("repartidor-movimiento", (data) => {
      const pedidoVigente = pedidoActualRef.current;

      if (!pedidoVigente?.id) {
        return;
      }

      const estadoPedido = String(pedidoVigente.estado || "").toLowerCase();

      if (estadoPedido === "cancelado" || estadoPedido === "entregado") {
        setRepartidor(null);
        return;
      }

      if (!pedidoVigente.repartidorId || !data?.repartidorId) {
        return;
      }

      if (String(pedidoVigente.repartidorId) !== String(data.repartidorId)) {
        return;
      }

      setRepartidor(data);
    });

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

  // 👤 Guardar sesión del cliente
  const guardarSesionCliente = (clienteData, recompensaData = null) => {
    if (!clienteData?.clienteId) return;

    localStorage.setItem("cliente", JSON.stringify(clienteData));
    localStorage.setItem("clienteId", clienteData.clienteId);

    setCliente(clienteData);
    setClienteId(clienteData.clienteId);

    if (clienteData.nombre) {
      setNombre(clienteData.nombre);
    }

    if (recompensaData) {
      setRecompensa(recompensaData);
    }

    setPedidos([]);
    setPedidoActual(null);
    localStorage.removeItem("pedidoActual");

    setAuthMensaje("");
    setAuthPin("");
    setScreen("home", { reemplazar: true });
  };

  // 🔐 Registrar o iniciar sesión con teléfono + PIN
  const enviarAuth = async (modo) => {
    try {
      setAuthCargando(true);
      setAuthMensaje("");

      const telefonoLimpio = authTelefono.replace(/\D/g, "");

      if (telefonoLimpio.length < 10) {
        setAuthMensaje("Escribe un número de teléfono válido.");
        return;
      }

      if (!/^\d{4,6}$/.test(authPin)) {
        setAuthMensaje("El PIN debe tener de 4 a 6 números.");
        return;
      }

      if (modo === "registrar" && !authNombre.trim()) {
        setAuthMensaje("Escribe tu nombre.");
        return;
      }

      const body =
        modo === "registrar"
          ? {
              nombre: authNombre.trim(),
              telefono: telefonoLimpio,
              pin: authPin,
              clienteIdActual: clienteId
            }
          : {
              telefono: telefonoLimpio,
              pin: authPin
            };

      const res = await fetch(`${SOCKET_URL}/auth/${modo}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setAuthMensaje(data.mensaje || "No se pudo continuar.");
        return;
      }

      guardarSesionCliente(data.cliente, data.recompensa);
    } catch (error) {
      setAuthMensaje("No se pudo conectar con el servidor.");
    } finally {
      setAuthCargando(false);
    }
  };

  // 🚪 Cerrar sesión / cambiar cuenta
  const cerrarSesion = () => {
    localStorage.removeItem("cliente");
    setCliente(null);
    setAuthModo("login");
    setAuthNombre("");
    setAuthTelefono("");
    setAuthPin("");
    setAuthMensaje("");
    setScreen("auth", { reemplazar: true });
  };

  // 👑 Iniciar sesión del dueño
  const iniciarSesionDueno = async () => {
    try {
      setDuenoCargando(true);
      setDuenoMensaje("");

      if (!duenoUsuario.trim() || !duenoPin.trim()) {
        setDuenoMensaje("Escribe usuario y PIN.");
        return;
      }

      const res = await fetch(`${SOCKET_URL}/dueno/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          usuario: duenoUsuario.trim(),
          pin: duenoPin.trim()
        })
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setDuenoMensaje(data.mensaje || "No se pudo iniciar sesión.");
        return;
      }

      const duenoActivo = {
        ...data.dueno,
        pin: duenoPin.trim()
      };

      localStorage.setItem("duenoActivo", JSON.stringify(duenoActivo));

      setDueno(duenoActivo);
      setDuenoUsuario("");
      setDuenoPin("");
      setScreen("dueno-panel", { reemplazar: true });

      cargarResumenDueno(duenoActivo, duenoFecha);
    } catch (error) {
      console.log("Error login dueño:", error);
      setDuenoMensaje("No se pudo conectar con el servidor.");
    } finally {
      setDuenoCargando(false);
    }
  };

  // 👑 Cargar resumen de entregas
  const cargarResumenDueno = async (duenoActivo = dueno, fecha = duenoFecha) => {
    try {
      if (!duenoActivo?.usuario || !duenoActivo?.pin) {
        setScreen("dueno-login", { reemplazar: true });
        return;
      }

      setDuenoCargando(true);
      setDuenoMensaje("");

      const res = await fetch(`${SOCKET_URL}/dueno/resumen-entregas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          usuario: duenoActivo.usuario,
          pin: duenoActivo.pin,
          fecha
        })
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setDuenoMensaje(data.mensaje || "No se pudo cargar el resumen.");
        return;
      }

      setDuenoResumen(data);
    } catch (error) {
      console.log("Error cargando resumen dueño:", error);
      setDuenoMensaje("No se pudo conectar con el servidor.");
    } finally {
      setDuenoCargando(false);
    }
  };

  // 👑 Cerrar sesión del dueño
  const cerrarSesionDueno = () => {
    localStorage.removeItem("duenoActivo");
    setDueno(null);
    setDuenoResumen(null);
    setDuenoUsuario("");
    setDuenoPin("");
    setDuenoMensaje("");
    setScreen("home", { reemplazar: true });
  };

  // ENVIAR
  const enviar = () => {
    if (!nombre || !pedido || !ubicacion || !zona) {
      mostrarAlerta("Completa todos los campos");
      return;
    }

    if (!servicio.activo) {
      mostrarAlerta(
        "Por el momento estamos fuera de servicio. Intenta más tarde.",
        "Fuera de servicio"
      );
      return;
    }

    const pedidoFinal = notaPedido.trim()
      ? `${pedido}

Notas del pedido:
${notaPedido.trim()}`
      : pedido;

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
      pedido: pedidoFinal,
      ubicacion,
      zona,
      costo,
      gps: ubicacionGPS,
      estado: "pendiente",
      repartidorId: "",
      repartidorNombre: "",
      fecha: new Date().toISOString()
    };

    socketRef.current
      .timeout(7000)
      .emit("nuevo-pedido", pedidoData, (err, respuesta) => {
        if (err || !respuesta?.ok) {
          mostrarAlerta(
            respuesta?.mensaje ||
              "No se pudo enviar el pedido. Intenta nuevamente.",
            "Pedido no enviado"
          );
          return;
        }

        const pedidoGuardado = respuesta.pedido || pedidoData;

        setPedidoActual(pedidoGuardado);
        localStorage.setItem("pedidoActual", JSON.stringify(pedidoGuardado));

        setResultadoPromo(null);
        setSorteando(false);
        setOcultarPromoInicio(false);

        const numero = "529621816603";

        const mensaje = `🏍️ NUEVO PEDIDO DESDE MANDAPLUS

👤 ${nombre}
🛒 ${pedidoFinal}
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
        setNotaPedido("");
        setUbicacion("");
        setZona("");
        setCoords(null);
        setCarrito([]);
        setNegocioSeleccionado(null);

        setScreen("home", { reemplazar: true });
      });
  };

  // 🍀 PROBAR SUERTE
  const probarSuerte = () => {
    if (!pedidoActual?.id) {
      mostrarAlerta("Primero realiza un pedido.");
      return;
    }

    const estadoPedidoActual = String(pedidoActual.estado || "").toLowerCase();

    if (estadoPedidoActual === "cancelado") {
      setResultadoPromo({
        tipo: "error",
        mensaje: "Los pedidos cancelados no pueden participar."
      });
      return;
    }

    if (estadoPedidoActual !== "entregado") {
      setResultadoPromo({
        tipo: "error",
        mensaje: "🍀 Podrás probar tu suerte cuando el repartidor marque tu pedido como entregado.\n\nSi ganas, no se te cobra el envío."
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
    setOcultarPromoInicio(false);

    socketRef.current
      .timeout(7000)
      .emit("probar-suerte", { pedidoId: pedidoActual.id }, (err, resultado) => {
        setSorteando(false);
        setOcultarPromoInicio(false);

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

  // 🧼 Limpia texto para crear ids seguros
  const limpiarTextoId = (texto) =>
    String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-");

  // 💵 Revisa si un producto tiene precio visible.
  // Si precio es null, mostramos precioTexto como "Precio a consultar" o "Ver opciones".
  const productoTienePrecio = (producto) =>
    producto?.precio !== null &&
    producto?.precio !== undefined &&
    producto?.precio !== "" &&
    !Number.isNaN(Number(producto.precio));

  const mostrarPrecioProducto = (producto) => {
    if (!productoTienePrecio(producto)) {
      return producto?.precioTexto || "Precio a consultar";
    }

    return `$${Number(producto.precio || 0)}`;
  };

  const mostrarPrecioLineaCarrito = (item) => {
    if (!productoTienePrecio(item)) {
      return item.precioTexto || "Precio a consultar";
    }

    return `$${Number(item.precio || 0) * Number(item.cantidad || 1)}`;
  };

  // 💰 Calcula precio del producto según guisos y extras.
  const calcularPrecioProducto = (producto, guisos = [], extras = []) => {
    let precioBase = productoTienePrecio(producto)
      ? Number(producto.precio || 0)
      : null;

    if (producto.preciosPorGuisos) {
      // Quesillo NO cuenta como carne
      const cantidadCarnes = guisos.filter(
        (guiso) => limpiarTextoId(guiso) !== "quesillo"
      ).length;

      // 3 carnes o más = $75
      if (cantidadCarnes >= 3) {
        precioBase =
          producto.preciosPorGuisos.tresOMasCarnes ??
          producto.preciosPorGuisos.tresOMas ??
          producto.precio;
      } else if (cantidadCarnes === 2) {
        // 2 carnes = $65
        precioBase =
          producto.preciosPorGuisos.dosCarnes ??
          producto.preciosPorGuisos.dos ??
          producto.precio;
      } else if (cantidadCarnes === 1) {
        // 1 carne = $60
        precioBase =
          producto.preciosPorGuisos.unaCarne ??
          producto.preciosPorGuisos.uno ??
          producto.precio;
      } else if (
        cantidadCarnes === 0 &&
        guisos.some((guiso) => limpiarTextoId(guiso) === "quesillo")
      ) {
        // Solo quesillo = $60
        precioBase =
          producto.preciosPorGuisos.unaCarne ??
          producto.preciosPorGuisos.uno ??
          producto.precio;
      }
    }

    if (producto.preciosPorSeleccion) {
      if (guisos.length >= 3 && producto.preciosPorSeleccion.tresOMas) {
        precioBase = producto.preciosPorSeleccion.tresOMas;
      } else if (guisos.length === 1 && producto.preciosPorSeleccion.uno) {
        precioBase = producto.preciosPorSeleccion.uno;
      }
    }

    if (precioBase === null || precioBase === undefined || precioBase === "") {
      return null;
    }

    const totalExtras = extras.reduce(
      (total, extra) => total + Number(extra.precio || 0),
      0
    );

    return Number(precioBase || 0) + totalExtras;
  };

  // 🛒 AGREGAR PRODUCTOS AL CARRITO VISUAL
  const agregarProductoAlCarrito = (producto) => {
    if (!negocioSeleccionado) return;

    // Si tiene toppings o jarabes, abrimos ventana especial.
    // Esto se usa para Monsis Fresas.
    if (
      (Array.isArray(producto.toppings) && producto.toppings.length > 0) ||
      (Array.isArray(producto.jarabes) && producto.jarabes.length > 0)
    ) {
      setProductoParaToppings(producto);
      setToppingsSeleccionados([]);
      setJarabesSeleccionados([]);
      setCantidadProductoToppings(1);
      setMostrarSelectorJarabes(false);
      return;
    }

    // Si tiene opciones, abrimos ventana para agregar una o varias opciones sin salir.
    if (Array.isArray(producto.opciones) && producto.opciones.length > 0) {
      setProductoParaOpciones(producto);
      return;
    }

    // Si tiene guisos, abrimos ventana para elegir guiso(s) y cantidad.
    if (Array.isArray(producto.guisos) && producto.guisos.length > 0) {
      setProductoParaGuisos(producto);
      setGuisosSeleccionados(producto.guisos.length === 1 ? producto.guisos : []);
      setCantidadProductoGuisos(1);
      return;
    }

    // Si tiene extras, abrimos ventana para elegir extra(s) y cantidad.
    if (Array.isArray(producto.extras) && producto.extras.length > 0) {
      setProductoParaExtras(producto);
      setExtrasSeleccionados([]);
      setCantidadProductoExtras(1);
      return;
    }

    // Si no tiene opciones, guisos ni extras, se agrega normal.
    agregarProductoConfiguradoAlCarrito(producto, [], 1, []);
  };

  // ✅ Agrega producto ya configurado con guisos, extras y cantidad al carrito
  const agregarProductoConfiguradoAlCarrito = (
    producto,
    guisos = [],
    cantidad = 1,
    extras = []
  ) => {
    if (!negocioSeleccionado) return;

    const cantidadFinal = Math.max(Number(cantidad) || 1, 1);
    const guisosLimpios = guisos.filter(Boolean);
    const extrasLimpios = extras.filter(Boolean);

    const guisosBase = Array.isArray(producto.guisosBase)
      ? producto.guisosBase
      : [];

    const guisosParaNombre = [...guisosBase, ...guisosLimpios];

    const opcionesParaNombre = [
      ...guisosParaNombre,
      ...extrasLimpios.map((extra) => extra.nombre)
    ];

    const guisosId = guisosLimpios.map(limpiarTextoId).join("-");
    const extrasId = extrasLimpios
      .map((extra) => limpiarTextoId(extra.id || extra.nombre))
      .join("-");

    const carritoId = [producto.id, guisosId, extrasId]
      .filter(Boolean)
      .join("-");

    const nombreFinal =
      opcionesParaNombre.length > 0
        ? `${producto.nombre} (${opcionesParaNombre.join(", ")})`
        : producto.nombre;

    const precioFinal = calcularPrecioProducto(
      producto,
      guisosLimpios,
      extrasLimpios
    );

    setCarrito((prev) => {
      const existe = prev.find(
        (item) =>
          item.id === carritoId &&
          item.negocioId === negocioSeleccionado.id
      );

      if (existe) {
        return prev.map((item) =>
          item.id === carritoId && item.negocioId === negocioSeleccionado.id
            ? { ...item, cantidad: item.cantidad + cantidadFinal }
            : item
        );
      }

      return [
        ...prev,
        {
          ...producto,
          id: carritoId,
          productoId: producto.productoBaseId || producto.id,
          nombre: nombreFinal,
          precio: precioFinal,
          precioTexto:
            precioFinal === null
              ? producto.precioTexto || "Precio a consultar"
              : producto.precioTexto,
          guisos: guisosLimpios,
          extras: extrasLimpios,
          opcion: producto.opcion || null,
          cantidad: cantidadFinal,
          negocioId: negocioSeleccionado.id,
          negocioNombre: negocioSeleccionado.nombre
        }
      ];
    });
  };

  // 🌮 Marcar/desmarcar guisos
  const alternarGuiso = (guiso) => {
    setGuisosSeleccionados((prev) => {
      if (prev.includes(guiso)) {
        return prev.filter((g) => g !== guiso);
      }

      if (productoParaGuisos?.maxGuisos && prev.length >= productoParaGuisos.maxGuisos) {
        mostrarAlerta(`Solo puedes elegir ${productoParaGuisos.maxGuisos} guisos extra.`);
        return prev;
      }

      return [...prev, guiso];
    });
  };

  // ✅ Confirmar producto con guisos
  const confirmarProductoConGuisos = () => {
    if (!productoParaGuisos) return;

    if (!productoParaGuisos.permitirSinGuisos && guisosSeleccionados.length === 0) {
      mostrarAlerta("Elige al menos un guiso.");
      return;
    }

    if (
      productoParaGuisos.cantidadExactaGuisosExtra &&
      guisosSeleccionados.length > 0 &&
      guisosSeleccionados.length !== productoParaGuisos.cantidadExactaGuisosExtra
    ) {
      mostrarAlerta(
        `Para este producto elige ${productoParaGuisos.cantidadExactaGuisosExtra} guisos extra o ninguno.`
      );
      return;
    }

    agregarProductoConfiguradoAlCarrito(
      productoParaGuisos,
      guisosSeleccionados,
      cantidadProductoGuisos,
      []
    );

    setProductoParaGuisos(null);
    setGuisosSeleccionados([]);
    setCantidadProductoGuisos(1);
  };

  // 🧀 Marcar/desmarcar extras
  const alternarExtra = (extra) => {
    setExtrasSeleccionados((prev) => {
      const existe = prev.some((item) => item.id === extra.id);

      if (existe) {
        return prev.filter((item) => item.id !== extra.id);
      }

      return [...prev, extra];
    });
  };

  // ✅ Confirmar producto con extras
  const confirmarProductoConExtras = () => {
    if (!productoParaExtras) return;

    agregarProductoConfiguradoAlCarrito(
      productoParaExtras,
      [],
      cantidadProductoExtras,
      extrasSeleccionados
    );

    setProductoParaExtras(null);
    setExtrasSeleccionados([]);
    setCantidadProductoExtras(1);
  };

  // 🍓 Marcar/desmarcar toppings
  const alternarTopping = (topping) => {
    setToppingsSeleccionados((prev) => {
      if (prev.includes(topping)) {
        return prev.filter((item) => item !== topping);
      }

      const maxToppings = Number(productoParaToppings?.maxToppings || 0);

      if (maxToppings > 0 && prev.length >= maxToppings) {
        mostrarAlerta(
          maxToppings === 1
            ? "Solo puedes elegir 1 topping."
            : `Solo puedes elegir ${maxToppings} toppings.`
        );
        return prev;
      }

      return [...prev, topping];
    });
  };

  // 🍯 Marcar/desmarcar jarabes
  // En Monsis Fresas solo se permite 1 jarabe.
  const alternarJarabe = (jarabe) => {
    setJarabesSeleccionados((prev) => {
      if (prev.includes(jarabe)) {
        return [];
      }

      return [jarabe];
    });
  };

  // ✅ Confirmar producto con toppings y jarabes
  const confirmarProductoConToppings = () => {
    if (!productoParaToppings) return;

    const maxToppings = Number(productoParaToppings.maxToppings || 0);

    if (
      Array.isArray(productoParaToppings.toppings) &&
      productoParaToppings.toppings.length > 0 &&
      toppingsSeleccionados.length === 0
    ) {
      mostrarAlerta(
        maxToppings === 1
          ? "Elige 1 topping."
          : "Elige al menos 1 topping."
      );
      return;
    }

    const toppingsLimpios = toppingsSeleccionados.filter(Boolean);
    const jarabesLimpios = jarabesSeleccionados.filter(Boolean);

    const detalles = [];

    if (toppingsLimpios.length > 0) {
      detalles.push(
        `${toppingsLimpios.length === 1 ? "Topping" : "Toppings"}: ${toppingsLimpios.join(", ")}`
      );
    }

    if (jarabesLimpios.length > 0) {
      detalles.push(`Jarabe: ${jarabesLimpios.join(", ")}`);
    }

    const detallesId = [...toppingsLimpios, ...jarabesLimpios]
      .map(limpiarTextoId)
      .join("-");

    const productoConfigurado = {
      ...productoParaToppings,
      id: `${productoParaToppings.id}-${detallesId || "sin-detalles"}`,
      productoBaseId: productoParaToppings.id,
      nombre:
        detalles.length > 0
          ? `${productoParaToppings.nombre} (${detalles.join(" | ")})`
          : productoParaToppings.nombre,
      precio: productoParaToppings.precio,
      precioTexto: productoParaToppings.precioTexto,
      toppingsElegidos: toppingsLimpios,
      jarabesElegidos: jarabesLimpios,
      toppings: undefined,
      jarabes: undefined,
    };

    agregarProductoConfiguradoAlCarrito(
      productoConfigurado,
      [],
      cantidadProductoToppings,
      []
    );

    setProductoParaToppings(null);
    setToppingsSeleccionados([]);
    setJarabesSeleccionados([]);
    setCantidadProductoToppings(1);
    setMostrarSelectorJarabes(false);
  };

  // ✅ Agregar una opción sin cerrar el selector
  const agregarOpcionAlCarrito = (productoBase, opcion, cantidad = 1) => {
    if (!productoBase || !opcion) return;

    const productoConOpcion = {
      ...productoBase,
      id: opcion.id,
      nombre: `${productoBase.nombre} - ${opcion.nombre}`,
      precio: opcion.precio,
      precioTexto: opcion.precioTexto,
      descripcion: opcion.descripcion || productoBase.descripcion,
      imagen: productoBase.imagen,
      opcion,
      opciones: undefined
    };

    agregarProductoConfiguradoAlCarrito(
      productoConOpcion,
      [],
      cantidad,
      []
    );
  };

  // 🛒 QUITAR PRODUCTOS DEL CARRITO VISUAL
  const quitarProductoDelCarrito = (productoId, negocioId) => {
    setCarrito((prev) => {
      let descontado = false;

      return prev
        .map((item) => {
          const baseId = item.productoId || item.id;

          if (
            !descontado &&
            baseId === productoId &&
            item.negocioId === negocioId
          ) {
            descontado = true;
            return { ...item, cantidad: item.cantidad - 1 };
          }

          return item;
        })
        .filter((item) => item.cantidad > 0);
    });
  };

  const obtenerCantidadProducto = (productoId, negocioId) => {
    return carrito
      .filter((item) => {
        const baseId = item.productoId || item.id;
        return baseId === productoId && item.negocioId === negocioId;
      })
      .reduce((total, item) => total + item.cantidad, 0);
  };

  const totalProductosCarrito = carrito.reduce(
    (total, item) => total + item.cantidad,
    0
  );

  const totalCarrito = carrito.reduce((total, item) => {
    if (!productoTienePrecio(item)) return total;
    return total + Number(item.precio || 0) * Number(item.cantidad || 1);
  }, 0);

  const carritoTienePrecioConsulta = carrito.some(
    (item) => !productoTienePrecio(item)
  );

  const textoTotalCarrito = carritoTienePrecioConsulta
    ? totalCarrito > 0
      ? `$${totalCarrito} + precio a consultar`
      : "Precio a consultar"
    : `$${totalCarrito}`;

  const limpiarCarrito = () => {
    setCarrito([]);
  };

  // 🛒 CONFIRMAR CARRITO Y PASARLO AL FORMULARIO
  const confirmarCarrito = () => {
    if (carrito.length === 0) {
      mostrarAlerta("Agrega al menos un producto al carrito.");
      return;
    }

    const carritoPorNegocio = carrito.reduce((grupos, item) => {
      const negocio = item.negocioNombre || "Negocio no especificado";

      if (!grupos[negocio]) {
        grupos[negocio] = [];
      }

      grupos[negocio].push(item);

      return grupos;
    }, {});

    const detallePorNegocio = Object.entries(carritoPorNegocio)
      .map(([negocio, productos]) => {
        const productosTexto = productos
          .map((item) => {
            const precioLinea = mostrarPrecioLineaCarrito(item);
            return `- ${item.cantidad} x ${item.nombre} — ${precioLinea}`;
          })
          .join("\n");

        return `🏪 ${negocio}\n${productosTexto}`;
      })
      .join("\n\n");

    const pedidoArmado = `Pedido de negocios locales:\n\n${detallePorNegocio}\n\nTotal productos: ${textoTotalCarrito}`;

    setPedido(pedidoArmado);
    setNotaPedido("");
    setScreen("form");
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

  // 🍀 Oculta el mensaje de la promoción en inicio después de 1 minuto.
  // El resultado sigue quedando visible en el historial del pedido.
  useEffect(() => {
    if (!promoParaMostrar) {
      setOcultarPromoInicio(false);
      return;
    }

    setOcultarPromoInicio(false);

    const timer = setTimeout(() => {
      setOcultarPromoInicio(true);
    }, 60000);

    return () => clearTimeout(timer);
  }, [pedidoActual?.id, promoParaMostrar?.tipo, promoParaMostrar?.mensaje]);

  // 📦 Oculta el pedido actual del inicio 10 minutos después de ser entregado.
  // Así el cliente tiene tiempo de presionar "Probar mi suerte".
  useEffect(() => {
    if (pedidoActual?.estado !== "entregado") {
      return;
    }

    const timer = setTimeout(() => {
      setPedidoActual(null);
      setResultadoPromo(null);
      localStorage.removeItem("pedidoActual");
    }, 600000);

    return () => clearTimeout(timer);
  }, [pedidoActual?.id, pedidoActual?.estado]);


  const mostrarBotonInstalar = !isStandalone && (canInstall || isIOS);

  const estiloBotonInstalar = {
    margin: "6px auto 8px",
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 700,
    border: "none",
    borderRadius: 999,
    background: "#111827",
    color: "white",
    cursor: "pointer",
    display: "block",
    boxShadow: "0 2px 6px rgba(0,0,0,0.18)"
  };

  // 👑 Si el dueño entra directo con #dueno y ya tiene sesión, cargamos el resumen.
  useEffect(() => {
    if (screen === "dueno-panel" && dueno && !duenoResumen) {
      cargarResumenDueno(dueno, duenoFecha);
    }
  }, [screen, dueno?.usuario]);



  return (
    <div className="app">

      {alertaApp && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
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
              textAlign: "center"
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                background: "#ecfdf5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 10px",
                fontSize: 28
              }}
            >
              ⚠️
            </div>

            <h2
              style={{
                fontSize: 20,
                marginBottom: 8,
                color: "#111827"
              }}
            >
              {alertaApp.titulo}
            </h2>

            <p
              style={{
                fontSize: 15,
                color: "#374151",
                whiteSpace: "pre-line",
                lineHeight: 1.4,
                marginBottom: 16
              }}
            >
              {alertaApp.mensaje}
            </p>

            <button
              className="btn"
              onClick={cerrarAlerta}
              style={{
                background: "#16a34a",
                color: "white",
                marginTop: 0
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {screen === "splash" && (
        <div className="splash">
          <div className="box">
            <img src={logo} style={{ width: "140px" }} />
            <h1>MandaPlus</h1>
            <p>Tu app de mandados a domicilio</p>
          </div>
        </div>
      )}

      {screen === "auth" && (
        <div className="card">

          <div className="header">
            <img src={logo} />
            <h1>🏍️ MandaPlus</h1>
            <h1>👤 Acceso de cliente</h1>

            {mostrarBotonInstalar && (
              <button
                type="button"
                onClick={instalarApp}
                style={estiloBotonInstalar}
              >
                📲 Instalar app
              </button>
            )}
          </div>

          <div
            style={{
              marginTop: 10,
              padding: 14,
              background: "#ffffff",
              borderRadius: 12,
              border: "1px solid #e5e7eb"
            }}
          >
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>
              {authModo === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </h2>

            <p style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>
              Usa tu teléfono y un PIN para que tus puntos no se pierdan si cambias de celular.
            </p>

            {authModo === "registro" && (
              <input
                value={authNombre}
                onChange={(e) => setAuthNombre(e.target.value)}
                placeholder="Nombre"
              />
            )}

            <input
              value={authTelefono}
              onChange={(e) => setAuthTelefono(e.target.value)}
              placeholder="Teléfono"
              inputMode="numeric"
            />

            <input
              value={authPin}
              onChange={(e) => setAuthPin(e.target.value)}
              placeholder="PIN de 4 a 6 números"
              inputMode="numeric"
              type="password"
            />

            {authMensaje && (
              <div
                style={{
                  marginTop: 10,
                  padding: 10,
                  background: "#fee2e2",
                  border: "1px solid #ef4444",
                  borderRadius: 10,
                  color: "#991b1b",
                  fontSize: 14
                }}
              >
                {authMensaje}
              </div>
            )}

            <button
              className="btn"
              onClick={() => enviarAuth(authModo === "login" ? "login" : "registrar")}
              disabled={authCargando}
              style={{ marginTop: 12 }}
            >
              {authCargando
                ? "Cargando..."
                : authModo === "login"
                  ? "Iniciar sesión"
                  : "Crear cuenta"}
            </button>

            <button
              onClick={() => {
                setAuthMensaje("");
                setAuthModo(authModo === "login" ? "registro" : "login");
              }}
              style={{
                marginTop: 10,
                padding: "8px 12px",
                borderRadius: 10,
                border: "none",
                background: "#e5e7eb",
                cursor: "pointer",
                width: "100%"
              }}
            >
              {authModo === "login"
                ? "No tengo cuenta, registrarme"
                : "Ya tengo cuenta, iniciar sesión"}
            </button>
          </div>

        </div>
      )}

      {screen === "home" && (
        <div
          className="card"
          style={{
            background:
              "linear-gradient(180deg, #f8fafc 0%, #eef2ff 42%, #ffffff 100%)",
            border: "1px solid #e5e7eb",
            boxShadow: "0 16px 35px rgba(15, 23, 42, 0.12)",
            gap: 12
          }}
        >
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 24,
              padding: "18px 18px 22px",
              background:
                "linear-gradient(135deg, #0f172a 0%, #1d4ed8 52%, #16a34a 100%)",
              color: "white",
              boxShadow: "0 14px 28px rgba(37, 99, 235, 0.28)"
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 170,
                height: 170,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.12)",
                top: -70,
                right: -65
              }}
            />

            <div
              style={{
                position: "absolute",
                width: 110,
                height: 110,
                borderRadius: "50%",
                background: "rgba(250,204,21,0.18)",
                bottom: -50,
                left: -40
              }}
            />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img
                  src={logo}
                  alt="MandaPlus"
                  style={{
                    width: 76,
                    height: 76,
                    objectFit: "contain",
                    borderRadius: 18,
                    background: "rgba(255,255,255,0.14)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    padding: 4
                  }}
                />

                <div>
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontSize: 13,
                      opacity: 0.9,
                      fontWeight: 700
                    }}
                  >
                    🛵 Servicio de mandados
                  </p>

                  <h1
                    style={{
                      margin: 0,
                      fontSize: 28,
                      lineHeight: 1.05,
                      letterSpacing: "-0.6px"
                    }}
                  >
                    MandaPlus
                  </h1>

                  <p
                    style={{
                      margin: "5px 0 0",
                      fontSize: 13,
                      opacity: 0.95,
                      fontWeight: 600
                    }}
                  >
                    Rápido, seguro y hasta tu puerta
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 14,
                  padding: "7px 11px",
                  borderRadius: 999,
                  background: servicio.activo
                    ? "rgba(220, 252, 231, 0.95)"
                    : "rgba(254, 226, 226, 0.95)",
                  color: servicio.activo ? "#166534" : "#991b1b",
                  fontSize: 13,
                  fontWeight: 900,
                  boxShadow: "0 6px 16px rgba(15,23,42,0.18)"
                }}
              >
                {servicio.activo ? "🟢 Servicio disponible" : "🔴 Fuera de servicio"}
              </div>

              <h2
                style={{
                  margin: "18px 0 0",
                  fontSize: 21,
                  lineHeight: 1.15,
                  color: "white",
                  textShadow: "0 2px 8px rgba(0,0,0,0.25)"
                }}
              >
                Hola{cliente?.nombre ? `, ${cliente.nombre.split(" ")[0]}` : ""} 👋
              </h2>

              {mostrarBotonInstalar && (
                <button
                  type="button"
                  onClick={instalarApp}
                  style={{
                    marginTop: 14,
                    padding: "8px 13px",
                    fontSize: 13,
                    fontWeight: 900,
                    border: "none",
                    borderRadius: 999,
                    background: "white",
                    color: "#111827",
                    cursor: "pointer",
                    boxShadow: "0 8px 18px rgba(0,0,0,0.22)"
                  }}
                >
                  📲 Instalar app
                </button>
              )}
            </div>
          </div>

          <div
            style={{
              padding: "13px 15px",
              background: "white",
              borderRadius: 18,
              border: "1px solid #e5e7eb",
              boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)"
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 15,
                color: "#111827",
                fontWeight: 900,
                lineHeight: 1.25
              }}
            >
              ¿Qué necesitas hoy?
            </p>

            <p
              style={{
                margin: "4px 0 0",
                fontSize: 13,
                color: "#64748b",
                lineHeight: 1.35,
                fontWeight: 600
              }}
            >
              Pide comida, compras, farmacia o cualquier mandado.
            </p>
          </div>

          {!servicio.activo && (
            <div
              style={{
                padding: 14,
                background: "#fff1f2",
                border: "1px solid #fb7185",
                borderRadius: 18,
                color: "#9f1239",
                fontWeight: "bold",
                textAlign: "center",
                boxShadow: "0 8px 18px rgba(244, 63, 94, 0.12)"
              }}
            >
              ⏰ Por el momento estamos fuera de servicio.
              <br />
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                Intenta más tarde. Gracias por tu comprensión.
              </span>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10
            }}
          >
            <button
              onClick={() => {
                if (!servicio.activo) {
                  mostrarAlerta(
                    "Por el momento estamos fuera de servicio. Intenta más tarde.",
                    "Fuera de servicio"
                  );
                  return;
                }

                setNegocioSeleccionado(null);
                setScreen("negocios-locales");
              }}
              style={{
                border: "none",
                borderRadius: 18,
                padding: 14,
                textAlign: "left",
                color: "white",
                background: "linear-gradient(135deg, #f97316, #facc15)",
                boxShadow: "0 10px 22px rgba(249, 115, 22, 0.28)",
                cursor: "pointer",
                minHeight: 112
              }}
            >
              <div style={{ fontSize: 30, marginBottom: 8 }}>🍽️</div>
              <strong style={{ display: "block", fontSize: 15 }}>
                Negocios locales{totalProductosCarrito > 0 ? ` (${totalProductosCarrito})` : ""}
              </strong>
              <span
                style={{
                  display: "block",
                  fontSize: 12,
                  marginTop: 5,
                  opacity: 0.95
                }}
              >
                Menús, comida y antojos
              </span>
            </button>

            <button
              onClick={() => {
                if (!servicio.activo) {
                  mostrarAlerta(
                    "Por el momento estamos fuera de servicio. Intenta más tarde.",
                    "Fuera de servicio"
                  );
                  return;
                }

                setScreen("form");
              }}
              style={{
                border: "none",
                borderRadius: 18,
                padding: 14,
                textAlign: "left",
                color: "white",
                background: "linear-gradient(135deg, #16a34a, #22c55e)",
                boxShadow: "0 10px 22px rgba(34, 197, 94, 0.25)",
                cursor: "pointer",
                minHeight: 112
              }}
            >
              <div style={{ fontSize: 30, marginBottom: 8 }}>📦</div>
              <strong style={{ display: "block", fontSize: 15 }}>
                Pedido personalizado
              </strong>
              <span
                style={{
                  display: "block",
                  fontSize: 12,
                  marginTop: 5,
                  opacity: 0.95
                }}
              >
                Pide lo que necesites
              </span>
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: cliente ? "1fr auto" : "1fr",
              gap: 10,
              alignItems: "center",
              padding: 13,
              background: "rgba(255,255,255,0.96)",
              borderRadius: 18,
              border: "1px solid #e5e7eb",
              boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)"
            }}
          >
            {cliente ? (
              <>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 15,
                      fontWeight: 900,
                      color: "#111827"
                    }}
                  >
                    👤 {cliente.nombre}
                  </p>

                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 13,
                      color: "#64748b",
                      fontWeight: 700
                    }}
                  >
                    📱 {cliente.telefono}
                  </p>
                </div>

                <button
                  onClick={cerrarSesion}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 12,
                    border: "none",
                    background: "#f1f5f9",
                    color: "#334155",
                    cursor: "pointer",
                    fontWeight: 800
                  }}
                >
                  Cambiar
                </button>
              </>
            ) : (
              <>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 15,
                      fontWeight: 900,
                      color: "#111827"
                    }}
                  >
                    👤 Cuenta de cliente
                  </p>

                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 13,
                      color: "#64748b"
                    }}
                  >
                    Inicia sesión para conservar tus recompensas.
                  </p>
                </div>

                <button
                  onClick={() => setScreen("auth")}
                  style={{
                    marginTop: 10,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "none",
                    background: "#2563eb",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: 900,
                    width: "100%"
                  }}
                >
                  Iniciar sesión
                </button>
              </>
            )}
          </div>

          <div
            style={{
              background: "white",
              borderRadius: 20,
              border: "1px solid #e5e7eb",
              overflow: "hidden",
              boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)"
            }}
          >
            <div style={{ padding: "12px 14px 10px" }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  color: "#111827"
                }}
              >
                📍 Ubicación y repartidor
              </h2>

              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: 13,
                  color: "#64748b"
                }}
              >
                Comparte tu ubicación y sigue al repartidor cuando inicie su GPS.
              </p>
            </div>

            <div
              className="cliente-mapa-card"
              style={{
                borderTop: "1px solid #e5e7eb"
              }}
            >
              <style>
                {`
                  .cliente-mapa-card .leaflet-container {
                    height: 260px !important;
                    min-height: 260px !important;
                    max-height: 260px !important;
                  }

                  .cliente-mapa-card {
                    overflow: hidden;
                  }
                `}
              </style>

              <Mapa setCoords={setCoords} repartidor={repartidor} />
            </div>
          </div>

          <div
            style={{
              padding: 14,
              background: recompensa.recompensaDisponible
                ? "linear-gradient(135deg, #fff7ed, #fef3c7)"
                : "white",
              borderRadius: 20,
              border: recompensa.recompensaDisponible
                ? "1px solid #f59e0b"
                : "1px solid #e5e7eb",
              boxShadow: recompensa.recompensaDisponible
                ? "0 10px 24px rgba(245, 158, 11, 0.16)"
                : "0 10px 24px rgba(15, 23, 42, 0.07)"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: 8
              }}
            >
              <h2 style={{ fontSize: 19, margin: 0, color: "#111827" }}>
                ⭐ Recompensas
              </h2>

              <span
                style={{
                  padding: "5px 9px",
                  borderRadius: 999,
                  background: recompensa.recompensaDisponible
                    ? "#f59e0b"
                    : "#e2e8f0",
                  color: recompensa.recompensaDisponible ? "white" : "#334155",
                  fontSize: 12,
                  fontWeight: 900
                }}
              >
                {recompensa.recompensaDisponible
                  ? "Cupón listo"
                  : `${recompensa.pedidosCompletados}/${recompensa.meta}`}
              </span>
            </div>

            {recompensa.recompensaDisponible ? (
              <>
                <p
                  style={{
                    fontWeight: "bold",
                    color: "#92400e",
                    marginBottom: 8,
                    fontSize: 15
                  }}
                >
                  🎁 ¡Tienes un cupón de $20 disponible!
                </p>

                <p
                  style={{
                    fontSize: 13,
                    color: "#78350f",
                    lineHeight: 1.35,
                    margin: 0
                  }}
                >
                  Se aplicará automáticamente en tu próximo pedido. Si el envío cuesta $20, tu envío será GRATIS. Si el envío cuesta más, solo pagarás la diferencia. Después de usarlo, tu progreso volverá a 0/10.
                </p>
              </>
            ) : (
              <>
                <p style={{ fontSize: 14, marginBottom: 8 }}>
                  Pedidos completados:{" "}
                  <strong>
                    {recompensa.pedidosCompletados}/{recompensa.meta}
                  </strong>
                </p>

                <div
                  style={{
                    width: "100%",
                    height: 11,
                    background: "#e5e7eb",
                    borderRadius: 999,
                    overflow: "hidden",
                    marginBottom: 8
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(
                        100,
                        (recompensa.pedidosCompletados / recompensa.meta) * 100
                      )}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #22c55e, #16a34a)"
                    }}
                  />
                </div>

                <p style={{ fontSize: 13, color: "#555", margin: 0 }}>
                  Te faltan <strong>{recompensa.faltan}</strong> pedidos entregados para ganar un cupón de $20.
                </p>
              </>
            )}
          </div>

          {pedidoActual && (
            <div
              style={{
                padding: 14,
                background: "white",
                borderRadius: 20,
                border: "1px solid #e5e7eb",
                boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)"
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  marginBottom: 10
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: 18,
                    color: "#111827"
                  }}
                >
                  📦 Pedido actual
                </h2>

                <span
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 900,
                    color:
                      pedidoActual.estado === "entregado"
                        ? "#166534"
                        : pedidoActual.estado === "cancelado"
                          ? "#991b1b"
                          : pedidoActual.estado === "en camino"
                            ? "#1d4ed8"
                            : "#92400e",
                    background:
                      pedidoActual.estado === "entregado"
                        ? "#dcfce7"
                        : pedidoActual.estado === "cancelado"
                          ? "#fee2e2"
                          : pedidoActual.estado === "en camino"
                            ? "#dbeafe"
                            : "#fef3c7"
                  }}
                >
                  {pedidoActual.estado === "entregado"
                    ? "✅ Entregado"
                    : pedidoActual.estado === "cancelado"
                      ? "❌ Cancelado"
                      : pedidoActual.estado === "en camino"
                        ? "🚀 En camino"
                        : `📦 ${pedidoActual.estado}`}
                </span>
              </div>

              <div
                style={{
                  padding: 12,
                  background: "#f8fafc",
                  borderRadius: 16,
                  border: "1px solid #e2e8f0"
                }}
              >
                <p style={{ margin: "0 0 7px", fontWeight: 800 }}>
                  👤 {pedidoActual.nombre}
                </p>

                <p
                  style={{
                    margin: "0 0 7px",
                    whiteSpace: "pre-line",
                    fontSize: 14,
                    color: "#334155",
                    lineHeight: 1.35
                  }}
                >
                  🛒 {pedidoActual.pedido}
                </p>

                {pedidoActual.repartidorNombre && (
                  <p
                    style={{
                      margin: 0,
                      color: "#2563eb",
                      fontWeight: 900
                    }}
                  >
                    🛵 Repartidor asignado: {pedidoActual.repartidorNombre}
                  </p>
                )}
              </div>

              {!pedidoActual.promocion?.participo &&
                pedidoActual.estado !== "cancelado" && (
                  <button
                    className="btn"
                    onClick={probarSuerte}
                    disabled={sorteando}
                    style={{
                      marginTop: 12,
                      background: "linear-gradient(135deg, #22c55e, #16a34a)",
                      borderRadius: 14,
                      boxShadow: "0 8px 18px rgba(34,197,94,0.22)"
                    }}
                  >
                    {sorteando ? "🎁 Revisando tu suerte..." : "🍀 Probar mi suerte"}
                  </button>
                )}

              {promoParaMostrar && !ocultarPromoInicio && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 14,
                    borderRadius: 16,
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

          <button
            className="btn"
            onClick={() => setScreen("historial")}
            style={{
              marginTop: 2,
              background: "#0f172a",
              borderRadius: 16,
              boxShadow: "0 8px 18px rgba(15, 23, 42, 0.18)"
            }}
          >
            📜 Historial de pedidos{pedidos.length > 0 ? ` (${pedidos.length})` : ""}
          </button>
        </div>
      )}


      {screen === "dueno-login" && (
        <div className="card">

          <button
            onClick={() => {
              setDuenoMensaje("");
              setScreen("home", { reemplazar: true });
            }}
            style={{
              width: "fit-content",
              padding: "8px 12px",
              borderRadius: 10,
              border: "none",
              background: "#e5e7eb",
              cursor: "pointer"
            }}
          >
            ← Volver
          </button>

          <div className="header">
            <img src={logo} />
            <h1>👑 Panel Dueño</h1>
            <p style={{ fontSize: 14, color: "#666" }}>
              Acceso privado para revisar cuentas de repartidores.
            </p>
          </div>

          <div
            style={{
              marginTop: 10,
              padding: 14,
              background: "#ffffff",
              borderRadius: 12,
              border: "1px solid #e5e7eb"
            }}
          >
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>
              Iniciar sesión
            </h2>

            <input
              value={duenoUsuario}
              onChange={(e) => setDuenoUsuario(e.target.value)}
              placeholder="Usuario dueño"
            />

            <input
              value={duenoPin}
              onChange={(e) => setDuenoPin(e.target.value)}
              placeholder="PIN"
              inputMode="numeric"
              type="password"
            />

            {duenoMensaje && (
              <div
                style={{
                  marginTop: 10,
                  padding: 10,
                  background: "#fee2e2",
                  border: "1px solid #ef4444",
                  borderRadius: 10,
                  color: "#991b1b",
                  fontSize: 14
                }}
              >
                {duenoMensaje}
              </div>
            )}

            <button
              className="btn"
              onClick={iniciarSesionDueno}
              disabled={duenoCargando}
              style={{ marginTop: 12, background: "#111827" }}
            >
              {duenoCargando ? "Entrando..." : "Entrar"}
            </button>
          </div>

        </div>
      )}

      {screen === "dueno-panel" && (
        <div className="card">

          <button
            onClick={() => setScreen("home")}
            style={{
              width: "fit-content",
              padding: "8px 12px",
              borderRadius: 10,
              border: "none",
              background: "#e5e7eb",
              cursor: "pointer"
            }}
          >
            ← Volver
          </button>

          <div
            style={{
              marginTop: 10,
              padding: 12,
              background: "#111827",
              color: "white",
              borderRadius: 12
            }}
          >
            <h1 style={{ fontSize: 22, marginBottom: 6 }}>
              👑 Panel Dueño
            </h1>

            <p style={{ fontSize: 14 }}>
              Dueño activo: <strong>{dueno?.nombre || "Dueño"}</strong>
            </p>

            <button
              onClick={cerrarSesionDueno}
              style={{
                marginTop: 8,
                padding: "6px 10px",
                borderRadius: 8,
                border: "none",
                background: "#ef4444",
                color: "white",
                cursor: "pointer"
              }}
            >
              Cerrar sesión dueño
            </button>
          </div>

          <div
            style={{
              marginTop: 10,
              padding: 12,
              background: "#ffffff",
              borderRadius: 12,
              border: "1px solid #e5e7eb"
            }}
          >
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>
              📅 Corte del día
            </h2>

            <input
              type="date"
              value={duenoFecha}
              onChange={(e) => setDuenoFecha(e.target.value)}
            />

            <button
              className="btn"
              onClick={() => cargarResumenDueno(dueno, duenoFecha)}
              disabled={duenoCargando}
              style={{ marginTop: 8, background: "#2563eb" }}
            >
              {duenoCargando ? "Cargando..." : "Actualizar resumen"}
            </button>

            {duenoMensaje && (
              <div
                style={{
                  marginTop: 10,
                  padding: 10,
                  background: "#fee2e2",
                  border: "1px solid #ef4444",
                  borderRadius: 10,
                  color: "#991b1b",
                  fontSize: 14
                }}
              >
                {duenoMensaje}
              </div>
            )}
          </div>

          {duenoResumen && (
            <>
              <div
                style={{
                  marginTop: 10,
                  padding: 14,
                  background: "#ecfdf5",
                  borderRadius: 12,
                  border: "1px solid #22c55e",
                  textAlign: "center"
                }}
              >
                <h2 style={{ fontSize: 20, marginBottom: 6 }}>
                  Total del día: ${duenoResumen.totalGeneral || 0}
                </h2>

                <p style={{ fontSize: 14, color: "#166534" }}>
                  Entregas registradas: <strong>{duenoResumen.totalEntregas || 0}</strong>
                </p>
              </div>

              <div style={{ marginTop: 10 }}>
                {duenoResumen.resumen?.map((item) => (
                  <div
                    key={item.repartidorId}
                    style={{
                      marginBottom: 10,
                      padding: 12,
                      background: "#ffffff",
                      borderRadius: 12,
                      border: "1px solid #e5e7eb"
                    }}
                  >
                    <h3 style={{ fontSize: 18 }}>
                      🛵 {item.repartidorNombre}
                    </h3>

                    <p>
                      Entregas: <strong>{item.entregas}</strong>
                    </p>

                    <p style={{ color: "#16a34a", fontWeight: "bold" }}>
                      Debe entregar al dueño: ${item.totalDueno}
                    </p>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  background: "#ffffff",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb"
                }}
              >
                <h2 style={{ fontSize: 18, marginBottom: 8 }}>
                  📋 Detalle de entregas
                </h2>

                {duenoResumen.detalles?.length === 0 && (
                  <p style={{ fontSize: 14, color: "#666" }}>
                    No hay entregas registradas en esta fecha.
                  </p>
                )}

                {duenoResumen.detalles?.map((entrega) => (
                  <div
                    key={entrega.pedidoId}
                    style={{
                      marginBottom: 8,
                      padding: 10,
                      background: "#f8fafc",
                      borderRadius: 10,
                      border: "1px solid #e5e7eb"
                    }}
                  >
                    <p>
                      <strong>🕒 Hora:</strong> {entrega.hora || "Sin hora"}
                    </p>

                    <p>
                      <strong>🛵 Repartidor:</strong> {entrega.repartidorNombre}
                    </p>

                    <p>
                      <strong>👤 Cliente:</strong> {entrega.clienteNombre || "No especificado"}
                    </p>

                    <p>
                      <strong>📍 Zona:</strong> {entrega.zona || "No especificada"}
                    </p>

                    <p>
                      <strong>💰 Envío:</strong> {entrega.costo || "No especificado"}
                    </p>

                    <p style={{ color: "#16a34a", fontWeight: "bold" }}>
                      Comisión dueño: ${entrega.comisionDueno || 10}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      )}

      {screen === "historial" && (
        <div className="card">

          <button
            onClick={() => {
              setShowCancel(null);
              setScreen("home", { reemplazar: true });
            }}
            style={{
              width: "fit-content",
              padding: "8px 12px",
              borderRadius: 10,
              border: "none",
              background: "#e5e7eb",
              cursor: "pointer"
            }}
          >
            ← Volver
          </button>

          <div
            style={{
              marginTop: 10,
              padding: 12,
              background: "#ffffff",
              borderRadius: 12,
              border: "1px solid #e5e7eb"
            }}
          >
            <h1 style={{ fontSize: 22, marginBottom: 6 }}>
              📜 Historial de pedidos
            </h1>

            <p style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>
              Aquí puedes revisar tus últimos pedidos y cancelar los que sigan activos.
            </p>

            {pedidos.length === 0 && (
              <p style={{ fontSize: 14, color: "#666" }}>
                Aún no hay pedidos en tu historial.
              </p>
            )}

            {pedidos.map((p) => (
              <div
                key={p.id}
                style={{
                  marginBottom: 10,
                  padding: 10,
                  background: "#f8fafc",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb"
                }}
              >
                <p><strong>👤 Cliente:</strong> {p.nombre}</p>
                <p style={{ whiteSpace: "pre-line" }}>
                  <strong>🛒 Pedido:</strong> {p.pedido}
                </p>
                <p><strong>📦 Estado:</strong> {p.estado}</p>
                <p><strong>📍 Zona:</strong> {p.zona || "No especificada"}</p>

                {p.promocion?.participo && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: 12,
                      borderRadius: 12,
                      background: p.promocion.ganador ? "#dcfce7" : "#fef3c7",
                      border: p.promocion.ganador
                        ? "1px solid #22c55e"
                        : "1px solid #f59e0b",
                      color: p.promocion.ganador ? "#14532d" : "#78350f",
                      textAlign: "center",
                      fontWeight: "bold",
                      whiteSpace: "pre-line",
                      lineHeight: "1.4"
                    }}
                  >
                    {p.promocion.ganador ? MENSAJE_GANADOR : MENSAJE_PERDEDOR}
                  </div>
                )}

                {p.estado !== "cancelado" && p.estado !== "entregado" && (
                  <button
                    onClick={() => setShowCancel(p.id)}
                    style={{
                      marginTop: 8,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: "#ef4444",
                      color: "white",
                      cursor: "pointer"
                    }}
                  >
                    Cancelar pedido
                  </button>
                )}

                {p.estado === "entregado" && (
                  <p style={{ color: "green", fontWeight: "bold", marginTop: 8 }}>
                    ✅ Pedido entregado
                  </p>
                )}

                {p.estado === "cancelado" && (
                  <p style={{ color: "red", fontWeight: "bold", marginTop: 8 }}>
                    ❌ Pedido cancelado
                  </p>
                )}

                {showCancel === p.id && (
                  <div
                    style={{
                      marginTop: 10,
                      background: "#fff",
                      padding: 10,
                      borderRadius: 10,
                      border: "1px solid #e5e7eb"
                    }}
                  >
                    <p>¿Cancelar pedido?</p>

                    <button
                      onClick={() => cancelarPedido(p.id)}
                      style={{
                        marginRight: 8,
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "none",
                        background: "#ef4444",
                        color: "white",
                        cursor: "pointer"
                      }}
                    >
                      Sí
                    </button>

                    <button
                      onClick={() => setShowCancel(null)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "none",
                        background: "#e5e7eb",
                        cursor: "pointer"
                      }}
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      )}

      {screen === "negocios-locales" && (
        <div className="card">

          <button
            onClick={() => {
              setNegocioSeleccionado(null);
              setScreen("home", { reemplazar: true });
            }}
            style={{
              width: "fit-content",
              padding: "8px 12px",
              borderRadius: 10,
              border: "none",
              background: "#e5e7eb",
              cursor: "pointer"
            }}
          >
            ← Volver
          </button>

          <div
            style={{
              marginTop: 10,
              padding: 12,
              background: "#ffffff",
              borderRadius: 12,
              border: "1px solid #e5e7eb"
            }}
          >
            <h1 style={{ fontSize: 22, marginBottom: 6 }}>
              🍽️ Negocios locales
            </h1>

            <p style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>
              Elige un negocio para ver su menú.
            </p>

            {negocios.map((negocio) => (
  <button
    key={negocio.id}
    onClick={() => {
      setNegocioSeleccionado(negocio);
      setScreen("menu-negocio");
    }}
    style={{
      width: "100%",
      padding: 10,
      marginBottom: 10,
      borderRadius: 12,
      border: "1px solid #ddd",
      background: "#f9fafb",
      textAlign: "left",
      cursor: "pointer",
      display: "flex",
      gap: 10,
      alignItems: "center"
    }}
  >
    <div
      style={{
        width: 70,
        height: 70,
        borderRadius: 12,
        background: "#f3f4f6",
        overflow: "hidden",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 28
      }}
    >
      {negocio.imagen ? (
        <img
          src={negocio.imagen}
          alt={negocio.nombre}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover"
          }}
        />
      ) : (
        negocio.emoji
      )}
    </div>

    <div>
      <strong>
        {negocio.emoji} {negocio.nombre}
      </strong>

      <br />

      <span style={{ fontSize: 13, color: "#666" }}>
        {negocio.descripcion}
      </span>
    </div>
  </button>
))}
          </div>

        </div>
      )}

      {screen === "menu-negocio" && negocioSeleccionado && (
        <div className="card">

          <button
            onClick={() => {
              setScreen("negocios-locales", { reemplazar: true });
            }}
            style={{
              width: "fit-content",
              padding: "8px 12px",
              borderRadius: 10,
              border: "none",
              background: "#e5e7eb",
              cursor: "pointer"
            }}
          >
            ← Volver
          </button>

          <div
            style={{
              marginTop: 10,
              padding: 12,
              background: "#ffffff",
              borderRadius: 12,
              border: "1px solid #e5e7eb"
            }}
          >
            <h1 style={{ fontSize: 22 }}>
              {negocioSeleccionado.emoji} {negocioSeleccionado.nombre}
            </h1>

            <p style={{ fontSize: 14, color: "#666", marginTop: 5 }}>
              {negocioSeleccionado.descripcion}
            </p>
          </div>

          {carrito.length > 0 && (
            <div
              style={{
                marginTop: 10,
                padding: 12,
                background: "#ecfdf5",
                borderRadius: 12,
                border: "1px solid #22c55e"
              }}
            >
              <h2 style={{ fontSize: 18, marginBottom: 8 }}>
                🛒 Carrito
              </h2>

              {carrito.map((item) => (
                <div
                  key={`${item.negocioId}-${item.id}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    marginBottom: 6,
                    fontSize: 14
                  }}
                >
                  <span>
                    {item.cantidad} x {item.nombre}
                  </span>

                  <strong>{mostrarPrecioLineaCarrito(item)}</strong>
                </div>
              ))}

              <hr style={{ margin: "8px 0" }} />

              <p style={{ fontWeight: "bold", marginBottom: 8 }}>
                Total productos: {textoTotalCarrito}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap"
                }}
              >
                <button
                  onClick={confirmarCarrito}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "none",
                    background: "#22c55e",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  ✅ Confirmar carrito
                </button>

                <button
                  onClick={limpiarCarrito}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "none",
                    background: "#ef4444",
                    color: "white",
                    cursor: "pointer"
                  }}
                >
                  Vaciar carrito
                </button>
              </div>

              <p style={{ fontSize: 12, color: "#166534", marginTop: 8 }}>
                Al confirmar, este carrito se pasará al formulario del pedido.
              </p>
            </div>
          )}

          <div style={{ marginTop: 10 }}>
            {negocioSeleccionado.productos.map((producto) => {
              const cantidad = obtenerCantidadProducto(
                producto.id,
                negocioSeleccionado.id
              );

              return (
                <div
                  key={producto.id}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: 10,
                    marginBottom: 10,
                    background: "#ffffff",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb"
                  }}
                >
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 12,
                      background: "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 30,
                      flexShrink: 0,
                      overflow: "hidden"
                    }}
                  >
                    {producto.imagen ? (
                      <img
                        src={producto.imagen}
                        alt={producto.nombre}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover"
                        }}
                      />
                    ) : (
                      "🍽️"
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 16, marginBottom: 4 }}>
                      {producto.nombre}
                    </h3>

                    <p style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>
                      {producto.descripcion}
                    </p>

                    <strong>{mostrarPrecioProducto(producto)}</strong>

                    {cantidad === 0 ? (
                      <button
                        onClick={() => agregarProductoAlCarrito(producto)}
                        style={{
                          width: "100%",
                          marginTop: 8,
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "none",
                          background: "#22c55e",
                          color: "white",
                          fontWeight: "bold",
                          cursor: "pointer"
                        }}
                      >
                        Agregar al pedido
                      </button>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginTop: 8
                        }}
                      >
                        <button
                          onClick={() =>
                            quitarProductoDelCarrito(
                              producto.id,
                              negocioSeleccionado.id
                            )
                          }
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            border: "none",
                            background: "#e5e7eb",
                            cursor: "pointer",
                            fontWeight: "bold"
                          }}
                        >
                          -
                        </button>

                        <strong>{cantidad}</strong>

                        <button
                          onClick={() => agregarProductoAlCarrito(producto)}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            border: "none",
                            background: "#22c55e",
                            color: "white",
                            cursor: "pointer",
                            fontWeight: "bold"
                          }}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {productoParaGuisos && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "14px 12px",
            zIndex: 999999,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch"
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 430,
              maxHeight: "calc(100dvh - 28px)",
              background: "white",
              borderRadius: 18,
              padding: 16,
              boxSizing: "border-box",
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch"
            }}
          >
            <h2 style={{ fontSize: 20, marginBottom: 6 }}>
              {productoParaGuisos.nombre}
            </h2>

            {productoParaGuisos.guisosBase?.length > 0 && (
              <div
                style={{
                  marginBottom: 10,
                  padding: 10,
                  background: "#fef3c7",
                  border: "1px solid #f59e0b",
                  borderRadius: 10,
                  fontSize: 14
                }}
              >
                Incluye: <strong>{productoParaGuisos.guisosBase.join(", ")}</strong>
              </div>
            )}

            <p style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>
              {productoParaGuisos.textoSelector || "Elige uno o varios guisos:"}
            </p>

            <div style={{ display: "grid", gap: 9 }}>
              {productoParaGuisos.guisos.map((guiso) => (
                <label
                  key={guiso}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "12px 11px",
                    minHeight: 48,
                    background: guisosSeleccionados.includes(guiso)
                      ? "#dcfce7"
                      : "#f8fafc",
                    border: guisosSeleccionados.includes(guiso)
                      ? "1px solid #22c55e"
                      : "1px solid #e5e7eb",
                    borderRadius: 12,
                    cursor: "pointer",
                    textTransform: "capitalize",
                    lineHeight: 1.25,
                    boxSizing: "border-box"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={guisosSeleccionados.includes(guiso)}
                    onChange={() => alternarGuiso(guiso)}
                    style={{
                      flexShrink: 0,
                      marginTop: 2
                    }}
                  />

                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      whiteSpace: "normal",
                      overflowWrap: "anywhere",
                      wordBreak: "normal",
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#111827"
                    }}
                  >
                    {guiso}
                  </span>
                </label>
              ))}
            </div>

            <p style={{ marginTop: 12, fontWeight: "bold" }}>
              Precio unitario: ${calcularPrecioProducto(productoParaGuisos, guisosSeleccionados)}
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                marginTop: 12,
                padding: 10,
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                borderRadius: 10
              }}
            >
              <strong>Cantidad</strong>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() =>
                    setCantidadProductoGuisos((prev) => Math.max(prev - 1, 1))
                  }
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    border: "none",
                    background: "#e5e7eb",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  -
                </button>

                <strong>{cantidadProductoGuisos}</strong>

                <button
                  onClick={() => setCantidadProductoGuisos((prev) => prev + 1)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    border: "none",
                    background: "#22c55e",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <p style={{ marginTop: 10, fontWeight: "bold" }}>
              Total: ${calcularPrecioProducto(productoParaGuisos, guisosSeleccionados) * cantidadProductoGuisos}
            </p>

            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 12,
                position: "sticky",
                bottom: 0,
                background: "white",
                paddingTop: 10,
                paddingBottom: 2
              }}
            >
              <button
                onClick={confirmarProductoConGuisos}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  border: "none",
                  background: "#22c55e",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer",
                  minHeight: 46
                }}
              >
                Agregar
              </button>

              <button
                onClick={() => {
                  setProductoParaGuisos(null);
                  setGuisosSeleccionados([]);
                  setCantidadProductoGuisos(1);
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  border: "none",
                  background: "#e5e7eb",
                  cursor: "pointer",
                  minHeight: 46,
                  fontWeight: "bold"
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}


      {productoParaToppings && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 9999
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 430,
              background: "white",
              borderRadius: 16,
              padding: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            <h2 style={{ fontSize: 20, marginBottom: 6 }}>
              {productoParaToppings.nombre}
            </h2>

            <p style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>
              {productoParaToppings.descripcion}
            </p>

            {Array.isArray(productoParaToppings.toppings) &&
              productoParaToppings.toppings.length > 0 && (
                <>
                  <p style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>
                    {productoParaToppings.textoToppings ||
                      `Elige hasta ${productoParaToppings.maxToppings || 1} topping(s):`}
                  </p>

                  <div style={{ display: "grid", gap: 8 }}>
                    {productoParaToppings.toppings.map((topping) => {
                      const seleccionado = toppingsSeleccionados.includes(topping);

                      return (
                        <label
                          key={topping}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 10,
                            padding: "12px 11px",
                            minHeight: 48,
                            background: seleccionado ? "#dcfce7" : "#f8fafc",
                            border: seleccionado
                              ? "1px solid #22c55e"
                              : "1px solid #e5e7eb",
                            borderRadius: 10,
                            cursor: "pointer"
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={seleccionado}
                            onChange={() => alternarTopping(topping)}
                            style={{
                              flexShrink: 0,
                              marginTop: 2
                            }}
                          />

                          <span
                            style={{
                              flex: 1,
                              minWidth: 0,
                              whiteSpace: "normal",
                              overflowWrap: "anywhere",
                              fontWeight: 700
                            }}
                          >
                            {topping}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
                    Seleccionados: {toppingsSeleccionados.length}/
                    {productoParaToppings.maxToppings || 1}
                  </p>
                </>
              )}

            {Array.isArray(productoParaToppings.jarabes) &&
              productoParaToppings.jarabes.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setMostrarSelectorJarabes((prev) => !prev)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 10,
                      border: "none",
                      background: "#f59e0b",
                      color: "white",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    🍯 Seleccionar jarabe
                    {jarabesSeleccionados.length > 0
                      ? ` (${jarabesSeleccionados[0]})`
                      : ""}
                  </button>

                  {mostrarSelectorJarabes && (
                    <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                      <p style={{ fontSize: 14, color: "#666" }}>
                        Elige solo 1 jarabe:
                      </p>

                      {productoParaToppings.jarabes.map((jarabe) => {
                        const seleccionado = jarabesSeleccionados.includes(jarabe);

                        return (
                          <label
                            key={jarabe}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: 10,
                              background: seleccionado ? "#dcfce7" : "#f8fafc",
                              border: seleccionado
                                ? "1px solid #22c55e"
                                : "1px solid #e5e7eb",
                              borderRadius: 10,
                              cursor: "pointer"
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={seleccionado}
                              onChange={() => alternarJarabe(jarabe)}
                              style={{
                                flexShrink: 0,
                                marginTop: 2
                              }}
                            />

                            <span
                              style={{
                                flex: 1,
                                minWidth: 0,
                                whiteSpace: "normal",
                                overflowWrap: "anywhere",
                                fontWeight: 700
                              }}
                            >
                              {jarabe}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            <p style={{ marginTop: 12, fontWeight: "bold" }}>
              Precio unitario: {mostrarPrecioProducto(productoParaToppings)}
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                marginTop: 12,
                padding: 10,
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                borderRadius: 10
              }}
            >
              <strong>Cantidad</strong>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() =>
                    setCantidadProductoToppings((prev) => Math.max(prev - 1, 1))
                  }
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    border: "none",
                    background: "#e5e7eb",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  -
                </button>

                <strong>{cantidadProductoToppings}</strong>

                <button
                  onClick={() => setCantidadProductoToppings((prev) => prev + 1)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    border: "none",
                    background: "#22c55e",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <p style={{ marginTop: 10, fontWeight: "bold" }}>
              Total:{" "}
              {productoTienePrecio(productoParaToppings)
                ? `$${Number(productoParaToppings.precio || 0) * cantidadProductoToppings}`
                : mostrarPrecioProducto(productoParaToppings)}
            </p>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                onClick={confirmarProductoConToppings}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 10,
                  border: "none",
                  background: "#22c55e",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                Agregar
              </button>

              <button
                onClick={() => {
                  setProductoParaToppings(null);
                  setToppingsSeleccionados([]);
                  setJarabesSeleccionados([]);
                  setCantidadProductoToppings(1);
                  setMostrarSelectorJarabes(false);
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 10,
                  border: "none",
                  background: "#e5e7eb",
                  cursor: "pointer"
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}


      {productoParaOpciones && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 9999
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 430,
              background: "white",
              borderRadius: 16,
              padding: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            <h2 style={{ fontSize: 20, marginBottom: 6 }}>
              {productoParaOpciones.nombre}
            </h2>

            <p style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>
              {productoParaOpciones.textoSelector || "Agrega una o varias opciones:"}
            </p>

            <div style={{ display: "grid", gap: 8 }}>
              {productoParaOpciones.opciones.map((opcion) => {
                const cantidadOpcion = obtenerCantidadProducto(
                  opcion.id,
                  negocioSeleccionado.id
                );

                return (
                  <div
                    key={opcion.id}
                    style={{
                      padding: 10,
                      background: cantidadOpcion > 0 ? "#dcfce7" : "#f8fafc",
                      border: cantidadOpcion > 0
                        ? "1px solid #22c55e"
                        : "1px solid #e5e7eb",
                      borderRadius: 10
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <strong>{opcion.nombre}</strong>

                        {opcion.descripcion && (
                          <p style={{ fontSize: 12, color: "#666", marginTop: 3 }}>
                            {opcion.descripcion}
                          </p>
                        )}
                      </div>

                      <strong>{mostrarPrecioProducto(opcion)}</strong>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        marginTop: 10
                      }}
                    >
                      <span style={{ fontSize: 13, color: "#166534" }}>
                        {cantidadOpcion > 0
                          ? `En carrito: ${cantidadOpcion}`
                          : "Aún no agregado"}
                      </span>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          onClick={() =>
                            quitarProductoDelCarrito(
                              opcion.id,
                              negocioSeleccionado.id
                            )
                          }
                          disabled={cantidadOpcion === 0}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            border: "none",
                            background: cantidadOpcion === 0 ? "#f3f4f6" : "#e5e7eb",
                            color: cantidadOpcion === 0 ? "#9ca3af" : "#111827",
                            cursor: cantidadOpcion === 0 ? "not-allowed" : "pointer",
                            fontWeight: "bold"
                          }}
                        >
                          -
                        </button>

                        <strong>{cantidadOpcion}</strong>

                        <button
                          onClick={() =>
                            agregarOpcionAlCarrito(
                              productoParaOpciones,
                              opcion,
                              1
                            )
                          }
                          style={{
                            minWidth: 90,
                            height: 34,
                            padding: "0 10px",
                            borderRadius: 10,
                            border: "none",
                            background: "#22c55e",
                            color: "white",
                            cursor: "pointer",
                            fontWeight: "bold"
                          }}
                        >
                          + Agregar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p style={{ marginTop: 12, fontWeight: "bold" }}>
              Total productos: {textoTotalCarrito}
            </p>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                onClick={() => setProductoParaOpciones(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 10,
                  border: "none",
                  background: "#22c55e",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                Listo
              </button>

              <button
                onClick={() => setProductoParaOpciones(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 10,
                  border: "none",
                  background: "#e5e7eb",
                  cursor: "pointer"
                }}
              >
                Cerrar
              </button>
            </div>

            <p style={{ fontSize: 12, color: "#166534", marginTop: 8 }}>
              Puedes agregar varias opciones sin salir de esta ventana.
            </p>
          </div>
        </div>
      )}


      {productoParaExtras && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 9999
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 380,
              background: "white",
              borderRadius: 16,
              padding: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
            }}
          >
            <h2 style={{ fontSize: 20, marginBottom: 6 }}>
              {productoParaExtras.nombre}
            </h2>

            <p style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>
              Puedes agregar extras si lo deseas:
            </p>

            <div style={{ display: "grid", gap: 8 }}>
              {productoParaExtras.extras.map((extra) => {
                const seleccionado = extrasSeleccionados.some(
                  (item) => item.id === extra.id
                );

                return (
                  <label
                    key={extra.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: 10,
                      background: seleccionado ? "#dcfce7" : "#f8fafc",
                      border: seleccionado
                        ? "1px solid #22c55e"
                        : "1px solid #e5e7eb",
                      borderRadius: 10,
                      cursor: "pointer"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={seleccionado}
                      onChange={() => alternarExtra(extra)}
                    />

                    <span style={{ flex: 1 }}>
                      {extra.nombre}
                    </span>

                    <strong>+${extra.precio}</strong>
                  </label>
                );
              })}
            </div>

            <p style={{ marginTop: 12, fontWeight: "bold" }}>
              Precio unitario: ${calcularPrecioProducto(productoParaExtras, [], extrasSeleccionados)}
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                marginTop: 12,
                padding: 10,
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                borderRadius: 10
              }}
            >
              <strong>Cantidad</strong>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() =>
                    setCantidadProductoExtras((prev) => Math.max(prev - 1, 1))
                  }
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    border: "none",
                    background: "#e5e7eb",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  -
                </button>

                <strong>{cantidadProductoExtras}</strong>

                <button
                  onClick={() => setCantidadProductoExtras((prev) => prev + 1)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    border: "none",
                    background: "#22c55e",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <p style={{ marginTop: 10, fontWeight: "bold" }}>
              Total: ${calcularPrecioProducto(productoParaExtras, [], extrasSeleccionados) * cantidadProductoExtras}
            </p>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                onClick={confirmarProductoConExtras}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 10,
                  border: "none",
                  background: "#22c55e",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                Agregar
              </button>

              <button
                onClick={() => {
                  setProductoParaExtras(null);
                  setExtrasSeleccionados([]);
                  setCantidadProductoExtras(1);
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 10,
                  border: "none",
                  background: "#e5e7eb",
                  cursor: "pointer"
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === "form" && (
        <div className="card">

          <button
            type="button"
            onClick={() => setScreen("home")}
            style={{
              width: "fit-content",
              padding: "8px 12px",
              borderRadius: 10,
              border: "none",
              background: "#e5e7eb",
              cursor: "pointer",
              marginBottom: 10
            }}
          >
            ← Volver
          </button>

          <h1>📦 Pedido personalizado</h1>

          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
          />

          <textarea
            value={pedido}
            onChange={(e) => setPedido(e.target.value)}
            placeholder="Escribe lo que necesitas: comida, compras, farmacia, mandado especial, etc."
            rows={6}
            style={{
              width: "100%",
              resize: "vertical",
              minHeight: 110,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
              fontFamily: "Arial, sans-serif"
            }}
          />

          <textarea
            value={notaPedido}
            onChange={(e) => setNotaPedido(e.target.value)}
            placeholder="Notas opcionales: sin cebolla, con salsa aparte, bien dorada, etc."
            rows={3}
            style={{
              width: "100%",
              resize: "vertical",
              minHeight: 70,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
              fontFamily: "Arial, sans-serif"
            }}
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