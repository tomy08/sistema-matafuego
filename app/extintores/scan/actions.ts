"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { parseMonthYearInput } from "@/lib/date-parsing";
import { consultarAgc } from "@/lib/agc";
import { edificios, extintores } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

function texto(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function nullable(formData: FormData, key: string): string | null {
  const v = texto(formData, key);
  return v.length ? v : null;
}

async function exigirEdificioPropio(edificioId: number, email: string) {
  const filas = await db
    .select({ id: edificios.id })
    .from(edificios)
    .where(and(eq(edificios.id, edificioId), eq(edificios.administradorEmail, email)))
    .limit(1);
  if (!filas.length) throw new Error("Edificio inválido.");
}

export async function crearExtintorDesdeAgc(formData: FormData) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login");

  const edificioId = Number(formData.get("edificioId"));
  if (!Number.isInteger(edificioId) || edificioId <= 0) {
    throw new Error("Seleccioná un edificio.");
  }
  await exigirEdificioPropio(edificioId, email);

  const urlQr = texto(formData, "urlQr");
  const ubicacionInterna = texto(formData, "ubicacionInterna");
  if (!urlQr) throw new Error("Falta la URL del QR.");
  if (!ubicacionInterna) throw new Error("La ubicación interna es obligatoria.");

  const consulta = await consultarAgc(urlQr);
  const d = consulta.datos;

  const agente = nullable(formData, "agente") ?? d.agente;
  const capacidad = nullable(formData, "capacidad") ?? d.capacidad;
  if (!agente || !capacidad) {
    throw new Error("Agente y capacidad son obligatorios (completá lo que falte de AGC).");
  }

  const fechaMantenimiento = parseMonthYearInput(
    nullable(formData, "fechaMantenimiento") ?? d.fechaMantenimiento ?? "",
  );
  const vencMantenimiento = parseMonthYearInput(
    nullable(formData, "vencMantenimiento") ?? d.vencMantenimiento ?? "",
  );
  const fechaFabricacion = parseMonthYearInput(
    nullable(formData, "fechaFabricacion") ?? d.fechaFabricacion ?? "",
  );
  const vencVidaUtil = parseMonthYearInput(
    nullable(formData, "vencVidaUtil") ?? d.vencVidaUtil ?? "",
  );
  const vencPh = parseMonthYearInput(
    nullable(formData, "vencPh") ?? d.vencPh ?? "",
  );

  await db.insert(extintores).values({
    edificioId,
    ubicacionInterna,
    nroExtintor: nullable(formData, "nroExtintor") ?? d.nroExtintor,
    nroTarjeta: nullable(formData, "nroTarjeta") ?? d.nroTarjeta,
    nroSerie: nullable(formData, "nroSerie") ?? d.nroSerie,
    agente,
    capacidad,
    fabricante: nullable(formData, "fabricante") ?? d.empresaFabricante,
    recargadora: nullable(formData, "recargadora") ?? d.empresaRecargadora,
    uso: nullable(formData, "uso") ?? d.uso,
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
    urlQr: consulta.url,
    estadoVerificacion: "verificado",
    origen: "qr",
    datosAgcCrudos: { ids: consulta.ids, datos: d },
  });

  redirect("/");
}
