"use client";

import type { Conector, Plano } from "@/lib/planos";
import { NIVEL_META, type NivelVencimiento } from "@/lib/vencimientos";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { guardarPosicionExtintor } from "./actions";

export type ExtintorEnMapa = {
  id: number;
  ubicacionInterna: string;
  nroExtintor: string | null;
  agente: string;
  capacidad: string;
  fabricante: string | null;
  nivel: NivelVencimiento;
  fechaCritica: string | null;
  diasRestantes: number | null;
  x: number | null;
  y: number | null;
};

type Posicion = { x: number; y: number };

type Arrastre = {
  id: number;
  desdeLista: boolean;
  inicioX: number;
  inicioY: number;
  movido: boolean;
  anterior: Posicion | null;
};

// Distancia mínima (px) para considerar que el usuario arrastra y no hace click.
const UMBRAL_ARRASTRE = 5;
// Al soltar a menos de esta distancia (px) de un conector libre, el extintor se engancha ahí.
const RADIO_ENGANCHE = 28;
const ANCHO_TOOLTIP = 256;

const COLOR_MARCADOR: Record<NivelVencimiento, string> = {
  vencido: "bg-red-600 text-white",
  critico: "bg-red-500 text-white",
  proximo_60: "bg-amber-500 text-slate-900",
  proximo_90: "bg-yellow-300 text-slate-900",
  vigente: "bg-emerald-600 text-white",
  sin_datos: "bg-slate-500 text-white",
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const mismaPosicion = (a: Posicion, b: Posicion) => Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5;

export function MapaExtintores({
  plano,
  extintores,
}: {
  plano: Plano;
  extintores: ExtintorEnMapa[];
}) {
  const ordenados = [...extintores].sort((a, b) => a.id - b.id);
  const numero = new Map(ordenados.map((x, i) => [x.id, i + 1]));

  const [posiciones, setPosiciones] = useState<Record<number, Posicion | null>>(() =>
    Object.fromEntries(
      extintores.map((x) => [x.id, x.x !== null && x.y !== null ? { x: x.x, y: x.y } : null]),
    ),
  );
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  // Colocación por clicks, en cualquier orden: extintor de la lista + conector del plano.
  const [aColocar, setAColocar] = useState<number | null>(null);
  const [conectorElegido, setConectorElegido] = useState<string | null>(null);
  const [conectorObjetivo, setConectorObjetivo] = useState<string | null>(null);
  const [arrastrandoId, setArrastrandoId] = useState<number | null>(null);
  const [fantasma, setFantasma] = useState<{ id: number; x: number; y: number } | null>(null);
  const [pendientes, setPendientes] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [anchoMapa, setAnchoMapa] = useState(0);

  const mapaRef = useRef<HTMLDivElement>(null);
  const arrastreRef = useRef<Arrastre | null>(null);
  const suprimirClickRef = useRef(false);

  useEffect(() => {
    const el = mapaRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entrada]) => setAnchoMapa(entrada!.contentRect.width));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setSeleccionado(null);
      setAColocar(null);
      setConectorElegido(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function posicionEnMapa(clientX: number, clientY: number): Posicion {
    const rect = mapaRef.current!.getBoundingClientRect();
    const redondear = (n: number) => Math.round(n * 100) / 100;
    return {
      x: redondear(clamp(((clientX - rect.left) / rect.width) * 100, 0, 100)),
      y: redondear(clamp(((clientY - rect.top) / rect.height) * 100, 0, 100)),
    };
  }

  function dentroDelMapa(clientX: number, clientY: number) {
    const rect = mapaRef.current!.getBoundingClientRect();
    return (
      clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
    );
  }

  function conectorOcupado(c: Conector, salvoId: number | null) {
    return Object.entries(posiciones).some(
      ([id, pos]) => pos && Number(id) !== salvoId && mismaPosicion(pos, c),
    );
  }

  function conectorCercano(clientX: number, clientY: number, salvoId: number): Conector | null {
    const rect = mapaRef.current!.getBoundingClientRect();
    let mejor: Conector | null = null;
    let mejorDist = RADIO_ENGANCHE;
    for (const c of plano.conectores) {
      if (conectorOcupado(c, salvoId)) continue;
      const dist = Math.hypot(
        rect.left + (c.x / 100) * rect.width - clientX,
        rect.top + (c.y / 100) * rect.height - clientY,
      );
      if (dist <= mejorDist) {
        mejor = c;
        mejorDist = dist;
      }
    }
    return mejor;
  }

  function posicionEnganchada(clientX: number, clientY: number, id: number): Posicion {
    const c = conectorCercano(clientX, clientY, id);
    return c ? { x: c.x, y: c.y } : posicionEnMapa(clientX, clientY);
  }

  async function colocar(id: number, pos: Posicion | null, anterior: Posicion | null) {
    setPosiciones((p) => ({ ...p, [id]: pos }));
    setError(null);
    setPendientes((n) => n + 1);
    try {
      await guardarPosicionExtintor(id, pos?.x ?? null, pos?.y ?? null);
    } catch {
      setPosiciones((p) => ({ ...p, [id]: anterior }));
      setError("No se pudo guardar la posición. Probá de nuevo.");
    } finally {
      setPendientes((n) => n - 1);
    }
  }

  function iniciarArrastre(e: PointerEvent<HTMLElement>, id: number, desdeLista: boolean) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    suprimirClickRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
    arrastreRef.current = {
      id,
      desdeLista,
      inicioX: e.clientX,
      inicioY: e.clientY,
      movido: false,
      anterior: posiciones[id] ?? null,
    };
  }

  function moverArrastre(e: PointerEvent<HTMLElement>) {
    const a = arrastreRef.current;
    if (!a) return;
    if (!a.movido) {
      if (Math.hypot(e.clientX - a.inicioX, e.clientY - a.inicioY) < UMBRAL_ARRASTRE) return;
      a.movido = true;
      setArrastrandoId(a.id);
      setSeleccionado(null);
      setAColocar(null);
      setConectorElegido(null);
    }
    setConectorObjetivo(
      dentroDelMapa(e.clientX, e.clientY) ? (conectorCercano(e.clientX, e.clientY, a.id)?.id ?? null) : null,
    );
    if (a.desdeLista) {
      setFantasma({ id: a.id, x: e.clientX, y: e.clientY });
    } else {
      const pos = posicionEnMapa(e.clientX, e.clientY);
      setPosiciones((p) => ({ ...p, [a.id]: pos }));
    }
  }

  function terminarArrastre(e: PointerEvent<HTMLElement>) {
    const a = arrastreRef.current;
    arrastreRef.current = null;
    if (!a?.movido) return;
    suprimirClickRef.current = true;
    setArrastrandoId(null);
    setFantasma(null);
    setConectorObjetivo(null);
    if (a.desdeLista && !dentroDelMapa(e.clientX, e.clientY)) return;
    void colocar(a.id, posicionEnganchada(e.clientX, e.clientY, a.id), a.anterior);
  }

  function cancelarArrastre() {
    const a = arrastreRef.current;
    arrastreRef.current = null;
    setArrastrandoId(null);
    setFantasma(null);
    setConectorObjetivo(null);
    if (a?.movido && !a.desdeLista) {
      setPosiciones((p) => ({ ...p, [a.id]: a.anterior }));
    }
  }

  function clickEnMarcador(id: number) {
    if (suprimirClickRef.current) {
      suprimirClickRef.current = false;
      return;
    }
    setSeleccionado((s) => (s === id ? null : id));
  }

  function clickEnLista(id: number) {
    if (suprimirClickRef.current) {
      suprimirClickRef.current = false;
      return;
    }
    const conector = plano.conectores.find((c) => c.id === conectorElegido);
    if (conector) {
      setConectorElegido(null);
      void colocar(id, { x: conector.x, y: conector.y }, null);
      setSeleccionado(id);
      return;
    }
    setSeleccionado(null);
    setAColocar((s) => (s === id ? null : id));
  }

  function clickEnConector(c: Conector) {
    if (aColocar !== null) {
      void colocar(aColocar, { x: c.x, y: c.y }, posiciones[aColocar] ?? null);
      setSeleccionado(aColocar);
      setAColocar(null);
      return;
    }
    setSeleccionado(null);
    setConectorElegido((s) => (s === c.id ? null : c.id));
  }

  const sinUbicar = ordenados.filter((x) => !posiciones[x.id]);
  const ubicados = ordenados.filter((x) => posiciones[x.id]);
  const extintorSeleccionado = ordenados.find((x) => x.id === seleccionado);
  const posSeleccionado = seleccionado !== null ? posiciones[seleccionado] : null;
  const conectoresLibres = plano.conectores.filter((c) => !conectorOcupado(c, arrastrandoId));
  const eligiendo = aColocar !== null || arrastrandoId !== null;

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <section className="rounded-xl border border-slate-200 bg-white p-2 sm:p-3">
        <div
          ref={mapaRef}
          className="relative select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget || e.target instanceof HTMLImageElement) {
              setSeleccionado(null);
              setConectorElegido(null);
            }
          }}
        >
          <Image
            src={plano.src}
            alt="Plano del edificio"
            width={plano.ancho}
            height={plano.alto}
            priority
            draggable={false}
            className="block h-auto w-full rounded-lg"
          />

          {conectoresLibres.map((c) => {
            const resaltado = conectorElegido === c.id || conectorObjetivo === c.id;
            return (
              <button
                key={c.id}
                type="button"
                aria-label={aColocar !== null ? "Colocar el extintor en este punto" : "Punto para extintor"}
                title={aColocar !== null ? "Colocar acá" : "Punto para extintor"}
                onClick={() => clickEnConector(c)}
                style={{ left: `${c.x}%`, top: `${c.y}%` }}
                className={`absolute z-[5] flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full ${
                  arrastrandoId !== null ? "pointer-events-none" : ""
                }`}
              >
                <span
                  className={`block rounded-full border-2 transition-all ${
                    resaltado
                      ? "h-7 w-7 border-slate-900 bg-slate-900/20"
                      : eligiendo
                        ? "h-6 w-6 animate-pulse border-sky-600 bg-sky-400/30"
                        : "h-5 w-5 border-dashed border-slate-700/70 bg-white/40 hover:h-6 hover:w-6 hover:bg-white/70"
                  }`}
                />
              </button>
            );
          })}

          {ubicados.map((x) => {
            const pos = posiciones[x.id]!;
            const activo = seleccionado === x.id;
            const arrastrando = arrastrandoId === x.id;
            return (
              <button
                key={x.id}
                type="button"
                aria-label={`Extintor ${numero.get(x.id)}: ${x.ubicacionInterna}`}
                title={x.ubicacionInterna}
                onPointerDown={(e) => iniciarArrastre(e, x.id, false)}
                onPointerMove={moverArrastre}
                onPointerUp={terminarArrastre}
                onPointerCancel={cancelarArrastre}
                onClick={() => clickEnMarcador(x.id)}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                className={`absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center rounded-full text-xs font-bold shadow-md ring-2 transition-transform before:absolute before:-inset-2 before:rounded-full before:content-[''] ${
                  COLOR_MARCADOR[x.nivel]
                } ${activo ? "z-20 scale-125 ring-slate-900" : "z-10 ring-white hover:scale-110"} ${
                  arrastrando ? "z-30 scale-125 cursor-grabbing" : "cursor-grab"
                }`}
              >
                {numero.get(x.id)}
              </button>
            );
          })}

          {extintorSeleccionado && posSeleccionado && arrastrandoId === null ? (
            <Tooltip
              extintor={extintorSeleccionado}
              numero={numero.get(extintorSeleccionado.id)!}
              pos={posSeleccionado}
              anchoMapa={anchoMapa}
              onCerrar={() => setSeleccionado(null)}
              onQuitar={() => {
                setSeleccionado(null);
                void colocar(extintorSeleccionado.id, null, posSeleccionado);
              }}
            />
          ) : null}
        </div>

        <div className="mt-2 flex min-h-5 flex-wrap items-center justify-between gap-2 px-1 text-xs">
          <Leyenda />
          {error ? (
            <span className="text-red-700">{error}</span>
          ) : pendientes > 0 ? (
            <span className="text-slate-500">Guardando…</span>
          ) : null}
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-3">
          <h2 className="text-sm font-semibold">Sin ubicar ({sinUbicar.length})</h2>
          {sinUbicar.length === 0 ? (
            <p className="mt-1 text-xs text-slate-500">Todos los extintores están en el mapa.</p>
          ) : (
            <>
              <p className="mt-1 text-xs text-slate-500">
                {conectorElegido
                  ? "Tocá el extintor que va en el punto marcado."
                  : aColocar !== null
                    ? "Ahora tocá un punto del plano para colocarlo."
                    : "Tocá uno y después un punto del plano, o arrastralo hasta el punto."}
              </p>
              <ul className="mt-2 space-y-1.5">
                {sinUbicar.map((x) => (
                  <li key={x.id}>
                    <button
                      type="button"
                      onPointerDown={(e) => iniciarArrastre(e, x.id, true)}
                      onPointerMove={moverArrastre}
                      onPointerUp={terminarArrastre}
                      onPointerCancel={cancelarArrastre}
                      onClick={() => clickEnLista(x.id)}
                      className={`flex w-full touch-none cursor-grab items-center gap-2 rounded-lg border p-2 text-left text-sm hover:bg-slate-50 ${
                        aColocar === x.id ? "border-sky-600 bg-sky-50" : "border-dashed border-slate-300"
                      } ${arrastrandoId === x.id ? "opacity-40" : ""}`}
                    >
                      <Punto nivel={x.nivel} numero={numero.get(x.id)!} />
                      <span className="min-w-0 truncate">{x.ubicacionInterna}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-3">
          <h2 className="text-sm font-semibold">En el mapa ({ubicados.length})</h2>
          {ubicados.length === 0 ? (
            <p className="mt-1 text-xs text-slate-500">Ninguno todavía.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {ubicados.map((x) => (
                <li key={x.id}>
                  <button
                    type="button"
                    onClick={() => setSeleccionado((s) => (s === x.id ? null : x.id))}
                    className={`flex w-full items-center gap-2 rounded-lg p-1.5 text-left text-sm hover:bg-slate-50 ${
                      seleccionado === x.id ? "bg-slate-100" : ""
                    }`}
                  >
                    <Punto nivel={x.nivel} numero={numero.get(x.id)!} />
                    <span className="min-w-0 truncate">{x.ubicacionInterna}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>

      {fantasma ? (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2"
          style={{ left: fantasma.x, top: fantasma.y }}
        >
          <Punto
            nivel={ordenados.find((x) => x.id === fantasma.id)!.nivel}
            numero={numero.get(fantasma.id)!}
            grande
          />
        </div>
      ) : null}
    </div>
  );
}

function Tooltip({
  extintor: x,
  numero,
  pos,
  anchoMapa,
  onCerrar,
  onQuitar,
}: {
  extintor: ExtintorEnMapa;
  numero: number;
  pos: Posicion;
  anchoMapa: number;
  onCerrar: () => void;
  onQuitar: () => void;
}) {
  const meta = NIVEL_META[x.nivel];
  const ancho = Math.min(ANCHO_TOOLTIP, Math.max(anchoMapa - 8, 0));
  // Centrado sobre el marcador, pero sin salirse de los bordes del plano.
  const centro = (pos.x / 100) * anchoMapa;
  const left = clamp(centro - ancho / 2, 4, Math.max(anchoMapa - ancho - 4, 4));
  const arriba = pos.y > 45;

  return (
    <div
      role="dialog"
      aria-label={`Detalle de ${x.ubicacionInterna}`}
      className="absolute z-40 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-xl"
      style={{
        left,
        width: ancho,
        top: `${pos.y}%`,
        transform: arriba ? "translateY(calc(-100% - 20px))" : "translateY(20px)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">Extintor #{numero}</p>
          <p className="truncate font-semibold text-slate-900">{x.ubicacionInterna}</p>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="-mr-1 -mt-1 rounded-md px-1.5 text-lg leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          ×
        </button>
      </div>
      <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${meta.clase}`}>
        {meta.titulo}
      </span>
      <dl className="mt-2 space-y-0.5 text-xs text-slate-700">
        <Dato titulo="Agente" valor={`${x.agente} ${x.capacidad}`} />
        <Dato titulo="Nro." valor={x.nroExtintor} />
        <Dato titulo="Fabricante" valor={x.fabricante} />
        <Dato
          titulo="Vence"
          valor={
            x.fechaCritica
              ? `${x.fechaCritica}${x.diasRestantes !== null ? ` (${x.diasRestantes}d)` : ""}`
              : "—"
          }
        />
      </dl>
      <div className="mt-3 flex items-center justify-between gap-2">
        <button type="button" onClick={onQuitar} className="text-xs text-slate-500 hover:text-red-700 hover:underline">
          Quitar del mapa
        </button>
        <Link
          href={`/extintores/${x.id}`}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
        >
          Ver ficha →
        </Link>
      </div>
    </div>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string | null }) {
  if (!valor) return null;
  return (
    <div className="flex gap-1">
      <dt className="font-medium">{titulo}:</dt>
      <dd className="min-w-0 truncate">{valor}</dd>
    </div>
  );
}

function Punto({ nivel, numero, grande }: { nivel: NivelVencimiento; numero: number; grande?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold shadow ring-2 ring-white ${
        COLOR_MARCADOR[nivel]
      } ${grande ? "h-8 w-8 text-sm" : "h-6 w-6 text-[11px]"}`}
    >
      {numero}
    </span>
  );
}

function Leyenda() {
  const niveles: NivelVencimiento[] = ["vencido", "critico", "proximo_60", "proximo_90", "vigente", "sin_datos"];
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-slate-600">
      {niveles.map((n) => (
        <li key={n} className="flex items-center gap-1">
          <span className={`h-2.5 w-2.5 rounded-full ${COLOR_MARCADOR[n].split(" ")[0]}`} />
          {NIVEL_META[n].titulo}
        </li>
      ))}
    </ul>
  );
}
