"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { edificios, extintores, inspeccionesVisuales } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function crearInspeccion(formData: FormData) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login");

  const extintorId = Number(formData.get("extintorId"));
  if (!Number.isInteger(extintorId) || extintorId <= 0) {
    throw new Error("Seleccioná un extintor.");
  }
  const own = await db
    .select({ id: extintores.id })
    .from(extintores)
    .innerJoin(edificios, eq(extintores.edificioId, edificios.id))
    .where(and(eq(extintores.id, extintorId), eq(edificios.administradorEmail, email)))
    .limit(1);
  if (!own.length) throw new Error("Extintor inválido.");

  const fecha = String(formData.get("fecha") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new Error("Fecha inválida (AAAA-MM-DD).");
  const manometro = String(formData.get("manometro") ?? "");
  if (!["en_verde", "fuera_de_rango", "no_tiene"].includes(manometro)) {
    throw new Error("Manómetro inválido.");
  }
  const estadoCilindro = String(formData.get("estadoCilindro") ?? "");
  if (!["bueno", "corrosion", "golpes", "danado"].includes(estadoCilindro)) {
    throw new Error("Estado del cilindro inválido.");
  }
  const observaciones = String(formData.get("observaciones") ?? "").trim();

  await db.insert(inspeccionesVisuales).values({
    extintorId,
    fecha,
    manometro: manometro as "en_verde" | "fuera_de_rango" | "no_tiene",
    precintoIntacto: formData.get("precintoIntacto") === "on",
    estadoCilindro: estadoCilindro as "bueno" | "corrosion" | "golpes" | "danado",
    observaciones: observaciones.length ? observaciones : null,
  });

  redirect(`/extintores/${extintorId}`);
}
