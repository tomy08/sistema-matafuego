export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { edificios } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { actualizarEdificio } from "./actions";

export default async function EditarEdificioPage({
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

  return (
    <main className="mx-auto w-full max-w-2xl p-4 sm:p-6">
      <Link href={`/edificios/${edificio.id}`} className="text-sm text-blue-600 hover:underline">
        ← Volver al edificio
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Editar edificio</h1>

      <form
        action={actualizarEdificio}
        className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-6"
      >
        <input type="hidden" name="edificioId" value={edificio.id} />
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="nombre">
            Nombre
          </label>
          <input
            id="nombre"
            name="nombre"
            required
            defaultValue={edificio.nombre}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="direccion">
            Dirección
          </label>
          <input
            id="direccion"
            name="direccion"
            required
            defaultValue={edificio.direccion}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="umbralVencidoDias">
              Umbral crítico (días)
            </label>
            <input
              id="umbralVencidoDias"
              name="umbralVencidoDias"
              type="number"
              min={1}
              defaultValue={edificio.umbralVencidoDias}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="umbralProximo60Dias">
              Umbral próximo 1
            </label>
            <input
              id="umbralProximo60Dias"
              name="umbralProximo60Dias"
              type="number"
              min={1}
              defaultValue={edificio.umbralProximo60Dias}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="umbralProximo90Dias">
              Umbral próximo 2
            </label>
            <input
              id="umbralProximo90Dias"
              name="umbralProximo90Dias"
              type="number"
              min={1}
              defaultValue={edificio.umbralProximo90Dias}
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
