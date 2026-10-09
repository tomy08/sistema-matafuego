export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { edificios, extintores, inspeccionesVisuales } from "@/lib/schema";
import { NIVEL_META, calcularEstadoVencimiento } from "@/lib/vencimientos";
import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eliminarExtintor } from "./editar/actions";

function fila(titulo: string, valor: string | null, estimado?: boolean) {
  if (!valor) return null;
  return (
    <p className="text-sm text-slate-700">
      <span className="font-medium">{titulo}:</span> {valor}
      {estimado ? <span className="text-amber-700"> (estimado)</span> : null}
    </p>
  );
}

export default async function ExtintorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login");
  const extintorId = Number(id);
  if (!Number.isInteger(extintorId)) notFound();

  const filas = await db
    .select({ x: extintores, e: edificios })
    .from(extintores)
    .innerJoin(edificios, eq(extintores.edificioId, edificios.id))
    .where(and(eq(extintores.id, extintorId), eq(edificios.administradorEmail, email)))
    .limit(1);
  const row = filas[0];
  if (!row) notFound();
  const { x, e } = row;

  const estado = calcularEstadoVencimiento(
    { vencMantenimiento: x.vencMantenimiento, vencVidaUtil: x.vencVidaUtil, vencPh: x.vencPh },
    {
      umbralVencidoDias: e.umbralVencidoDias,
      umbralProximo60Dias: e.umbralProximo60Dias,
      umbralProximo90Dias: e.umbralProximo90Dias,
    },
  );
  const meta = NIVEL_META[estado.nivel];

  const inspecciones = await db
    .select()
    .from(inspeccionesVisuales)
    .where(eq(inspeccionesVisuales.extintorId, x.id))
    .orderBy(desc(inspeccionesVisuales.fecha))
    .limit(20);

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <Link href="/" className="text-sm text-blue-600 hover:underline">← Volver</Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/extintores/${x.id}/editar`}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            Editar
          </Link>
          <form action={eliminarExtintor}>
            <input type="hidden" name="extintorId" value={x.id} />
            <button
              type="submit"
              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
            >
              Eliminar
            </button>
          </form>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold">{x.ubicacionInterna}</h1>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.clase}`}>{meta.titulo}</span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs">{x.origen} · {x.estadoVerificacion}</span>
      </div>
      <p className="text-sm text-slate-600">{e.nombre} · {x.agente} {x.capacidad}</p>

      <section className="mt-4 space-y-1 rounded-xl border border-slate-200 bg-white p-4">
        {fila("Nro. extintor", x.nroExtintor)}
        {fila("Nro. tarjeta AGC", x.nroTarjeta)}
        {fila("Nro. serie", x.nroSerie)}
        {fila("Fabricante", x.fabricante)}
        {fila("Recargadora", x.recargadora)}
        {fila("Uso", x.uso)}
        {fila("Fecha mantenimiento", x.fechaMantenimiento, x.fechaMantenimientoEstimada)}
        {fila("Venc. mantenimiento", x.vencMantenimiento, x.vencMantenimientoEstimada)}
        {fila("Fecha fabricación", x.fechaFabricacion, x.fechaFabricacionEstimada)}
        {fila("Venc. vida útil", x.vencVidaUtil, x.vencVidaUtilEstimada)}
        {fila("Venc. PH", x.vencPh, x.vencPhEstimada)}
        {fila("Color marbete", x.colorMarbete)}
        {fila("URL QR", x.urlQr)}
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Inspecciones visuales</h2>
          <Link href={`/inspecciones/nuevo?extintorId=${x.id}`} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">
            Nueva
          </Link>
        </div>
        {inspecciones.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">Sin inspecciones registradas.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {inspecciones.map((i) => (
              <li key={i.id} className="rounded-lg border border-slate-100 p-2">
                {i.fecha} · manómetro {i.manometro} · precinto {i.precintoIntacto ? "ok" : "roto"} · cilindro {i.estadoCilindro}
                {i.observaciones ? ` · ${i.observaciones}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
