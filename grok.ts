import { getRequiredEnv } from "./env";

/** Campos del extintor que Grok intenta leer de la foto (etiqueta / tarjeta AGC). */
export type DatosExtintorGrok = {
  agente: string | null;
  capacidad: string | null;
  recargadora: string | null;
  fabricante: string | null;
  uso: string | null;
  nroTarjeta: string | null;
  nroExtintor: string | null;
  nroSerie: string | null;
  fechaMantenimiento: string | null;
  vencMantenimiento: string | null;
  fechaFabricacion: string | null;
  vencVidaUtil: string | null;
  vencPh: string | null;
  textoLeido: string;
};

const CAMPOS_TEXTO = [
  "agente",
  "capacidad",
  "recargadora",
  "fabricante",
  "uso",
  "nroTarjeta",
  "nroExtintor",
  "nroSerie",
] as const;

const CAMPOS_FECHA = [
  "fechaMantenimiento",
  "vencMantenimiento",
  "fechaFabricacion",
  "vencVidaUtil",
  "vencPh",
] as const;

const XAI_URL = "https://api.x.ai/v1/chat/completions";
const MODELO_POR_DEFECTO = "grok-4";

const PROMPT = `Sos un asistente que lee etiquetas de matafuegos (extintores) de Argentina:
etiqueta de la empresa recargadora, tarjeta AGC (Agencia Gubernamental de Control) y marbete.
Extraé de la imagen los siguientes datos. Si un dato no aparece o no es legible, devolvé null (no inventes).

- agente: agente extintor en mayúsculas (ej. "ABC", "BC", "CO2", "HALOCLEAN", "HALOTRON", "AGUA", "ESPUMA").
- capacidad: número y unidad (ej. "5 KG", "10 KG", "3.5 KG", "10 LTS").
- recargadora: razón social de la empresa recargadora/mantenedora.
- fabricante: fabricante del cilindro, si figura.
- uso: uso o clase de fuego indicado, si figura.
- nroTarjeta: número de tarjeta AGC (solo dígitos).
- nroExtintor: número de extintor/matafuego asignado por la recargadora.
- nroSerie: número de serie del cilindro.
- fechaMantenimiento: fecha del último mantenimiento/recarga.
- vencMantenimiento: vencimiento del mantenimiento/recarga.
- fechaFabricacion: fecha de fabricación del cilindro.
- vencVidaUtil: vencimiento de la vida útil.
- vencPh: vencimiento de la prueba hidráulica (PH).
- textoLeido: todo el texto visible en la imagen, transcripto tal cual.

Todas las fechas en formato "MM/AAAA" (ej. "08/2026"). Si solo se ve el año, usá "AAAA".`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    ...Object.fromEntries(
      [...CAMPOS_TEXTO, ...CAMPOS_FECHA].map((c) => [c, { type: ["string", "null"] }]),
    ),
    textoLeido: { type: "string" },
  },
  required: [...CAMPOS_TEXTO, ...CAMPOS_FECHA, "textoLeido"],
};

function texto(valor: unknown): string | null {
  if (typeof valor !== "string" && typeof valor !== "number") return null;
  const v = String(valor).replace(/\s+/g, " ").trim();
  return v.length && !/^(null|n\/a|-)$/i.test(v) ? v : null;
}

/** Lleva una fecha a "MM/AAAA" o "AAAA" (lo que acepta parseMonthYearInput); si no se puede, null. */
export function normalizarFecha(valor: unknown): string | null {
  const v = texto(valor);
  if (!v) return null;
  const mesAnio = v.match(/^(?:\d{1,2}[\/\-.])?(\d{1,2})[\/\-.](\d{2}|\d{4})$/);
  if (mesAnio) {
    const mes = Number(mesAnio[1]);
    const anio = mesAnio[2]!.length === 2 ? 2000 + Number(mesAnio[2]) : Number(mesAnio[2]);
    if (mes >= 1 && mes <= 12) return `${String(mes).padStart(2, "0")}/${anio}`;
  }
  const iso = v.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  if (iso && Number(iso[2]) >= 1 && Number(iso[2]) <= 12) return `${iso[2]}/${iso[1]}`;
  if (/^\d{4}$/.test(v)) return v;
  return null;
}

/** Valida y normaliza el JSON devuelto por Grok. Todo sigue requiriendo conciliación manual. */
export function normalizarRespuestaGrok(crudo: unknown): DatosExtintorGrok {
  const obj = (crudo && typeof crudo === "object" ? crudo : {}) as Record<string, unknown>;
  const datos = { textoLeido: typeof obj.textoLeido === "string" ? obj.textoLeido.trim() : "" } as DatosExtintorGrok;
  for (const c of CAMPOS_TEXTO) datos[c] = texto(obj[c]);
  for (const c of CAMPOS_FECHA) datos[c] = normalizarFecha(obj[c]);
  if (datos.agente) datos.agente = datos.agente.toUpperCase();
  if (datos.capacidad) datos.capacidad = datos.capacidad.replace(",", ".").toUpperCase();
  return datos;
}

/** Envía la imagen (data URL base64) a Grok y devuelve los datos del extintor detectados. */
export async function extraerDatosExtintor(imagenDataUrl: string): Promise<DatosExtintorGrok> {
  const apiKey = getRequiredEnv("XAI_API_KEY");
  const modelo = process.env.XAI_MODEL?.trim() || MODELO_POR_DEFECTO;

  const res = await fetch(XAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelo,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imagenDataUrl, detail: "high" } },
            { type: "text", text: PROMPT },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "datos_extintor", strict: true, schema: SCHEMA },
      },
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    throw new Error(`Grok respondió ${res.status}: ${detalle.slice(0, 300)}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const contenido = json.choices?.[0]?.message?.content ?? "";
  // Por si el modelo envuelve el JSON en ```json ... ```
  const limpio = contenido.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  try {
    return normalizarRespuestaGrok(JSON.parse(limpio));
  } catch {
    throw new Error("Grok devolvió una respuesta que no es JSON válido.");
  }
}
