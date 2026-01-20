/* NutriMenu UCAB */

/*
   DATASET SIMULADO
*/
const simulatedMenuData = [
  {
    id: "m001",
    restaurant: "Feria UCAB - Local A",
    dish: "Pabellón Criollo Nutritivo",
    price: 4.5,
    stock: 15,
    isPublished: false,
    capacity: 50,
    currentAforo: 55,
    category: "almuerzo",
    stockAlertSent: false, // para evitar spam
  },
  {
    id: "m002",
    restaurant: "Nico Módulo 4",
    dish: "Bowl Vegano de Granos",
    price: 3.75,
    stock: 6,
    isPublished: false,
    capacity: 20,
    currentAforo: 18,
    category: "saludable",
    stockAlertSent: false,
  },
  {
    id: "m003",
    restaurant: "Cafetín Cincuentenario",
    dish: "Sandwich Integral de Pavo",
    price: 2.0,
    stock: 20,
    isPublished: false,
    capacity: 30,
    currentAforo: 5,
    category: "snack",
    stockAlertSent: false,
  },
  {
    id: "m004",
    restaurant: "Solarium Módulo 2",
    dish: "Ensalada César con Pollo",
    price: 5.0,
    stock: 3,
    isPublished: false,
    capacity: 15,
    currentAforo: 14,
    category: "saludable",
    stockAlertSent: false,
  },
];

/*
   UTILIDAD: Notificador UI
*/
const notifContainer = document.getElementById("notificaciones");
const contadorEl = document.getElementById("contador");

let notifCount = 0;

function addNotification({ tipo, titulo, mensaje }) {
  notifCount++;
  contadorEl.textContent = notifCount.toString();

  const now = new Date();
  const hora = now.toLocaleTimeString();

  const div = document.createElement("div");
  div.className = `notif ${tipo}`;

  div.innerHTML = `
    <div class="meta">
      <span class="tag">${tipo}</span>
      <strong>${titulo}</strong>
      <span style="float:right;">${hora}</span>
    </div>
    <div>${mensaje}</div>
  `;

  notifContainer.prepend(div);
}

/*
   POA - Aspecto (Auditoria)
*/
function auditoriaPOA(fnPrincipal) {
  return function (menu) {
    const hora = new Date().toLocaleTimeString();
    addNotification({
      tipo: "AUDITORIA",
      titulo: "AUDITORIA",
      mensaje: `${menu.restaurant} publicó menu "<b>${menu.dish}</b>" a las ${hora}.`,
    });

    return fnPrincipal(menu);
  };
}

function publicarMenu(menu) {
  menu.isPublished = true;
  // Cuando se publica, reseteamos la alerta de stock para que pueda notificar si hace falta
  menu.stockAlertSent = false;

  addNotification({
    tipo: "EVENTO",
    titulo: "MENU PUBLICADO",
    mensaje: `✅ Menú publicado: <b>${menu.dish}</b> (${menu.restaurant}).`,
  });
}

const publicarMenuConAuditoria = auditoriaPOA(publicarMenu);

/*
   POE - Eventos (EventBus + Scheduler)
*/
class EventBus {
  constructor() {
    this.listeners = {};
  }
  on(eventName, cb) {
    if (!this.listeners[eventName]) this.listeners[eventName] = [];
    this.listeners[eventName].push(cb);
  }
  emit(eventName, data) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach((cb) => cb(data));
    }
  }
}

const eventBus = new EventBus();

// Listeners (receptores)
eventBus.on("ALMUERZO", () => {
  const menu = getSelectedMenu();

  addNotification({
    tipo: "EVENTO",
    titulo: "ALMUERZO (12:00)",
    mensaje: `🔔 ¡Menú del día disponible!<br>
              Hoy en <b>${menu.restaurant}</b>: ${menu.dish}.<br>
              Quedan ${menu.stock} raciones.`,
  });
});


eventBus.on("CIERRE_OFERTAS", () => {
  addNotification({
    tipo: "EVENTO",
    titulo: "CIERRE (4:00)",
    mensaje: `🔔 "¡Ofertas de cierre disponibles! Revisa promos flash."`,
  });
});

eventBus.on("STOCK_BAJO", (menu) => {
  addNotification({
    tipo: "ALERTA",
    titulo: "STOCK BAJO",
    mensaje: `⚠ Últimas raciones: <b>${menu.dish}</b> en ${menu.restaurant}. Quedan ${menu.stock}.`,
  });
});

eventBus.on("PROMO_FLASH", (msg) => {
  addNotification({
    tipo: "PROMO",
    titulo: "PROMO FLASH",
    mensaje: `🔥 ${msg}`,
  });
});

// Scheduler (revisión periódica)
let schedulerId = null;

