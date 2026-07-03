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
// 1 guiso = $60
// 2 guisos = $65
// 3 o más guisos = $75
const PRECIOS_QUESADILLA_BURRITO_SOPE = {
  uno: 60,
  dos: 65,
  tresOMas: 75,
};

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
        descripcion: "Quesillo opcional + 1 carne $60, 2 carnes $65, 3 o más carnes $75",
        imagen: "/productos/quesadillas-la-bendicion.jpg",
        guisos: GUISOS_LA_BENDICION,
        preciosPorGuisos: PRECIOS_QUESADILLA_BURRITO_SOPE,
      },
      {
        id: "burritos-la-bendicion",
        nombre: "Burritos",
        precio: 60,
        descripcion: "Quesillo opcional + 1 carne $60, 2 carnes $65, 3 o más carnes $75",
        imagen: "/productos/burritos-la-bendicion.jpg",
        guisos: GUISOS_LA_BENDICION,
        preciosPorGuisos: PRECIOS_QUESADILLA_BURRITO_SOPE,
      },
      {
        id: "sopes-la-bendicion",
        nombre: "Sopes",
        precio: 60,
        descripcion: "Quesillo opcional + 1 carne $60, 2 carnes $65, 3 o más carnes $75",
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
        textoSelector: "Incluye asada con quesillo. Puedes elegir 2 guisos extra:",
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
];

export default negocios;