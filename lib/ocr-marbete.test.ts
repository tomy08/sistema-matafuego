import { describe, expect, it } from "vitest";
import {
  aniosCandidatosPorColor,
  colorPorDigito,
  digitoPorColor,
  estimarFechasPorAnioMarbete,
  inferirAnioPorColor,
  validarAnioMarbeteOpcional,
  validarCoherenciaColorAnio,
} from "./marbete";
import { parseOcrTexto } from "./ocr";

describe("marbete", () => {
  it("estima mantenimiento y +1 año de vencimiento", () => {
    expect(estimarFechasPorAnioMarbete(2026)).toEqual({
      fechaMantenimiento: "2026-01-01",
      vencMantenimiento: "2027-01-01",
    });
  });

  it("mapea dígito <-> color oficial", () => {
    expect(colorPorDigito(6)).toBe("violeta");
    expect(colorPorDigito(5)).toBe("azul");
    expect(colorPorDigito(4)).toBe("verde oscuro");
    expect(digitoPorColor("violeta")).toBe(6);
    expect(digitoPorColor("lila")).toBe(6);
    expect(digitoPorColor("azul")).toBe(5);
    expect(digitoPorColor("verde oscuro")).toBe(4);
    expect(digitoPorColor("marron claro")).toBe(0);
    expect(digitoPorColor("rojo")).toBeNull();
  });

  it("infiere el año más reciente por color", () => {
    expect(inferirAnioPorColor("violeta", 2026)).toBe(2026);
    expect(inferirAnioPorColor("azul", 2026)).toBe(2025);
    expect(inferirAnioPorColor("verde oscuro", 2026)).toBe(2024);
    expect(inferirAnioPorColor("negro", 2026)).toBe(2021);
    expect(inferirAnioPorColor("marron claro", 2026)).toBe(2020);
    expect(inferirAnioPorColor("rojo", 2026)).toBeNull();
  });

  it("lista candidatos por década", () => {
    expect(aniosCandidatosPorColor("violeta", 2026)).toEqual([2026, 2016, 2006]);
  });

  it("año opcional vacío -> null", () => {
    expect(validarAnioMarbeteOpcional("")).toBeNull();
    expect(validarAnioMarbeteOpcional(null)).toBeNull();
    expect(validarAnioMarbeteOpcional("2026")).toBe(2026);
  });

  it("valida coherencia color-año", () => {
    expect(() => validarCoherenciaColorAnio("violeta", 2026)).not.toThrow();
    expect(() => validarCoherenciaColorAnio("violeta", 2025)).toThrow();
    expect(() => validarCoherenciaColorAnio("azul", 2025)).not.toThrow();
  });
});

describe("ocr", () => {
  it("extrae fechas, agente y capacidad", () => {
    const r = parseOcrTexto(
      "SUYAI EXTINTORES S.R.L.\nHaloclean 5 Kg/Lts\nMantenimiento 08/2026 Vence 08/2027\nTarjeta 1041950779",
    );
    expect(r.fechas).toContain("08/2026");
    expect(r.fechas).toContain("08/2027");
    expect(r.agente).toBe("HALOCLEAN");
    expect(r.capacidad).toContain("5");
    expect(r.nroTarjeta).toBe("1041950779");
  });
});
