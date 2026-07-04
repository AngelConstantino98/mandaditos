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

  const [screen, setScreen] = useState("splash");

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
  const [opcionSeleccionada, setOpcionSeleccionada] = useState(null);
  const [cantidadProductoOpciones, setCantidadProductoOpciones] = useState(1);

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
      alert(
        "Para instalar MandaPlus en iPhone:\n\n1. Abre esta app en Safari\n2. Toca el botón Compartir\n3. Elige 'Agregar a pantalla de inicio'"
      );
      return;
    }

    alert(
      "Para instalar MandaPlus, abre el menú del navegador y elige 'Instalar app' o 'Agregar a pantalla principal'."
    );
  };

  // SPLASH
  useEffect(() => {
    const timer = setTimeout(() => {
      const clienteGuardado = localStorage.getItem("cliente");
      setScreen(clienteGuardado ? "home" : "auth");
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

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
    setScreen("home");
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
    setScreen("auth");
  };

  // ENVIAR
  const enviar = () => {
    if (!nombre || !pedido || !ubicacion || !zona) {
      alert("Completa todos los campos");
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
      fecha: new Date().toISOString()
    };

    socketRef.current.emit("nuevo-pedido", pedidoData);

    setPedidoActual(pedidoData);
    localStorage.setItem("pedidoActual", JSON.stringify(pedidoData));

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

    // Si tiene opciones, abrimos ventana para elegir una opción y cantidad.
    if (Array.isArray(producto.opciones) && producto.opciones.length > 0) {
      setProductoParaOpciones(producto);
      setOpcionSeleccionada(null);
      setCantidadProductoOpciones(1);
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
          productoId: producto.id,
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
        alert(`Solo puedes elegir ${productoParaGuisos.maxGuisos} guisos extra.`);
        return prev;
      }

      return [...prev, guiso];
    });
  };

  // ✅ Confirmar producto con guisos
  const confirmarProductoConGuisos = () => {
    if (!productoParaGuisos) return;

    if (!productoParaGuisos.permitirSinGuisos && guisosSeleccionados.length === 0) {
      alert("Elige al menos un guiso.");
      return;
    }

    if (
      productoParaGuisos.cantidadExactaGuisosExtra &&
      guisosSeleccionados.length > 0 &&
      guisosSeleccionados.length !== productoParaGuisos.cantidadExactaGuisosExtra
    ) {
      alert(
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

  // ✅ Confirmar producto con opción
  const confirmarProductoConOpcion = () => {
    if (!productoParaOpciones) return;

    if (!opcionSeleccionada) {
      alert("Elige una opción.");
      return;
    }

    const productoConOpcion = {
      ...productoParaOpciones,
      id: opcionSeleccionada.id,
      nombre: `${productoParaOpciones.nombre} - ${opcionSeleccionada.nombre}`,
      precio: opcionSeleccionada.precio,
      precioTexto: opcionSeleccionada.precioTexto,
      descripcion: opcionSeleccionada.descripcion || productoParaOpciones.descripcion,
      imagen: productoParaOpciones.imagen,
      opcion: opcionSeleccionada,
      opciones: undefined
    };

    agregarProductoConfiguradoAlCarrito(
      productoConOpcion,
      [],
      cantidadProductoOpciones,
      []
    );

    setProductoParaOpciones(null);
    setOpcionSeleccionada(null);
    setCantidadProductoOpciones(1);
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
      alert("Agrega al menos un producto al carrito.");
      return;
    }

    const negociosEnCarrito = [
      ...new Set(carrito.map((item) => item.negocioNombre))
    ];

    const textoNegocios =
      negociosEnCarrito.length === 1
        ? `Negocio: ${negociosEnCarrito[0]}`
        : `Negocios:\n${negociosEnCarrito.map((n) => `- ${n}`).join("\n")}`;

    const detalleProductos = carrito
      .map((item) => {
        const precioLinea = mostrarPrecioLineaCarrito(item);
        return `- ${item.cantidad} x ${item.nombre} — ${precioLinea}`;
      })
      .join("\n");

    const pedidoArmado = `${textoNegocios}\n\nPedido:\n${detalleProductos}\n\nTotal productos: ${textoTotalCarrito}`;

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

  // 📦 Oculta el pedido actual del inicio 1 minuto después de ser entregado.
  // El pedido sigue disponible en la pantalla de historial.
  useEffect(() => {
    if (pedidoActual?.estado !== "entregado") {
      return;
    }

    const timer = setTimeout(() => {
      setPedidoActual(null);
      setResultadoPromo(null);
      localStorage.removeItem("pedidoActual");
    }, 60000);

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



  return (
    <div className="app">

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
        <div className="card">

          <div className="header">
            <img src={logo} />
            <h1>🏍️ MandaPlus</h1>
            <h1>Tu app de mandados a domicilio</h1>

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
              padding: 10,
              background: "#f8fafc",
              borderRadius: 12,
              border: "1px solid #e5e7eb"
            }}
          >
            {cliente ? (
              <>
                <p style={{ fontSize: 14 }}>
                  👤 <strong>{cliente.nombre}</strong>
                </p>

                <p style={{ fontSize: 13, color: "#666" }}>
                  📱 {cliente.telefono}
                </p>

                <button
                  onClick={cerrarSesion}
                  style={{
                    marginTop: 8,
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "none",
                    background: "#e5e7eb",
                    cursor: "pointer"
                  }}
                >
                  Cambiar cuenta
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: 14, color: "#666" }}>
                  No has iniciado sesión.
                </p>

                <button
                  onClick={() => setScreen("auth")}
                  style={{
                    marginTop: 8,
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "none",
                    background: "#22c55e",
                    color: "white",
                    cursor: "pointer"
                  }}
                >
                  Iniciar sesión
                </button>
              </>
            )}
          </div>

          <Mapa
            setCoords={setCoords}
            repartidor={repartidor}
          />

          <button
            className="btn"
            onClick={() => {
              setNegocioSeleccionado(null);
              setScreen("negocios-locales");
            }}
            style={{ marginTop: 10 }}
          >
            🍽️ Negocios locales{totalProductosCarrito > 0 ? ` (${totalProductosCarrito})` : ""}
          </button>

          <div
            style={{
              marginTop: 10,
              padding: 12,
              background: recompensa.recompensaDisponible ? "#fef3c7" : "#f8fafc",
              borderRadius: 12,
              border: recompensa.recompensaDisponible
                ? "1px solid #f59e0b"
                : "1px solid #e5e7eb"
            }}
          >
            <h2 style={{ fontSize: 18, marginBottom: 6 }}>
              ⭐ Recompensas
            </h2>

            {recompensa.recompensaDisponible ? (
              <>
                <p
                  style={{
                    fontWeight: "bold",
                    color: "#92400e",
                    marginBottom: 8
                  }}
                >
                  🎁 ¡Tienes un envío gratis disponible!
                </p>

                <p style={{ fontSize: 13, color: "#78350f" }}>
                  Podrás usarlo en tu próximo pedido. Después de usarlo, tu progreso volverá a 0/10.
                </p>
              </>
            ) : (
              <>
                <p style={{ fontSize: 14, marginBottom: 8 }}>
                  Pedidos completados: <strong>{recompensa.pedidosCompletados}/{recompensa.meta}</strong>
                </p>

                <div
                  style={{
                    width: "100%",
                    height: 10,
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
                      background: "#22c55e"
                    }}
                  />
                </div>

                <p style={{ fontSize: 13, color: "#555" }}>
                  Te faltan <strong>{recompensa.faltan}</strong> pedidos entregados para ganar un envío gratis.
                </p>
              </>
            )}
          </div>

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

              {promoParaMostrar && !ocultarPromoInicio && (
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

          <button
            className="btn"
            onClick={() => setScreen("historial")}
            style={{ marginTop: 10, background: "#334155" }}
          >
            📜 Historial de pedidos{pedidos.length > 0 ? ` (${pedidos.length})` : ""}
          </button>

          <button className="btn" onClick={() => setScreen("form")}>
            Hacer pedido
          </button>
        </div>
      )}

      {screen === "historial" && (
        <div className="card">

          <button
            onClick={() => {
              setShowCancel(null);
              setScreen("home");
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
              setScreen("home");
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
              setScreen("negocios-locales");
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

            <div style={{ display: "grid", gap: 8 }}>
              {productoParaGuisos.guisos.map((guiso) => (
                <label
                  key={guiso}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: 10,
                    background: guisosSeleccionados.includes(guiso)
                      ? "#dcfce7"
                      : "#f8fafc",
                    border: guisosSeleccionados.includes(guiso)
                      ? "1px solid #22c55e"
                      : "1px solid #e5e7eb",
                    borderRadius: 10,
                    cursor: "pointer",
                    textTransform: "capitalize"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={guisosSeleccionados.includes(guiso)}
                    onChange={() => alternarGuiso(guiso)}
                  />

                  {guiso}
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

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                onClick={confirmarProductoConGuisos}
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
                  setProductoParaGuisos(null);
                  setGuisosSeleccionados([]);
                  setCantidadProductoGuisos(1);
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
              maxWidth: 400,
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
              {productoParaOpciones.textoSelector || "Elige una opción:"}
            </p>

            <div style={{ display: "grid", gap: 8 }}>
              {productoParaOpciones.opciones.map((opcion) => {
                const seleccionado = opcionSeleccionada?.id === opcion.id;

                return (
                  <label
                    key={opcion.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
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
                      type="radio"
                      name={`opcion-${productoParaOpciones.id}`}
                      checked={seleccionado}
                      onChange={() => setOpcionSeleccionada(opcion)}
                      style={{ marginTop: 3 }}
                    />

                    <div style={{ flex: 1 }}>
                      <strong>{opcion.nombre}</strong>

                      {opcion.descripcion && (
                        <p style={{ fontSize: 12, color: "#666", marginTop: 3 }}>
                          {opcion.descripcion}
                        </p>
                      )}
                    </div>

                    <strong>{mostrarPrecioProducto(opcion)}</strong>
                  </label>
                );
              })}
            </div>

            <p style={{ marginTop: 12, fontWeight: "bold" }}>
              Precio unitario:{" "}
              {opcionSeleccionada
                ? mostrarPrecioProducto(opcionSeleccionada)
                : "Elige una opción"}
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
                    setCantidadProductoOpciones((prev) => Math.max(prev - 1, 1))
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

                <strong>{cantidadProductoOpciones}</strong>

                <button
                  onClick={() => setCantidadProductoOpciones((prev) => prev + 1)}
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
              {opcionSeleccionada && productoTienePrecio(opcionSeleccionada)
                ? `$${Number(opcionSeleccionada.precio || 0) * cantidadProductoOpciones}`
                : opcionSeleccionada
                  ? mostrarPrecioProducto(opcionSeleccionada)
                  : "Elige una opción"}
            </p>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                onClick={confirmarProductoConOpcion}
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
                  setProductoParaOpciones(null);
                  setOpcionSeleccionada(null);
                  setCantidadProductoOpciones(1);
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

          <h1>📦 Nuevo pedido</h1>

          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
          />

          <textarea
            value={pedido}
            onChange={(e) => setPedido(e.target.value)}
            placeholder="Pedido"
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