import { afterEach, describe, expect, it } from "vitest";
import { getRequiredEnv } from "./env";

const originalEnv = process.env;

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("getRequiredEnv", () => {
  it("devuelve el valor configurado", () => {
    process.env.AUTH_SECRET = "secret-test";

    expect(getRequiredEnv("AUTH_SECRET")).toBe("secret-test");
  });

  it("lanza error cuando falta la variable", () => {
    delete process.env.AUTH_SECRET;

    expect(() => getRequiredEnv("AUTH_SECRET")).toThrow(
      "Missing required environment variable: AUTH_SECRET",
    );
  });

  it("lanza error cuando la variable está vacía", () => {
    process.env.AUTH_SECRET = "   ";

    expect(() => getRequiredEnv("AUTH_SECRET")).toThrow(
      "Missing required environment variable: AUTH_SECRET",
    );
  });
});
