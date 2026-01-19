// 1. DATASET SIMULADO (Basado en el PDF - Páginas 2 y 3)
const simulatedMenuData = [
    {
        id: 'm001',
        restaurant: 'Nico - Caja Negra',
        dish: 'Pabellón Criollo',
        capacity: 50,
        currentAforo: 50, // Lo puse lleno para probar el mensaje de error
    },
    {
        id: 'm004',
        restaurant: 'Graciel - CDE',
        dish: 'Ensalada César con Pollo',
        capacity: 15,
        currentAforo: 10,
    }
];

// 2. FUNCIÓN ASÍNCRONA (PA): Simula la consulta a la API de sensores
const verificarDisponibilidad = (idPlato) => {
    console.log("Verificando mesas..."); // Mensaje inmediato [cite: 27]

    return new Promise((resolve, reject) => {
        // Simulación de espera de 2 segundos [cite: 26]
        setTimeout(() => {
            // Buscamos el plato en la "base de datos"
            const plato = simulatedMenuData.find(p => p.id === idPlato);

            if (!plato) {
                reject("Error: Plato no encontrado.");
                return;
            }

            // Lógica de disponibilidad
            const mesasLibres = plato.capacity - plato.currentAforo;

            if (mesasLibres <= 0) {
                resolve(`Local lleno (Capacidad: ${plato.capacity} personas), pide para llevar.`); // [cite: 27]
            } else {
                resolve(`Local con disponibilidad. Quedan ${mesasLibres} puestos.`); // [cite: 27]
            }
        }, 2000);
    });
};

// 3. EJECUCIÓN DEL PROGRAMA
async function main() {
    try {
        // Prueba 1: Local Lleno (m001)
        console.log("--- Consultando Plato 1 ---");
        const resultado1 = await verificarDisponibilidad('m001');
        console.log(resultado1);

        console.log("\n--- Consultando Plato 2 ---");
        // Prueba 2: Local con espacio (m004)
        const resultado2 = await verificarDisponibilidad('m004');
        console.log(resultado2);
        
    } catch (error) {
        console.error(error);
    }
}

main();