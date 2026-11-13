#!/usr/bin/env node
// Genera los datos de ejemplo del proyecto base con semilla fija (reproducible).
// Uso: node gen-datos.mjs <dir-del-proyecto-base>
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir) { console.error("uso: gen-datos.mjs <dir>"); process.exit(2); }
let s = 20261112;
const rnd = () => ((s = (s * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const money = (a, b) => Math.round((a + rnd() * (b - a)) * 100) / 100;
const fecha = (desde, dias) => { const d = new Date(desde); d.setDate(d.getDate() + dias); return d.toISOString().slice(0, 10); };
const CORTE = "2026-11-10"; // fecha de corte común de los datos
const out = (n, v) => { mkdirSync(join(dir, "src/data"), { recursive: true }); writeFileSync(join(dir, "src/data", n), JSON.stringify(v, null, 2)); };

const proveedores = ["Ferretería Istmo", "Cementos del Pacífico", "Grupo Ultramar", "TecnoRed", "Papelería Central", "Combustibles Azuero", "Transportes Chiriquí", "Metales Colón", "Servicios Darién", "Llantas Veraguas", "Andamios Coclé", "Electro Bocas"];
const centros = ["Bodega Colón", "Bodega Panamá Pacífico", "Flota", "Administración", "Mantenimiento"];
const estadosOC = ["borrador", "aprobada", "enviada", "recibida parcial", "recibida", "cancelada"];
out("ordenes.json", Array.from({ length: 300 }, (_, i) => {
  const emision = fecha("2026-05-01", int(0, 190));
  const estado = pick(estadosOC);
  return { id: `OC-${String(4100 + i)}`, proveedor: pick(proveedores), centroCosto: pick(centros), monto: money(180, 48000), moneda: "USD", estado, fechaEmision: emision, fechaEntregaPrometida: fecha(emision, int(5, 45)), fechaRecepcion: estado.startsWith("recibida") ? fecha(emision, int(4, 60)) : null, solicitante: pick(["M. Ríos", "J. Pérez", "A. Castillo", "L. Vega", "R. Sanjur"]) };
}));

const indicadores = ["avanceFisicoPct", "avanceFinancieroPct", "presupuestoUSD", "ejecutadoUSD", "desviacionCostoPct", "diasAtraso", "hitosCumplidos", "hitosTotales", "incidentesSeguridad", "satisfaccionCliente", "personalAsignado", "riesgo"];
out("proyectos.json", { indicadores, proyectos: Array.from({ length: 40 }, (_, i) => {
  const pres = money(50000, 2500000); const fis = int(3, 100);
  return { id: `P-${101 + i}`, nombre: `${pick(["Centro de distribución", "Patio de contenedores", "Ampliación bodega", "Sistema WMS", "Flota eléctrica", "Muelle"])} ${pick(["Norte", "Sur", "Este", "Oeste", "Colón", "Pacífico", "Tocumen"])} ${i + 1}`, gerente: pick(["C. Herrera", "D. Batista", "E. Moreno", "F. Quintero"]), avanceFisicoPct: fis, avanceFinancieroPct: Math.min(100, fis + int(-15, 20)), presupuestoUSD: pres, ejecutadoUSD: Math.round(pres * (fis / 100) * (0.8 + rnd() * 0.5)), desviacionCostoPct: money(-12, 25), diasAtraso: int(0, 1) ? 0 : int(1, 90), hitosCumplidos: int(0, 8), hitosTotales: 10, incidentesSeguridad: int(0, 1) ? 0 : int(1, 4), satisfaccionCliente: money(2.5, 5), personalAsignado: int(3, 60), riesgo: pick(["bajo", "medio", "alto"]) };
}) });

const bodegas = ["Colón", "Panamá Pacífico", "Tocumen", "David"];
out("inventario.json", Array.from({ length: 120 }, (_, i) => ({ sku: `SKU-${20000 + i * 7}`, descripcion: `${pick(["Pallet", "Caja", "Film stretch", "Etiqueta térmica", "Montacargas batería", "Esquinero", "Fleje", "Contenedor plástico"])} ${pick(["estándar", "reforzado", "XL", "industrial"])}`, bodega: pick(bodegas), existencia: int(0, 1) ? int(0, 15) : int(16, 2400), minimo: int(20, 200), unidad: pick(["und", "rollo", "caja"]), costoUnitario: money(0.4, 900), ultimoMovimiento: fecha("2026-08-01", int(0, 100)) })));

out("cartera.json", { clientes: Array.from({ length: 60 }, (_, i) => ({ cliente: `Cliente ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) + 1} S.A.`, saldo0a30: money(0, 40000), saldo31a60: money(0, 20000), saldo61a90: money(0, 12000), saldoMas90: int(0, 2) ? 0 : money(0, 30000), limiteCredito: money(20000, 150000) })), cobradoMensual: ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"].map((m) => ({ mes: m, facturado: money(380000, 520000), cobrado: money(320000, 500000) })) });

out("facturas.json", Array.from({ length: 48 }, (_, i) => { const lineas = Array.from({ length: int(1, 6) }, () => ({ descripcion: pick(["Flete Colón–Panamá", "Almacenaje por pallet", "Manejo de carga", "Seguro de mercancía", "Despacho aduanal", "Etiquetado"]), cantidad: int(1, 40), precioUnitario: money(15, 900) })); const sub = lineas.reduce((a, l) => a + l.cantidad * l.precioUnitario, 0); const estado = pick(["pagada", "pagada", "pendiente", "vencida", "anulada"]); const emision = estado === "pendiente" ? fecha(CORTE, -int(1, 29)) : estado === "vencida" ? fecha(CORTE, -int(31, 120)) : fecha(CORTE, -int(1, 160)); return { numero: `FE-${String(88001 + i)}`, emision, vencimiento: fecha(emision, 30), estado, lineas, subtotal: Math.round(sub * 100) / 100, itbms: Math.round(sub * 7) / 100, total: Math.round(sub * 107) / 100 }; }));

const agentes = ["Ana", "Bruno", "Carla", "Diego", "Elena", "Félix"];
out("tickets.json", Array.from({ length: 180 }, (_, i) => { const abierto = fecha("2026-09-01", int(0, 70)); const prio = pick(["crítica", "alta", "alta", "media", "media", "baja"]); const estado = pick(["abierto", "en curso", "esperando cliente", "resuelto", "resuelto"]); return { id: `T-${7000 + i}`, asunto: pick(["Retraso de entrega", "Factura incorrecta", "Carga dañada", "Acceso al portal", "Cambio de dirección", "Rastreo sin actualizar"]), cliente: `Cliente ${int(1, 40)}`, prioridad: prio, estado, agente: pick(agentes), abierto, primeraRespuestaHoras: money(0.1, 30), slaHoras: { crítica: 4, alta: 8, media: 24, baja: 48 }[prio], resolucionHoras: estado === "resuelto" ? money(1, 120) : null }; }));

const COMENTARIOS = [["Herramientas", "Faltan herramientas para el turno de noche."], ["Herramientas", "Los escáneres de la bodega fallan seguido."], ["Reconocimiento", "Mi jefe me reconoce el trabajo."], ["Reconocimiento", "Nadie nota cuando sacamos un despacho difícil."], ["Carga de trabajo", "La carga en temporada alta es excesiva."], ["Carga de trabajo", "Hacemos horas extra casi todas las semanas."], ["Comunicación", "No me entero de los cambios a tiempo."], ["Comunicación", "Las reuniones de inicio de turno ayudan mucho."], ["Liderazgo", "Mi supervisor escucha y resuelve."], ["Desarrollo", "Quisiera un plan de carrera claro."], ["Desarrollo", "La capacitación en montacargas fue muy buena."], ["Compensación", "El salario no ha subido en dos años."]];
const dims = ["Liderazgo", "Reconocimiento", "Carga de trabajo", "Comunicación", "Desarrollo", "Compensación", "Herramientas"];
const areas = ["Operaciones", "Bodega", "Flota", "Finanzas", "Comercial", "TI"];
out("clima.json", { respuestas: 412, invitados: 530, enps: { promotores: 148, pasivos: 151, detractores: 113 }, dimensiones: dims.map((d) => ({ dimension: d, puntaje: money(2.6, 4.4), anterior: money(2.6, 4.4) })), porArea: areas.flatMap((a) => dims.map((d) => ({ area: a, dimension: d, puntaje: money(2.2, 4.6), n: int(12, 120) }))), comentarios: Array.from({ length: 30 }, () => { const [tema, texto] = pick(COMENTARIOS); return { area: pick(areas), tema, texto }; }) });

out("taller.json", { titulo: "IA aplicada a operaciones logísticas", subtitulo: "Taller práctico de 2 días para equipos de operaciones", fechas: ["2026-12-03", "2026-12-04"], horario: "8:30 a 16:30", sede: "Ciudad del Saber, Panamá", precioUSD: 690, precioGrupoUSD: 590, cupo: 24, inscritos: 17, facilitador: { nombre: "Laura Méndez", bio: "Consultora en procesos y analítica, 12 años en cadena de suministro." }, agenda: [{ dia: 1, bloques: [["8:30", "Bienvenida y diagnóstico"], ["9:30", "Qué hace y qué no hace un modelo de lenguaje"], ["11:00", "Caso: conciliación de órdenes"], ["13:30", "Prompts para reportes operativos"], ["15:00", "Laboratorio en equipos"]] }, { dia: 2, bloques: [["8:30", "Automatizar seguimiento de entregas"], ["10:30", "Riesgos, datos y privacidad"], ["13:30", "Diseño de un piloto propio"], ["15:30", "Presentaciones y cierre"]] }], preguntas: [["¿Necesito saber programar?", "No. Trabajamos con herramientas sin código."], ["¿Entregan certificado?", "Sí, de participación."], ["¿Puedo pagar con transferencia?", "Sí, hasta 5 días antes del inicio."]] });
console.log("datos generados en", join(dir, "src/data"));
