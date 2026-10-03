export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { crearEdificio } from "./actions";

export default async function NuevoEdificioPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-2xl p-4 sm:p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Nuevo edificio</h1>
      <p className="mt-1 text-sm text-slate-600">
        Definí la configuración base para alertas de vencimiento.
      </p>

      <form action={crearEdificio} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="nombre">
            Nombre
          </label>
          <input id="nombre" name="nombre" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="direccion">
            Dirección
          </label>
          <input id="direccion" name="direccion" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="umbralVencidoDias">
              Umbral vencido (días)
            </label>
            <input id="umbralVencidoDias" name="umbralVencidoDias" defaultValue={30} type="number" min={1} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="umbralProximo60Dias">
              Umbral próximo 1
            </label>
            <input id="umbralProximo60Dias" name="umbralProximo60Dias" defaultValue={60} type="number" min={1} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="umbralProximo90Dias">
              Umbral próximo 2
            </label>
            <input id="umbralProximo90Dias" name="umbralProximo90Dias" defaultValue={90} type="number" min={1} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
        </div>

        <button type="submit" className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-white hover:bg-slate-700 sm:w-auto">
          Guardar edificio
        </button>
      </form>
    </main>
  );
}
