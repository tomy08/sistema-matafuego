import { describe, expect, it } from "vitest";
import { estimarFechasPorAnioMarbete } from "./marbete";
import { parseOcrTexto } from "./ocr";

describe("marbete", () => {
  it("estima mantenimiento y +1 año de vencimiento", () => {
    expect(estimarFechasPorAnioMarbete(2026)).toEqual({
      fechaMantenimiento: "2026-01-01",
      vencMantenimiento: "2027-01-01",
    });
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
