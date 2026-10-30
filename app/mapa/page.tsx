export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PLANO_PISO_1 } from "@/lib/planos";
import { edificios, extintores } from "@/lib/schema";
import { calcularEstadoVencimiento } from "@/lib/vencimientos";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MapaExtintores, type ExtintorEnMapa } from "./mapa-extintores";

export default async function MapaPage({
  searchParams,
}: {
  searchParams?: Promise<{ edificioId?: string }>;
}) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login");

  const { edificioId: edificioIdQuery } = (await searchParams) ?? {};
  const edificioId = Number(edificioIdQuery);
  if (!Number.isInteger(edificioId) || edificioId <= 0) notFound();

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

  const enMapa: ExtintorEnMapa[] = equipos.map((x) => {
    const estado = calcularEstadoVencimiento(
      { vencMantenimiento: x.vencMantenimiento, vencVidaUtil: x.vencVidaUtil, vencPh: x.vencPh },
      {
        umbralVencidoDias: edificio.umbralVencidoDias,
        umbralProximo60Dias: edificio.umbralProximo60Dias,
        umbralProximo90Dias: edificio.umbralProximo90Dias,
      },
    );
    return {
      id: x.id,
      ubicacionInterna: x.ubicacionInterna,
      nroExtintor: x.nroExtintor,
      agente: x.agente,
      capacidad: x.capacidad,
      fabricante: x.fabricante,
      nivel: estado.nivel,
      fechaCritica: estado.fechaCritica,
      diasRestantes: estado.diasRestantes,
      x: x.mapaX,
      y: x.mapaY,
    };
  });

  return (
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">
      <Link href={`/edificios/${edificio.id}`} className="text-sm text-blue-600 hover:underline">
        ← Volver a {edificio.nombre}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Mapa de extintores</h1>
      <p className="text-sm text-slate-600">{edificio.direccion}</p>
      <MapaExtintores plano={PLANO_PISO_1} extintores={enMapa} />
    </main>
  );
}
