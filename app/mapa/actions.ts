"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { edificios, extintores } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

function normalizarCoordenada(valor: number | null) {
  if (valor === null) return null;
  if (!Number.isFinite(valor)) throw new Error("Posición inválida.");
  return Math.min(100, Math.max(0, valor));
}

/**
 * Guarda la posición del extintor en el plano (en % de la imagen).
 * Con x/y en null lo saca del mapa.
 */
export async function guardarPosicionExtintor(
  extintorId: number,
  x: number | null,
  y: number | null,
) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login");

  if (!Number.isInteger(extintorId) || extintorId <= 0) {
    throw new Error("Extintor inválido.");
  }
  if ((x === null) !== (y === null)) {
    throw new Error("Posición inválida.");
  }

  const filas = await db
    .select({ id: extintores.id })
    .from(extintores)
    .innerJoin(edificios, eq(extintores.edificioId, edificios.id))
    .where(and(eq(extintores.id, extintorId), eq(edificios.administradorEmail, email)))
    .limit(1);
  if (!filas.length) throw new Error("Extintor inválido.");

  await db
    .update(extintores)
    .set({
      mapaX: normalizarCoordenada(x),
      mapaY: normalizarCoordenada(y),
      updatedAt: new Date(),
    })
    .where(eq(extintores.id, extintorId));
}
