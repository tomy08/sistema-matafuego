import { describe, expect, it } from "vitest";
import { parseMonthYearInput } from "./date-parsing";

describe("parseMonthYearInput", () => {
  it("convierte MM/AAAA al primer día del mes", () => {
    expect(parseMonthYearInput("08/2026")).toEqual({
      date: "2026-08-01",
      estimated: false,
    });
  });

  it("convierte AAAA con estimación conservadora (enero)", () => {
    expect(parseMonthYearInput("2028")).toEqual({
      date: "2028-01-01",
      estimated: true,
    });
  });

  it("acepta vacío como sin dato", () => {
    expect(parseMonthYearInput("   ")).toEqual({ date: null, estimated: false });
  });

  it("falla con formatos inválidos", () => {
    expect(() => parseMonthYearInput("2026/08")).toThrow();
  });
});
