export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { COLORES_MARBETE } from "@/lib/marbete";
import { edificios } from "@/lib/schema";
import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { crearExtintorMarbete } from "./actions";

export default async function MarbetePage({
  searchParams,
}: {
  searchParams?: Promise<{ edificioId?: string }>;
}) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login");

  const { edificioId: edificioIdQuery } = (await searchParams) ?? {};
  const preseleccion = Number(edificioIdQuery);
  const edificioPreseleccionado =
    Number.isInteger(preseleccion) && preseleccion > 0 ? preseleccion : null;

  const lista = await db
    .select({ id: edificios.id, nombre: edificios.nombre, direccion: edificios.direccion })
    .from(edificios)
    .where(eq(edificios.administradorEmail, email))
    .orderBy(asc(edificios.nombre));

  if (!lista.length) {
    return (
      <main className="mx-auto w-full max-w-2xl p-4 sm:p-6">
        <h1 className="text-2xl font-semibold">Alta por marbete</h1>
        <p className="mt-2 text-sm text-slate-600">Primero creá un edificio.</p>
        <Link href="/edificios/nuevo" className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white">
          Crear edificio
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <Link href="/" className="text-sm text-blue-600 hover:underline">← Volver</Link>
      <h1 className="mt-2 text-2xl font-semibold">Alta sin etiquetas (por marbete)</h1>
      <p className="mt-1 text-sm text-slate-600">
        Cuando no hay tarjeta ni etiqueta legible y <strong>no sabés el año</strong>.
        Alcanza con el color del aro del cuello + ubicación: deducimos el año por tabla IRAM
        (el color se repite cada 10 años, tomamos el más reciente).
      </p>
      <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
        <p className="font-medium">Tabla oficial (terminación del año):</p>
        <p className="mt-1">1 Negro · 2 Amarillo · 3 Celeste · 4 Verde oscuro · 5 Azul · 6 Violeta/Lila · 7 Blanco · 8 Verde claro · 9 Naranja · 0 Marrón claro</p>
        <p className="mt-1 text-slate-500">Ej: violeta → 2026, azul → 2025, verde oscuro → 2024. Si el equipo hace años no se recarga (ej violeta de 2016), indicá el año exacto abajo.</p>
      </div>
      <form action={crearExtintorMarbete} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="edificioId" className="block text-sm font-medium text-slate-700">Edificio</label>
            <select id="edificioId" name="edificioId" required defaultValue={edificioPreseleccionado ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="">Seleccionar…</option>
              {lista.map((e) => (
                <option key={e.id} value={e.id}>{e.nombre} · {e.direccion}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ubicacionInterna" className="block text-sm font-medium text-slate-700">Ubicación interna</label>
            <input id="ubicacionInterna" name="ubicacionInterna" required placeholder="Piso 3 - Palier" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="colorMarbete" className="block text-sm font-medium text-slate-700">Color del marbete</label>
            <select id="colorMarbete" name="colorMarbete" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="">Seleccionar…</option>
              {COLORES_MARBETE.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="anioMarbete" className="block text-sm font-medium text-slate-700">Año exacto (opcional)</label>
            <input id="anioMarbete" name="anioMarbete" type="number" min={1980} max={2100} placeholder="Vacío = deducimos por color" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            <p className="mt-1 text-xs text-slate-500">Vacío si no lo sabés. Si lo ponés, debe coincidir con el color (ej violeta → ...6).</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="agente" className="block text-sm font-medium text-slate-700">Agente (si se ve)</label>
            <input id="agente" name="agente" placeholder="ABC / CO2" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="capacidad" className="block text-sm font-medium text-slate-700">Capacidad (si se ve)</label>
            <input id="capacidad" name="capacidad" placeholder="5 Kg" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="nroExtintor" className="block text-sm font-medium text-slate-700">Nro. extintor (si se ve)</label>
            <input id="nroExtintor" name="nroExtintor" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
        </div>
        <button type="submit" className="w-full rounded-lg bg-amber-600 px-4 py-2.5 text-white hover:bg-amber-500 sm:w-auto">
          Guardar por marbete
        </button>
      </form>
    </main>
  );
}
