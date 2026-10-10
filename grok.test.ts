import { describe, expect, it } from "vitest";
import { normalizarFecha, normalizarRespuestaGrok } from "./grok";

describe("normalizarFecha", () => {
  it("acepta MM/AAAA y variantes", () => {
    expect(normalizarFecha("08/2026")).toBe("08/2026");
    expect(normalizarFecha("8-2026")).toBe("08/2026");
    expect(normalizarFecha("08/26")).toBe("08/2026");
    expect(normalizarFecha("15/08/2026")).toBe("08/2026");
    expect(normalizarFecha("2026-08-01")).toBe("08/2026");
    expect(normalizarFecha("2026")).toBe("2026");
  });

  it("descarta valores inválidos", () => {
    expect(normalizarFecha(null)).toBeNull();
    expect(normalizarFecha("")).toBeNull();
    expect(normalizarFecha("13/2026")).toBeNull();
    expect(normalizarFecha("agosto")).toBeNull();
  });
});

describe("normalizarRespuestaGrok", () => {
  it("normaliza campos del extintor", () => {
    const r = normalizarRespuestaGrok({
      agente: "haloclean",
      capacidad: "5 kg",
      recargadora: " SUYAI EXTINTORES S.R.L. ",
      nroTarjeta: 1041950779,
      nroExtintor: "null",
      fechaMantenimiento: "08/2026",
      vencMantenimiento: "08/2027",
      vencPh: "2030",
      textoLeido: "SUYAI EXTINTORES S.R.L.\nHaloclean 5 Kg",
    });
    expect(r.agente).toBe("HALOCLEAN");
    expect(r.capacidad).toBe("5 KG");
    expect(r.recargadora).toBe("SUYAI EXTINTORES S.R.L.");
    expect(r.nroTarjeta).toBe("1041950779");
    expect(r.nroExtintor).toBeNull();
    expect(r.nroSerie).toBeNull();
    expect(r.fechaMantenimiento).toBe("08/2026");
    expect(r.vencMantenimiento).toBe("08/2027");
    expect(r.vencPh).toBe("2030");
    expect(r.textoLeido).toContain("Haloclean");
  });

  it("tolera respuestas vacías o inválidas", () => {
    const r = normalizarRespuestaGrok("no es un objeto");
    expect(r.agente).toBeNull();
    expect(r.textoLeido).toBe("");
  });
});
