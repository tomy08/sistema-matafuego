export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { edificios } from "@/lib/schema";
import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import ScanForm from "./scan-form";

export default async function ScanPage({
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
        <h1 className="text-2xl font-semibold">Alta por QR (AGC)</h1>
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
      <h1 className="mt-2 text-2xl font-semibold">Alta por QR (AGC)</h1>
      <p className="mt-1 text-sm text-slate-600">
        Escaneá el QR de la tarjeta, subí una foto o pegá la URL. Se consulta la ficha oficial y se guarda como verificado.
      </p>
      <div className="mt-6">
        <ScanForm edificios={lista} edificioPreseleccionado={edificioPreseleccionado} />
      </div>
    </main>
  );
}
