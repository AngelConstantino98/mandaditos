const GUISOS_LA_BENDICION = [
  "asada",
  "deshebrada",
  "tripa",
  "chicharrón",
  "champiñon",
  "chorizo",
  "quesillo",
];

const GUISOS_EXTRA_TLAYUDA = [
  "deshebrada",
  "tripa",
  "chicharrón",
  "pollo",
  "chorizo",
];

// Quesadillas, burritos y sopes:
// quesillo no cuenta como carne
// 1 carne = $60
// 2 carnes = $65
// 3 o más carnes = $75
const PRECIOS_QUESADILLA_BURRITO_SOPE = {
  uno: 60,
  dos: 65,
  tresOMas: 75,
};

// Extras para Tortas El Güero
// Estos NO aparecen como productos separados.
// Solo aparecerán cuando el cliente seleccione una torta o hamburguesa.
const EXTRAS_TORTAS_HAMBURGUESAS_EL_GUERO = [
  {
    id: "extra-carne-el-guero",
    nombre: "Extra carne",
    precio: 15,
  },
  {
    id: "extra-quesillo-el-guero",
    nombre: "Extra quesillo",
    precio: 15,
  },
];

const negocios = [
  {
    id: "antojitos-la-bendicion-de-dios",
    nombre: "ANTOJITOS La Bendición de Dios",
    emoji: "🌮",
    descripcion:
      "Quesadillas, tostadas, empanadas, burritos, tacos, sopes y tlayudas",
    imagen: "/negocios/antojitos-la-bendicion-de-dios.jpg",
    productos: [
      {
        id: "quesadillas-la-bendicion",
        nombre: "Quesadillas",
        precio: 60,
        descripcion:
          "Quesillo opcional + 1 carne $60, 2 carnes $65, 3 o más carnes $75",
        imagen: "/productos/quesadillas-la-bendicion.jpg",
        guisos: GUISOS_LA_BENDICION,
        preciosPorGuisos: PRECIOS_QUESADILLA_BURRITO_SOPE,
      },
      {
        id: "burritos-la-bendicion",
        nombre: "Burritos",
        precio: 60,
        descripcion:
          "Quesillo opcional + 1 carne $60, 2 carnes $65, 3 o más carnes $75",
        imagen: "/productos/burritos-la-bendicion.jpg",
        guisos: GUISOS_LA_BENDICION,
        preciosPorGuisos: PRECIOS_QUESADILLA_BURRITO_SOPE,
      },
      {
        id: "sopes-la-bendicion",
        nombre: "Sopes",
        precio: 60,
        descripcion:
          "Quesillo opcional + 1 carne $60, 2 carnes $65, 3 o más carnes $75",
        imagen: "/productos/sopes-la-bendicion.jpg",
        guisos: GUISOS_LA_BENDICION,
        preciosPorGuisos: PRECIOS_QUESADILLA_BURRITO_SOPE,
      },
      {
        id: "tacos-la-bendicion",
        nombre: "Tacos de asada",
        precio: 20,
        descripcion: "Taco de asada $20 c/u",
        imagen: "/productos/tacos-la-bendicion.jpg",
        guisos: ["asada"],
      },
      {
        id: "tlayudas-la-bendicion",
        nombre: "Tlayudas",
        precio: 110,
        precioConExtras: 130,
        descripcion: "Asada con quesillo $110. Con 2 guisos extra $130",
        imagen: "/productos/tlayudas-la-bendicion.jpg",
        guisosBase: ["asada con quesillo"],
        guisos: GUISOS_EXTRA_TLAYUDA,
        permitirSinGuisos: true,
        maxGuisos: 2,
        cantidadExactaGuisosExtra: 2,
        textoSelector:
          "Incluye asada con quesillo. Puedes elegir 2 guisos extra:",
      },
      {
        id: "empanadas-la-bendicion",
        nombre: "Orden de empanadas",
        precio: 50,
        descripcion: "Orden con 4 empanadas de asada con quesillo",
        imagen: "/productos/empanadas-la-bendicion.jpg",
      },
      {
        id: "tostadas-la-bendicion",
        nombre: "Orden de tostadas",
        precio: 50,
        descripcion: "Orden con 3 tostadas de asada",
        imagen: "/productos/tostadas-la-bendicion.jpg",
      },
    ],
  },

  {
    id: "tortas-el-guero",
    nombre: "Tortas El Güero",
    emoji: "🥪",
    descripcion: "Tortas, hot dogs y hamburguesas",
    imagen: "/negocios/tortas-el-guero.jpg",
    productos: [
      // TORTAS
      {
        id: "torta-combinada-el-guero",
        nombre: "Torta combinada",
        precio: 55,
        descripcion: "Carnes frías. Puedes agregar extras.",
        imagen: "/productos/tortas-el-guero.jpg",
        extras: EXTRAS_TORTAS_HAMBURGUESAS_EL_GUERO,
      },
      {
        id: "torta-pollo-el-guero",
        nombre: "Torta de pollo",
        precio: 55,
        descripcion: "Torta de pollo. Puedes agregar extras.",
        imagen: "/productos/tortas-el-guero.jpg",
        extras: EXTRAS_TORTAS_HAMBURGUESAS_EL_GUERO,
      },
      {
        id: "torta-combinada-con-pollo-el-guero",
        nombre: "Torta combinada c/pollo",
        precio: 60,
        descripcion: "Combinada con pollo. Puedes agregar extras.",
        imagen: "/productos/tortas-el-guero.jpg",
        extras: EXTRAS_TORTAS_HAMBURGUESAS_EL_GUERO,
      },
      {
        id: "torta-milanesa-el-guero",
        nombre: "Torta de milanesa",
        precio: 55,
        descripcion: "Torta de milanesa. Puedes agregar extras.",
        imagen: "/productos/tortas-el-guero.jpg",
        extras: EXTRAS_TORTAS_HAMBURGUESAS_EL_GUERO,
      },
      {
        id: "torta-milanesa-con-pollo-el-guero",
        nombre: "Torta milanesa con pollo",
        precio: 60,
        descripcion: "Milanesa con pollo. Puedes agregar extras.",
        imagen: "/productos/tortas-el-guero.jpg",
        extras: EXTRAS_TORTAS_HAMBURGUESAS_EL_GUERO,
      },
      {
        id: "torta-asada-el-guero",
        nombre: "Torta de asada",
        precio: 60,
        descripcion: "Torta de asada. Puedes agregar extras.",
        imagen: "/productos/tortas-el-guero.jpg",
        extras: EXTRAS_TORTAS_HAMBURGUESAS_EL_GUERO,
      },
      {
        id: "torta-asada-con-pollo-el-guero",
        nombre: "Torta asada c/pollo",
        precio: 65,
        descripcion: "Asada con pollo. Puedes agregar extras.",
        imagen: "/productos/tortas-el-guero.jpg",
        extras: EXTRAS_TORTAS_HAMBURGUESAS_EL_GUERO,
      },
      {
        id: "torta-campechana-el-guero",
        nombre: "Torta campechana",
        precio: 60,
        descripcion: "Torta campechana. Puedes agregar extras.",
        imagen: "/productos/tortas-el-guero.jpg",
        extras: EXTRAS_TORTAS_HAMBURGUESAS_EL_GUERO,
      },
      {
        id: "torta-salchicha-con-huevo-el-guero",
        nombre: "Torta salchicha con huevo",
        precio: 50,
        descripcion: "Salchicha con huevo. Puedes agregar extras.",
        imagen: "/productos/tortas-el-guero.jpg",
        extras: EXTRAS_TORTAS_HAMBURGUESAS_EL_GUERO,
      },

      // HOT DOGS
      {
        id: "hotdog-tradicional-el-guero",
        nombre: "Hot dog tradicional",
        precio: 35,
        descripcion: "Hot dog tradicional",
        imagen: "/productos/hotdogs-el-guero.jpg",
      },
      {
        id: "hotdog-milanesa-el-guero",
        nombre: "Hot dog de milanesa",
        precio: 40,
        descripcion: "Hot dog de milanesa",
        imagen: "/productos/hotdogs-el-guero.jpg",
      },
      {
        id: "hotdog-pollo-el-guero",
        nombre: "Hot dog de pollo",
        precio: 40,
        descripcion: "Hot dog de pollo",
        imagen: "/productos/hotdogs-el-guero.jpg",
      },
      {
        id: "hotdog-doble-el-guero",
        nombre: "Hot dog doble",
        precio: 40,
        descripcion: "Hot dog doble",
        imagen: "/productos/hotdogs-el-guero.jpg",
      },
      {
        id: "hotdog-especial-el-guero",
        nombre: "Hot dog especial",
        precio: 40,
        descripcion: "Hot dog especial",
        imagen: "/productos/hotdogs-el-guero.jpg",
      },
      {
        id: "hotdog-combinado-el-guero",
        nombre: "Hot dog combinado",
        precio: 40,
        descripcion: "Hot dog combinado",
        imagen: "/productos/hotdogs-el-guero.jpg",
      },
      {
        id: "hotdog-pikachu-el-guero",
        nombre: "Hot dog Pikachu",
        precio: 40,
        descripcion: "Hot dog Pikachu",
        imagen: "/productos/hotdogs-el-guero.jpg",
      },
      {
        id: "hotdog-salchicha-con-tocino-el-guero",
        nombre: "Hot dog salchicha con tocino",
        precio: 40,
        descripcion: "Salchicha con tocino",
        imagen: "/productos/hotdogs-el-guero.jpg",
      },

      // HAMBURGUESAS
      {
        id: "hamburguesa-tradicional-el-guero",
        nombre: "Hamburguesa tradicional",
        precio: 90,
        descripcion: "Hamburguesa tradicional. Puedes agregar extras.",
        imagen: "/productos/hamburguesas-el-guero.jpg",
        extras: EXTRAS_TORTAS_HAMBURGUESAS_EL_GUERO,
      },
      {
        id: "hamburguesa-especial-el-guero",
        nombre: "Hamburguesa especial",
        precio: 115,
        descripcion:
          "Doble carne, piña, queso amarillo y quesillo. Puedes agregar extras.",
        imagen: "/productos/hamburguesas-el-guero.jpg",
        extras: EXTRAS_TORTAS_HAMBURGUESAS_EL_GUERO,
      },
    ],
  },

  {
    id: "tacos-dona-lety",
    nombre: "Tacos Doña Lety",
    emoji: "🌮",
    descripcion: "Tacos de cabeza de res",
    imagen: "/negocios/tacos-dona-lety.jpg",
    productos: [
      {
        id: "tacos-cabeza-dona-lety",
        nombre: "Tacos de cabeza de res",
        precio: null,
        precioTexto: "Precio a consultar",
        descripcion: "Tacos de cabeza de res preparados al momento",
        imagen: "/productos/tacos-cabeza-dona-lety.jpg",
      },
    ],
  },
];

export default negocios;