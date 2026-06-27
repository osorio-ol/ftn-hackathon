export type DocumentTemplateType =
  | "politica_tratamiento"
  | "autorizacion"
  | "clausula_contrato"
  | "formato_consulta"
  | "formato_reclamo";

export type DocumentTemplate = {
  id: DocumentTemplateType;
  title: string;
  description: string;
};

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "politica_tratamiento",
    title: "Política de tratamiento de datos",
    description: "Documento base conforme a la Ley 1581 de 2012",
  },
  {
    id: "autorizacion",
    title: "Autorización para tratamiento de datos",
    description: "Formato de consentimiento previo, expreso e informado",
  },
  {
    id: "clausula_contrato",
    title: "Cláusula de protección de datos",
    description: "Cláusula para contratos con terceros y empleados",
  },
  {
    id: "formato_consulta",
    title: "Formato de atención de consultas",
    description: "Registro de consultas de titulares (Art. 14)",
  },
  {
    id: "formato_reclamo",
    title: "Formato de atención de reclamos",
    description: "Registro de reclamos de titulares (Art. 15)",
  },
];

type TemplateContext = {
  empresa: string;
  nit?: string;
  sector?: string;
  responsable?: string;
  email?: string;
  fecha?: string;
};

export function generateDocument(type: DocumentTemplateType, ctx: TemplateContext): string {
  const fecha = ctx.fecha ?? new Date().toLocaleDateString("es-CO");
  const empresa = ctx.empresa || "_________________________";
  const nit = ctx.nit || "_________________________";
  const responsable = ctx.responsable || "_________________________";
  const email = ctx.email || "_________________________";

  switch (type) {
    case "politica_tratamiento":
      return `POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES
${empresa} — NIT ${nit}
Fecha: ${fecha}

1. IDENTIFICACIÓN DEL RESPONSABLE
Razón social: ${empresa}
NIT: ${nit}
Correo de contacto: ${email}
Responsable del tratamiento: ${responsable}

2. FINALIDAD DEL TRATAMIENTO
Los datos personales recolectados serán utilizados para: gestión comercial, atención al cliente, cumplimiento contractual, marketing (con autorización), y demás finalidades informadas al titular.

3. DERECHOS DE LOS TITULARES
Conforme al Art. 8 de la Ley 1581, los titulares tienen derecho a conocer, actualizar, rectificar y suprimir sus datos, así como revocar la autorización y presentar quejas ante la SIC.

4. CANALES DE ATENCIÓN
Consultas: ${email}
Reclamos: ${email}
Plazo de respuesta consultas: 10 días hábiles. Reclamos: 15 días hábiles.

5. MEDIDAS DE SEGURIDAD
Se implementan controles técnicos, humanos y administrativos para proteger la información personal contra acceso no autorizado, pérdida o alteración.

6. VIGENCIA
Esta política rige a partir de ${fecha} y será revisada anualmente.`;

    case "autorizacion":
      return `AUTORIZACIÓN PARA EL TRATAMIENTO DE DATOS PERSONALES

Yo, _________________________, identificado(a) con documento No. ____________,
autorizo de manera previa, expresa e informada a ${empresa} (NIT ${nit})
para recolectar, almacenar, usar, circular, suprimir y en general tratar mis
datos personales con las finalidades descritas en la Política de Tratamiento
de Datos Personales, disponible en ${email}.

Declaro haber sido informado(a) de mis derechos como titular conforme a la
Ley 1581 de 2012 y el Decreto 1377 de 2013.

Finalidades específicas:
[ ] Gestión comercial y contractual
[ ] Envío de información comercial
[ ] Análisis estadístico interno

Firma: _________________________  Fecha: ${fecha}`;

    case "clausula_contrato":
      return `CLÁUSULA DE PROTECCIÓN DE DATOS PERSONALES

Las partes declaran que en el marco de la presente relación contractual,
${empresa} actuará como responsable del tratamiento de los datos personales
que sean necesarios para la ejecución del contrato.

El encargado/trabajador se obliga a:
a) Tratar los datos únicamente conforme a las instrucciones del responsable.
b) Implementar medidas de seguridad adecuadas.
c) Guardar confidencialidad sobre la información accedida.
d) Suprimir o devolver los datos al terminar la relación contractual.
e) Permitir auditorías de cumplimiento.

El incumplimiento de estas obligaciones generará responsabilidad conforme a
la Ley 1581 de 2012.`;

    case "formato_consulta":
      return `FORMATO DE ATENCIÓN DE CONSULTAS — LEY 1581
${empresa} — NIT ${nit}

Fecha de recepción: ${fecha}
Radicado No.: ___________

DATOS DEL TITULAR
Nombre: _________________________
Documento: _______________________
Correo/Teléfono: __________________

CONSULTA
_________________________________________________________________
_________________________________________________________________

RESPUESTA (plazo máximo: 10 días hábiles)
_________________________________________________________________
_________________________________________________________________

Funcionario responsable: ${responsable}
Fecha de respuesta: ___________`;

    case "formato_reclamo":
      return `FORMATO DE ATENCIÓN DE RECLAMOS — LEY 1581
${empresa} — NIT ${nit}

Fecha de recepción: ${fecha}
Radicado No.: ___________

DATOS DEL TITULAR
Nombre: _________________________
Documento: _______________________
Correo/Teléfono: __________________

RECLAMO (corrección, supresión, revocación u oposición)
Tipo: [ ] Corrección [ ] Supresión [ ] Revocación [ ] Información
Descripción:
_________________________________________________________________
_________________________________________________________________

RESPUESTA (plazo máximo: 15 días hábiles)
_________________________________________________________________

Funcionario responsable: ${responsable}
Fecha de respuesta: ___________`;

    default:
      return "";
  }
}

export function downloadTextDocument(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