function schedulerPOE() {
  // Notificar stock bajo en menús publicados
  simulatedMenuData.forEach((menu) => {
    // Evitamos spam: solo 1 vez mientras se mantenga stock bajo
    if (menu.isPublished && menu.stock <= 5 && !menu.stockAlertSent) {
      eventBus.emit("STOCK_BAJO", menu);
      menu.stockAlertSent = true;
    }
  });

  // Promo flash aleatoria
  if (Math.random() < 0.08) {
    eventBus.emit("PROMO_FLASH", "50% en ensaladas en el cafetín del módulo 4");
  }
}

/*
   PA - Proceso asíncrono (Verificar capacidad)
*/
async function verificarCapacidad(menu) {
  addNotification({
    tipo: "ASYNC",
    titulo: "VERIFICACIÓN",
    mensaje: `⏳ Verificando mesas para <b>${menu.restaurant}</b>...`,
  });

  const resultado = await new Promise((resolve) => {
    setTimeout(() => {
      if (menu.currentAforo >= menu.capacity) {
        resolve(`❌ Local lleno (Capacidad: ${menu.capacity}), pide para llevar`);
      } else {
        resolve("✅ Local con disponibilidad");
      }
    }, 2000);
  });

  addNotification({
    tipo: "ASYNC",
    titulo: "RESULTADO",
    mensaje: resultado,
  });

  return resultado;
}

/*
   UI: Cargar select
*/
const menuSelect = document.getElementById("menuSelect");
let selectedMenuId = null; //  Mantener el plato seleccionado entre renders

function renderSelect() {
  // Si todavía no hemos guardado selección, toma la actual o la primera opción
  if (!selectedMenuId) {
    selectedMenuId = menuSelect.value || simulatedMenuData[0]?.id || null;
  }

  menuSelect.innerHTML = "";

  simulatedMenuData.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = `${m.dish} — ${m.restaurant} (stock: ${m.stock})`;

    //  Mantener selección
    if (m.id === selectedMenuId) {
      opt.selected = true;
    }

    menuSelect.appendChild(opt);
  });
}

renderSelect();

// Cada vez que el usuario cambie el select, guardamos la selección
menuSelect.addEventListener("change", () => {
  selectedMenuId = menuSelect.value;
});

function getSelectedMenu() {
  // Usa el id seleccionado guardado (más estable)
  const id = selectedMenuId || menuSelect.value;
  return simulatedMenuData.find((m) => m.id === id);
}

/*
   UI: Botones
*/
document.getElementById("btnPublicar").addEventListener("click", () => {
  // Guardar selección 
  selectedMenuId = menuSelect.value;

  const menu = getSelectedMenu();
  publicarMenuConAuditoria(menu);
  renderSelect();
});

document.getElementById("btnVerificar").addEventListener("click", () => {
  // Guardar selección
  selectedMenuId = menuSelect.value;

  const menu = getSelectedMenu();
  verificarCapacidad(menu);
});

document.getElementById("btnAlmuerzo").addEventListener("click", () => {
  eventBus.emit("ALMUERZO");
});

document.getElementById("btnCierre").addEventListener("click", () => {
  eventBus.emit("CIERRE_OFERTAS");
});

document.getElementById("btnStockBajo").addEventListener("click", () => {
  //  Guardar selección 
  selectedMenuId = menuSelect.value;

  const menu = getSelectedMenu();
  // Bajamos el stock para disparar la alerta
  menu.stock = Math.min(menu.stock, 5);
  menu.stockAlertSent = false; // permite que se notifique de nuevo

  addNotification({
    tipo: "ALERTA",
    titulo: "SIMULACIÓN",
    mensaje: `📉 Stock ajustado a ${menu.stock} para <b>${menu.dish}</b>.`,
  });

  renderSelect();
});

document.getElementById("btnLimpiar").addEventListener("click", () => {
  notifContainer.innerHTML = "";
  notifCount = 0;
  contadorEl.textContent = "0";
});

/*
   UI: Encender/Apagar Scheduler
*/
const schedulerState = document.getElementById("schedulerState");
const btnToggleScheduler = document.getElementById("btnToggleScheduler");

function setSchedulerUI(on) {
  schedulerState.textContent = on ? "ON" : "OFF";
  btnToggleScheduler.textContent = on ? "Apagar Reloj" : "Encender Reloj";
}

btnToggleScheduler.addEventListener("click", () => {
  if (schedulerId) {
    clearInterval(schedulerId);
    schedulerId = null;
    setSchedulerUI(false);
    addNotification({
      tipo: "EVENTO",
      titulo: "SCHEDULER",
      mensaje: "🛑 Scheduler apagado.",
    });
  } else {
    schedulerId = setInterval(schedulerPOE, 5000);
    setSchedulerUI(true);
    addNotification({
      tipo: "EVENTO",
      titulo: "SCHEDULER",
      mensaje: "✅ Scheduler encendido.",
    });
  }
});

setSchedulerUI(false);

/*
   Mensaje inicial
*/
addNotification({
  tipo: "EVENTO",
  titulo: "SISTEMA",
  mensaje: "Bienvenido. Publica un menú (POA), dispara eventos (POE) o verifica mesas (PA).",
});
