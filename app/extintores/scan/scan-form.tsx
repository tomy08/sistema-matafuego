"use client";

import { useRef, useState } from "react";
import type { AgcDatos } from "@/lib/agc";
import { crearExtintorDesdeAgc } from "./actions";

type EdificioOption = { id: number; nombre: string; direccion: string };

export default function ScanForm({
  edificios,
  edificioPreseleccionado,
}: {
  edificios: EdificioOption[];
  edificioPreseleccionado?: number | null;
}) {
  const [url, setUrl] = useState("");
  const [cargando, setCargando] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datos, setDatos] = useState<AgcDatos | null>(null);
  const [urlConfirmada, setUrlConfirmada] = useState("");
  const scannerRef = useRef<{ clear: () => unknown } | null>(null);
  const readerId = "qr-reader";

  async function consultar(urlAConsultar: string) {
    const u = urlAConsultar.trim();
    if (!u) {
      setError("Pegá o escaneá la URL del QR.");
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/agc/consultar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u }),
      });
      const json = (await res.json()) as { error?: string; datos?: AgcDatos; url?: string };
      if (!res.ok) throw new Error(json.error ?? "Error consultando AGC.");
      setDatos(json.datos ?? null);
      setUrlConfirmada(json.url ?? u);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error consultando AGC.");
      setDatos(null);
    } finally {
      setCargando(false);
    }
  }

  async function iniciarCamara() {
    setError(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(readerId);
      scannerRef.current = scanner;
      setEscaneando(true);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodificado: string) => {
          setUrl(decodificado);
          void detenerCamara();
          void consultar(decodificado);
        },
        () => {},
      );
    } catch {
      setError("No se pudo abrir la cámara. Pegá la URL manualmente.");
      setEscaneando(false);
    }
  }

  async function detenerCamara() {
    try {
      await scannerRef.current?.clear();
    } catch {
      // ignorar
    }
    scannerRef.current = null;
    setEscaneando(false);
  }

  async function leerDeArchivo(file: File) {
    setError(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(readerId);
      const decodificado = await scanner.scanFile(file, true);
      setUrl(decodificado);
      await scanner.clear();
      await consultar(decodificado);
    } catch {
      setError("No se encontró un QR legible en esa imagen.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <label htmlFor="urlQr" className="block text-sm font-medium text-slate-700">
          URL del QR de la tarjeta AGC
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="urlQr"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://dghpsh.agcontrol.gob.ar/matafuegos/datosEstampilla.jsp?..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void consultar(url)}
            disabled={cargando}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {cargando ? "Consultando…" : "Consultar AGC"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {!escaneando ? (
            <button
              type="button"
              onClick={() => void iniciarCamara()}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
            >
              Escanear con cámara
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void detenerCamara()}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
            >
              Detener cámara
            </button>
          )}
          <label className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100">
            Subir foto del QR
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void leerDeArchivo(f);
              }}
            />
          </label>
        </div>
        <div id={readerId} className="mt-3 w-full max-w-sm" />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {datos && (
        <form
          action={crearExtintorDesdeAgc}
          className="space-y-4 rounded-xl border border-emerald-200 bg-white p-4"
        >
          <input type="hidden" name="urlQr" value={urlConfirmada} />
          <p className="rounded-lg bg-emerald-50 p-2 text-sm text-emerald-800">
            Datos AGC verificados. Completá edificio y ubicación, corregí lo necesario y guardá.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edificioId" className="block text-sm font-medium text-slate-700">Edificio</label>
              <select id="edificioId" name="edificioId" required defaultValue={edificioPreseleccionado ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                <option value="">Seleccionar…</option>
                {edificios.map((e) => (
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
            <Campo name="nroTarjeta" titulo="Nro. tarjeta AGC" valor={datos.nroTarjeta} />
            <Campo name="nroExtintor" titulo="Nro. extintor" valor={datos.nroExtintor} />
            <Campo name="nroSerie" titulo="Nro. serie" valor={datos.nroSerie} />
            <Campo name="agente" titulo="Agente extintor" valor={datos.agente} requerido />
            <Campo name="capacidad" titulo="Capacidad" valor={datos.capacidad} requerido />
            <Campo name="fabricante" titulo="Fabricante" valor={datos.empresaFabricante} />
            <Campo name="recargadora" titulo="Recargadora" valor={datos.empresaRecargadora} />
            <Campo name="uso" titulo="Uso" valor={datos.uso} />
            <Campo name="fechaMantenimiento" titulo="Fecha mantenimiento (MM/AAAA)" valor={datos.fechaMantenimiento} />
            <Campo name="vencMantenimiento" titulo="Venc. mantenimiento (MM/AAAA)" valor={datos.vencMantenimiento} />
            <Campo name="fechaFabricacion" titulo="Fecha fabricación" valor={datos.fechaFabricacion} />
            <Campo name="vencVidaUtil" titulo="Venc. vida útil" valor={datos.vencVidaUtil} />
            <Campo name="vencPh" titulo="Venc. PH" valor={datos.vencPh} />
          </div>
          <button type="submit" className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-white hover:bg-emerald-500 sm:w-auto">
            Guardar extintor verificado
          </button>
        </form>
      )}
    </div>
  );
}

function Campo({
  name,
  titulo,
  valor,
  requerido,
}: {
  name: string;
  titulo: string;
  valor: string | null;
  requerido?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">{titulo}</label>
      <input
        id={name}
        name={name}
        defaultValue={valor ?? ""}
        required={requerido}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
      />
    </div>
  );
}
