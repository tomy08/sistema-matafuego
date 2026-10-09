export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { edificios, extintores } from "@/lib/schema";
import { and, asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { actualizarExtintor } from "./actions";

function aInput(fecha: string | null, estimada?: boolean): string {
  if (!fecha) return "";
  const [y, m] = fecha.split("-");
  if (!y) return "";
  if (estimada) return y;
  if (!m) return y;
  return `${m}/${y}`;
}

export default async function EditarExtintorPage({
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
  const { x } = row;

  const misEdificios = await db
    .select({ id: edificios.id, nombre: edificios.nombre, direccion: edificios.direccion })
    .from(edificios)
    .where(eq(edificios.administradorEmail, email))
    .orderBy(asc(edificios.nombre));

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <Link href={`/extintores/${x.id}`} className="text-sm text-blue-600 hover:underline">
        ← Volver al extintor
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Editar extintor</h1>
      <p className="mt-1 text-sm text-slate-600">
        Origen: {x.origen} · Estado: {x.estadoVerificacion} (no se modifican al editar)
      </p>

      <form
        action={actualizarExtintor}
        className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-6"
      >
        <input type="hidden" name="extintorId" value={x.id} />

        <div>
          <label htmlFor="edificioId" className="block text-sm font-medium text-slate-700">
            Edificio
          </label>
          <select
            id="edificioId"
            name="edificioId"
            required
            defaultValue={x.edificioId}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {misEdificios.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre} · {e.direccion}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ubicacionInterna" className="block text-sm font-medium text-slate-700">
              Ubicación interna
            </label>
            <input
              id="ubicacionInterna"
              name="ubicacionInterna"
              required
              defaultValue={x.ubicacionInterna}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="nroExtintor" className="block text-sm font-medium text-slate-700">
              Nro. extintor
            </label>
            <input
              id="nroExtintor"
              name="nroExtintor"
              defaultValue={x.nroExtintor ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nroTarjeta" className="block text-sm font-medium text-slate-700">
              Nro. tarjeta AGC
            </label>
            <input
              id="nroTarjeta"
              name="nroTarjeta"
              defaultValue={x.nroTarjeta ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="nroSerie" className="block text-sm font-medium text-slate-700">
              Nro. serie
            </label>
            <input
              id="nroSerie"
              name="nroSerie"
              defaultValue={x.nroSerie ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="agente" className="block text-sm font-medium text-slate-700">
              Agente extintor
            </label>
            <input
              id="agente"
              name="agente"
              required
              defaultValue={x.agente}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="capacidad" className="block text-sm font-medium text-slate-700">
              Capacidad
            </label>
            <input
              id="capacidad"
              name="capacidad"
              required
              defaultValue={x.capacidad}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fabricante" className="block text-sm font-medium text-slate-700">
              Fabricante
            </label>
            <input
              id="fabricante"
              name="fabricante"
              defaultValue={x.fabricante ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="recargadora" className="block text-sm font-medium text-slate-700">
              Recargadora
            </label>
            <input
              id="recargadora"
              name="recargadora"
              defaultValue={x.recargadora ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="uso" className="block text-sm font-medium text-slate-700">
              Uso
            </label>
            <input
              id="uso"
              name="uso"
              defaultValue={x.uso ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="colorMarbete" className="block text-sm font-medium text-slate-700">
              Color marbete
            </label>
            <input
              id="colorMarbete"
              name="colorMarbete"
              defaultValue={x.colorMarbete ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fechaMantenimiento" className="block text-sm font-medium text-slate-700">
              Fecha mantenimiento (MM/AAAA o AAAA)
            </label>
            <input
              id="fechaMantenimiento"
              name="fechaMantenimiento"
              placeholder="08/2026"
              defaultValue={aInput(x.fechaMantenimiento, x.fechaMantenimientoEstimada)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="vencMantenimiento" className="block text-sm font-medium text-slate-700">
              Venc. mantenimiento (MM/AAAA o AAAA)
            </label>
            <input
              id="vencMantenimiento"
              name="vencMantenimiento"
              placeholder="08/2027"
              defaultValue={aInput(x.vencMantenimiento, x.vencMantenimientoEstimada)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="fechaFabricacion" className="block text-sm font-medium text-slate-700">
              Fecha fabricación (MM/AAAA o AAAA)
            </label>
            <input
              id="fechaFabricacion"
              name="fechaFabricacion"
              defaultValue={aInput(x.fechaFabricacion, x.fechaFabricacionEstimada)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="vencVidaUtil" className="block text-sm font-medium text-slate-700">
              Venc. vida útil (MM/AAAA o AAAA)
            </label>
            <input
              id="vencVidaUtil"
              name="vencVidaUtil"
              defaultValue={aInput(x.vencVidaUtil, x.vencVidaUtilEstimada)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="vencPh" className="block text-sm font-medium text-slate-700">
              Venc. PH (MM/AAAA o AAAA)
            </label>
            <input
              id="vencPh"
              name="vencPh"
              defaultValue={aInput(x.vencPh, x.vencPhEstimada)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-white hover:bg-slate-700 sm:w-auto"
        >
          Guardar cambios
        </button>
      </form>
    </main>
  );
}
