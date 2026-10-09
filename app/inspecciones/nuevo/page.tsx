export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { edificios, extintores } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { crearInspeccion } from "./actions";

export default async function NuevaInspeccionPage({
  searchParams,
}: {
  searchParams: Promise<{ extintorId?: string }>;
}) {
  const { extintorId } = await searchParams;
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login");

  const { inArray } = await import("drizzle-orm");
  const misEdificios = await db
    .select({ id: edificios.id })
    .from(edificios)
    .where(eq(edificios.administradorEmail, email));
  const equipos =
    misEdificios.length === 0
      ? []
      : await db
          .select({
            id: extintores.id,
            ubicacion: extintores.ubicacionInterna,
            agente: extintores.agente,
          })
          .from(extintores)
          .where(
            inArray(
              extintores.edificioId,
              misEdificios.map((e) => e.id),
            ),
          );

  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto w-full max-w-2xl p-4 sm:p-6">
      <Link href="/" className="text-sm text-blue-600 hover:underline">← Volver</Link>
      <h1 className="mt-2 text-2xl font-semibold">Nueva inspección visual</h1>
      <form action={crearInspeccion} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <label htmlFor="extintorId" className="block text-sm font-medium text-slate-700">Extintor</label>
          <select id="extintorId" name="extintorId" required defaultValue={extintorId ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Seleccionar…</option>
            {equipos.map((e) => (
              <option key={e.id} value={e.id}>#{e.id} · {e.ubicacion} · {e.agente}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="fecha" className="block text-sm font-medium text-slate-700">Fecha</label>
          <input id="fecha" name="fecha" type="date" required defaultValue={hoy} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="manometro" className="block text-sm font-medium text-slate-700">Manómetro</label>
            <select id="manometro" name="manometro" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="en_verde">En verde</option>
              <option value="fuera_de_rango">Fuera de rango</option>
              <option value="no_tiene">No tiene</option>
            </select>
          </div>
          <div>
            <label htmlFor="estadoCilindro" className="block text-sm font-medium text-slate-700">Cilindro</label>
            <select id="estadoCilindro" name="estadoCilindro" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="bueno">Bueno</option>
              <option value="corrosion">Corrosión</option>
              <option value="golpes">Golpes</option>
              <option value="danado">Dañado</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="precintoIntacto" defaultChecked className="h-4 w-4" />
          Precinto intacto
        </label>
        <div>
          <label htmlFor="observaciones" className="block text-sm font-medium text-slate-700">Observaciones</label>
          <textarea id="observaciones" name="observaciones" rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        <button type="submit" className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-white sm:w-auto">
          Guardar inspección
        </button>
      </form>
    </main>
  );
}
