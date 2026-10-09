import { describe, expect, it } from "vitest";
import { calcularEstadoVencimiento } from "./vencimientos";

const UMBRALES = {
  umbralVencidoDias: 30,
  umbralProximo60Dias: 60,
  umbralProximo90Dias: 90,
};

describe("calcularEstadoVencimiento", () => {
  it("marca vencido si la fecha crítica ya pasó", () => {
    const r = calcularEstadoVencimiento(
      { vencMantenimiento: "2020-01-01", vencVidaUtil: null, vencPh: null },
      UMBRALES,
      new Date(2026, 9, 3),
    );
    expect(r.nivel).toBe("vencido");
    expect(r.campoCritico).toBe("vencMantenimiento");
  });

  it("usa la mínima de las 3 fechas", () => {
    const r = calcularEstadoVencimiento(
      {
        vencMantenimiento: "2027-08-01",
        vencVidaUtil: "2028-12-01",
        vencPh: "2026-10-10",
      },
      UMBRALES,
      new Date(2026, 9, 3),
    );
    expect(r.fechaCritica).toBe("2026-10-10");
    expect(r.campoCritico).toBe("vencPh");
    expect(r.nivel).toBe("critico");
  });

  it("devuelve sin_datos sin fechas", () => {
    const r = calcularEstadoVencimiento(
      { vencMantenimiento: null, vencVidaUtil: null, vencPh: null },
      UMBRALES,
    );
    expect(r.nivel).toBe("sin_datos");
  });

  it("marca vigente lejos del vencimiento", () => {
    const r = calcularEstadoVencimiento(
      { vencMantenimiento: "2028-01-01", vencVidaUtil: null, vencPh: null },
      UMBRALES,
      new Date(2026, 9, 3),
    );
    expect(r.nivel).toBe("vigente");
  });
});
