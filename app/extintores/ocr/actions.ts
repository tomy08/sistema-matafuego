"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { parseMonthYearInput } from "@/lib/date-parsing";
import { edificios, extintores } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

function nullable(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  return v.length ? v : null;
}

export async function crearExtintorOcr(formData: FormData) {
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
  const agente = String(formData.get("agente") ?? "").trim();
  const capacidad = String(formData.get("capacidad") ?? "").trim();
  if (!ubicacionInterna || !agente || !capacidad) {
    throw new Error("Ubicación, agente y capacidad son obligatorios (conciliá el OCR).");
  }

  const fechaMantenimiento = parseMonthYearInput(String(formData.get("fechaMantenimiento") ?? ""));
  const vencMantenimiento = parseMonthYearInput(String(formData.get("vencMantenimiento") ?? ""));
  const fechaFabricacion = parseMonthYearInput(String(formData.get("fechaFabricacion") ?? ""));
  const vencVidaUtil = parseMonthYearInput(String(formData.get("vencVidaUtil") ?? ""));
  const vencPh = parseMonthYearInput(String(formData.get("vencPh") ?? ""));
  const textoOcr = nullable(formData.get("textoOcr"));

  await db.insert(extintores).values({
    edificioId,
    ubicacionInterna,
    nroExtintor: nullable(formData.get("nroExtintor")),
    nroTarjeta: nullable(formData.get("nroTarjeta")),
    nroSerie: nullable(formData.get("nroSerie")),
    agente,
    capacidad,
    fabricante: nullable(formData.get("fabricante")),
    recargadora: nullable(formData.get("recargadora")),
    uso: nullable(formData.get("uso")),
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
    origen: "ocr",
    datosAgcCrudos: textoOcr ? { ocr: textoOcr } : null,
  });

  redirect("/");
}
