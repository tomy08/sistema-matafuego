"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { parseMonthYearInput } from "@/lib/date-parsing";
import { edificios, extintores } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

function toNullableText(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized.length ? normalized : null;
}

async function exigirExtintorPropio(extintorId: number, email: string) {
  const filas = await db
    .select({ x: extintores, edificioId: extintores.edificioId })
    .from(extintores)
    .innerJoin(edificios, eq(extintores.edificioId, edificios.id))
    .where(and(eq(extintores.id, extintorId), eq(edificios.administradorEmail, email)))
    .limit(1);
  const row = filas[0];
  if (!row) throw new Error("Extintor inválido.");
  return row.x;
}

async function exigirEdificioPropio(edificioId: number, email: string) {
  const filas = await db
    .select({ id: edificios.id })
    .from(edificios)
    .where(and(eq(edificios.id, edificioId), eq(edificios.administradorEmail, email)))
    .limit(1);
  if (!filas.length) throw new Error("Edificio inválido.");
}

export async function actualizarExtintor(formData: FormData) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login");

  const extintorId = Number(formData.get("extintorId"));
  if (!Number.isInteger(extintorId) || extintorId <= 0) {
    throw new Error("Extintor inválido.");
  }
  await exigirExtintorPropio(extintorId, email);

  const edificioId = Number(formData.get("edificioId"));
  if (!Number.isInteger(edificioId) || edificioId <= 0) {
    throw new Error("Debés seleccionar un edificio.");
  }
  await exigirEdificioPropio(edificioId, email);

  const ubicacionInterna = String(formData.get("ubicacionInterna") ?? "").trim();
  const agente = String(formData.get("agente") ?? "").trim();
  const capacidad = String(formData.get("capacidad") ?? "").trim();
  if (!ubicacionInterna || !agente || !capacidad) {
    throw new Error("Ubicación, agente y capacidad son obligatorios.");
  }

  const fechaMantenimiento = parseMonthYearInput(
    String(formData.get("fechaMantenimiento") ?? ""),
  );
  const vencMantenimiento = parseMonthYearInput(
    String(formData.get("vencMantenimiento") ?? ""),
  );
  const fechaFabricacion = parseMonthYearInput(
    String(formData.get("fechaFabricacion") ?? ""),
  );
  const vencVidaUtil = parseMonthYearInput(
    String(formData.get("vencVidaUtil") ?? ""),
  );
  const vencPh = parseMonthYearInput(String(formData.get("vencPh") ?? ""));

  await db
    .update(extintores)
    .set({
      edificioId,
      ubicacionInterna,
      nroExtintor: toNullableText(formData.get("nroExtintor")),
      nroTarjeta: toNullableText(formData.get("nroTarjeta")),
      nroSerie: toNullableText(formData.get("nroSerie")),
      agente,
      capacidad,
      fabricante: toNullableText(formData.get("fabricante")),
      recargadora: toNullableText(formData.get("recargadora")),
      uso: toNullableText(formData.get("uso")),
      colorMarbete: toNullableText(formData.get("colorMarbete")),
      fechaMantenimiento: fechaMantenimiento.date,
      vencMantenimiento: vencMantenimiento.date,
      fechaFabricacion: fechaFabricacion.date,
      vencVidaUtil: vencVidaUtil.date,
      vencPh: vencPh.date,
      fechaMantenimientoEstimada: fechaMantenimiento.estimated,
      vencMantenimientoEstimada: vencMantenimiento.estimated,
      fechaFabricacionEstimada: fechaFabricacion.estimated,
      vencVidaUtilEstimada: vencVidaUtil.estimated,
      vencPhEstimada: vencPh.estimated,
      updatedAt: new Date(),
    })
    .where(eq(extintores.id, extintorId));

  redirect(`/extintores/${extintorId}`);
}

export async function eliminarExtintor(formData: FormData) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login");

  const extintorId = Number(formData.get("extintorId"));
  if (!Number.isInteger(extintorId) || extintorId <= 0) {
    throw new Error("Extintor inválido.");
  }
  const actual = await exigirExtintorPropio(extintorId, email);
  const edificioId = actual.edificioId;

  await db.delete(extintores).where(eq(extintores.id, extintorId));

  redirect(`/edificios/${edificioId}`);
}
