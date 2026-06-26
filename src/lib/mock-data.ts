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
  "¿Cuenta la empresa con una política formal de tratamiento de datos personales?",
  "¿Se ha designado un oficial de protección de datos?",
  "¿Existe un registro de bases de datos ante la SIC?",
  "¿Se solicita autorización expresa al titular antes de tratar sus datos?",
  "¿Se cuenta con procedimientos para atender consultas y reclamos?",
  "¿Se realizan capacitaciones periódicas al personal en protección de datos?",
  "¿Se aplican medidas de seguridad técnicas y administrativas?",
  "¿Se gestionan los incidentes de seguridad documentadamente?",
  "¿Se firman acuerdos de transferencia con encargados de tratamiento?",
  "¿Se realizan auditorías internas de cumplimiento de la Ley 1581?",
  "¿Se conservan evidencias de las autorizaciones obtenidas?",
];