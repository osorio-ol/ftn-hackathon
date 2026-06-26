export type Evaluacion = {
  id: string;
  empresa: string;
  fecha: string;
  responsable: string;
  puntaje: number;
  estado: "Cumple" | "Parcial" | "No cumple";
};

export const empresasMock = [
  "Cavaltec SAS",
  "Soluciones Andinas",
  "Tecnología Bogotá",
  "Grupo Caribe",
  "Innovaciones del Sur",
];

function rand(seed: number) {
  let x = seed;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

const r = rand(42);

export const evaluacionesMock: Evaluacion[] = Array.from({ length: 14 }).map((_, i) => {
  const p = Math.round(40 + r() * 60);
  return {
    id: `EV-${String(1000 + i)}`,
    empresa: empresasMock[i % empresasMock.length],
    fecha: new Date(Date.now() - i * 86400000 * 3).toISOString().slice(0, 10),
    responsable: ["Ana López", "Carlos Ruiz", "María Pérez", "Jorge Díaz"][i % 4],
    puntaje: p,
    estado: p >= 80 ? "Cumple" : p >= 60 ? "Parcial" : "No cumple",
  };
});

export const tendenciaMock = Array.from({ length: 8 }).map((_, i) => ({
  mes: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago"][i],
  puntaje: Math.round(50 + r() * 45),
}));

export const preguntasLey1581 = [
  "¿La empresa obtiene autorización para tratar datos?",
  "¿Cuenta con una política de tratamiento publicada?",
  "¿Permite a los titulares ejercer sus derechos?",
  "¿Tiene procedimientos para consultas y reclamos?",
  "¿Aplica medidas de seguridad para proteger los datos?",
  "¿Capacita a su personal en protección de datos?",
  "¿Conoce y cumple las obligaciones legales sobre tratamiento de datos?",
  "¿Realiza seguimiento y mejora continua de sus prácticas de protección de datos?",
];