export const COLORES_MARBETE = [
  "rojo",
  "verde",
  "azul",
  "amarillo",
  "blanco",
  "negro",
  "naranja",
  "violeta",
  "gris",
  "celeste",
] as const;

export type ColorMarbete = (typeof COLORES_MARBETE)[number] | string;

export type EstimacionMarbete = {
  fechaMantenimiento: string;
  vencMantenimiento: string;
};

/**
 * Mapeo color -> año CONFIRMADO por fuentes públicas.
 * - 2026 = violeta (publicación "Marbete 2026 ... color violeta").
 * Otros años no se infieren para no inventar tabla oficial.
 * Si tenés la tabla IRAM 3517-2 completa, agregala acá.
 */
export const COLOR_A_ANIO_CONFIRMADO: Record<string, number> = {
  violeta: 2026,
  violaceo: 2026,
};

export function inferirAnioPorColor(
  colorNormalizado: string,
  anioActual = new Date().getFullYear(),
): number | null {
  const directo = COLOR_A_ANIO_CONFIRMADO[colorNormalizado];
  if (directo) return directo;
  // Sin tabla oficial completa no inferimos: devolvemos null
  // para guardar como sin_datos hasta conciliación.
  void anioActual;
  return null;
}

/**
 * Alta sin etiquetas: con solo el marbete no hay fecha exacta.
 * Convención conservadora: se asume mantenimiento en enero del año
 * del marbete y vencimiento en enero del año siguiente, ambos
 * marcados como estimados (no_verificado -> estimado).
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

export function normalizarColorMarbete(color: string): string {
  const v = color
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  if (!v) throw new Error("El color del marbete es obligatorio.");
  return v;
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
