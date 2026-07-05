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

  {
    id: "el-carboncito",
    nombre: "El Carboncito",
    emoji: "🔥",
    descripcion: "Tacos, gringas, tortas, quesadillas y especialidades",
    imagen: "/negocios/negocio-elcarboncito.jpeg",
    productos: [
      {
        id: "tacos-el-carboncito",
        nombre: "Tacos",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion: "Elige el tipo de taco",
        imagen: "/productos/tacos-el-carboncito.jpg",
        textoSelector: "Elige el tipo de taco:",
        opciones: [
          {
            id: "tacos-bistec-el-carboncito",
            nombre: "Bistec",
            precio: 60,
            descripcion: "Orden de 4 tacos de bistec",
          },
          {
            id: "tacos-chuleta-el-carboncito",
            nombre: "Chuleta",
            precio: 55,
            descripcion: "Orden de 4 tacos de chuleta",
          },
          {
            id: "tacos-chorizo-el-carboncito",
            nombre: "Chorizo",
            precio: 55,
            descripcion: "Orden de 4 tacos de chorizo",
          },
          {
            id: "tacos-pastor-2x1-el-carboncito",
            nombre: "Pastor 2x1",
            precio: 68,
            descripcion: "Promoción 2x1 todos los días en tacos al pastor",
          },
        ],
      },

      {
        id: "burritos-el-carboncito",
        nombre: "Burritos",
        precio: 70,
        descripcion: "Burrito de El Carboncito",
        imagen: "/productos/burritos-el-carboncito.jpg",
      },
      {
        id: "hamburguesas-el-carboncito",
        nombre: "Hamburguesas",
        precio: 80,
        descripcion: "Hamburguesa de El Carboncito",
        imagen: "/productos/hamburguesa-el-carboncito.jpg",
      },
      {
        id: "quesadillas-el-carboncito",
        nombre: "Quesadillas",
        precio: 45,
        descripcion: "Quesadilla de El Carboncito",
        imagen: "/productos/quesadillas-el-carboncito.jpg",
      },
      {
        id: "papa-rellena-el-carboncito",
        nombre: "Papa rellena",
        precio: 80,
        descripcion: "Papa rellena de El Carboncito",
        imagen: "/productos/papa-rellena.jpg",
      },

      {
        id: "gringos-el-carboncito",
        nombre: "Gringas",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion: "Elige sencilla o especial",
        imagen: "/productos/gringas-el-carboncito.jpg",
        textoSelector: "Elige el tipo de gringa:",
        opciones: [
          {
            id: "gringa-sencilla-el-carboncito",
            nombre: "Sencilla",
            precio: 30,
            descripcion: "Gringa sencilla",
          },
          {
            id: "gringa-especial-el-carboncito",
            nombre: "Especial",
            precio: 55,
            descripcion: "Gringa especial",
          },
        ],
      },

      {
        id: "extras-con-queso-el-carboncito",
        nombre: "Especiales con queso",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion: "Bistec c/queso, chuleta c/queso, choriqueso y más",
        imagen: "/productos/especial-con-queso.jpg",
        textoSelector: "Elige una opción:",
        opciones: [
          {
            id: "bistec-con-queso-el-carboncito",
            nombre: "Bistec c/queso",
            precio: 75,
            descripcion: "Bistec con queso",
          },
          {
            id: "chuleta-con-queso-el-carboncito",
            nombre: "Chuleta c/queso",
            precio: 75,
            descripcion: "Chuleta con queso",
          },
          {
            id: "choriqueso-el-carboncito",
            nombre: "Choriqueso",
            precio: 75,
            descripcion: "Choriqueso",
          },
          {
            id: "pastor-suizo-el-carboncito",
            nombre: "Pastor suizo",
            precio: 75,
            descripcion: "Pastor suizo",
          },
          {
            id: "sincronizadas-el-carboncito",
            nombre: "Sincronizadas",
            precio: 45,
            descripcion: "Sincronizadas",
          },
        ],
      },

      {
        id: "tortas-el-carboncito",
        nombre: "Tortas",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion: "Al pastor, chuleta o combinadas",
        imagen: "/productos/tortas-el-carboncito.jpg",
        textoSelector: "Elige el tipo de torta:",
        opciones: [
          {
            id: "torta-pastor-el-carboncito",
            nombre: "Al pastor",
            precio: 50,
            descripcion: "Torta al pastor",
          },
          {
            id: "torta-chuleta-el-carboncito",
            nombre: "Chuleta",
            precio: 50,
            descripcion: "Torta de chuleta",
          },
          {
            id: "torta-combinada-el-carboncito",
            nombre: "Combinada",
            precio: 50,
            descripcion: "Torta combinada",
          },
          {
            id: "tortas-2x90-el-carboncito",
            nombre: "2 x $90",
            precio: 90,
            descripcion: "Promoción de 2 tortas",
          },
        ],
      },

      {
        id: "especialidades-el-carboncito",
        nombre: "Especialidades",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion: "Pastor por kilo, alambre, fortachón, hawaiano y más",
        imagen: "/productos/alambre-el-carboncito.jpg",
        textoSelector: "Elige una especialidad:",
        opciones: [
          {
            id: "pastor-kilo-el-carboncito",
            nombre: "Pastor kilo",
            precio: 400,
            descripcion: "1 kilo de pastor",
          },
          {
            id: "pastor-medio-kilo-el-carboncito",
            nombre: "Pastor 1/2 kilo",
            precio: 230,
            descripcion: "1/2 kilo de pastor",
          },
          {
            id: "que-me-vez-el-carboncito",
            nombre: "Que me vez",
            precio: 55,
            descripcion: "Chuleta, tocino y quesillo",
          },
          {
            id: "tlaconete-el-carboncito",
            nombre: "Tlaconete",
            precio: 80,
            descripcion:
              "Pastor, salsa mexicana y quesillo en 3 tortillas de harina",
          },
          {
            id: "rikis-el-carboncito",
            nombre: "Rikis",
            precio: 80,
            descripcion:
              "Pastor, tocino y salsa mexicana. Dos tacos con doble tortilla de harina",
          },
          {
            id: "alambre-el-carboncito",
            nombre: "Alambre",
            precio: 100,
            descripcion:
              "Chuleta, chile morrón, cebolla, jamón, tocino y quesillo",
          },
          {
            id: "fortachon-el-carboncito",
            nombre: "Fortachón",
            precio: 100,
            descripcion:
              "Bistec, chorizo, chuleta, jamón, tocino y quesillo",
          },
          {
            id: "hawaiano-el-carboncito",
            nombre: "Hawaiano",
            precio: 100,
            descripcion: "Pastor, piña y quesillo",
          },
          {
            id: "champinon-con-queso-el-carboncito",
            nombre: "Champiñón c/queso",
            precio: 100,
            descripcion:
              "Champiñón, chuleta, jamón, tocino y quesillo",
          },
          {
            id: "pinguino-el-carboncito",
            nombre: "Pingüino",
            precio: 100,
            descripcion: "Bistec, jamón y quesillo",
          },
          {
            id: "parrillada-2-personas-el-carboncito",
            nombre: "Parrillada 2 personas",
            precio: 185,
            descripcion:
              "Chile morrón, cebolla, bistec, pastor, chuleta, jamón, tocino, piña y quesillo",
          },
        ],
      },
    ],
  },,

  {
    id: "cockteleria-la-almeja-2",
    nombre: "COCKTELERIA LA ALMEJA 2",
    emoji: "🦐",
    descripcion:
      "Cockteles, ensaladas, camarones, pescado, tostadas, caldos y bebidas",
    imagen: "/negocios/cockteleria-la-almeja-2.jpg",
    productos: [
      {
        id: "cocktel-la-almeja-2",
        nombre: "Cocktel",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion: "Camarón y vuelve a la vida en chico, mediano o grande",
        imagen: "/productos/cocktel-la-almeja-2.jpg",
        textoSelector: "Elige tu cocktel:",
        opciones: [
          {
            id: "cocktel-camaron-chico-la-almeja-2",
            nombre: "Camarón chico",
            precio: 90,
            descripcion: "Cocktel de camarón chico",
          },
          {
            id: "cocktel-camaron-mediano-la-almeja-2",
            nombre: "Camarón mediano",
            precio: 140,
            descripcion: "Cocktel de camarón mediano",
          },
          {
            id: "cocktel-camaron-grande-la-almeja-2",
            nombre: "Camarón grande",
            precio: 170,
            descripcion: "Cocktel de camarón grande",
          },
          {
            id: "cocktel-vuelve-vida-chico-la-almeja-2",
            nombre: "Vuelve a la vida chico",
            precio: 90,
            descripcion: "Cocktel vuelve a la vida chico",
          },
          {
            id: "cocktel-vuelve-vida-mediano-la-almeja-2",
            nombre: "Vuelve a la vida mediano",
            precio: 140,
            descripcion: "Cocktel vuelve a la vida mediano",
          },
          {
            id: "cocktel-vuelve-vida-grande-la-almeja-2",
            nombre: "Vuelve a la vida grande",
            precio: 170,
            descripcion: "Cocktel vuelve a la vida grande",
          },
        ],
      },

      {
        id: "ensaladas-la-almeja-2",
        nombre: "Ensaladas",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion: "Ensaladas de mariscos y camarón",
        imagen: "/productos/ensaladas-la-almeja-2.jpg",
        textoSelector: "Elige tu ensalada:",
        opciones: [
          {
            id: "ensalada-mariscos-la-almeja-2",
            nombre: "De mariscos",
            precio: 200,
            descripcion: "Ensalada de mariscos",
          },
          {
            id: "ensalada-camaron-la-almeja-2",
            nombre: "De camarón",
            precio: 200,
            descripcion: "Ensalada de camarón",
          },
        ],
      },

      {
        id: "camarones-la-almeja-2",
        nombre: "Camarones",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion: "Aguachile, mojo de ajo, empanizados y ceviche",
        imagen: "/productos/camarones-la-almeja-2.jpg",
        textoSelector: "Elige tus camarones:",
        opciones: [
          {
            id: "aguachile-chitepin-la-almeja-2",
            nombre: "Aguachile chitepin",
            precio: 220,
            descripcion: "Camarones en aguachile chitepin",
          },
          {
            id: "camarones-al-aguachile-la-almeja-2",
            nombre: "Al aguachile",
            precio: 200,
            descripcion: "Camarones al aguachile",
          },
          {
            id: "camarones-mojo-ajo-la-almeja-2",
            nombre: "Al mojo de ajo",
            precio: 180,
            descripcion: "Camarones al mojo de ajo",
          },
          {
            id: "camarones-empanizados-la-almeja-2",
            nombre: "Empanizados",
            precio: 180,
            descripcion: "Camarones empanizados",
          },
          {
            id: "ceviche-camaron-la-almeja-2",
            nombre: "Ceviche de camarón",
            precio: 200,
            descripcion: "Ceviche de camarón",
          },
        ],
      },

      {
        id: "pescado-la-almeja-2",
        nombre: "Pescado",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion: "Filetes, ceviche, mojarra y macabil",
        imagen: "/productos/pescado-la-almeja-2.jpg",
        textoSelector: "Elige tu pescado:",
        opciones: [
          {
            id: "filete-mexicana-la-almeja-2",
            nombre: "Filete a la mexicana",
            precio: 150,
            descripcion: "Filete a la mexicana",
          },
          {
            id: "filete-vapor-la-almeja-2",
            nombre: "Filete al vapor",
            precio: 150,
            descripcion: "Filete al vapor",
          },
          {
            id: "ceviche-pescado-la-almeja-2",
            nombre: "Ceviche",
            precio: 100,
            descripcion: "Ceviche de pescado",
          },
          {
            id: "filete-empanizado-la-almeja-2",
            nombre: "Filete empanizado",
            precio: 130,
            descripcion: "Filete empanizado",
          },
          {
            id: "mojarra-la-almeja-2",
            nombre: "Mojarra",
            precio: 150,
            descripcion: "Mojarra",
          },
          {
            id: "macabil-la-almeja-2",
            nombre: "Macabil",
            precio: 180,
            descripcion: "Macabil",
          },
          {
            id: "mojarra-vapor-la-almeja-2",
            nombre: "Mojarra al vapor",
            precio: 180,
            descripcion: "Mojarra al vapor",
          },
          {
            id: "mojarra-mexicana-la-almeja-2",
            nombre: "Mojarra a la mexicana",
            precio: 180,
            descripcion: "Mojarra a la mexicana",
          },
        ],
      },

      {
        id: "tostadas-la-almeja-2",
        nombre: "Tostadas",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion: "Ceviche, camarón, mixtas, calamar y caracol",
        imagen: "/productos/tostadas-la-almeja-2.jpg",
        textoSelector: "Elige tus tostadas:",
        opciones: [
          {
            id: "tostada-ceviche-la-almeja-2",
            nombre: "De ceviche",
            precio: 45,
            descripcion: "Tostada de ceviche",
          },
          {
            id: "tostada-camaron-la-almeja-2",
            nombre: "De camarón",
            precio: 45,
            descripcion: "Tostada de camarón",
          },
          {
            id: "tostada-mixta-la-almeja-2",
            nombre: "Mixtas",
            precio: 60,
            descripcion: "Tostada mixta",
          },
          {
            id: "tostada-calamar-la-almeja-2",
            nombre: "De calamar",
            precio: 45,
            descripcion: "Tostada de calamar",
          },
          {
            id: "tostada-caracol-la-almeja-2",
            nombre: "De caracol",
            precio: 45,
            descripcion: "Tostada de caracol",
          },
        ],
      },

      {
        id: "caldos-la-almeja-2",
        nombre: "Caldos",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion: "Caldo de camarón, mariscos y sopa de mariscos",
        imagen: "/productos/caldos-la-almeja-2.jpg",
        textoSelector: "Elige tu caldo:",
        opciones: [
          {
            id: "caldo-camaron-la-almeja-2",
            nombre: "De camarón",
            precio: 200,
            descripcion: "Caldo de camarón",
          },
          {
            id: "caldo-mariscos-la-almeja-2",
            nombre: "De mariscos",
            precio: 220,
            descripcion: "Caldo de mariscos",
          },
          {
            id: "sopa-mariscos-la-almeja-2",
            nombre: "Sopa de mariscos",
            precio: 220,
            descripcion: "Sopa de mariscos",
          },
        ],
      },

      {
        id: "bebidas-la-almeja-2",
        nombre: "Bebidas",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion: "Bebidas, micheladas, refrescos y agua natural",
        imagen: "/productos/bebidas-la-almeja-2.jpg",
        textoSelector: "Elige tu bebida:",
        opciones: [
          {
            id: "banadita-la-almeja-2",
            nombre: "Bañadita",
            precio: 100,
            descripcion: "Bañadita",
          },
          {
            id: "chilquada-la-almeja-2",
            nombre: "Chilquada",
            precio: 50,
            descripcion: "Chilquada",
          },
          {
            id: "modelo-la-almeja-2",
            nombre: "Modelo",
            precio: 35,
            descripcion: "Modelo",
          },
          {
            id: "michelada-copa-la-almeja-2",
            nombre: "Michelada copa",
            precio: 50,
            descripcion: "Michelada copa",
          },
          {
            id: "michelada-copa-camaron-la-almeja-2",
            nombre: "Michelada copa/camarón",
            precio: 80,
            descripcion: "Michelada copa con camarón",
          },
          {
            id: "michelada-tarro-la-almeja-2",
            nombre: "Michelada tarro",
            precio: 60,
            descripcion: "Michelada tarro",
          },
          {
            id: "michelada-tarro-camaron-la-almeja-2",
            nombre: "Michelada tarro/camarón",
            precio: 90,
            descripcion: "Michelada tarro con camarón",
          },
          {
            id: "refresco-la-almeja-2",
            nombre: "Refresco",
            precio: 25,
            descripcion: "Refresco",
          },
          {
            id: "agua-natural-la-almeja-2",
            nombre: "Agua natural",
            precio: 25,
            descripcion: "Agua natural",
          },
          {
            id: "jarra-agua-natural-la-almeja-2",
            nombre: "Jarra de agua natural",
            precio: 120,
            descripcion: "Jarra de agua natural",
          },
        ],
      },
    ],
  }
];

export default negocios;