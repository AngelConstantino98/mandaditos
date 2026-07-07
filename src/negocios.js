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


// Toppings para Monsis Fresas
const TOPPINGS_MONSIS_FRESAS = [
  "Chispas de chocolate",
  "Coco rayado",
  "Bombón",
  "Mazapán",
  "Bubulubu",
  "Oreo",
  "Chocoletas",
  "Granola",
  "Cremino",
  "Pastelito Hershey's",
];

// Jarabes para Monsis Fresas
const JARABES_MONSIS_FRESAS = [
  "Nutella",
  "Cajeta",
  "Hershey's",
  "Lechera",
];

const negocios = [
  {
    id: "antojitos-la-bendicion-de-dios",
    nombre: "ANTOJITOS La Bendición de Dios",
    emoji: "🌮",
    descripcion:
      "Quesadillas, tostadas, empanadas, burritos, tacos, sopes y tlayudas",
    imagen: "/negocios/antojitos-la-bendicion-de-dios.jpg",
    horarios: [
          { dias: [0, 1, 2, 3, 4, 5, 6], abre: "17:00", cierra: "23:30" },
        ],
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
    horarios: [
          { dias: [0, 1, 2, 3, 4, 5, 6], abre: "07:30", cierra: "23:00" },
        ],
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
      precioTexto: "Ver opciones",
      descripcion: "Agrega tacos de cabeza de res al carrito",
      imagen: "/productos/tacos-cabeza-dona-lety.jpg",
      textoSelector: "Agrega la cantidad que quieres:",
      opciones: [
        {
          id: "orden-tacos-cabeza-dona-lety",
          nombre: "Tacos de cabeza de res",
          precio: null,
          precioTexto: "Precio a consultar",
          descripcion: "Precio a consultar con el negocio",
        },
      ],
    },
  ],
},

  {
    id: "el-carboncito",
    nombre: "El Carboncito",
    emoji: "🔥",
    descripcion: "Tacos, gringas, tortas, quesadillas y especialidades",
    imagen: "/negocios/negocio-elcarboncito.jpeg",
    horarios: [
      { dias: [0, 1, 2, 3, 4, 5, 6], abre: "16:00", cierra: "00:30" },
    ],
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
  },

  {
    id: "cockteleria-la-almeja-2",
    nombre: "COCKTELERIA LA ALMEJA 2",
    emoji: "🦐",
    descripcion:
      "Cockteles, ensaladas, camarones, pescado, tostadas, caldos y bebidas",
    imagen: "/negocios/cockteleria-la-almeja-2.jpg",
    horarios: [
          { dias: [0, 1, 3, 4, 5, 6], abre: "12:00", cierra: "18:00" },
        ],
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
            id: "chiquiada-la-almeja-2",
            nombre: "Chiquiada",
            precio: 50,
            descripcion: "Chiquiada",
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
  },
  {
    id: "cocteleria-juanito",
    nombre: "Coctelería Juanito",
    emoji: "🦐",
    descripcion: "Cockteles, ensaladas, camarones, mojarras, tostadas, licuados y bebidas",
    imagen: "/negocios/cocteleria-juanito.jpg",
    horarios: [
      { dias: [0, 1, 2, 3, 4, 5, 6], abre: "10:00", cierra: "20:00" },
    ],
    productos: [
      {
        id: "cocktel-juanito",
        nombre: "Cocktel",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion: "Camarón, ostión, pulpo y mixto en chico, mediano o grande",
        imagen: "/productos/cocktel-juanito.jpg",
        textoSelector: "Elige tu cocktel:",
        opciones: [
          { id: "cocktel-camaron-chico-juanito", nombre: "Camarón chico", precio: 120, descripcion: "Cocktel de camarón chico" },
          { id: "cocktel-camaron-mediano-juanito", nombre: "Camarón mediano", precio: 140, descripcion: "Cocktel de camarón mediano" },
          { id: "cocktel-camaron-grande-juanito", nombre: "Camarón grande", precio: 160, descripcion: "Cocktel de camarón grande" },
          { id: "cocktel-ostion-chico-juanito", nombre: "Ostión chico", precio: 120, descripcion: "Cocktel de ostión chico" },
          { id: "cocktel-ostion-mediano-juanito", nombre: "Ostión mediano", precio: 140, descripcion: "Cocktel de ostión mediano" },
          { id: "cocktel-ostion-grande-juanito", nombre: "Ostión grande", precio: 160, descripcion: "Cocktel de ostión grande" },
          { id: "cocktel-pulpo-chico-juanito", nombre: "Pulpo chico", precio: 120, descripcion: "Cocktel de pulpo chico" },
          { id: "cocktel-pulpo-mediano-juanito", nombre: "Pulpo mediano", precio: 140, descripcion: "Cocktel de pulpo mediano" },
          { id: "cocktel-pulpo-grande-juanito", nombre: "Pulpo grande", precio: 160, descripcion: "Cocktel de pulpo grande" },
          { id: "cocktel-mixto-chico-juanito", nombre: "Mixto chico", precio: 120, descripcion: "Cocktel mixto chico" },
          { id: "cocktel-mixto-mediano-juanito", nombre: "Mixto mediano", precio: 160, descripcion: "Cocktel mixto mediano" },
          { id: "cocktel-mixto-grande-juanito", nombre: "Mixto grande", precio: 180, descripcion: "Cocktel mixto grande" },
        ],
      },

      {
        id: "ensaladas-juanito",
        nombre: "Ensaladas",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion: "Camarón, pulpo, mixta y ceviche",
        imagen: "/productos/ensaladas-juanito.jpg",
        textoSelector: "Elige tu ensalada:",
        opciones: [
          { id: "ensalada-camaron-juanito", nombre: "Camarón", precio: 220, descripcion: "Ensalada de camarón" },
          { id: "ensalada-camaron-familiar-juanito", nombre: "Camarón familiar", precio: 700, descripcion: "Ensalada de camarón familiar" },
          { id: "ensalada-pulpo-juanito", nombre: "Pulpo", precio: 220, descripcion: "Ensalada de pulpo" },
          { id: "ensalada-mixta-juanito", nombre: "Mixta", precio: 250, descripcion: "Ensalada mixta" },
          { id: "ceviche-juanito", nombre: "Ceviche", precio: 230, descripcion: "Ceviche" },
        ],
      },

      {
        id: "camarones-juanito",
        nombre: "Camarones",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion: "Aguachile, mojo de ajo, empanizados, a la plancha, a la diabla y a la momia",
        imagen: "/productos/camarones-juanito.jpg",
        textoSelector: "Elige tus camarones:",
        opciones: [
          { id: "camarones-aguachile-juanito", nombre: "Al aguachile", precio: 230, descripcion: "Camarones al aguachile" },
          { id: "camarones-mojo-ajo-juanito", nombre: "Al mojo de ajo", precio: 230, descripcion: "Camarones al mojo de ajo" },
          { id: "camarones-empanizados-juanito", nombre: "Empanizados", precio: 250, descripcion: "Camarones empanizados" },
          { id: "camarones-plancha-juanito", nombre: "A la plancha", precio: 250, descripcion: "Camarones a la plancha" },
          { id: "camarones-diabla-juanito", nombre: "A la diabla", precio: 230, descripcion: "Camarones a la diabla" },
          { id: "camarones-momia-juanito", nombre: "A la momia", precio: 280, descripcion: "Camarones a la momia" },
        ],
      },

      {
        id: "mojarras-juanito",
        nombre: "Mojarras",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion: "Al mojo de ajo, a la mexicana y empanizada",
        imagen: "/productos/mojarras-juanito.jpg",
        textoSelector: "Elige tu mojarra:",
        opciones: [
          { id: "mojarra-mojo-ajo-juanito", nombre: "Al mojo de ajo", precio: 250, descripcion: "Mojarra al mojo de ajo" },
          { id: "mojarra-mexicana-juanito", nombre: "A la mexicana", precio: 250, descripcion: "Mojarra a la mexicana" },
          { id: "mojarra-empanizada-juanito", nombre: "Empanizada", precio: 250, descripcion: "Mojarra empanizada" },
        ],
      },

      {
        id: "vuelve-a-la-vida-juanito",
        nombre: "Vuelve a la vida",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion: "Chico, mediano o grande",
        imagen: "/productos/vuelve-a-la-vida-juanito.jpg",
        textoSelector: "Elige el tamaño:",
        opciones: [
          { id: "vuelve-a-la-vida-chico-juanito", nombre: "Chico", precio: 120, descripcion: "Vuelve a la vida chico" },
          { id: "vuelve-a-la-vida-mediano-juanito", nombre: "Mediano", precio: 140, descripcion: "Vuelve a la vida mediano" },
          { id: "vuelve-a-la-vida-grande-juanito", nombre: "Grande", precio: 160, descripcion: "Vuelve a la vida grande" },
        ],
      },

      {
        id: "tostadas-juanito",
        nombre: "Tostadas",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion: "Tostada de camarón por pieza",
        imagen: "/productos/tostadas-juanito.jpg",
        textoSelector: "Elige tu tostada:",
        opciones: [
          { id: "tostada-camaron-juanito", nombre: "Camarón", precio: 60, descripcion: "Tostada de camarón por pieza" },
        ],
      },

      {
        id: "especiales-mariscos-juanito",
        nombre: "Especiales de mariscos",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion: "Filete de pescado, caldo de mariscos y shot de ostión",
        imagen: "/productos/especiales-mariscos-juanito.jpg",
        textoSelector: "Elige una opción:",
        opciones: [
          { id: "filete-pescado-juanito", nombre: "Filete de pescado", precio: 230, descripcion: "Filete de pescado" },
          { id: "caldo-mariscos-juanito", nombre: "Caldo de mariscos", precio: 280, descripcion: "Caldo de mariscos" },
          { id: "shot-ostion-juanito", nombre: "Shot de ostión", precio: 35, descripcion: "Shot de ostión" },
        ],
      },

      {
        id: "licuados-juanito",
        nombre: "Licuados",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion: "Plátano, mamey, fresa y chocomilk",
        imagen: "/productos/licuados-juanito.jpg",
        textoSelector: "Elige tu licuado:",
        opciones: [
          { id: "licuado-platano-juanito", nombre: "Plátano", precio: 80, descripcion: "Licuado de plátano" },
          { id: "licuado-mamey-juanito", nombre: "Mamey", precio: 80, descripcion: "Licuado de mamey" },
          { id: "licuado-fresa-juanito", nombre: "Fresa", precio: 80, descripcion: "Licuado de fresa" },
          { id: "licuado-chocomilk-juanito", nombre: "Chocomilk", precio: 80, descripcion: "Licuado de chocomilk" },
        ],
      },

      {
        id: "cervezas-juanito",
        nombre: "Cervezas",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion: "solo en establecimiento",
        imagen: "/productos/cervezas-juanito.jpg",
        textoSelector: "Elige tu cerveza:",
        opciones: [
          { id: "corona-cuarto-juanito", nombre: "Corona 1/4", precio: 35, descripcion: "Corona 1/4" },
          { id: "corona-media-juanito", nombre: "Corona 1/2", precio: 45, descripcion: "Corona 1/2" },
          { id: "victoria-cuarto-juanito", nombre: "Victoria 1/4", precio: 35, descripcion: "Victoria 1/4" },
          { id: "victoria-media-juanito", nombre: "Victoria 1/2", precio: 45, descripcion: "Victoria 1/2" },
        ],
      },

      {
        id: "micheladas-juanito",
        nombre: "Micheladas",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion: "Sencillas, con camarón y chiquiadas",
        imagen: "/productos/micheladas-juanito.jpg",
        textoSelector: "Elige tu michelada:",
        opciones: [
          { id: "michelada-sencilla-juanito", nombre: "Sencillas", precio: 70, descripcion: "Michelada sencilla" },
          { id: "michelada-camaron-juanito", nombre: "Con camarón", precio: 85, descripcion: "Michelada con camarón" },
          { id: "michelada-chiquiada-juanito", nombre: "Chiquiadas", precio: 70, descripcion: "Michelada chiquiada" },
        ],
      },

      {
        id: "refrescos-juanito",
        nombre: "Refrescos",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion: "Solo en establecimiento",
        imagen: "/productos/refrescos-juanito.jpg",
        textoSelector: "Elige tu refresco:",
        opciones: [
          { id: "refresco-juanito", nombre: "Refresco", precio: 35, descripcion: "solo en establecimiento" },
        ],
      },

      {
        id: "jarras-agua-juanito",
        nombre: "Jarras de agua",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion: "Piña, melón, sandía y horchata",
        imagen: "/productos/jarras-agua-juanito.jpg",
        textoSelector: "Elige tu jarra de agua:",
        opciones: [
          { id: "jarra-agua-pina-juanito", nombre: "Piña", precio: 120, descripcion: "Jarra de agua de piña" },
          { id: "jarra-agua-melon-juanito", nombre: "Melón", precio: 120, descripcion: "Jarra de agua de melón" },
          { id: "jarra-agua-sandia-juanito", nombre: "Sandía", precio: 120, descripcion: "Jarra de agua de sandía" },
          { id: "jarra-agua-horchata-juanito", nombre: "Horchata", precio: 120, descripcion: "Jarra de agua de horchata" },
        ],
      },
    ],
  },


  {
    id: "monsis-fresas",
    nombre: "Monsis Fresas",
    emoji: "🍓",
    descripcion: "Fresas con crema, toppings, jarabes y frappes",
    imagen: "/negocios/monsis-fresas.jpg",
    horarios: [
          { dias: [0, 2, 3, 4, 5, 6], abre: "16:00", cierra: "21:00" },
        ],
    productos: [
      {
        id: "fresas-crema-chica-monsis",
        nombre: "Fresas con crema chica",
        precio: 50,
        descripcion: "Incluye 1 topping. Puedes elegir jarabes.",
        imagen: "/productos/monsis-fresas-chica.png",
        toppings: TOPPINGS_MONSIS_FRESAS,
        maxToppings: 1,
        jarabes: JARABES_MONSIS_FRESAS,
        textoToppings: "Elige 1 topping:",
        textoJarabes: "Selecciona jarabes:",
      },
      {
        id: "fresas-crema-mediana-monsis",
        nombre: "Fresas con crema mediana",
        precio: 80,
        descripcion: "Incluye 1 topping. Puedes elegir jarabes.",
        imagen: "/productos/monsis-fresas-mediana.png",
        toppings: TOPPINGS_MONSIS_FRESAS,
        maxToppings: 1,
        jarabes: JARABES_MONSIS_FRESAS,
        textoToppings: "Elige 1 topping:",
        textoJarabes: "Selecciona jarabes:",
      },
      {
        id: "fresas-crema-grande-monsis",
        nombre: "Fresas con crema grande",
        precio: 100,
        descripcion: "Incluye 2 toppings. Puedes elegir jarabes.",
        imagen: "/productos/monsis-fresas-grande.png",
        toppings: TOPPINGS_MONSIS_FRESAS,
        maxToppings: 2,
        jarabes: JARABES_MONSIS_FRESAS,
        textoToppings: "Elige hasta 2 toppings:",
        textoJarabes: "Selecciona jarabes:",
      },
      {
        id: "frappe-monsis",
        nombre: "Frappe",
        precio: null,
        precioTexto: "Ver sabores",
        descripcion: "Gansito, fresa u Oreo",
        imagen: "/productos/monsis-fresas-frappe.png",
        textoSelector: "Elige el sabor de frappe:",
        opciones: [
          {
            id: "frappe-gansito-monsis",
            nombre: "Gansito",
            precio: 60,
            descripcion: "Frappe sabor gansito",
          },
          {
            id: "frappe-fresa-monsis",
            nombre: "Fresa",
            precio: 60,
            descripcion: "Frappe sabor fresa",
          },
          {
            id: "frappe-oreo-monsis",
            nombre: "Oreo",
            precio: 60,
            descripcion: "Frappe sabor Oreo",
          },
        ],
      },
    ],
  },

  {
    id: "pasteleria-oscarin",
    nombre: "Pastelería Oscarín",
    emoji: "🎂",
    descripcion: "Pasteles tres leches y tradicionales de 15 a 20 porciones",
    imagen: "/negocios/pasteleria-oscarin.jpg",
    horarios: [
          { dias: [0, 1, 2, 3, 4, 5, 6], abre: "08:00", cierra: "20:00" },
        ],
    productos: [
      {
        id: "pastel-vainilla-oscarin",
        nombre: "Pastel tradicional vainilla",
        precio: 300,
        descripcion:
          "Pastel tradicional de vainilla, relleno de crema batida. Porciones: 15/20. Presentación única. Mantener frío, no mayor a 6°C.",
        imagen: "/productos/pasteleria-oscarin-vainilla.jpg",
      },
      {
        id: "pastel-manjar-oscarin",
        nombre: "Manjar",
        precio: 350,
        descripcion:
          "Pastel base de vainilla, relleno de crema tipo manjar sabor vainilla y canela. Porciones: 15/20. Presentación única. Mantener frío, no mayor a 6°C.",
        imagen: "/productos/pasteleria-oscarin-manjar.jpg",
      },
      {
        id: "pastel-capuchino-oscarin",
        nombre: "Capuchino",
        precio: 300,
        descripcion:
          "Pastel tres leches con sabor a café capuchino, relleno de su misma crema. Porciones: 15/20. Presentación única. Mantener frío, no mayor a 6°C.",
        imagen: "/productos/pasteleria-oscarin-capuchino.jpg",
      },
      {
        id: "pastel-moka-oscarin",
        nombre: "Moka",
        precio: 300,
        descripcion:
          "Pastel tres leches con sabor moka tradicional, relleno de su misma crema. Porciones: 15/20. Presentación única. Mantener frío, no mayor a 6°C.",
        imagen: "/productos/pasteleria-oscarin-moka.jpg",
      },
      {
        id: "pastel-oreo-oscarin",
        nombre: "Oreo",
        precio: 350,
        descripcion:
          "Pastel tres leches sabor galleta de chocolate, relleno de galleta Oreo triturada. Porciones: 15/20. Presentación variada. Mantener frío, no mayor a 6°C.",
        imagen: "/productos/pasteleria-oscarin-oreo.jpg",
      },
      {
        id: "pastel-nuez-oscarin",
        nombre: "Nuez",
        precio: 350,
        descripcion:
          "Pastel tres leches relleno de crema de nuez triturada. Porciones: 15/20. Presentación variada. Mantener frío, no mayor a 6°C.",
        imagen: "/productos/pasteleria-oscarin-nuez.jpg",
      },
      {
        id: "pastel-coco-oscarin",
        nombre: "Coco",
        precio: 350,
        descripcion:
          "Pastel tres leches sabor coco, relleno de crema de coco y glaseado con coco rallado. Porciones: 15/20. Presentación única. Mantener frío, no mayor a 6°C.",
        imagen: "/productos/pasteleria-oscarin-coco.jpg",
      },
      {
        id: "pastel-chocolate-oscarin",
        nombre: "Chocolate",
        precio: 350,
        descripcion:
          "Pastel tres leches de vainilla, relleno de crema de chocolate semiamargo. Porciones: 15/20. Presentación variada. Mantener frío, no mayor a 6°C.",
        imagen: "/productos/pasteleria-oscarin-chocolate.jpg",
      },
      {
        id: "pastel-malvavisco-oscarin",
        nombre: "Malvavisco",
        precio: 350,
        descripcion:
          "Pastel tres leches relleno con una explosión de malvavisco en el centro. Porciones: 15/20. Presentación única. Mantener frío, no mayor a 6°C.",
        imagen: "/productos/pasteleria-oscarin-malvavisco.jpg",
      },
      {
        id: "pastel-fiesta-oscarin",
        nombre: "Fiesta",
        precio: 350,
        descripcion:
          "Pastel tres leches relleno de chispas de chocolate, ideal para fiestas. Porciones: 15/20. Presentación variada. Mantener frío, no mayor a 6°C.",
        imagen: "/productos/pasteleria-oscarin-fiesta.jpg",
      },
      {
        id: "pastel-carajillo-oscarin",
        nombre: "Carajillo",
        precio: 350,
        descripcion:
          "Pastel tres leches relleno de crema de café con un toque de whisky. Porciones: 15/20. Presentación variada. Mantener frío, no mayor a 6°C.",
        imagen: "/productos/pasteleria-oscarin-carajillo.jpg",
      },
    ],
  },

  {
    id: "papeleria-las-gueras",
    nombre: "Papelería Las Güeras",
    emoji: "📚",
    descripcion: "Papelería, regalos, material escolar, peluches, copias e impresiones",
    imagen: "/negocios/papeleria-las-gueras.jpg",
    horarios: [
          { dias: [1, 2, 3, 4, 5], abre: "08:00", cierra: "20:00" },
          { dias: [0, 6], abre: "08:00", cierra: "16:00" },
        ],
    productos: [
      {
        id: "libretas-cuadernos-las-gueras",
        nombre: "Libretas y cuadernos",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion:
          "Libretas, cuadernos profesionales, cuadernos cosidos, libretas de rayas, dibujo y modelos decorados.",
        imagen: "/productos/papeleria-las-gueras-libretas.jpg",
        textoSelector: "Elige qué tipo de libreta o cuaderno necesitas:",
        opciones: [
          {
            id: "libreta-rayas-las-gueras",
            nombre: "Libreta de rayas",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Libreta de rayas. Modelo y precio a consultar.",
          },
          {
            id: "libreta-dibujo-las-gueras",
            nombre: "Libreta de dibujo",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Libreta de dibujo. Modelo y precio a consultar.",
          },
          {
            id: "cuaderno-profesional-las-gueras",
            nombre: "Cuaderno profesional",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Cuaderno profesional. Modelo y precio a consultar.",
          },
          {
            id: "cuaderno-cosido-las-gueras",
            nombre: "Cuaderno cosido",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Cuaderno cosido. Modelo y precio a consultar.",
          },
          {
            id: "cuadernos-colores-las-gueras",
            nombre: "Cuadernos de colores",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Cuadernos de colores. Modelo y precio a consultar.",
          },
          {
            id: "libretas-decoradas-las-gueras",
            nombre: "Libretas decoradas",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Libretas decoradas. Modelo y precio a consultar.",
          },
        ],
      },
      {
        id: "material-escolar-las-gueras",
        nombre: "Material escolar",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion:
          "Pinturas, colores, plumones, marcadores, fomi, hojas de colores, cartulinas y material para tareas.",
        imagen: "/productos/papeleria-las-gueras-material-escolar.jpg",
        textoSelector: "Elige el material escolar que necesitas:",
        opciones: [
          {
            id: "pinturas-las-gueras",
            nombre: "Pinturas",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Pinturas escolares. Color, marca y precio a consultar.",
          },
          {
            id: "pintura-textil-las-gueras",
            nombre: "Pintura textil",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Pintura textil. Color y precio a consultar.",
          },
          {
            id: "colores-las-gueras",
            nombre: "Colores",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Colores escolares. Marca y precio a consultar.",
          },
          {
            id: "plumones-marcadores-las-gueras",
            nombre: "Plumones / marcadores",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Plumones o marcadores. Tipo y precio a consultar.",
          },
          {
            id: "fomi-las-gueras",
            nombre: "Fomi",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Fomi para manualidades. Color y precio a consultar.",
          },
          {
            id: "hojas-colores-las-gueras",
            nombre: "Hojas de colores",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Hojas de colores. Tamaño y precio a consultar.",
          },
          {
            id: "cartulinas-papel-colores-las-gueras",
            nombre: "Cartulinas / papel de colores",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Cartulinas o papel de colores. Precio a consultar.",
          },
        ],
      },
      {
        id: "diccionarios-libros-las-gueras",
        nombre: "Diccionarios y libros escolares",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion:
          "Diccionarios escolares, diccionarios Larousse, libros básicos y material de apoyo escolar.",
        imagen: "/productos/papeleria-las-gueras-diccionarios.jpg",
        textoSelector: "Elige el libro o diccionario que necesitas:",
        opciones: [
          {
            id: "diccionario-larousse-pocket-las-gueras",
            nombre: "Diccionario Larousse Pocket",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Diccionario Larousse Pocket. Precio a consultar.",
          },
          {
            id: "diccionario-basico-escolar-las-gueras",
            nombre: "Diccionario Básico Escolar",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Diccionario Básico Escolar. Precio a consultar.",
          },
          {
            id: "diccionario-escolar-las-gueras",
            nombre: "Diccionario Escolar",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Diccionario Escolar. Precio a consultar.",
          },
          {
            id: "diccionario-lengua-espanola-las-gueras",
            nombre: "Diccionario de Lengua Española",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Diccionario de Lengua Española. Precio a consultar.",
          },
          {
            id: "libros-apoyo-escolar-las-gueras",
            nombre: "Libros de apoyo escolar",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Libros básicos o de apoyo escolar. Precio a consultar.",
          },
        ],
      },
      {
        id: "peluches-regalos-las-gueras",
        nombre: "Peluches y regalos",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion:
          "Peluches de personajes, peluches de corazón, detalles y regalos para ocasiones especiales.",
        imagen: "/productos/papeleria-las-gueras-peluches-regalos.jpg",
        textoSelector: "Elige el tipo de regalo:",
        opciones: [
          {
            id: "peluches-personajes-las-gueras",
            nombre: "Peluches de personajes",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Peluches de personajes. Tamaño y precio a consultar.",
          },
          {
            id: "peluches-corazon-las-gueras",
            nombre: "Peluches de corazón",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Peluches de corazón. Tamaño y precio a consultar.",
          },
          {
            id: "peluches-medianos-las-gueras",
            nombre: "Peluches medianos",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Peluches medianos. Modelo y precio a consultar.",
          },
          {
            id: "peluches-grandes-las-gueras",
            nombre: "Peluches grandes",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Peluches grandes. Modelo y precio a consultar.",
          },
          {
            id: "detalles-regalos-las-gueras",
            nombre: "Detalles y regalos decorativos",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Detalles y regalos decorativos. Precio a consultar.",
          },
        ],
      },
      {
        id: "bolsas-accesorios-las-gueras",
        nombre: "Bolsas y accesorios",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion:
          "Bolsas de regalo, bolsitas, carteras, accesorios y artículos decorativos.",
        imagen: "/productos/papeleria-las-gueras-bolsas-accesorios.jpg",
        textoSelector: "Elige el artículo que necesitas:",
        opciones: [
          {
            id: "bolsas-regalo-las-gueras",
            nombre: "Bolsas de regalo",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Bolsas de regalo. Tamaño, diseño y precio a consultar.",
          },
          {
            id: "bolsitas-las-gueras",
            nombre: "Bolsitas",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Bolsitas. Modelo y precio a consultar.",
          },
          {
            id: "carteras-las-gueras",
            nombre: "Carteras",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Carteras o bolsitas. Modelo y precio a consultar.",
          },
          {
            id: "accesorios-vitrina-las-gueras",
            nombre: "Accesorios de vitrina",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Accesorios de vitrina. Precio a consultar.",
          },
          {
            id: "articulos-decorativos-las-gueras",
            nombre: "Artículos decorativos",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Artículos decorativos. Precio a consultar.",
          },
        ],
      },
      {
        id: "copias-impresiones-las-gueras",
        nombre: "Copias e impresiones",
        precio: null,
        precioTexto: "Ver opciones",
        descripcion:
          "Servicio de copias, impresiones y trabajos básicos de papelería.",
        imagen: "/productos/papeleria-las-gueras-copias-impresiones.jpg",
        textoSelector: "Elige el servicio que necesitas:",
        opciones: [
          {
            id: "copias-las-gueras",
            nombre: "Copias",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Servicio de copias. Precio a consultar.",
          },
          {
            id: "impresiones-las-gueras",
            nombre: "Impresiones",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Servicio de impresiones. Precio a consultar.",
          },
          {
            id: "trabajos-basicos-papeleria-las-gueras",
            nombre: "Trabajos básicos de papelería",
            precio: null,
            precioTexto: "Precio a consultar",
            descripcion: "Trabajos básicos de papelería. Precio a consultar.",
          },
        ],
      },
    ],
  },


  {
    id: "liamdi-hamburguesas-y-mas",
    nombre: "🔥 LIAMDI Hamburguesas y Más",
    emoji: "🔥",
    descripcion:
      "Hamburguesas, hot dogs jumbo, alitas, papas, aros de cebolla, bebidas y combos",
    imagen: "/negocios/liamdi-hamburguesas-y-mas.jpg",
    horarios: [
      { dias: [0, 1, 2, 3, 4, 5, 6], abre: "18:00", cierra: "22:00" },
    ],
    productos: [
      {
        id: "hamburguesa-clasica-liamdi",
        nombre: "Hamburguesa clásica",
        precio: 85,
        descripcion: "Pan, carne, quesillo, jamón y verduras. Puedes agregar extras.",
        imagen: "/productos/liamdi-hamburguesas.jpg",
        extras: [
          { id: "ingrediente-extra-liamdi", nombre: "Ingrediente extra", precio: 20 },
          { id: "carne-adicional-liamdi", nombre: "Carne adicional", precio: 35 },
        ],
      },
      {
        id: "hamburguesa-tocino-liamdi",
        nombre: "Hamburguesa tocino",
        precio: 100,
        descripcion: "Pan, carne, quesillo, jamón, tocino y verduras. Puedes agregar extras.",
        imagen: "/productos/liamdi-hamburguesas-tocino.jpg",
        extras: [
          { id: "ingrediente-extra-liamdi", nombre: "Ingrediente extra", precio: 20 },
          { id: "carne-adicional-liamdi", nombre: "Carne adicional", precio: 35 },
        ],
      },
      {
        id: "hamburguesa-hawaiana-liamdi",
        nombre: "Hamburguesa hawaiana",
        precio: 100,
        descripcion: "Pan, carne, quesillo, jamón, tocino, piña y verduras. Puedes agregar extras.",
        imagen: "/productos/liamdi-hamburguesas-hawaiana.jpg",
        extras: [
          { id: "ingrediente-extra-liamdi", nombre: "Ingrediente extra", precio: 20 },
          { id: "carne-adicional-liamdi", nombre: "Carne adicional", precio: 35 },
        ],
      },
      {
        id: "hamburguesa-bbq-liamdi",
        nombre: "Hamburguesa BBQ",
        precio: 100,
        descripcion: "Pan, carne, quesillo, jamón, tocino, BBQ y verduras. Puedes agregar extras.",
        imagen: "/productos/liamdi-hamburguesas-bbq.jpg",
        extras: [
          { id: "ingrediente-extra-liamdi", nombre: "Ingrediente extra", precio: 20 },
          { id: "carne-adicional-liamdi", nombre: "Carne adicional", precio: 35 },
        ],
      },
      {
        id: "hamburguesa-salchiburger-liamdi",
        nombre: "Salchiburger",
        precio: 100,
        descripcion:
          "Pan, carne, quesillo, jamón, salchicha para asar y verduras. Puedes agregar extras.",
        imagen: "/productos/liamdi-hamburguesas-salchi.jpg",
        extras: [
          { id: "ingrediente-extra-liamdi", nombre: "Ingrediente extra", precio: 20 },
          { id: "carne-adicional-liamdi", nombre: "Carne adicional", precio: 35 },
        ],
      },
      {
        id: "hamburguesa-chistorra-liamdi",
        nombre: "Hamburguesa chistorra",
        precio: 100,
        descripcion: "Pan, carne, quesillo, jamón, chistorra y verduras. Puedes agregar extras.",
        imagen: "/productos/liamdi-hamburguesas-chistor.jpg",
        extras: [
          { id: "ingrediente-extra-liamdi", nombre: "Ingrediente extra", precio: 20 },
          { id: "carne-adicional-liamdi", nombre: "Carne adicional", precio: 35 },
        ],
      },
      {
        id: "hamburguesa-doble-carne-liamdi",
        nombre: "Hamburguesa doble carne",
        precio: 120,
        descripcion:
          "Pan, doble porción de carne, quesillo, jamón y verduras. Puedes agregar extras.",
        imagen: "/productos/liamdi-hamburguesas-doblec.jpg",
        extras: [
          { id: "ingrediente-extra-liamdi", nombre: "Ingrediente extra", precio: 20 },
          { id: "carne-adicional-liamdi", nombre: "Carne adicional", precio: 35 },
        ],
      },
      {
        id: "hamburguesa-especial-liamdi",
        nombre: "Hamburguesa especial",
        precio: 130,
        descripcion:
          "Pan, carne, quesillo, jamón, tocino, piña, salchicha para asar y verduras. Puedes agregar extras.",
        imagen: "/productos/liamdi-hamburguesas-especial.jpg",
        extras: [
          { id: "ingrediente-extra-liamdi", nombre: "Ingrediente extra", precio: 20 },
          { id: "carne-adicional-liamdi", nombre: "Carne adicional", precio: 35 },
        ],
      },
      {
        id: "hot-dogs-jumbo-liamdi",
        nombre: "Hot dogs jumbo",
        precio: null,
        precioTexto: "Desde $60",
        descripcion: "Elige clásico o hawaiano.",
        imagen: "/productos/liamdi-hotdogs.jpg",
        textoSelector: "Elige tu hot dog jumbo:",
        opciones: [
          {
            id: "hot-dog-clasico-liamdi",
            nombre: "Clásico",
            precio: 60,
            descripcion: "Pan, salchicha, quesillo fundido y cebolla caramelizada.",
          },
          {
            id: "hot-dog-hawaiano-liamdi",
            nombre: "Hawaiano",
            precio: 80,
            descripcion:
              "Pan, salchicha, quesillo fundido, tocino, piña y cebolla caramelizada.",
          },
        ],
      },
      {
        id: "alitas-liamdi",
        nombre: "Alitas",
        precio: null,
        precioTexto: "$95",
        descripcion: "6 piezas acompañadas con porción de papas y aderezo ranch.",
        imagen: "/productos/liamdi-alitas.jpg",
        textoSelector: "Elige el sabor de tus alitas:",
        opciones: [
          { id: "alitas-bbq-liamdi", nombre: "BBQ", precio: 95, descripcion: "6 piezas con papas y aderezo ranch." },
          { id: "alitas-bufalo-liamdi", nombre: "Búfalo", precio: 95, descripcion: "6 piezas con papas y aderezo ranch." },
          { id: "alitas-mango-habanero-liamdi", nombre: "Mango habanero", precio: 95, descripcion: "6 piezas con papas y aderezo ranch." },
        ],
      },
      {
        id: "papas-liamdi",
        nombre: "Papas",
        precio: null,
        precioTexto: "Desde $10",
        descripcion: "Porción, papas a la francesa, salchipapas y papa rellena.",
        imagen: "/productos/liamdi-papas.jpg",
        textoSelector: "Elige tus papas:",
        opciones: [
          { id: "porcion-papas-liamdi", nombre: "Porción", precio: 10, descripcion: "Porción de papas." },
          { id: "papas-a-la-francesa-liamdi", nombre: "A la francesa", precio: 50, descripcion: "Papas a la francesa." },
          { id: "salchipapas-liamdi", nombre: "Salchipapas", precio: 80, descripcion: "Salchipapas." },
          { id: "papa-rellena-arrachera-liamdi", nombre: "Papa rellena con arrachera", precio: 100, descripcion: "Disponible fines de semana." },
        ],
      },
      {
        id: "aros-cebolla-liamdi",
        nombre: "Aros de cebolla",
        precio: 70,
        descripcion: "Orden de 10 piezas.",
        imagen: "/productos/liamdi-aros-cebolla.jpg",
      },
      {
        id: "bebidas-liamdi",
        nombre: "Bebidas",
        precio: null,
        precioTexto: "$30",
        descripcion: "Agua natural y refresco embotellado.",
        imagen: "/productos/liamdi-bebidas.jpg",
        textoSelector: "Elige tu bebida:",
        opciones: [
          { id: "agua-natural-liamdi", nombre: "Agua natural", precio: 30, descripcion: "Agua natural." },
          { id: "refresco-embotellado-liamdi", nombre: "Refresco embotellado", precio: 30, descripcion: "Refresco embotellado." },
        ],
      },
      {
        id: "combo-individual-liamdi",
        nombre: "Combo individual",
        precio: 130,
        descripcion:
          "1 hamburguesa de especialidad, 1 porción de papas y 1 agua o refresco.",
        imagen: "/productos/liamdi-combo-individual.jpg",
      },
      {
        id: "combo-pareja-liamdi",
        nombre: "Combo pareja",
        precio: 430,
        descripcion:
          "2 hamburguesas de especialidad, 2 órdenes de alitas, 1 porción de papas y 2 aguas o refrescos.",
        imagen: "/productos/liamdi-combo-pareja.jpg",
      },
      {
        id: "combo-mix-liamdi",
        nombre: "Combo mix",
        precio: 170,
        descripcion:
          "1 hamburguesa de especialidad, 1/2 orden de alitas, 1 porción de papas y 1 agua o refresco.",
        imagen: "/productos/liamdi-combo-mix.jpg",
      },
      {
        id: "combo-dogos-liamdi",
        nombre: "Combo dogos",
        precio: 180,
        descripcion:
          "2 hot dogs clásicos, 1/2 orden de aros de cebolla, 1 porción de papas y 1 agua o refresco.",
        imagen: "/productos/liamdi-combo-dogos.jpg",
      },
      {
        id: "combo-pro-liamdi",
        nombre: "Combo pro",
        precio: 240,
        descripcion:
          "2 hot dogs hawaianos, 1 orden de alas y 1 agua o refresco.",
        imagen: "/productos/liamdi-combo-pro.jpg",
      },
    ],
  },

];

export default negocios;