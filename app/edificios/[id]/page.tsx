export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { edificios, extintores } from "@/lib/schema";
import {
  NIVEL_META,
  calcularEstadoVencimiento,
} from "@/lib/vencimientos";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eliminarEdificio } from "./editar/actions";

export default async function EdificioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login");
  const edificioId = Number(id);
  if (!Number.isInteger(edificioId)) notFound();

  const filas = await db
    .select()
    .from(edificios)
    .where(and(eq(edificios.id, edificioId), eq(edificios.administradorEmail, email)))
    .limit(1);
  const edificio = filas[0];
  if (!edificio) notFound();

  const equipos = await db
    .select()
    .from(extintores)
    .where(eq(extintores.edificioId, edificioId));

  const conEstado = equipos.map((x) => ({
    x,
    estado: calcularEstadoVencimiento(
      { vencMantenimiento: x.vencMantenimiento, vencVidaUtil: x.vencVidaUtil, vencPh: x.vencPh },
      {
        umbralVencidoDias: edificio.umbralVencidoDias,
        umbralProximo60Dias: edificio.umbralProximo60Dias,
        umbralProximo90Dias: edificio.umbralProximo90Dias,
      },
    ),
  }));

  return (
    <main className="mx-auto w-full max-w-4xl p-4 sm:p-6">
      <Link href="/" className="text-sm text-blue-600 hover:underline">← Volver</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{edificio.nombre}</h1>
          <p className="text-sm text-slate-600">{edificio.direccion}</p>
          <p className="mt-1 text-xs text-slate-500">
            Umbrales: crítico {edificio.umbralVencidoDias}d · próximo {edificio.umbralProximo60Dias}d · 90d {edificio.umbralProximo90Dias}d
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/edificios/${edificio.id}/editar`}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            Editar
          </Link>
          <form action={eliminarEdificio}>
            <input type="hidden" name="edificioId" value={edificio.id} />
            <button
              type="submit"
              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
            >
              Eliminar
            </button>
          </form>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/extintores/scan?edificioId=${edificio.id}`} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500">Alta por QR</Link>
        <Link href={`/extintores/ocr?edificioId=${edificio.id}`} className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-500">Alta por foto (IA)</Link>
        <Link href={`/extintores/marbete?edificioId=${edificio.id}`} className="rounded-lg bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-500">Alta por marbete</Link>
        <Link href={`/extintores/nuevo?edificioId=${edificio.id}`} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500">Alta manual</Link>
        <Link href={`/mapa?edificioId=${edificio.id}`} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-100">Ver en el mapa</Link>
      </div>
      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold">Extintores ({equipos.length})</h2>
        <ul className="mt-3 space-y-2">
          {conEstado.length === 0 ? (
            <li className="text-sm text-slate-600">Sin extintores.</li>
          ) : (
            conEstado.map(({ x, estado }) => {
              const meta = NIVEL_META[estado.nivel];
              return (
                <li key={x.id} className="flex flex-col gap-2 rounded-lg border border-slate-100 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link href={`/extintores/${x.id}`} className="font-medium text-blue-700 hover:underline">
                      {x.ubicacionInterna} · {x.agente} {x.capacidad}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {x.origen} · {x.estadoVerificacion} · Vence: {estado.fechaCritica ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs ${meta.clase}`}>{meta.titulo}</span>
                    <Link href={`/extintores/${x.id}`} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs hover:bg-slate-100">
                      Ver
                    </Link>
                    <Link href={`/extintores/${x.id}/editar`} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs hover:bg-slate-100">
                      Editar
                    </Link>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </section>
    </main>
  );
}
