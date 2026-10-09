/**
 * Tabla oficial Argentina (Norma IRAM 3517-2): color del marbete
 * según el último dígito del año de recarga/mantenimiento.
 *
 * - 1: Negro
 * - 2: Amarillo
 * - 3: Celeste
 * - 4: Verde oscuro
 * - 5: Azul
 * - 6: Violeta / Lila
 * - 7: Blanco
 * - 8: Verde claro
 * - 9: Naranja
 * - 0: Marrón claro
 *
 * Verificación reciente: 2024=verde(oscuro), 2025=azul, 2026=violeta.
 */
export const COLORES_MARBETE = [
  "negro",
  "amarillo",
  "celeste",
  "verde oscuro",
  "azul",
  "violeta",
  "blanco",
  "verde claro",
  "naranja",
  "marrón claro",
] as const;

export type ColorMarbete = (typeof COLORES_MARBETE)[number] | string;

export type EstimacionMarbete = {
  fechaMantenimiento: string;
  vencMantenimiento: string;
};

/** Dígito (0-9) -> color oficial de display. */
export const DIGITO_A_COLOR: Record<number, string> = {
  1: "negro",
  2: "amarillo",
  3: "celeste",
  4: "verde oscuro",
  5: "azul",
  6: "violeta",
  7: "blanco",
  8: "verde claro",
  9: "naranja",
  0: "marrón claro",
};

/**
 * Color normalizado (minúsculas, sin tildes) -> dígito.
 * Incluye alias legacy: lila=v angels6, verde=4, marrón sin tilde, etc.
 * Colores fuera de norma (rojo, gris) devuelven null.
 */
const COLOR_A_DIGITO: Record<string, number> = {
  negro: 1,
  amarillo: 2,
  celeste: 3,
  "verde oscuro": 4,
  verde: 4, // alias legacy: se asume verde oscuro
  "verdeoscuro": 4,
  azul: 5,
  violeta: 6,
  lila: 6,
  "violeta / lila": 6,
  violaceo: 6,
  blanco: 7,
  "verde claro": 8,
  "verdefclaro": 8,
  verdeclaro: 8,
  naranja: 9,
  "marron claro": 0,
  "marron": 0,
  marronclaro: 0,
};

export function normalizarColorMarbete(color: string): string {
  const v = color
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!v) throw new Error("El color del marbete es obligatorio.");
  return v;
}

/** Devuelve el dígito 0-9 para un color normalizado, o null si es fuera de norma. */
export function digitoPorColor(colorNormalizado: string): number | null {
  const d = COLOR_A_DIGITO[colorNormalizado];
  return d === undefined ? null : d;
}

/** Devuelve el color oficial para un dígito 0-9. */
export function colorPorDigito(digito: number): string | null {
  if (!Number.isInteger(digito) || digito < 0 || digito > 9) return null;
  return DIGITO_A_COLOR[digito] ?? null;
}

/**
 * Infiere el año más reciente <= anioActual que termina con el dígito del color.
 * Ej con anioActual 2026: violeta(6)->2026, azul(5)->2025, negro(1)->2021.
 * Devuelve null si el color es fuera de norma (rojo, gris).
 */
export function inferirAnioPorColor(
  colorNormalizado: string,
  anioActual = new Date().getFullYear(),
): number | null {
  const digito = digitoPorColor(colorNormalizado);
  if (digito === null) return null;
  const ultimo = ((anioActual % 10) - digito + 10) % 10;
  return anioActual - ultimo;
}

/**
 * Candidatos por década para advertir ambigüedad (el marbete se repite cada 10 años).
 * Ej violeta en 2026 -> [2026, 2016, 2006].
 */
export function aniosCandidatosPorColor(
  colorNormalizado: string,
  anioActual = new Date().getFullYear(),
  cantidad = 3,
): number[] {
  const base = inferirAnioPorColor(colorNormalizado, anioActual);
  if (base === null) return [];
  return Array.from({ length: cantidad }, (_, i) => base - i * 10);
}

/**
 * Valida que el año ingresado termine con el dígito del color.
 * Si el color es fuera de norma, no valida (devuelve ok).
 * Lanza error descriptivo si no coincide.
 */
export function validarCoherenciaColorAnio(
  colorNormalizado: string,
  anio: number,
): void {
  const digito = digitoPorColor(colorNormalizado);
  if (digito === null) return;
  if (anio % 10 !== digito) {
    throw new Error(
      `El color ${colorNormalizado} corresponde a terminación ${digito} (ej ${inferirAnioPorColor(colorNormalizado, anio)}), pero indicaste ${anio}. Corregí el color o el año.`,
    );
  }
}

/**
 * Alta sin etiquetas: con solo el marbete no hay fecha exacta.
 * Convención conservadora: se asume mantenimiento en enero del año
 * del marbete y vencimiento en enero del año siguiente, ambos
 * marcados como estimados.
 */
export function estimarFechasPorAnioMarbete(anio: number): EstimacionMarbete {
  if (!Number.isInteger(anio) || anio < 1980 || anio > 2100) {
    throw new Error(`Año de marbete inválido: "${anio}".`);
  }
  return {
    fechaMantenimiento: `${anio}-01-01`,
    vencMantenimiento: `${anio + 1}-01-01`,
  };
}

export function validarAnioMarbete(value: unknown): number {
  const anio = Number(value);
  if (!Number.isInteger(anio) || anio < 1980 || anio > 2100) {
    throw new Error("Indicá el año del marbete (1980-2100).");
  }
  return anio;
}

/**
 * Año opcional: vacío/null/"" -> null (no se sabe).
 * Si viene con valor, valida rango 1980-2100.
 */
export function validarAnioMarbeteOpcional(value: unknown): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const anio = Number(raw);
  if (!Number.isInteger(anio) || anio < 1980 || anio > 2100) {
    throw new Error("Si indicás el año, usá 1980-2100. O dejalo vacío.");
  }
  return anio;
}
