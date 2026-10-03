"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { edificios } from "@/lib/schema";
import { redirect } from "next/navigation";

function parseThreshold(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export async function crearEdificio(formData: FormData) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    redirect("/login");
  }

  const nombre = String(formData.get("nombre") ?? "").trim();
  const direccion = String(formData.get("direccion") ?? "").trim();

  if (!nombre || !direccion) {
    throw new Error("Nombre y dirección son obligatorios.");
  }

  await db.insert(edificios).values({
    nombre,
    direccion,
    administradorEmail: email,
    umbralVencidoDias: parseThreshold(formData.get("umbralVencidoDias"), 30),
    umbralProximo60Dias: parseThreshold(formData.get("umbralProximo60Dias"), 60),
    umbralProximo90Dias: parseThreshold(formData.get("umbralProximo90Dias"), 90),
  });

  redirect("/");
}
