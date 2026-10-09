"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { edificios } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

function parseThreshold(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

async function exigirEdificioPropio(edificioId: number, email: string) {
  const filas = await db
    .select({ id: edificios.id })
    .from(edificios)
    .where(and(eq(edificios.id, edificioId), eq(edificios.administradorEmail, email)))
    .limit(1);
  if (!filas.length) throw new Error("Edificio inválido.");
}

export async function actualizarEdificio(formData: FormData) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login");

  const edificioId = Number(formData.get("edificioId"));
  if (!Number.isInteger(edificioId) || edificioId <= 0) {
    throw new Error("Edificio inválido.");
  }
  await exigirEdificioPropio(edificioId, email);

  const nombre = String(formData.get("nombre") ?? "").trim();
  const direccion = String(formData.get("direccion") ?? "").trim();
  if (!nombre || !direccion) {
    throw new Error("Nombre y dirección son obligatorios.");
  }

  await db
    .update(edificios)
    .set({
      nombre,
      direccion,
      umbralVencidoDias: parseThreshold(formData.get("umbralVencidoDias"), 30),
      umbralProximo60Dias: parseThreshold(formData.get("umbralProximo60Dias"), 60),
      umbralProximo90Dias: parseThreshold(formData.get("umbralProximo90Dias"), 90),
      updatedAt: new Date(),
    })
    .where(eq(edificios.id, edificioId));

  redirect(`/edificios/${edificioId}`);
}

export async function eliminarEdificio(formData: FormData) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login");

  const edificioId = Number(formData.get("edificioId"));
  if (!Number.isInteger(edificioId) || edificioId <= 0) {
    throw new Error("Edificio inválido.");
  }
  await exigirEdificioPropio(edificioId, email);

  await db.delete(edificios).where(eq(edificios.id, edificioId));

  redirect("/");
}
