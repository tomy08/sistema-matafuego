export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { edificios } from "@/lib/schema";
import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { crearExtintorManual } from "./actions";

export default async function NuevoExtintorPage({
  searchParams,
}: {
  searchParams?: Promise<{ edificioId?: string }>;
}) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    redirect("/login");
  }

  const { edificioId: edificioIdQuery } = (await searchParams) ?? {};
  const edificioPreseleccionado = Number(edificioIdQuery);
  const tienePreseleccion =
    Number.isInteger(edificioPreseleccionado) && edificioPreseleccionado > 0
      ? edificioPreseleccionado
      : null;

  const edificiosDelUsuario = await db
    .select({ id: edificios.id, nombre: edificios.nombre, direccion: edificios.direccion })
    .from(edificios)
    .where(eq(edificios.administradorEmail, email))
    .orderBy(asc(edificios.nombre));

  if (!edificiosDelUsuario.length) {
    return (
      <main className="mx-auto w-full max-w-2xl p-4 sm:p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Alta manual de extintor</h1>
        <p className="mt-2 text-sm text-slate-600">
          Primero necesitás crear un edificio para asociar el equipo.
        </p>
        <Link
          href="/edificios/nuevo"
          className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white hover:bg-slate-700"
        >
          Crear edificio
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Alta manual de extintor</h1>
      <p className="mt-1 text-sm text-slate-600">
        Cargá los datos de la tarjeta AGC y de la etiqueta de la recargadora.
      </p>

      <form action={crearExtintorManual} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <div>
          <label htmlFor="edificioId" className="block text-sm font-medium text-slate-700">Edificio</label>
          <select id="edificioId" name="edificioId" required defaultValue={tienePreseleccion ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Seleccionar…</option>
            {edificiosDelUsuario.map((edificio) => (
              <option key={edificio.id} value={edificio.id}>
                {edificio.nombre} · {edificio.direccion}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ubicacionInterna" className="block text-sm font-medium text-slate-700">Ubicación interna</label>
            <input id="ubicacionInterna" name="ubicacionInterna" required placeholder="Piso 3 - Palier" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="nroExtintor" className="block text-sm font-medium text-slate-700">Nro. extintor</label>
            <input id="nroExtintor" name="nroExtintor" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nroTarjeta" className="block text-sm font-medium text-slate-700">Nro. tarjeta AGC</label>
            <input id="nroTarjeta" name="nroTarjeta" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="nroSerie" className="block text-sm font-medium text-slate-700">Nro. serie</label>
            <input id="nroSerie" name="nroSerie" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="agente" className="block text-sm font-medium text-slate-700">Agente extintor</label>
            <input id="agente" name="agente" required placeholder="ABC / CO2 / Haloclean" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="capacidad" className="block text-sm font-medium text-slate-700">Capacidad</label>
            <input id="capacidad" name="capacidad" required placeholder="5 Kg/Lts" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fabricante" className="block text-sm font-medium text-slate-700">Fabricante</label>
            <input id="fabricante" name="fabricante" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="recargadora" className="block text-sm font-medium text-slate-700">Recargadora</label>
            <input id="recargadora" name="recargadora" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
        </div>

        <div>
          <label htmlFor="uso" className="block text-sm font-medium text-slate-700">Uso</label>
          <input id="uso" name="uso" placeholder="Particular / Industrial" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fechaMantenimiento" className="block text-sm font-medium text-slate-700">Fecha mantenimiento (MM/AAAA)</label>
            <input id="fechaMantenimiento" name="fechaMantenimiento" placeholder="08/2026" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="vencMantenimiento" className="block text-sm font-medium text-slate-700">Venc. mantenimiento (MM/AAAA)</label>
            <input id="vencMantenimiento" name="vencMantenimiento" placeholder="08/2027" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="fechaFabricacion" className="block text-sm font-medium text-slate-700">Fecha fabricación (MM/AAAA o AAAA)</label>
            <input id="fechaFabricacion" name="fechaFabricacion" placeholder="12/2008 o 2008" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="vencVidaUtil" className="block text-sm font-medium text-slate-700">Venc. vida útil (MM/AAAA o AAAA)</label>
            <input id="vencVidaUtil" name="vencVidaUtil" placeholder="12/2028 o 2028" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="vencPh" className="block text-sm font-medium text-slate-700">Venc. PH (MM/AAAA)</label>
            <input id="vencPh" name="vencPh" placeholder="08/2028" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
        </div>

        <button type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-500 sm:w-auto">
          Guardar extintor manual
        </button>
      </form>
    </main>
  );
}
