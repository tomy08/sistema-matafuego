export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { logout } from "@/app/actions/auth-actions";
import { db } from "@/lib/db";
import { edificios, extintores } from "@/lib/schema";
import {
  NIVEL_META,
  calcularEstadoVencimiento,
  type NivelVencimiento,
} from "@/lib/vencimientos";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

const ORDEN_NIVEL: Record<NivelVencimiento, number> = {
  vencido: 0,
  critico: 1,
  proximo_60: 2,
  proximo_90: 3,
  sin_datos: 4,
  vigente: 5,
};

export default async function HomePage() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login");

  const listaEdificios = await db
    .select()
    .from(edificios)
    .where(eq(edificios.administradorEmail, email));

  const umbralesPorEdificio = new Map(
    listaEdificios.map((e) => [
      e.id,
      {
        umbralVencidoDias: e.umbralVencidoDias,
        umbralProximo60Dias: e.umbralProximo60Dias,
        umbralProximo90Dias: e.umbralProximo90Dias,
      },
    ]),
  );
  const nombrePorEdificio = new Map(listaEdificios.map((e) => [e.id, e.nombre]));

  const listaExtintores =
    listaEdificios.length === 0
      ? []
      : await db
          .select()
          .from(extintores)
          .where(
            // drizzle no soporta IN con array vacío; ya filtramos arriba
            eq(extintores.edificioId, listaEdificios[0]!.id),
          );

  // Traer todos los extintores de todos los edificios del usuario
  let todos: typeof listaExtintores = listaExtintores;
  if (listaEdificios.length > 1) {
    const { inArray } = await import("drizzle-orm");
    todos = await db
      .select()
      .from(extintores)
      .where(
        inArray(
          extintores.edificioId,
          listaEdificios.map((e) => e.id),
        ),
      );
  }

  const conEstado = todos
    .map((x) => {
      const umbrales = umbralesPorEdificio.get(x.edificioId) ?? {
        umbralVencidoDias: 30,
        umbralProximo60Dias: 60,
        umbralProximo90Dias: 90,
      };
      const estado = calcularEstadoVencimiento(
        {
          vencMantenimiento: x.vencMantenimiento,
          vencVidaUtil: x.vencVidaUtil,
          vencPh: x.vencPh,
        },
        umbrales,
      );
      return { x, estado };
    })
    .sort(
      (a, b) =>
        ORDEN_NIVEL[a.estado.nivel] - ORDEN_NIVEL[b.estado.nivel] ||
        (a.estado.fechaCritica ?? "").localeCompare(b.estado.fechaCritica ?? ""),
    );

  const conteo: Record<NivelVencimiento, number> = {
    vencido: 0,
    critico: 0,
    proximo_60: 0,
    proximo_90: 0,
    vigente: 0,
    sin_datos: 0,
  };
  conEstado.forEach(({ estado }) => {
    conteo[estado.nivel] += 1;
  });

  return (
    <main className="mx-auto w-full max-w-5xl p-4 sm:p-6">
      <header className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Sistema de Gestión de Matafuegos</h1>
          <p className="text-sm text-slate-600">Sesión: {session.user?.name ?? email}</p>
        </div>
        <form action={logout}>
          <button type="submit" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            Cerrar sesión
          </button>
        </form>
      </header>

      <section className="mt-4 grid gap-4 sm:grid-cols-4">
        <Stat titulo="Edificios" valor={listaEdificios.length} />
        <Stat titulo="Extintores" valor={todos.length} />
        <Stat titulo="Vencidos" valor={conteo.vencido} alerta={conteo.vencido > 0} />
        <Stat titulo="Críticos + próximos" valor={conteo.critico + conteo.proximo_60 + conteo.proximo_90} />
      </section>

      <section className="mt-4 flex flex-wrap gap-2">
        <Link href="/edificios/nuevo" className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white hover:bg-slate-700">Nuevo edificio</Link>
        <Link href="/extintores/scan" className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm text-white hover:bg-emerald-500">Alta por QR</Link>
        <Link href="/extintores/ocr" className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm text-white hover:bg-violet-500">Alta por OCR</Link>
        <Link href="/extintores/marbete" className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm text-white hover:bg-amber-500">Alta por marbete</Link>
        <Link href="/extintores/nuevo" className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm text-white hover:bg-blue-500">Alta manual</Link>
        <Link href="/inspecciones/nuevo" className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm hover:bg-slate-100">Nueva inspección</Link>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Extintores por vencer</h2>
        {conEstado.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">Todavía no cargaste extintores.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {conEstado.slice(0, 30).map(({ x, estado }) => {
              const meta = NIVEL_META[estado.nivel];
              return (
                <li key={x.id} className="flex flex-col gap-1 rounded-lg border border-slate-100 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link href={`/extintores/${x.id}`} className="font-medium text-blue-700 hover:underline">
                      {x.ubicacionInterna} · {x.agente} {x.capacidad}
                    </Link>
                    <p className="text-slate-600">
                      {nombrePorEdificio.get(x.edificioId) ?? ""} · Vence: {estado.fechaCritica ?? "—"}
                      {estado.diasRestantes !== null ? ` (${estado.diasRestantes}d)` : ""}
                      {x.fechaMantenimientoEstimada || x.vencMantenimientoEstimada ? " · estimado" : ""}
                    </p>
                  </div>
                  <span className={`inline-flex w-fit rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.clase}`}>
                    {meta.titulo} · {x.origen}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Mis edificios</h2>
        <ul className="mt-3 space-y-2">
          {listaEdificios.length === 0 ? (
            <li className="text-sm text-slate-600">Todavía no registraste edificios.</li>
          ) : (
            listaEdificios.map((e) => (
              <li key={e.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                <Link href={`/edificios/${e.id}`} className="font-medium text-blue-700 hover:underline">{e.nombre}</Link>
                <p className="text-slate-600">{e.direccion}</p>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}

function Stat({ titulo, valor, alerta }: { titulo: string; valor: number; alerta?: boolean }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{titulo}</p>
      <p className={`text-3xl font-semibold ${alerta ? "text-red-600" : "text-slate-900"}`}>{valor}</p>
    </article>
  );
}
