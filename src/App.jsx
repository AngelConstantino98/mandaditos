import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import logo from "./assets/logo.png";
import Mapa from "./Mapa";
import negocios from "./negocios";
import "./App.css";

const SOCKET_URL = "https://mandaditos-backend.onrender.com";
// Para producción después usaremos:
// const SOCKET_URL = "https://mandaditos-backend.onrender.com";

// 💬 Contactos oficiales de MandaPlus
const CONTACTOS_WHATSAPP = [
  {
    id: "principal",
    etiqueta: "Número principal",
    numeroVisible: "962 181 6603",
    numeroWhatsApp: "529621816603",
  },
  {
    id: "secundario",
    etiqueta: "Número secundario",
    numeroVisible: "962 480 6032",
    numeroWhatsApp: "529624806032",
  },
];


// Ícono de WhatsApp usado en los botones de contacto.
function IconoWhatsApp({ size = 17 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path
        fill="#25D366"
        d="M20.52 3.48A11.86 11.86 0 0 0 12.07 0C5.55 0 .24 5.3.24 11.82c0 2.08.54 4.1 1.57 5.88L0 24l6.47-1.69a11.8 11.8 0 0 0 5.6 1.43h.01c6.52 0 11.83-5.3 11.83-11.82 0-3.16-1.23-6.14-3.39-8.44ZM12.08 21.7h-.01a9.8 9.8 0 0 1-5-1.37l-.36-.22-3.84 1 1.03-3.74-.24-.38a9.77 9.77 0 0 1-1.5-5.17c0-5.43 4.42-9.85 9.86-9.85 2.63 0 5.1 1.02 6.96 2.9a9.77 9.77 0 0 1 2.87 6.95c0 5.43-4.43 9.85-9.86 9.85Zm5.4-7.37c-.3-.15-1.77-.88-2.04-.98-.27-.1-.47-.15-.67.15-.2.3-.77.98-.95 1.18-.17.2-.35.22-.65.08-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.8-1.68-2.1-.18-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.5h-.57c-.2 0-.53.08-.8.38-.28.3-1.06 1.03-1.06 2.52s1.08 2.92 1.23 3.12c.15.2 2.13 3.25 5.16 4.55.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.58-.35Z"
      />
    </svg>
  );
}

const MENSAJE_GANADOR = `🎉 ¡Felicidades!

Tu envío será totalmente GRATIS.
El repartidor ya fue notificado.`;

const MENSAJE_PERDEDOR = `😔 Esta vez no ganaste

Gracias por participar.
¡Te deseamos suerte en tu próximo pedido!`;

const ZONA_HORARIA_NEGOCIOS = "America/Mexico_City";

function horaAMinutos(hora = "00:00") {
  const [horas, minutos] = String(hora).split(":").map(Number);
  return (horas || 0) * 60 + (minutos || 0);
}

function formatearHora(hora = "00:00") {
  const [hh, mm] = String(hora).split(":").map(Number);
  const periodo = hh >= 12 ? "PM" : "AM";
  const hora12 = hh % 12 || 12;
  return `${hora12}:${String(mm || 0).padStart(2, "0")} ${periodo}`;
}

function obtenerAhoraMexico() {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA_HORARIA_NEGOCIOS,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const mapa = {};
  partes.forEach((parte) => {
    mapa[parte.type] = parte.value;
  });

  const dias = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    dia: dias[mapa.weekday] ?? new Date().getDay(),
    minutos: Number(mapa.hour || 0) * 60 + Number(mapa.minute || 0),
  };
}

function textoDiasHorario(dias = []) {
  const normalizados = [...new Set(dias)].sort((a, b) => a - b).join(",");

  if (normalizados === "0,1,2,3,4,5,6") return "Todos los días";
  if (normalizados === "1,2,3,4,5") return "Lun a Vie";
  if (normalizados === "0,6") return "Sáb y Dom";
  if (normalizados === "0,1,3,4,5,6") return "Mié a Lun";
  if (normalizados === "0,2,3,4,5,6") return "Mar a Dom";

  const nombres = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return dias.map((dia) => nombres[dia]).filter(Boolean).join(", ");
}

function obtenerTextoHorarioNegocio(negocio) {
  if (!Array.isArray(negocio?.horarios) || negocio.horarios.length === 0) {
    return "Horario no definido";
  }

  return negocio.horarios
    .map((horario) => `${textoDiasHorario(horario.dias)} ${formatearHora(horario.abre)} - ${formatearHora(horario.cierra)}`)
    .join(" · ");
}

function calcularEstadoPorHorario(negocio) {
  const horarios = Array.isArray(negocio?.horarios) ? negocio.horarios : [];

  if (horarios.length === 0) {
    return {
      abierto: true,
      textoEstado: "Sin horario automático",
      detalleHorario: "Horario no definido",
    };
  }

  const ahora = obtenerAhoraMexico();
  const horariosHoy = horarios.filter((horario) =>
    Array.isArray(horario.dias) && horario.dias.includes(ahora.dia)
  );

  let abierto = false;

  horariosHoy.forEach((horario) => {
    const abre = horaAMinutos(horario.abre);
    const cierra = horaAMinutos(horario.cierra);

    if (cierra < abre) {
      if (ahora.minutos >= abre || ahora.minutos < cierra) abierto = true;
      return;
    }

    if (ahora.minutos >= abre && ahora.minutos < cierra) abierto = true;
  });

  return {
    abierto,
    textoEstado: abierto ? "Abierto por horario" : "Cerrado por horario",
    detalleHorario: obtenerTextoHorarioNegocio(negocio),
  };
}


