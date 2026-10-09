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

function parseBuildingId(value: FormDataEntryValue | null) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Debés seleccionar un edificio.");
  }

  return parsed;
}

export async function crearExtintorManual(formData: FormData) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const edificioId = parseBuildingId(formData.get("edificioId"));
  const propio = await db
    .select({ id: edificios.id })
    .from(edificios)
    .where(
      and(
        eq(edificios.id, edificioId),
        eq(edificios.administradorEmail, session.user.email),
      ),
    )
    .limit(1);
  if (!propio.length) {
    throw new Error("Edificio inválido.");
  }
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

  await db.insert(extintores).values({
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
    estadoVerificacion: "no_verificado",
    origen: "manual",
  });

  redirect("/");
}
