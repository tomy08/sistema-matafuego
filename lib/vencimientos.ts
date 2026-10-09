export type NivelVencimiento =
  | "vencido"
  | "critico"
  | "proximo_60"
  | "proximo_90"
  | "vigente"
  | "sin_datos";

export type FechasVencimiento = {
  vencMantenimiento: string | null;
  vencVidaUtil: string | null;
  vencPh: string | null;
};

export type UmbralesAlerta = {
  umbralVencidoDias: number;
  umbralProximo60Dias: number;
  umbralProximo90Dias: number;
};

export type EstadoVencimiento = {
  nivel: NivelVencimiento;
  fechaCritica: string | null;
  campoCritico: keyof FechasVencimiento | null;
  diasRestantes: number | null;
};

const MS_POR_DIA = 86_400_000;

function inicioDelDia(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function diasHasta(fechaIso: string, hoy = new Date()): number {
  const [y, m, d] = fechaIso.split("-").map(Number);
  if (!y || !m || !d) return Number.NaN;
  const objetivo = new Date(y, m - 1, d);
  return Math.round(
    (inicioDelDia(objetivo).getTime() - inicioDelDia(hoy).getTime()) /
      MS_POR_DIA,
  );
}

function fechaCritica(
  fechas: FechasVencimiento,
): { fecha: string; campo: keyof FechasVencimiento } | null {
  const candidatas: Array<{ fecha: string; campo: keyof FechasVencimiento }> = [];
  (Object.keys(fechas) as Array<keyof FechasVencimiento>).forEach((campo) => {
    const v = fechas[campo];
    if (v) candidatas.push({ fecha: v, campo });
  });
  if (!candidatas.length) return null;
  candidatas.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
  return candidatas[0] ?? null;
}

/**
 * Motor de vencimientos. Usa la fecha crítica (mínima entre las 3).
 * - vencido: ya pasó (dias < 0)
 * - critico: vence dentro de umbralVencidoDias
 * - proximo_60 / proximo_90: dentro de esos umbrales
 * - vigente / sin_datos
 * Los umbrales se ordenan para tolerar configuración personalizada.
 */
export function calcularEstadoVencimiento(
  fechas: FechasVencimiento,
  umbrales: UmbralesAlerta,
  hoy = new Date(),
): EstadoVencimiento {
  const critica = fechaCritica(fechas);
  if (!critica) {
    return {
      nivel: "sin_datos",
      fechaCritica: null,
      campoCritico: null,
      diasRestantes: null,
    };
  }
  const dias = diasHasta(critica.fecha, hoy);
  if (Number.isNaN(dias)) {
    return {
      nivel: "sin_datos",
      fechaCritica: critica.fecha,
      campoCritico: critica.campo,
      diasRestantes: null,
    };
  }
  const [t1, t2, t3] = [
    umbrales.umbralVencidoDias,
    umbrales.umbralProximo60Dias,
    umbrales.umbralProximo90Dias,
  ]
    .map((n) => (Number.isFinite(n) && n > 0 ? n : 0))
    .sort((a, b) => a - b);

  let nivel: NivelVencimiento = "vigente";
  if (dias < 0) nivel = "vencido";
  else if (dias <= t1) nivel = "critico";
  else if (dias <= t2) nivel = "proximo_60";
  else if (dias <= t3) nivel = "proximo_90";

  return {
    nivel,
    fechaCritica: critica.fecha,
    campoCritico: critica.campo,
    diasRestantes: dias,
  };
}

export const NIVEL_META: Record<
  NivelVencimiento,
  { titulo: string; clase: string }
> = {
  vencido: {
    titulo: "Vencido",
    clase: "bg-red-100 text-red-800 border-red-200",
  },
  critico: {
    titulo: "Por vencer (crítico)",
    clase: "bg-red-50 text-red-700 border-red-200",
  },
  proximo_60: {
    titulo: "Próximo a vencer",
    clase: "bg-amber-100 text-amber-900 border-amber-200",
  },
  proximo_90: {
    titulo: "Vence en 90 días",
    clase: "bg-yellow-50 text-yellow-800 border-yellow-200",
  },
  vigente: {
    titulo: "Vigente",
    clase: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  sin_datos: {
    titulo: "Sin datos",
    clase: "bg-slate-100 text-slate-600 border-slate-200",
  },
};
