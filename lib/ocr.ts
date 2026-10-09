export type SugerenciaOcr = {
  agente: string | null;
  capacidad: string | null;
  recargadora: string | null;
  nroTarjeta: string | null;
  nroExtintor: string | null;
  nroSerie: string | null;
  fechas: string[];
  textoLimpio: string;
};

function limpiarEspacios(texto: string): string {
  return texto.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

const AGENTES_CONOCIDOS = [
  "haloclean",
  "halotron",
  "co2",
  "abc",
  "bc",
  "polvo",
  "espuma",
  "agua",
  "hcfc",
  "fm-200",
  "novec",
];

/**
 * Parsea texto crudo de Tesseract (etiqueta recargadora / tarjeta AGC).
 * Todo es heurística: el resultado SIEMPRE requiere conciliación manual.
 */
export function parseOcrTexto(texto: string): SugerenciaOcr {
  const textoLimpio = limpiarEspacios(texto ?? "");
  const lower = textoLimpio.toLowerCase();

  const fechas = [
    ...textoLimpio.matchAll(/\b(0[1-9]|1[0-2])[\/\-.](19\d{2}|20\d{2})\b/g),
  ].map((m) => m[0].replace(/[\-.]/g, "/"));
  const fechasUnicas = [...new Set(fechas)];

  const capMatch = textoLimpio.match(
    /(\d+(?:[.,]\d+)?)\s*(kg\s*\/\s*lts|kg|kgs|lts|ltrs|litros)\b/i,
  );
  const capacidad = capMatch
    ? `${capMatch[1]?.replace(",", ".")} ${capMatch[2]?.replace(/\s+/g, " ").toUpperCase()}`
    : null;

  const agente =
    AGENTES_CONOCIDOS.find((a) => {
      if (a === "abc" || a === "bc") {
        return new RegExp(`\\b${a}\\b`, "i").test(textoLimpio);
      }
      return lower.includes(a);
    }) ?? null;

  const lineaRecargadora = textoLimpio
    .split("\n")
    .map((l) => l.trim())
    .find((l) =>
      /recarg|extintor|s\.?r\.?l|s\.?a\.?|matafuego|inspecci/i.test(l),
    );
  const recargadora =
    lineaRecargadora && lineaRecargadora.length <= 80
      ? lineaRecargadora
      : null;

  const nroTarjeta =
    textoLimpio.match(/tarjeta[^0-9]{0,12}(\d{4,})/i)?.[1] ?? null;
  const nroExtintor =
    textoLimpio.match(/(?:extintor|matafuego)[^0-9]{0,12}(\d{1,8})/i)?.[1] ??
    null;
  const nroSerie =
    textoLimpio.match(/serie[^0-9a-z]{0,12}([0-9a-z-]{3,})/i)?.[1] ?? null;

  return {
    agente: agente ? agente.toUpperCase().replace("CO2", "CO2") : null,
    capacidad,
    recargadora,
    nroTarjeta,
    nroExtintor,
    nroSerie,
    fechas: fechasUnicas,
    textoLimpio,
  };
}
