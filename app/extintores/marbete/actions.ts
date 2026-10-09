"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  estimarFechasPorAnioMarbete,
  inferirAnioPorColor,
  normalizarColorMarbete,
  validarAnioMarbeteOpcional,
  validarCoherenciaColorAnio,
} from "@/lib/marbete";
import { edificios, extintores } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

function textoNullable(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  return v.length ? v : null;
}

export async function crearExtintorMarbete(formData: FormData) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login");

  const edificioId = Number(formData.get("edificioId"));
  if (!Number.isInteger(edificioId) || edificioId <= 0) {
    throw new Error("Seleccioná un edificio.");
  }
  const propio = await db
    .select({ id: edificios.id })
    .from(edificios)
    .where(and(eq(edificios.id, edificioId), eq(edificios.administradorEmail, email)))
    .limit(1);
  if (!propio.length) throw new Error("Edificio inválido.");

  const ubicacionInterna = String(formData.get("ubicacionInterna") ?? "").trim();
  if (!ubicacionInterna) throw new Error("La ubicación interna es obligatoria.");

  const colorMarbete = normalizarColorMarbete(String(formData.get("colorMarbete") ?? ""));
  // Tabla oficial IRAM: el color define la terminación del año.
  // Si no indicás año, inferimos el más reciente (ej violeta->2026).
  // Si lo indicás, validamos que coincida con el color.
  const anioIngresado = validarAnioMarbeteOpcional(formData.get("anioMarbete"));
  if (anioIngresado !== null) validarCoherenciaColorAnio(colorMarbete, anioIngresado);
  const anio = anioIngresado ?? inferirAnioPorColor(colorMarbete);
  const estimado = anio ? estimarFechasPorAnioMarbete(anio) : null;

  await db.insert(extintores).values({
    edificioId,
    ubicacionInterna,
    agente: textoNullable(formData.get("agente")) ?? "Sin datos",
    capacidad: textoNullable(formData.get("capacidad")) ?? "Sin datos",
    nroExtintor: textoNullable(formData.get("nroExtintor")),
    colorMarbete: anio
      ? `${colorMarbete} (${anio})`
      : colorMarbete,
    fechaMantenimiento: estimado?.fechaMantenimiento ?? null,
    vencMantenimiento: estimado?.vencMantenimiento ?? null,
    fechaMantenimientoEstimada: estimado ? true : false,
    vencMantenimientoEstimada: estimado ? true : false,
    estadoVerificacion: estimado ? "estimado" : "sin_datos",
    origen: "marbete",
  });

  redirect("/");
}
