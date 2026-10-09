export const AGC_HOST = "dghpsh.agcontrol.gob.ar";
export const AGC_PATH = "/matafuegos/datosEstampilla.jsp";

export type AgcDatos = {
  domicilioInstalacion: string | null;
  empresaFabricante: string | null;
  empresaRecargadora: string | null;
  fechaMantenimiento: string | null;
  vencMantenimiento: string | null;
  fechaFabricacion: string | null;
  vencVidaUtil: string | null;
  vencPh: string | null;
  nroTarjeta: string | null;
  agente: string | null;
  capacidad: string | null;
  nroExtintor: string | null;
  uso: string | null;
  nroSerie: string | null;
};

const EMPTY_AGC: AgcDatos = {
  domicilioInstalacion: null,
  empresaFabricante: null,
  empresaRecargadora: null,
  fechaMantenimiento: null,
  vencMantenimiento: null,
  fechaFabricacion: null,
  vencVidaUtil: null,
  vencPh: null,
  nroTarjeta: null,
  agente: null,
  capacidad: null,
  nroExtintor: null,
  uso: null,
  nroSerie: null,
};

/** Decodifica un parámetro AGC: hex(ascii) -> base64 -> texto. Ej "4d545932..." -> "MTY2..." -> "16642013" */
export function decodeAgcParam(hexValue: string): string {
  const clean = hexValue.trim();
  if (!/^[0-9a-fA-F]+$/.test(clean) || clean.length % 2 !== 0) {
    throw new Error(`Parámetro AGC inválido: "${hexValue}".`);
  }
  const ascii = Buffer.from(clean, "hex").toString("utf-8");
  try {
    return Buffer.from(ascii, "base64").toString("utf-8");
  } catch {
    throw new Error(`Parámetro AGC inválido: "${hexValue}".`);
  }
}

export function validarUrlAgc(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("La URL del QR no es válida.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("La URL del QR debe ser http(s).");
  }
  if (url.hostname.toLowerCase() !== AGC_HOST) {
    throw new Error(`Host no permitido. Se esperaba ${AGC_HOST}.`);
  }
  if (!url.pathname.endsWith("datosEstampilla.jsp")) {
    throw new Error("La URL no es una ficha AGC de matafuegos.");
  }
  if (
    !url.searchParams.get("p_tarjeta") ||
    !url.searchParams.get("p_var") ||
    !url.searchParams.get("p_var2")
  ) {
    throw new Error("La URL AGC no trae los parámetros p_tarjeta/p_var/p_var2.");
  }
  return url;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&aacute;/gi, "á")
    .replace(/&eacute;/gi, "é")
    .replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&uacute;/gi, "ú")
    .replace(/&ntilde;/gi, "ñ")
    .replace(/&Aacute;/gi, "Á")
    .replace(/&Eacute;/gi, "É")
    .replace(/&Iacute;/gi, "Í")
    .replace(/&Oacute;/gi, "Ó")
    .replace(/&Uacute;/gi, "Ú")
    .replace(/&Ntilde;/gi, "Ñ")
    .replace(/&uml;/gi, "")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(Number.parseInt(code, 10)),
    )
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarEtiqueta(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const ETIQUETA_A_CAMPO: Record<string, keyof AgcDatos> = {
  "domicilio instalacion": "domicilioInstalacion",
  "empresa fabricante": "empresaFabricante",
  "empresa recargadora": "empresaRecargadora",
  "fecha mantenimiento": "fechaMantenimiento",
  "fecha vencimiento mantenimiento": "vencMantenimiento",
  "fecha fabricacion": "fechaFabricacion",
  "fecha vencimiento vida util": "vencVidaUtil",
  "fecha vencimiento ph": "vencPh",
  "nro tarjeta": "nroTarjeta",
  "agente extintor": "agente",
  capacidad: "capacidad",
  "nro extintor": "nroExtintor",
  uso: "uso",
  "nro serie": "nroSerie",
};

function vacioANull(value: string): string | null {
  const t = value.trim();
  return t.length ? t : null;
}

/** Parsea el HTML de datosEstampilla.jsp (clases frTextoTabla / frTextoTablaRegistroInfo). */
export function parseAgcHtml(html: string): AgcDatos {
  const datos: AgcDatos = { ...EMPTY_AGC };
  const etiquetas = [
    ...html.matchAll(/class=['"]frTextoTabla['"][^>]*>([\s\S]*?)</gi),
  ].map((m) => decodeHtmlEntities(m[1] ?? ""));
  const valores = [
    ...html.matchAll(/class=['"]frTextoTablaRegistroInfo['"][^>]*>([\s\S]*?)</gi),
  ].map((m) => decodeHtmlEntities(m[1] ?? ""));

  const pares = Math.min(etiquetas.length, valores.length);
  for (let i = 0; i < pares; i++) {
    const campo = ETIQUETA_A_CAMPO[normalizarEtiqueta(etiquetas[i] ?? "")];
    if (campo) {
      datos[campo] = vacioANull(valores[i] ?? "");
    }
  }
  return datos;
}

export type AgcConsulta = {
  url: string;
  ids: { pTarjeta: string; pVar: string; pVar2: string };
  datos: AgcDatos;
};

export async function consultarAgc(
  rawUrl: string,
  fetcher: typeof fetch = fetch,
): Promise<AgcConsulta> {
  const url = validarUrlAgc(rawUrl);
  const ids = {
    pTarjeta: decodeAgcParam(url.searchParams.get("p_tarjeta") ?? ""),
    pVar: decodeAgcParam(url.searchParams.get("p_var") ?? ""),
    pVar2: decodeAgcParam(url.searchParams.get("p_var2") ?? ""),
  };

  const res = await fetcher(url.toString(), {
    headers: { "User-Agent": "sistema-matafuego/1.0" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) {
    throw new Error(`AGC respondió ${res.status}. Reintentá más tarde.`);
  }
  const html = await res.text();
  if (!html.includes("frTextoTablaRegistroInfo")) {
    throw new Error("AGC no devolvió datos de tarjeta para ese QR.");
  }
  return { url: url.toString(), ids, datos: parseAgcHtml(html) };
}
