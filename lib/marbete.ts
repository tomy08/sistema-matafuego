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