export default function App() {
  const socketRef = useRef(null);
  const pedidoActualRef = useRef(null);
  const screenRef = useRef("splash");
  const navegandoConBotonAtrasRef = useRef(false);
  const modalSuperiorRef = useRef(null);
  const modalHistorialRef = useRef(null);
  const enviandoPedidoRef = useRef(false);
  const recompensaCardRef = useRef(null);
  const pedidoActualCardRef = useRef(null);

  const [screen, setScreenBase] = useState("splash");

  // 💬 Alerta formal dentro de la app para no mostrar el nombre del dominio del navegador.
  const [alertaApp, setAlertaApp] = useState(null);

  // 📲 En iPhone/Safari a veces WhatsApp no se abre automático después de esperar al servidor.
  // Android se queda igual: abre WhatsApp directo como antes.
  const [whatsappPendiente, setWhatsappPendiente] = useState(null);

  // 💬 Ventana pequeña con los dos números oficiales de WhatsApp.
  const [mostrarContactos, setMostrarContactos] = useState(false);

  const mostrarAlerta = (mensaje, titulo = "MandaPlus") => {
    setAlertaApp({
      titulo,
      mensaje,
    });
  };

  const cerrarAlerta = () => {
    setAlertaApp(null);
  };

  const abrirWhatsAppPendiente = () => {
    if (!whatsappPendiente?.url) return;

    const url = whatsappPendiente.url;
    setWhatsappPendiente(null);

    // En iPhone conviene usar el mismo tab desde un botón tocado por el usuario.
    window.location.href = url;
  };

  const abrirWhatsAppContacto = (contacto) => {
    if (!contacto?.numeroWhatsApp) return;

    const mensaje = encodeURIComponent(
      "Hola MandaPlus, necesito información sobre el servicio de mandados."
    );

    setMostrarContactos(false);
    window.location.href = `https://wa.me/${contacto.numeroWhatsApp}?text=${mensaje}`;
  };

  const actualizarEstadoNegociosApp = (estado) => {
    const mapa = {};

    estado?.negocios?.forEach((item) => {
      if (!item?.negocioId) return;
      mapa[item.negocioId] = item;
    });

    setNegociosEstado(mapa);
  };

  const obtenerEstadoNegocio = (negocio) => {
    relojHorarios;
    const estadoServidor = negociosEstado[negocio.id] || {};
    const estadoHorario = calcularEstadoPorHorario(negocio);
    const modo = estadoServidor.modo || "auto";

    if (modo === "manual") {
      const abiertoManual = estadoServidor.abierto !== false;

      return {
        negocioId: negocio.id,
        negocioNombre: negocio.nombre,
        abierto: abiertoManual,
        modo: "manual",
        textoEstado: abiertoManual ? "Abierto manualmente" : "Cerrado manualmente",
        detalleHorario: estadoHorario.detalleHorario,
        fechaActualizacion: estadoServidor.fechaActualizacion || null,
      };
    }

    return {
      negocioId: negocio.id,
      negocioNombre: negocio.nombre,
      abierto: estadoHorario.abierto,
      modo: "auto",
      textoEstado: estadoHorario.textoEstado,
      detalleHorario: estadoHorario.detalleHorario,
      fechaActualizacion: estadoServidor.fechaActualizacion || null,
    };
  };

  const negocioEstaAbierto = (negocioId) => {
    const negocio = negocios.find((item) => item.id === negocioId);

    if (!negocio) {
      return negociosEstado[negocioId]?.abierto !== false;
    }

    return obtenerEstadoNegocio(negocio).abierto;
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
  const [gpsClienteBuscando, setGpsClienteBuscando] = useState(false);
  const [gpsClienteMensaje, setGpsClienteMensaje] = useState("");
  const [repartidor, setRepartidor] = useState(null);

  const [pedidoActual, setPedidoActual] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [enviandoPedido, setEnviandoPedido] = useState(false);

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

  // 🏪 Negocios abiertos/cerrados desde el panel dueño
  const [negociosEstado, setNegociosEstado] = useState({});
  const [relojHorarios, setRelojHorarios] = useState(Date.now());
  const [duenoNegociosCargando, setDuenoNegociosCargando] = useState(false);
  const [duenoNegociosMensaje, setDuenoNegociosMensaje] = useState("");
  const [negociosPedidoActual, setNegociosPedidoActual] = useState([]);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setRelojHorarios(Date.now());
    }, 60000);

    return () => clearInterval(intervalo);
  }, []);


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

  // 🔝 MandaPlus fix scroll menus v2: cada pantalla y cada negocio empiezan desde arriba.
  useEffect(() => {
    if (screen === "splash") return;

    const subirAlInicio = () => {
      try {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        document.querySelectorAll(".card").forEach((elemento) => {
          elemento.scrollTop = 0;
        });
      } catch {
        // No afecta el funcionamiento si algún navegador no permite mover el scroll.
      }
    };

    subirAlInicio();
    const frame = requestAnimationFrame(subirAlInicio);
    const timer = setTimeout(subirAlInicio, 80);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [screen, negocioSeleccionado?.id]);

  const cerrarModalSuperiorActual = () => {
    const modalActual = modalSuperiorRef.current;

    if (!modalActual) return false;

    if (modalActual === "alerta") {
      setAlertaApp(null);
      return true;
    }

    if (modalActual === "whatsapp") {
      setWhatsappPendiente(null);
      return true;
    }

    if (modalActual === "contactos") {
      setMostrarContactos(false);
      return true;
    }

    if (modalActual === "cancelar") {
      setShowCancel(null);
      return true;
    }

    if (modalActual === "extras") {
      setProductoParaExtras(null);
      setExtrasSeleccionados([]);
      setCantidadProductoExtras(1);
      return true;
    }

    if (modalActual === "toppings") {
      setProductoParaToppings(null);
      setToppingsSeleccionados([]);
      setJarabesSeleccionados([]);
      setGuisosSeleccionados([]);
      setCantidadProductoToppings(1);
      setMostrarSelectorJarabes(false);
      return true;
    }

    if (modalActual === "guisos") {
      setProductoParaGuisos(null);
      setGuisosSeleccionados([]);
      setCantidadProductoGuisos(1);
      return true;
    }

    if (modalActual === "opciones") {
      setProductoParaOpciones(null);
      return true;
    }

    return false;
  };

  // 📱 Si hay una ventana flotante abierta, el botón atrás debe cerrar esa ventana,
  // no regresar a la pantalla anterior ni cerrar el negocio.
  useEffect(() => {
    const modalActual =
      alertaApp
        ? "alerta"
        : whatsappPendiente
          ? "whatsapp"
          : mostrarContactos
            ? "contactos"
            : showCancel
              ? "cancelar"
            : productoParaExtras
              ? "extras"
              : productoParaToppings
                ? "toppings"
                : productoParaGuisos
                  ? "guisos"
                  : productoParaOpciones
                    ? "opciones"
                    : null;

    modalSuperiorRef.current = modalActual;

    if (!modalActual) {
      modalHistorialRef.current = null;
      return;
    }

    if (
      typeof window !== "undefined" &&
      modalHistorialRef.current !== modalActual
    ) {
      window.history.pushState(
        {
          mandaPlusScreen: screenRef.current,
          mandaPlusModal: modalActual,
        },
        "",
        window.location.href
      );

      modalHistorialRef.current = modalActual;
    }
  }, [
    alertaApp,
    whatsappPendiente,
    mostrarContactos,
    showCancel,
    productoParaExtras,
    productoParaToppings,
    productoParaGuisos,
    productoParaOpciones,
  ]);

  // 📱 Botón físico "atrás" de Android / botón atrás del navegador
  useEffect(() => {
    window.history.replaceState(
      { mandaPlusScreen: screenRef.current },
      "",
      window.location.href
    );

    const manejarBotonAtras = (event) => {
      if (modalSuperiorRef.current) {
        navegandoConBotonAtrasRef.current = true;
        cerrarModalSuperiorActual();
        modalHistorialRef.current = null;

        setTimeout(() => {
          navegandoConBotonAtrasRef.current = false;
        }, 0);

        return;
      }

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
      setGuisosSeleccionados([]);

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

  // 📍 MandaPlus fix GPS cliente v2:
  // El celular a veces entrega una primera ubicación aproximada.
  // Ahora tomamos varias lecturas por unos segundos y guardamos la más precisa.
  const normalizarCoordsCliente = (valor) => {
    const coordsBase = valor?.coords || valor || {};
    const lat = Number(coordsBase.latitude ?? coordsBase.lat);
    const lng = Number(coordsBase.longitude ?? coordsBase.lng);
    const accuracy = Number(coordsBase.accuracy);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return {
      lat,
      lng,
      accuracy: Number.isFinite(accuracy) ? accuracy : null,
      fecha: new Date().toISOString(),
    };
  };

  const obtenerMejorUbicacionCliente = (ubicacionInicial = null) => {
    const inicial = normalizarCoordsCliente(ubicacionInicial);

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(inicial);
        return;
      }

      const inicio = Date.now();
      const TIEMPO_BUSQUEDA_MS = 7500;
      const PRECISION_OBJETIVO_METROS = 45;

      let mejor = inicial;
      let terminado = false;
      let watchId = null;

      const guardarSiMejora = (ubicacion) => {
        const normalizada = normalizarCoordsCliente(ubicacion);

        if (!normalizada) return;

        if (!mejor) {
          mejor = normalizada;
          return;
        }

        const precisionNueva = Number(normalizada.accuracy);
        const precisionActual = Number(mejor.accuracy);

        if (!Number.isFinite(precisionActual)) {
          mejor = normalizada;
          return;
        }

        if (Number.isFinite(precisionNueva) && precisionNueva < precisionActual) {
          mejor = normalizada;
        }
      };

      const terminar = () => {
        if (terminado) return;

        terminado = true;

        if (watchId !== null) {
          try {
            navigator.geolocation.clearWatch(watchId);
          } catch {
            // No afecta si el navegador ya cerró el seguimiento.
          }
        }

        resolve(mejor);
      };

      const revisarPrecision = () => {
        const precision = Number(mejor?.accuracy);

        if (
          Number.isFinite(precision) &&
          precision <= PRECISION_OBJETIVO_METROS &&
          Date.now() - inicio >= 2000
        ) {
          terminar();
        }
      };

      try {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            guardarSiMejora(pos);
            revisarPrecision();
          },
          () => {
            // Si falla, usamos la mejor lectura disponible.
          },
          {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 0,
          }
        );

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            guardarSiMejora(pos);
            revisarPrecision();
          },
          () => {
            // Si falla, usamos la mejor lectura disponible.
          },
          {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 0,
          }
        );

        setTimeout(terminar, TIEMPO_BUSQUEDA_MS);
      } catch {
        resolve(inicial);
      }
    });
  };

  // Si el cliente comparte GPS después de haber enviado el pedido,
  // se actualiza solo la ubicación del pedido sin cambiar estado ni repartidor.
  const actualizarGPSCliente = async (nuevasCoords) => {
    if (gpsClienteBuscando) {
      return;
    }

    setGpsClienteBuscando(true);
    setGpsClienteMensaje("📍 Buscando ubicación precisa... espera unos segundos.");

    const mejorUbicacion = await obtenerMejorUbicacionCliente(nuevasCoords);

    setGpsClienteBuscando(false);

    const lat = Number(mejorUbicacion?.lat);
    const lng = Number(mejorUbicacion?.lng);
    const accuracy = Number(mejorUbicacion?.accuracy);
    const tienePrecision = Number.isFinite(accuracy);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setGpsClienteMensaje("⚠️ No se pudo obtener tu ubicación. Intenta de nuevo.");
      mostrarAlerta(
        "No se pudo obtener tu ubicación. Revisa que el GPS esté activado e intenta de nuevo.",
        "GPS no disponible"
      );
      return;
    }

    if (tienePrecision && accuracy > 90) {
      setGpsClienteMensaje(
        `⚠️ Ubicación poco precisa (${Math.round(accuracy)} m). Toca “Usar mi ubicación” otra vez o escribe una referencia.`
      );
      mostrarAlerta(
        `Tu ubicación salió poco precisa, aproximadamente ${Math.round(accuracy)} metros.\n\nPor seguridad no la actualicé todavía. Toca “Usar mi ubicación” otra vez o escribe una referencia clara.`,
        "GPS poco preciso"
      );
      return;
    }

    const gpsSeguro = {
      lat,
      lng,
      accuracy: tienePrecision ? accuracy : null,
      fecha: new Date().toISOString(),
    };

    setCoords(gpsSeguro);
    setGpsClienteMensaje(
      tienePrecision
        ? `✅ Ubicación lista. Precisión aproximada: ${Math.round(accuracy)} m.`
        : "✅ Ubicación lista."
    );

    const pedidoVigente = pedidoActualRef.current;

    if (!pedidoVigente?.id) {
      return;
    }

    const estadoPedido = String(pedidoVigente.estado || "").toLowerCase();

    if (estadoPedido === "cancelado" || estadoPedido === "entregado") {
      return;
    }

    socketRef.current
      ?.timeout(7000)
      .emit(
        "actualizar-gps-cliente",
        {
          pedidoId: pedidoVigente.id,
          clienteId,
          gps: gpsSeguro,
        },
        (err, respuesta) => {
          if (err || !respuesta?.ok || !respuesta?.pedido) {
            setGpsClienteMensaje(
              "⚠️ Tu GPS se guardó en este teléfono, pero no se pudo actualizar al repartidor. Intenta otra vez."
            );
            return;
          }

          setPedidoActual(respuesta.pedido);
          localStorage.setItem("pedidoActual", JSON.stringify(respuesta.pedido));
          setGpsClienteMensaje(
            tienePrecision
              ? `✅ GPS actualizado para el repartidor. Precisión aproximada: ${Math.round(accuracy)} m.`
              : "✅ GPS actualizado para el repartidor."
          );
        }
      );
  };

  // 🔄 MandaPlus fix sincronización cliente v1:
  // Si el cliente salió de la app y el repartidor cambió el estado,
  // al volver se consulta el pedido real del servidor para no quedarse con datos viejos.
  const obtenerTiempoPedidoCliente = (pedido) => {
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

    return 0;
  };

  const obtenerPedidoActualGuardado = () => {
    try {
      const guardado = localStorage.getItem("pedidoActual");
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  };

  const aplicarPedidoActualCliente = (pedidoServidor) => {
    if (!pedidoServidor?.id) return;

    setPedidoActual(pedidoServidor);
    localStorage.setItem("pedidoActual", JSON.stringify(pedidoServidor));

    const estadoPedido = String(pedidoServidor.estado || "").toLowerCase();

    if (estadoPedido === "cancelado" || estadoPedido === "entregado") {
      setRepartidor(null);
    }
  };

  const aplicarPedidosCliente = (data = []) => {
    const lista = Array.isArray(data) ? data : [];

    const filtrados = lista
      .filter((p) => String(p?.clienteId) === String(clienteId))
      .sort((a, b) => obtenerTiempoPedidoCliente(b) - obtenerTiempoPedidoCliente(a));

    setPedidos(filtrados.slice(0, 10));

    const pedidoLocal = pedidoActualRef.current || obtenerPedidoActualGuardado();

    const pedidoCoincidente = pedidoLocal?.id
      ? filtrados.find((p) => String(p.id) === String(pedidoLocal.id))
      : null;

    if (pedidoCoincidente) {
      aplicarPedidoActualCliente(pedidoCoincidente);
      return;
    }

    const pedidoActivo = filtrados.find((p) => {
      const estado = String(p.estado || "").toLowerCase();
      return estado !== "cancelado" && estado !== "entregado";
    });

    if (pedidoActivo) {
      aplicarPedidoActualCliente(pedidoActivo);
    }
  };

  const sincronizarPedidoActualCliente = (origen = "manual") => {
    if (!socketRef.current?.connected) {
      return;
    }

    socketRef.current
      .timeout(7000)
      .emit(
        "obtener-pedidos-cliente",
        {
          clienteId,
          origen,
        },
        (err, respuesta) => {
          if (err || !respuesta?.ok) {
            return;
          }

          aplicarPedidosCliente(respuesta.pedidos || []);
        }
      );
  };

  const obtenerPedidoActualServidor = (pedidoId, origen = "consulta-pedido") => {
    return new Promise((resolve) => {
      if (!socketRef.current?.connected) {
        resolve(null);
        return;
      }

      socketRef.current
        .timeout(7000)
        .emit(
          "obtener-pedidos-cliente",
          {
            clienteId,
            origen,
          },
          (err, respuesta) => {
            if (err || !respuesta?.ok) {
              resolve(null);
              return;
            }

            const pedidosServidor = Array.isArray(respuesta.pedidos)
              ? respuesta.pedidos
              : [];

            aplicarPedidosCliente(pedidosServidor);

            const pedidoEncontrado = pedidoId
              ? pedidosServidor.find((p) => String(p.id) === String(pedidoId))
              : pedidosServidor[0];

            resolve(pedidoEncontrado || null);
          }
        );
    });
  };

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

      socketRef.current.emit("obtener-negocios-estado", (data) => {
        if (data) {
          actualizarEstadoNegociosApp(data);
        }
      });

      sincronizarPedidoActualCliente("connect");
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

    socketRef.current.on("negocios-actualizados", (data) => {
      if (data) {
        actualizarEstadoNegociosApp(data);
      }
    });

    socketRef.current.on("pedido-rechazado", (data) => {
      mostrarAlerta(
        data?.mensaje || "Por el momento estamos fuera de servicio. Intenta más tarde.",
        data?.negocioId ? "Negocio cerrado" : "Fuera de servicio"
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
      aplicarPedidosCliente(data);
    });

    return () => socketRef.current?.disconnect();
  }, [clienteId]);


  // 🔄 Al volver a la app, sincroniza el pedido por si el repartidor lo aceptó
  // mientras el cliente estaba fuera o con la app en segundo plano.
  useEffect(() => {
    const sincronizarSiRegresa = () => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        sincronizarPedidoActualCliente("cliente-regreso-app");
      }
    };

    window.addEventListener("focus", sincronizarSiRegresa);
    window.addEventListener("pageshow", sincronizarSiRegresa);
    document.addEventListener("visibilitychange", sincronizarSiRegresa);

    return () => {
      window.removeEventListener("focus", sincronizarSiRegresa);
      window.removeEventListener("pageshow", sincronizarSiRegresa);
      document.removeEventListener("visibilitychange", sincronizarSiRegresa);
    };
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
      cargarEstadoNegociosDueno(duenoActivo);
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

  // 👑 Cargar estado de negocios para abrir/cerrar desde panel dueño
  const cargarEstadoNegociosDueno = async (duenoActivo = dueno) => {
    try {
      if (!duenoActivo?.usuario || !duenoActivo?.pin) return;

      const res = await fetch(`${SOCKET_URL}/dueno/estado-negocios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          usuario: duenoActivo.usuario,
          pin: duenoActivo.pin
        })
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setDuenoNegociosMensaje(data.mensaje || "No se pudo cargar negocios.");
        return;
      }

      actualizarEstadoNegociosApp(data.estado);
    } catch (error) {
      console.log("Error cargando estado negocios:", error);
      setDuenoNegociosMensaje("No se pudo conectar con el servidor.");
    }
  };

  const cambiarEstadoNegocioDueno = async (negocio, abierto, modo = "manual") => {
    try {
      if (!dueno?.usuario || !dueno?.pin) {
        setScreen("dueno-login", { reemplazar: true });
        return;
      }

      setDuenoNegociosCargando(true);
      setDuenoNegociosMensaje("");

      const res = await fetch(`${SOCKET_URL}/dueno/cambiar-negocio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          usuario: dueno.usuario,
          pin: dueno.pin,
          negocioId: negocio.id,
          negocioNombre: negocio.nombre,
          abierto,
          modo
        })
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setDuenoNegociosMensaje(data.mensaje || "No se pudo actualizar negocio.");
        return;
      }

      actualizarEstadoNegociosApp(data.estado);

      setDuenoNegociosMensaje(
        modo === "auto"
          ? `${negocio.nombre} volvió a modo automático.`
          : abierto
            ? `${negocio.nombre} quedó abierto manualmente.`
            : `${negocio.nombre} quedó cerrado manualmente.`
      );
    } catch (error) {
      console.log("Error actualizando negocio:", error);
      setDuenoNegociosMensaje("No se pudo conectar con el servidor.");
    } finally {
      setDuenoNegociosCargando(false);
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

  const normalizarTextoClavePedido = (valor) =>
    String(valor ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const crearClavePedidoCliente = (pedidoData) => {
    const carritoSeguro = Array.isArray(pedidoData.carritoNegocios)
      ? pedidoData.carritoNegocios.map((item) => ({
          id: item?.id || item?.productoId || "",
          nombre: item?.nombre || "",
          cantidad: item?.cantidad || 1,
          precio: item?.precio ?? null,
          negocioId: item?.negocioId || "",
        }))
      : [];

    return [
      "cliente",
      pedidoData.clienteId,
      "nombre",
      pedidoData.nombre,
      "pedido",
      pedidoData.pedido,
      "ubicacion",
      pedidoData.ubicacion,
      "zona",
      pedidoData.zona,
      "costo",
      pedidoData.costo,
      "negocios",
      (pedidoData.negociosIds || []).join(","),
      "carrito",
      JSON.stringify(carritoSeguro),
    ]
      .map(normalizarTextoClavePedido)
      .join("|")
      .slice(0, 3000);
  };

  // ENVIAR
  const enviar = () => {
    if (enviandoPedidoRef.current) {
      mostrarAlerta(
        "Tu pedido ya se está enviando. Espera unos segundos para evitar que se duplique.",
        "Enviando pedido"
      );
      return;
    }

    const esPedidoNegocioLocal = negociosPedidoActual.length > 0;
    const pedidoSeguroNegocio = esPedidoNegocioLocal
      ? construirPedidoNegociosLocales(carrito)
      : "";

    const pedidoBase = esPedidoNegocioLocal
      ? pedidoSeguroNegocio
      : pedido.trim();

    if (esPedidoNegocioLocal && carrito.length === 0) {
      mostrarAlerta(
        "Tu carrito de negocio local está vacío. Regresa a negocios locales y agrega productos.",
        "Carrito vacío"
      );
      return;
    }

    if (!nombre || !pedidoBase || !ubicacion || !zona) {
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

    const negocioCerradoPedido = negociosPedidoActual.find(
      (negocioId) => !negocioEstaAbierto(negocioId)
    );

    if (negocioCerradoPedido) {
      const negocio = negocios.find((item) => item.id === negocioCerradoPedido);

      mostrarAlerta(
        `${negocio?.nombre || "Este negocio"} está cerrado por el momento. No se puede enviar este pedido.`,
        "Negocio cerrado"
      );
      return;
    }

    const pedidoFinal = notaPedido.trim()
      ? `${pedidoBase}

Notas del pedido:
${notaPedido.trim()}`
      : pedidoBase;

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
      fecha: new Date().toISOString(),
      negociosIds: esPedidoNegocioLocal
        ? obtenerNegociosIdsCarrito(carrito)
        : negociosPedidoActual,
      carritoNegocios: esPedidoNegocioLocal
        ? obtenerCarritoProtegidoParaPedido()
        : [],
      totalProductosNegocios: esPedidoNegocioLocal ? textoTotalCarrito : null,
    };

    pedidoData.clientePedidoClave = crearClavePedidoCliente(pedidoData);

    enviandoPedidoRef.current = true;
    setEnviandoPedido(true);

    socketRef.current
      .timeout(7000)
      .emit("nuevo-pedido", pedidoData, (err, respuesta) => {
        enviandoPedidoRef.current = false;
        setEnviandoPedido(false);

        if (err || !respuesta?.ok) {
          sincronizarPedidoActualCliente("envio-sin-confirmacion");
          setTimeout(() => {
            sincronizarPedidoActualCliente("envio-sin-confirmacion-reintento");
          }, 1500);

          mostrarAlerta(
            respuesta?.mensaje ||
              "No recibimos confirmación del servidor. Si había mala señal, puede que el pedido sí se haya enviado. Estoy revisando para evitar duplicarlo; espera unos segundos antes de intentar otra vez.",
            "Pedido sin confirmación"
          );
          return;
        }

        const pedidoGuardado = respuesta.pedido || pedidoData;

        setPedidoActual(pedidoGuardado);
        localStorage.setItem("pedidoActual", JSON.stringify(pedidoGuardado));

        setResultadoPromo(null);
        setSorteando(false);
        setOcultarPromoInicio(false);

        if (respuesta.duplicado) {
          mostrarAlerta(
            "Este pedido ya estaba enviado. No lo dupliqué.",
            "Pedido ya enviado"
          );
        } else {
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

        const whatsappUrl = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

        if (isIOS) {
          // iPhone/Safari a veces permite abrir WhatsApp automático y a veces lo bloquea.
          // Primero intentamos abrirlo automático. Si no se abre, queda el botón de respaldo.
          setTimeout(() => {
            try {
              window.open(whatsappUrl, "_blank");
            } catch {
              // Si iPhone lo bloquea, el botón de respaldo queda disponible.
            }
          }, 200);

          setWhatsappPendiente({
            url: whatsappUrl,
            mensaje:
              "Tu pedido ya fue enviado al repartidor. Si WhatsApp no se abrió automáticamente, toca el botón para mandarlo también por WhatsApp."
          });
        } else {
          // Android se queda igual que antes.
          setTimeout(() => {
            window.open(
              whatsappUrl,
              "_blank"
            );
          }, 200);
        }
        }

        setNombre("");
        setPedido("");
        setNotaPedido("");
        setUbicacion("");
        setZona("");
        setCoords(null);
        setCarrito([]);
        setNegocioSeleccionado(null);
        setNegociosPedidoActual([]);

        setScreen("home", { reemplazar: true });
      });
  };

  // 🍀 PROBAR SUERTE
  const probarSuerte = async () => {
    if (!pedidoActual?.id) {
      mostrarAlerta("Primero realiza un pedido.");
      return;
    }

    let pedidoParaPromo = pedidoActual;
    let estadoPedidoActual = String(pedidoParaPromo.estado || "").toLowerCase();

    if (estadoPedidoActual !== "entregado" && estadoPedidoActual !== "cancelado") {
      setSorteando(true);
      setOcultarPromoInicio(false);
      setResultadoPromo({
        tipo: "info",
        mensaje: "🔄 Revisando el estado real del pedido..."
      });

      const pedidoServidor = await obtenerPedidoActualServidor(
        pedidoParaPromo.id,
        "antes-probar-suerte"
      );

      setSorteando(false);

      if (pedidoServidor?.id) {
        pedidoParaPromo = pedidoServidor;
        estadoPedidoActual = String(pedidoParaPromo.estado || "").toLowerCase();
      }
    }

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
        mensaje: "🍀 Podrás probar tu suerte cuando el repartidor marque tu pedido como entregado.\n\nSi el repartidor ya lo entregó y no te aparece, cierra y vuelve a abrir la app o intenta de nuevo en unos segundos."
      });
      return;
    }

    if (pedidoParaPromo.promocion?.participo) {
      setResultadoPromo({
        tipo: pedidoParaPromo.promocion.ganador ? "ganador" : "perdedor",
        mensaje: pedidoParaPromo.promocion.ganador
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
      .emit("probar-suerte", { pedidoId: pedidoParaPromo.id }, (err, resultado) => {
        setSorteando(false);
        setOcultarPromoInicio(false);

        if (err) {
          setResultadoPromo({
            tipo: "error",
            mensaje: "No se recibió respuesta del servidor. Revisa tu señal e intenta nuevamente."
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

  // 🌮 MandaPlus fix mixta Juquilita v2: Mixta solo incluye pastor, chuleta y chorizo.
  const CARNES_MIXTA_JUQUILITA = ["Pastor", "Chuleta", "Chorizo"];

  const esSelectorMixtaJuquilita = (producto) =>
    negocioSeleccionado?.id === "tacos-juquilita" &&
    Array.isArray(producto?.guisos) &&
    producto.guisos.some((guiso) => limpiarTextoId(guiso) === "mixta");

  const obtenerTextoSelectorGuisos = (producto) => {
    const texto = producto?.textoSelector || "Elige uno o varios guisos:";

    if (!esSelectorMixtaJuquilita(producto)) {
      return texto;
    }

    return String(texto)
      .replace(/Mixta incluye todas las carnes/gi, "Mixta incluye pastor, chuleta y chorizo")
      .replace(/todas las carnes/gi, "pastor, chuleta y chorizo");
  };

  const prepararGuisosParaCarrito = (producto, guisos = []) => {
    const guisosLimpios = guisos.filter(Boolean);

    if (!esSelectorMixtaJuquilita(producto)) {
      return guisosLimpios;
    }

    return guisosLimpios.map((guiso) =>
      limpiarTextoId(guiso) === "mixta"
        ? `Mixta: ${CARNES_MIXTA_JUQUILITA.join(", ")}`
        : guiso
    );
  };

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

  // 🏪 Productos solo para consultar menú dentro del establecimiento.
  const esSoloEstablecimiento = (producto, productoBase = null) =>
    producto?.soloEstablecimiento === true ||
    productoBase?.soloEstablecimiento === true;

  const obtenerAvisoSoloEstablecimiento = (producto) =>
    producto?.avisoSoloEstablecimiento ||
    "Solo disponible en establecimiento. Este producto se muestra solo para consultar el menú; no se puede pedir a domicilio.";

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

    if (!negocioEstaAbierto(negocioSeleccionado.id)) {
      mostrarAlerta(
        `${negocioSeleccionado.nombre} está cerrado por el momento.`,
        "Negocio cerrado"
      );
      return;
    }

    const productoSoloEstablecimiento = esSoloEstablecimiento(producto);
    const productoTieneOpcionesParaVer =
      Array.isArray(producto.opciones) && producto.opciones.length > 0;

    if (productoSoloEstablecimiento && !productoTieneOpcionesParaVer) {
      mostrarAlerta(
        obtenerAvisoSoloEstablecimiento(producto),
        "Solo en establecimiento"
      );
      return;
    }

    // Si tiene toppings o jarabes, abrimos ventana especial.
    // Esto se usa para Monsis Fresas.
    if (
      (Array.isArray(producto.toppings) && producto.toppings.length > 0) ||
      (Array.isArray(producto.jarabes) && producto.jarabes.length > 0)
    ) {
      setProductoParaToppings(producto);
      setToppingsSeleccionados([]);
      setJarabesSeleccionados([]);
      setGuisosSeleccionados(
        Array.isArray(producto.guisos) && producto.guisos.length === 1
          ? producto.guisos
          : []
      );
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
    const guisosLimpios = prepararGuisosParaCarrito(producto, guisos);
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
    const selectorActivo = productoParaGuisos || productoParaToppings;

    setGuisosSeleccionados((prev) => {
      if (prev.includes(guiso)) {
        return prev.filter((g) => g !== guiso);
      }

      if (esSelectorMixtaJuquilita(selectorActivo)) {
        return [guiso];
      }

      // ✅ MandaPlus fix iPhone/GAES v1:
      // Si el selector permite solo 1 opción, tocar otra reemplaza la anterior
      // en vez de mostrar alerta. Ejemplo: Manzana ↔ Guineo en waffles/hotcakes.
      if (Number(selectorActivo?.maxGuisos || 0) === 1) {
        return [guiso];
      }

      if (selectorActivo?.maxGuisos && prev.length >= selectorActivo.maxGuisos) {
        mostrarAlerta(
          selectorActivo.textoMaximoGuisos ||
            `Solo puedes elegir ${selectorActivo.maxGuisos} opción(es).`
        );
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
  const esExtraExclusivo = (extra) =>
    extra?.exclusivoConExtras === true ||
    limpiarTextoId(extra?.nombre).includes("todo-por-aparte");

  const alternarExtra = (extra) => {
    setExtrasSeleccionados((prev) => {
      const existe = prev.some((item) => item.id === extra.id);

      if (existe) {
        return prev.filter((item) => item.id !== extra.id);
      }

      if (esExtraExclusivo(extra)) {
        return [extra];
      }

      return [...prev.filter((item) => !esExtraExclusivo(item)), extra];
    });
  };

  // ✅ Confirmar producto con extras
  const confirmarProductoConExtras = () => {
    if (!productoParaExtras) return;

    if (
      productoParaExtras.extrasRequeridos === true &&
      extrasSeleccionados.length === 0
    ) {
      mostrarAlerta("Elige al menos una opción de aderezos.");
      return;
    }

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

  // ✅ Confirmar producto con toppings, jarabes y frutas/guisos
  const confirmarProductoConToppings = () => {
    if (!productoParaToppings) return;

    const maxToppings = Number(productoParaToppings.maxToppings || 0);
    const cantidadExactaToppings = Number(
      productoParaToppings.cantidadExactaToppings ||
        (String(productoParaToppings.textoToppings || "")
          .toLowerCase()
          .includes("elige 2")
          ? 2
          : 0)
    );

    const toppingsLimpios = toppingsSeleccionados.filter(Boolean);
    const jarabesLimpios = jarabesSeleccionados.filter(Boolean);
    const guisosLimpios = guisosSeleccionados.filter(Boolean);

    const requiereGuisos =
      Array.isArray(productoParaToppings.guisos) &&
      productoParaToppings.guisos.length > 0 &&
      !productoParaToppings.permitirSinGuisos;

    if (requiereGuisos && guisosLimpios.length === 0) {
      mostrarAlerta(
        productoParaToppings.textoSelector || "Elige una opción."
      );
      return;
    }

    if (
      productoParaToppings.cantidadExactaGuisosExtra &&
      guisosLimpios.length !== productoParaToppings.cantidadExactaGuisosExtra
    ) {
      mostrarAlerta(
        productoParaToppings.textoSelector ||
          `Elige ${productoParaToppings.cantidadExactaGuisosExtra} opción(es).`
      );
      return;
    }

    if (
      Array.isArray(productoParaToppings.toppings) &&
      productoParaToppings.toppings.length > 0
    ) {
      if (cantidadExactaToppings > 0 && toppingsLimpios.length !== cantidadExactaToppings) {
        mostrarAlerta(`Elige ${cantidadExactaToppings} topping(s).`);
        return;
      }

      if (cantidadExactaToppings === 0 && toppingsLimpios.length === 0) {
        mostrarAlerta(
          maxToppings === 1
            ? "Elige 1 topping."
            : "Elige al menos 1 topping."
        );
        return;
      }
    }

    if (
      productoParaToppings.jarabeRequerido === true &&
      jarabesLimpios.length === 0
    ) {
      mostrarAlerta(productoParaToppings.textoJarabes || "Elige 1 jarabe.");
      return;
    }

    const detalles = [];

    if (guisosLimpios.length > 0) {
      const etiquetaGuisos = String(productoParaToppings.textoSelector || "")
        .toLowerCase()
        .includes("fruta")
        ? "Fruta"
        : "Opción";

      detalles.push(`${etiquetaGuisos}: ${guisosLimpios.join(", ")}`);
    }

    if (toppingsLimpios.length > 0) {
      detalles.push(
        `${toppingsLimpios.length === 1 ? "Dulce" : "Dulces"}: ${toppingsLimpios.join(", ")}`
      );
    }

    if (jarabesLimpios.length > 0) {
      detalles.push(`Jarabe: ${jarabesLimpios.join(", ")}`);
    }

    const detallesId = [...guisosLimpios, ...toppingsLimpios, ...jarabesLimpios]
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
      guisosElegidos: guisosLimpios,
      toppingsElegidos: toppingsLimpios,
      jarabesElegidos: jarabesLimpios,
      guisos: undefined,
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
    setGuisosSeleccionados([]);
    setCantidadProductoToppings(1);
    setMostrarSelectorJarabes(false);
  };

  // ✅ Agregar una opción sin cerrar el selector
  // También soporta extras dentro de una opción, por ejemplo:
  // Hamburguesas GAES -> elegir hamburguesa -> agregar extras antes de añadir.
  const agregarOpcionAlCarrito = (productoBase, opcion, cantidad = 1, opcionesAgregar = {}) => {
    if (!productoBase || !opcion) return;

    if (esSoloEstablecimiento(opcion, productoBase)) {
      mostrarAlerta(
        obtenerAvisoSoloEstablecimiento(productoBase),
        "Solo en establecimiento"
      );
      return;
    }

    const cantidadFinal = Math.max(Number(cantidad) || 1, 1);
    const opcionTieneExtras =
      Array.isArray(opcion.extras) && opcion.extras.length > 0;

    const opcionTieneGuisos =
      Array.isArray(opcion.guisos) && opcion.guisos.length > 0;

    const opcionTieneToppings =
      Array.isArray(opcion.toppings) && opcion.toppings.length > 0;

    const opcionTieneJarabes =
      Array.isArray(opcion.jarabes) && opcion.jarabes.length > 0;

    const productoConOpcion = {
      ...productoBase,
      id: opcion.id,
      productoBaseId: opcion.id,
      nombre: `${productoBase.nombre} - ${opcion.nombre}`,
      precio: opcion.precio,
      precioTexto: opcion.precioTexto,
      descripcion: opcion.descripcion || productoBase.descripcion,
      imagen: opcion.imagen || productoBase.imagen,
      opcion,
      opciones: undefined,
      extras: opcionTieneExtras ? opcion.extras : undefined,
      extrasRequeridos:
        opcion.extrasRequeridos === true ||
        opcion.obligarElegirExtras === true ||
        productoBase.extrasRequeridos === true,
      textoExtras:
        opcion.textoExtras ||
        productoBase.textoExtras ||
        "Agrega extras para tu hamburguesa:",
      guisos: opcionTieneGuisos ? opcion.guisos : undefined,
      maxGuisos: opcion.maxGuisos,
      cantidadExactaGuisosExtra: opcion.cantidadExactaGuisosExtra,
      permitirSinGuisos: opcion.permitirSinGuisos,
      toppings: opcionTieneToppings ? opcion.toppings : undefined,
      maxToppings: opcion.maxToppings,
      cantidadExactaToppings: opcion.cantidadExactaToppings,
      textoToppings: opcion.textoToppings,
      jarabes: opcionTieneJarabes ? opcion.jarabes : undefined,
      jarabeRequerido: opcion.jarabeRequerido === true,
      textoJarabes: opcion.textoJarabes,
      textoSelector:
        opcion.textoSelector ||
        productoBase.textoSelector ||
        "Elige una opción:",
    };

    if (opcionTieneToppings || opcionTieneJarabes) {
      setProductoParaToppings(productoConOpcion);
      setToppingsSeleccionados([]);
      setJarabesSeleccionados([]);
      setGuisosSeleccionados(
        opcionTieneGuisos && productoConOpcion.guisos.length === 1
          ? productoConOpcion.guisos
          : []
      );
      setCantidadProductoToppings(cantidadFinal);
      setMostrarSelectorJarabes(false);
      return;
    }

    if (opcionTieneGuisos) {
      setProductoParaGuisos(productoConOpcion);
      setGuisosSeleccionados(
        productoConOpcion.guisos.length === 1 ? productoConOpcion.guisos : []
      );
      setCantidadProductoGuisos(cantidadFinal);
      return;
    }

    if (
      opcionTieneExtras &&
      (!opcionesAgregar.sinExtras || opcion.obligarElegirExtras === true)
    ) {
      setProductoParaExtras(productoConOpcion);
      setExtrasSeleccionados([]);
      setCantidadProductoExtras(cantidadFinal);
      return;
    }

    agregarProductoConfiguradoAlCarrito(
      productoConOpcion,
      [],
      cantidadFinal,
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

  // 🔒 Arma el resumen del pedido de negocios locales usando el carrito real.
  // Importante: este texto NO se toma del campo editable del formulario.
  const construirPedidoNegociosLocales = (carritoActual = carrito) => {
    const carritoSeguro = Array.isArray(carritoActual) ? carritoActual : [];

    const totalSeguro = carritoSeguro.reduce((total, item) => {
      if (!productoTienePrecio(item)) return total;
      return total + Number(item.precio || 0) * Number(item.cantidad || 1);
    }, 0);

    const tienePrecioConsulta = carritoSeguro.some(
      (item) => !productoTienePrecio(item)
    );

    const textoTotalSeguro = tienePrecioConsulta
      ? totalSeguro > 0
        ? `$${totalSeguro} + precio a consultar`
        : "Precio a consultar"
      : `$${totalSeguro}`;

    const carritoPorNegocio = carritoSeguro.reduce((grupos, item) => {
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

    return `Pedido de negocios locales:\n\n${detallePorNegocio}\n\nTotal productos: ${textoTotalSeguro}`;
  };

  const obtenerNegociosIdsCarrito = (carritoActual = carrito) => [
    ...new Set(
      carritoActual
        .map((item) => item.negocioId)
        .filter(Boolean)
    )
  ];

  const obtenerCarritoProtegidoParaPedido = () =>
    carrito.map((item) => ({
      id: item.id,
      productoId: item.productoId || item.id,
      nombre: item.nombre,
      cantidad: Number(item.cantidad || 1),
      precio: productoTienePrecio(item) ? Number(item.precio || 0) : null,
      precioTexto: productoTienePrecio(item)
        ? `$${Number(item.precio || 0)}`
        : item.precioTexto || "Precio a consultar",
      negocioId: item.negocioId,
      negocioNombre: item.negocioNombre,
      guisos: item.guisos || [],
      extras: item.extras || [],
      opcion: item.opcion || null,
    }));

  const limpiarCarrito = () => {
    setCarrito([]);
  };

  // 🛒 CONFIRMAR CARRITO Y PASARLO AL FORMULARIO
  const confirmarCarrito = () => {
    if (carrito.length === 0) {
      mostrarAlerta("Agrega al menos un producto al carrito.");
      return;
    }

    const negocioCerrado = carrito.find((item) => !negocioEstaAbierto(item.negocioId));

    if (negocioCerrado) {
      mostrarAlerta(
        `${negocioCerrado.negocioNombre || "Este negocio"} está cerrado por el momento. Elimina ese producto del carrito o espera a que abra.`,
        "Negocio cerrado"
      );
      return;
    }

    const pedidoArmado = construirPedidoNegociosLocales(carrito);

    setPedido(pedidoArmado);
    setNegociosPedidoActual(obtenerNegociosIdsCarrito(carrito));
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

  const pedidoDeNegocioLocal = negociosPedidoActual.length > 0;

  // ⚡ Atajo inteligente de la cabecera:
  // muestra el pedido activo o el progreso de recompensa y lleva a esa tarjeta.
  const nombreCortoCliente = String(cliente?.nombre || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)[0] || "";

  const estadoPedidoAtajo = String(pedidoActual?.estado || "")
    .trim()
    .toLowerCase();

  const pedidoActivoEnAtajo = Boolean(
    pedidoActual?.id &&
      estadoPedidoAtajo !== "entregado" &&
      estadoPedidoAtajo !== "cancelado"
  );

  const datosAtajoCabecera = (() => {
    if (pedidoActivoEnAtajo) {
      if (estadoPedidoAtajo === "pendiente") {
        return { emoji: "⏳", titulo: "Buscando", detalle: "repartidor" };
      }

      if (estadoPedidoAtajo === "aceptado") {
        return { emoji: "✅", titulo: "Aceptado", detalle: "Ver pedido" };
      }

      if (estadoPedidoAtajo === "en camino") {
        return { emoji: "🏍️", titulo: "En camino", detalle: "Ver seguimiento" };
      }

      const estadoVisible = estadoPedidoAtajo
        ? estadoPedidoAtajo.charAt(0).toUpperCase() + estadoPedidoAtajo.slice(1)
        : "Pedido activo";

      return { emoji: "📦", titulo: estadoVisible, detalle: "Ver pedido" };
    }

    if (recompensa.recompensaDisponible) {
      return { emoji: "🎁", titulo: "Cupón listo", detalle: "Recompensa" };
    }

    return {
      emoji: "🎁",
      titulo: `${recompensa.pedidosCompletados}/${recompensa.meta}`,
      detalle: "Recompensa",
    };
  })();

  const abrirAtajoCabecera = () => {
    const destino = pedidoActivoEnAtajo
      ? pedidoActualCardRef.current
      : recompensaCardRef.current;

    if (!destino) return;

    destino.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  // 🟢 En la lista de clientes, los negocios abiertos van primero y los cerrados abajo.
  const negociosOrdenadosParaClientes = [...negocios]
    .map((negocio, indiceOriginal) => ({
      negocio,
      indiceOriginal,
      estadoNegocio: obtenerEstadoNegocio(negocio),
    }))
    .sort((a, b) => {
      const abiertoA = a.estadoNegocio.abierto !== false;
      const abiertoB = b.estadoNegocio.abierto !== false;

      if (abiertoA !== abiertoB) {
        return abiertoA ? -1 : 1;
      }

      return a.indiceOriginal - b.indiceOriginal;
    });

  // 👑 Si el dueño entra directo con #dueno y ya tiene sesión, cargamos el resumen.
  useEffect(() => {
    if (screen === "dueno-panel" && dueno && !duenoResumen) {
      cargarResumenDueno(dueno, duenoFecha);
    }

    if (screen === "dueno-panel" && dueno) {
      cargarEstadoNegociosDueno(dueno);
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
            zIndex: 1000005,
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

      {whatsappPendiente && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            zIndex: 999998,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 390,
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
                width: 58,
                height: 58,
                borderRadius: "50%",
                background: "#dcfce7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 10px",
                fontSize: 30
              }}
            >
              ✅
            </div>

            <h2
              style={{
                fontSize: 20,
                marginBottom: 8,
                color: "#111827"
              }}
            >
              Pedido enviado
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
              {whatsappPendiente.mensaje ||
                "Tu pedido ya fue enviado al repartidor. Ahora puedes mandarlo también por WhatsApp."}
            </p>

            <button
              className="btn"
              onClick={abrirWhatsAppPendiente}
              style={{
                background: "#25D366",
                color: "white",
                marginTop: 0,
                fontWeight: 900
              }}
            >
              📲 Abrir WhatsApp para enviar pedido
            </button>

            <button
              type="button"
              onClick={() => setWhatsappPendiente(null)}
              style={{
                marginTop: 10,
                padding: "9px 12px",
                borderRadius: 10,
                border: "none",
                background: "#e5e7eb",
                color: "#111827",
                cursor: "pointer",
                width: "100%",
                fontWeight: 800
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {mostrarContactos && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.58)",
            zIndex: 1000000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
          onClick={() => setMostrarContactos(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-contactos-mandaplus"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 390,
              background: "white",
              borderRadius: 20,
              padding: 18,
              boxShadow: "0 24px 55px rgba(0,0,0,0.30)",
              border: "1px solid #e5e7eb"
            }}
          >
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: "50%",
                background: "#dcfce7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 10px",
                fontSize: 30
              }}
            >
              💬
            </div>

            <h2
              id="titulo-contactos-mandaplus"
              style={{
                margin: 0,
                textAlign: "center",
                fontSize: 21,
                color: "#111827"
              }}
            >
              WhatsApp de MandaPlus
            </h2>

            <p
              style={{
                margin: "7px 0 14px",
                textAlign: "center",
                color: "#64748b",
                fontSize: 14,
                lineHeight: 1.4
              }}
            >
              Elige el número con el que deseas comunicarte.
            </p>

            <div style={{ display: "grid", gap: 10 }}>
              {CONTACTOS_WHATSAPP.map((contacto) => (
                <button
                  key={contacto.id}
                  type="button"
                  onClick={() => abrirWhatsAppContacto(contacto)}
                  aria-label={`Abrir WhatsApp del ${contacto.etiqueta}: ${contacto.numeroVisible}`}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    border: "1px solid #bbf7d0",
                    borderRadius: 14,
                    background: "#f0fdf4",
                    color: "#14532d",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  <span
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      background: "#25D366",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      flexShrink: 0
                    }}
                  >
                    ☎️
                  </span>

                  <span style={{ flex: 1 }}>
                    <strong style={{ display: "block", fontSize: 14 }}>
                      {contacto.etiqueta}
                    </strong>
                    <span style={{ display: "block", marginTop: 3, fontSize: 17, fontWeight: 900 }}>
                      {contacto.numeroVisible}
                    </span>
                  </span>

                  <span style={{ fontSize: 20 }}>›</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setMostrarContactos(false)}
              style={{
                marginTop: 12,
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "none",
                background: "#e5e7eb",
                color: "#111827",
                cursor: "pointer",
                fontWeight: 800
              }}
            >
              Cerrar
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

            <button
              type="button"
              onClick={() => setMostrarContactos(true)}
              style={{
                marginTop: 10,
                padding: "8px 13px",
                fontSize: 13,
                fontWeight: 900,
                border: "1px solid #bbf7d0",
                borderRadius: 999,
                background: "#ecfdf5",
                color: "#166534",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
            >
              <IconoWhatsApp />
              <span>WhatsApp</span>
            </button>
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
                  textShadow: "0 2px 8px rgba(0,0,0,0.25)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                Hola{nombreCortoCliente ? `, ${nombreCortoCliente}` : ""} 👋
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

              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  alignItems: "stretch",
                  justifyContent: "space-between",
                  gap: 10,
                  width: "100%"
                }}
              >
                <button
                  type="button"
                  onClick={() => setMostrarContactos(true)}
                  style={{
                    minWidth: 0,
                    flex: "0 1 auto",
                    padding: "8px 12px",
                    fontSize: 13,
                    fontWeight: 900,
                    border: "1px solid rgba(255,255,255,0.65)",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.16)",
                    color: "white",
                    cursor: "pointer",
                    boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    whiteSpace: "nowrap"
                  }}
                >
                  <IconoWhatsApp />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={abrirAtajoCabecera}
                  aria-label={
                    pedidoActivoEnAtajo
                      ? "Ir al pedido actual"
                      : "Ir a mis recompensas"
                  }
                  style={{
                    minWidth: 0,
                    flex: "1 1 145px",
                    maxWidth: 178,
                    padding: "8px 10px",
                    borderRadius: 16,
                    border: recompensa.recompensaDisponible && !pedidoActivoEnAtajo
                      ? "1px solid rgba(253, 230, 138, 0.95)"
                      : "1px solid rgba(255,255,255,0.72)",
                    background: recompensa.recompensaDisponible && !pedidoActivoEnAtajo
                      ? "linear-gradient(135deg, rgba(255,247,237,0.98), rgba(254,243,199,0.98))"
                      : "rgba(255,255,255,0.92)",
                    color: "#0f172a",
                    cursor: "pointer",
                    boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    textAlign: "left"
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}
                  >
                    {datosAtajoCabecera.emoji}
                  </span>

                  <span style={{ minWidth: 0, lineHeight: 1.05 }}>
                    <strong
                      style={{
                        display: "block",
                        fontSize: 13,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {datosAtajoCabecera.titulo}
                    </strong>
                    <span
                      style={{
                        display: "block",
                        marginTop: 3,
                        fontSize: 10.5,
                        fontWeight: 800,
                        color: "#475569",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {datosAtajoCabecera.detalle}
                    </span>
                  </span>
                </button>
              </div>
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

                setNegociosPedidoActual([]);
                setPedido("");
                setNotaPedido("");
                setCarrito([]);
                setNegocioSeleccionado(null);
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

              <Mapa setCoords={actualizarGPSCliente} repartidor={repartidor} />
            </div>

            {(gpsClienteBuscando || gpsClienteMensaje) && (
              <div
                style={{
                  padding: "10px 14px",
                  borderTop: "1px solid #e5e7eb",
                  background: gpsClienteBuscando ? "#eff6ff" : "#f8fafc",
                  color: gpsClienteBuscando ? "#1d4ed8" : "#334155",
                  fontSize: 13,
                  fontWeight: 800,
                  lineHeight: 1.35
                }}
              >
                {gpsClienteMensaje}
              </div>
            )}
          </div>

          <div
            ref={recompensaCardRef}
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
              ref={pedidoActualCardRef}
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
              🏪 Abrir / cerrar negocios
            </h2>

            <p style={{ fontSize: 14, color: "#666", marginBottom: 10 }}>
              En modo automático se abre y cierra según su horario. Si hay un problema, puedes abrirlo o cerrarlo manualmente.
            </p>

            {duenoNegociosMensaje && (
              <div
                style={{
                  marginBottom: 10,
                  padding: 10,
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  fontSize: 14,
                  color: "#334155"
                }}
              >
                {duenoNegociosMensaje}
              </div>
            )}

            {negocios.map((negocio) => {
              const estadoNegocio = obtenerEstadoNegocio(negocio);
              const abierto = estadoNegocio.abierto !== false;
              const automatico = estadoNegocio.modo !== "manual";

              return (
                <div
                  key={negocio.id}
                  style={{
                    padding: 10,
                    marginBottom: 8,
                    borderRadius: 12,
                    border: abierto ? "1px solid #bbf7d0" : "1px solid #fecaca",
                    background: abierto ? "#f0fdf4" : "#fff1f2"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 10,
                      marginBottom: 8
                    }}
                  >
                    <div>
                      <strong>
                        {negocio.emoji} {negocio.nombre}
                      </strong>

                      <p
                        style={{
                          margin: "3px 0 0",
                          fontSize: 12,
                          color: abierto ? "#166534" : "#991b1b",
                          fontWeight: "bold"
                        }}
                      >
                        {abierto ? "🟢 Abierto" : "🔴 Cerrado"} · {automatico ? "🤖 Automático" : "✋ Manual"}
                      </p>

                      <p
                        style={{
                          margin: "3px 0 0",
                          fontSize: 12,
                          color: "#475569"
                        }}
                      >
                        {estadoNegocio.textoEstado}
                      </p>

                      <p
                        style={{
                          margin: "3px 0 0",
                          fontSize: 11,
                          color: "#64748b"
                        }}
                      >
                        {estadoNegocio.detalleHorario}
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8
                    }}
                  >
                    <button
                      onClick={() => cambiarEstadoNegocioDueno(negocio, false, "manual")}
                      disabled={duenoNegociosCargando}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "none",
                        background: "#dc2626",
                        color: "white",
                        fontWeight: "bold",
                        cursor: "pointer"
                      }}
                    >
                      Cerrar manual
                    </button>

                    <button
                      onClick={() => cambiarEstadoNegocioDueno(negocio, true, "manual")}
                      disabled={duenoNegociosCargando}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "none",
                        background: "#16a34a",
                        color: "white",
                        fontWeight: "bold",
                        cursor: "pointer"
                      }}
                    >
                      Abrir manual
                    </button>
                  </div>

                  <button
                    onClick={() => cambiarEstadoNegocioDueno(negocio, true, "auto")}
                    disabled={duenoNegociosCargando}
                    style={{
                      width: "100%",
                      marginTop: 8,
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      background: automatico ? "#e0f2fe" : "#ffffff",
                      color: "#0f172a",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    🤖 Volver automático
                  </button>
                </div>
              );
            })}
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

            {negociosOrdenadosParaClientes.map(({ negocio, estadoNegocio }) => {
              const abierto = estadoNegocio.abierto;

              return (
                <button
                  key={negocio.id}
                  onClick={() => {
                    if (!abierto) {
                      mostrarAlerta(
                        `${negocio.nombre} está cerrado por el momento. Intenta más tarde.`,
                        "Negocio cerrado"
                      );
                      return;
                    }

                    setNegocioSeleccionado(negocio);
                    setScreen("menu-negocio");
                  }}
                  style={{
                    width: "100%",
                    padding: 10,
                    marginBottom: 10,
                    borderRadius: 12,
                    border: abierto ? "1px solid #ddd" : "1px solid #fca5a5",
                    background: abierto ? "#f9fafb" : "#fff1f2",
                    textAlign: "left",
                    cursor: abierto ? "pointer" : "not-allowed",
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    opacity: abierto ? 1 : 0.75
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
                      fontSize: 28,
                      filter: abierto ? "none" : "grayscale(1)"
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

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8
                      }}
                    >
                      <strong>
                        {negocio.emoji} {negocio.nombre}
                      </strong>

                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: 999,
                          background: abierto ? "#dcfce7" : "#fee2e2",
                          color: abierto ? "#166534" : "#991b1b",
                          fontSize: 11,
                          fontWeight: 900,
                          whiteSpace: "nowrap"
                        }}
                      >
                        {abierto ? "Abierto" : "Cerrado"}
                      </span>
                    </div>

                    <span style={{ fontSize: 13, color: "#666" }}>
                      {negocio.descripcion}
                    </span>

                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
                      {estadoNegocio.textoEstado} · {estadoNegocio.detalleHorario}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

        </div>
      )}

      {screen === "menu-negocio" && negocioSeleccionado && (
        <div key={`menu-negocio-${negocioSeleccionado.id}`} className="card">

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

            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              {obtenerEstadoNegocio(negocioSeleccionado).textoEstado} · {obtenerEstadoNegocio(negocioSeleccionado).detalleHorario}
            </p>
          </div>

          {!negocioEstaAbierto(negocioSeleccionado.id) && (
            <div
              style={{
                marginTop: 10,
                padding: 12,
                background: "#fee2e2",
                borderRadius: 12,
                border: "1px solid #ef4444",
                color: "#991b1b",
                fontWeight: "bold",
                textAlign: "center"
              }}
            >
              🔴 Este negocio está cerrado por el momento.
              <br />
              <span style={{ fontSize: 13 }}>
                Puedes ver el menú, pero no se pueden enviar pedidos.
              </span>
            </div>
          )}

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
              const productoSoloEstablecimiento = esSoloEstablecimiento(producto);
              const productoTieneOpcionesParaVer =
                Array.isArray(producto.opciones) && producto.opciones.length > 0;

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

                    {productoSoloEstablecimiento && (
                      <div
                        style={{
                          marginBottom: 7,
                          padding: "7px 9px",
                          borderRadius: 9,
                          background: "#fef3c7",
                          color: "#92400e",
                          border: "1px solid #f59e0b",
                          fontSize: 12,
                          fontWeight: 900,
                        }}
                      >
                        {obtenerAvisoSoloEstablecimiento(producto)}
                      </div>
                    )}

                    <strong>{mostrarPrecioProducto(producto)}</strong>

                    {cantidad === 0 ? (
                      <button
                        onClick={() => agregarProductoAlCarrito(producto)}
                        disabled={productoSoloEstablecimiento && !productoTieneOpcionesParaVer}
                        style={{
                          width: "100%",
                          marginTop: 8,
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "none",
                          background: productoSoloEstablecimiento ? "#f59e0b" : "#22c55e",
                          color: "white",
                          fontWeight: "bold",
                          cursor:
                            productoSoloEstablecimiento && !productoTieneOpcionesParaVer
                              ? "not-allowed"
                              : "pointer"
                        }}
                      >
                        {productoSoloEstablecimiento
                          ? productoTieneOpcionesParaVer
                            ? "Ver menú"
                            : "Solo en establecimiento"
                          : "Agregar al pedido"}
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
            zIndex: 1000000,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch"
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 390,
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
              {obtenerTextoSelectorGuisos(productoParaGuisos)}
            </p>

            <div style={{ display: "grid", gap: 8 }}>
              {productoParaGuisos.guisos.map((guiso) => (
                <label
                  key={guiso}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: 10,
                    background: guisosSeleccionados.includes(guiso)
                      ? "#dcfce7"
                      : "#f8fafc",
                    border: guisosSeleccionados.includes(guiso)
                      ? "1px solid #22c55e"
                      : "1px solid #e5e7eb",
                    borderRadius: 10,
                    cursor: "pointer",
                    textTransform: "capitalize",
                    boxSizing: "border-box"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={guisosSeleccionados.includes(guiso)}
                    onChange={() => alternarGuiso(guiso)}
                    style={{
                      width: 20,
                      height: 20,
                      minWidth: 20,
                      maxWidth: 20,
                      flex: "0 0 20px",
                      margin: 0
                    }}
                  />

                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      whiteSpace: "normal",
                      overflowWrap: "break-word",
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#111827",
                      lineHeight: 1.25
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
            zIndex: 1000001
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

            {Array.isArray(productoParaToppings.guisos) &&
              productoParaToppings.guisos.length > 0 && (
                <>
                  <p style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>
                    {productoParaToppings.textoSelector || "Elige una opción:"}
                  </p>

                  <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
                    {productoParaToppings.guisos.map((guiso) => {
                      const seleccionado = guisosSeleccionados.includes(guiso);
                      const selectorUnico = Number(productoParaToppings.maxGuisos || 0) === 1;

                      return (
                        <label
                          key={guiso}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
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
                            type={selectorUnico ? "radio" : "checkbox"}
                            name={`guisos-${productoParaToppings.id}`}
                            checked={seleccionado}
                            onChange={() => alternarGuiso(guiso)}
                            style={{
                              width: 20,
                              height: 20,
                              minWidth: 20,
                              maxWidth: 20,
                              flex: "0 0 20px",
                              margin: 0
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
                            {guiso}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}

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
                            alignItems: "center",
                            gap: 10,
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
                            onChange={() => alternarTopping(topping)}
                            style={{
                              width: 20,
                              height: 20,
                              minWidth: 20,
                              maxWidth: 20,
                              flex: "0 0 20px",
                              margin: 0
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
                        {productoParaToppings.textoJarabes || "Elige solo 1 jarabe:"}
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
                                width: 20,
                                height: 20,
                                minWidth: 20,
                                maxWidth: 20,
                                flex: "0 0 20px",
                                margin: 0
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
                  setGuisosSeleccionados([]);
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

            {esSoloEstablecimiento(productoParaOpciones) && (
              <div
                style={{
                  marginBottom: 12,
                  padding: "9px 10px",
                  borderRadius: 10,
                  background: "#fef3c7",
                  border: "1px solid #f59e0b",
                  color: "#92400e",
                  fontSize: 13,
                  fontWeight: 900,
                }}
              >
                {obtenerAvisoSoloEstablecimiento(productoParaOpciones)}
              </div>
            )}

            <div style={{ display: "grid", gap: 8 }}>
              {productoParaOpciones.opciones.map((opcion) => {
                const cantidadOpcion = obtenerCantidadProducto(
                  opcion.id,
                  negocioSeleccionado.id
                );

                const opcionTieneExtras =
                  Array.isArray(opcion.extras) && opcion.extras.length > 0;

                const opcionSoloEstablecimiento = esSoloEstablecimiento(
                  opcion,
                  productoParaOpciones
                );

                return (
                  <div
                    key={opcion.id}
                    style={{
                      padding: 10,
                      background: opcionSoloEstablecimiento
                        ? "#fffbeb"
                        : cantidadOpcion > 0
                          ? "#dcfce7"
                          : "#f8fafc",
                      border: opcionSoloEstablecimiento
                        ? "1px solid #f59e0b"
                        : cantidadOpcion > 0
                          ? "1px solid #22c55e"
                          : "1px solid #e5e7eb",
                      borderRadius: 10
                    }}
                  >
                    {opcion.imagen && (
                      <div
                        style={{
                          width: "100%",
                          height: 180,
                          marginBottom: 10,
                          borderRadius: 10,
                          overflow: "hidden",
                          background: "#fff7ed",
                          border: "1px solid #e5e7eb"
                        }}
                      >
                        <img
                          src={opcion.imagen}
                          alt={opcion.nombre}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            display: "block"
                          }}
                        />
                      </div>
                    )}

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

                        {opcionSoloEstablecimiento && (
                          <p
                            style={{
                              fontSize: 12,
                              color: "#92400e",
                              marginTop: 4,
                              fontWeight: 900,
                            }}
                          >
                            ☕ Solo disponible en establecimiento
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
                      <span
                        style={{
                          fontSize: 13,
                          color: opcionSoloEstablecimiento ? "#92400e" : "#166534",
                          fontWeight: opcionSoloEstablecimiento ? 900 : 400,
                        }}
                      >
                        {opcionSoloEstablecimiento
                          ? "Solo para ver en establecimiento"
                          : cantidadOpcion > 0
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
                          disabled={cantidadOpcion === 0 || opcionSoloEstablecimiento}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            border: "none",
                            background:
                              cantidadOpcion === 0 || opcionSoloEstablecimiento
                                ? "#f3f4f6"
                                : "#e5e7eb",
                            color:
                              cantidadOpcion === 0 || opcionSoloEstablecimiento
                                ? "#9ca3af"
                                : "#111827",
                            cursor:
                              cantidadOpcion === 0 || opcionSoloEstablecimiento
                                ? "not-allowed"
                                : "pointer",
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
                              1,
                              { sinExtras: opcion.obligarElegirExtras !== true }
                            )
                          }
                          disabled={opcionSoloEstablecimiento}
                          style={{
                            minWidth: 90,
                            height: 34,
                            padding: "0 10px",
                            borderRadius: 10,
                            border: "none",
                            background: opcionSoloEstablecimiento ? "#d1d5db" : "#22c55e",
                            color: opcionSoloEstablecimiento ? "#6b7280" : "white",
                            cursor: opcionSoloEstablecimiento ? "not-allowed" : "pointer",
                            fontWeight: "bold"
                          }}
                        >
                          {opcionSoloEstablecimiento
                            ? "Solo ver"
                            : opcionTieneExtras && opcion.obligarElegirExtras === true
                              ? "Elegir aderezos"
                              : "+ Agregar"}
                        </button>

                        {opcionTieneExtras &&
                          !opcionSoloEstablecimiento &&
                          opcion.obligarElegirExtras !== true && (
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
                              background: "#f59e0b",
                              color: "white",
                              cursor: "pointer",
                              fontWeight: "bold"
                            }}
                          >
                            + Extras
                          </button>
                        )}
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

            <p
              style={{
                fontSize: 12,
                color: esSoloEstablecimiento(productoParaOpciones) ? "#92400e" : "#166534",
                marginTop: 8,
              }}
            >
              {esSoloEstablecimiento(productoParaOpciones)
                ? "Este menú solo es informativo para consumo en establecimiento."
                : "Puedes agregar varias opciones sin salir de esta ventana."}
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
              maxWidth: 390,
              maxHeight: "calc(100dvh - 32px)",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              background: "white",
              borderRadius: 16,
              padding: 16,
              boxSizing: "border-box",
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
            }}
          >
            <h2 style={{ fontSize: 20, marginBottom: 6 }}>
              {productoParaExtras.nombre}
            </h2>

            <p style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>
              {productoParaExtras.textoExtras || "Puedes agregar extras si lo deseas:"}
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
                      gap: 10,
                      padding: 10,
                      background: seleccionado ? "#dcfce7" : "#f8fafc",
                      border: seleccionado
                        ? "1px solid #22c55e"
                        : "1px solid #e5e7eb",
                      borderRadius: 10,
                      cursor: "pointer",
                      boxSizing: "border-box",
                      width: "100%",
                      minWidth: 0,
                      overflow: "hidden"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={seleccionado}
                      onChange={() => alternarExtra(extra)}
                      style={{
                        width: 20,
                        height: 20,
                        minWidth: 20,
                        maxWidth: 20,
                        flex: "0 0 20px",
                        margin: 0
                      }}
                    />

                    <span
                      style={{
                        flex: "1 1 auto",
                        minWidth: 0,
                        whiteSpace: "normal",
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                        fontWeight: 700,
                        lineHeight: 1.25
                      }}
                    >
                      {extra.nombre}
                    </span>

                    <strong
                      style={{
                        flex: "0 0 auto",
                        marginLeft: "auto",
                        whiteSpace: "nowrap",
                        fontWeight: 800
                      }}
                    >
                      {productoTienePrecio(extra)
                        ? `+$${Number(extra.precio || 0)}`
                        : extra.precioTexto || "Precio a consultar"}
                    </strong>
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

          <h1>{pedidoDeNegocioLocal ? "🍽️ Pedido de negocio local" : "📦 Pedido personalizado"}</h1>

          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
          />

          {pedidoDeNegocioLocal ? (
            <div
              style={{
                width: "100%",
                minHeight: 120,
                padding: 12,
                borderRadius: 10,
                border: "2px solid #111827",
                background: "#f8fafc",
                color: "#111827",
                fontFamily: "Arial, sans-serif",
                whiteSpace: "pre-wrap",
                lineHeight: 1.35,
                fontSize: 15
              }}
            >
              <div
                style={{
                  marginBottom: 10,
                  padding: "7px 9px",
                  borderRadius: 8,
                  background: "#dcfce7",
                  color: "#166534",
                  fontWeight: 900,
                  fontSize: 13
                }}
              >
                🔒 Pedido protegido. El cliente no puede modificar productos ni precios.
              </div>

              {pedido}
            </div>
          ) : (
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
          )}

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

          <button className="btn" onClick={enviar} disabled={enviandoPedido}>
            {enviandoPedido ? "Enviando pedido..." : "Enviar pedido"}
          </button>

        </div>
      )}

    </div>
  );
}