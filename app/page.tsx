export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { logout } from "@/app/actions/auth-actions";
import { db } from "@/lib/db";
import { edificios, extintores } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    redirect("/login");
  }

  const [conteoEdificios, conteoExtintores, listadoEdificios] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)` })
      .from(edificios)
      .where(eq(edificios.administradorEmail, email)),
    db
      .select({ total: sql<number>`count(*)` })
      .from(extintores)
      .innerJoin(edificios, eq(extintores.edificioId, edificios.id))
      .where(eq(edificios.administradorEmail, email)),
    db
      .select({ id: edificios.id, nombre: edificios.nombre, direccion: edificios.direccion })
      .from(edificios)
      .where(eq(edificios.administradorEmail, email)),
  ]);

  return (
    <main className="mx-auto w-full max-w-4xl p-4 sm:p-6">
      <header className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Sistema de Gestión de Matafuegos
          </h1>
          <p className="text-sm text-slate-600">
            Sesión: {session.user?.name ?? session.user?.email}
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      <section className="mt-4 grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Edificios</p>
          <p className="text-3xl font-semibold text-slate-900">{conteoEdificios[0]?.total ?? 0}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Extintores cargados</p>
          <p className="text-3xl font-semibold text-slate-900">{conteoExtintores[0]?.total ?? 0}</p>
        </article>
      </section>

      <section className="mt-4 flex flex-wrap gap-3">
        <Link href="/edificios/nuevo" className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white hover:bg-slate-700">
          Nuevo edificio
        </Link>
        <Link href="/extintores/nuevo" className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm text-white hover:bg-blue-500">
          Alta manual de extintor
        </Link>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Mis edificios</h2>
        <ul className="mt-3 space-y-2">
          {listadoEdificios.length === 0 ? (
            <li className="text-sm text-slate-600">Todavía no registraste edificios.</li>
          ) : (
            listadoEdificios.map((edificio) => (
              <li key={edificio.id} className="rounded-lg border border-slate-100 p-3 text-sm text-slate-700">
                <p className="font-medium">{edificio.nombre}</p>
                <p>{edificio.direccion}</p>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
