"use client";

import { useState } from "react";
import { parseOcrTexto } from "@/lib/ocr";
import { crearExtintorOcr } from "./actions";

type EdificioOption = { id: number; nombre: string; direccion: string };

export default function OcrForm({
  edificios,
  edificioPreseleccionado,
}: {
  edificios: EdificioOption[];
  edificioPreseleccionado?: number | null;
}) {
  const [procesando, setProcesando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [form, setForm] = useState({
    agente: "",
    capacidad: "",
    recargadora: "",
    nroTarjeta: "",
    nroExtintor: "",
    nroSerie: "",
    fechaMantenimiento: "",
    vencMantenimiento: "",
    fechaFabricacion: "",
    vencVidaUtil: "",
    vencPh: "",
    fabricante: "",
    uso: "",
  });

  function setCampo(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function procesar(file: File) {
    setProcesando(true);
    setProgreso(0);
    setError(null);
    try {
      const Tesseract = await import("tesseract.js");
      const resultado = await Tesseract.recognize(file, "spa", {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") setProgreso(Math.round((m.progress ?? 0) * 100));
        },
      });
      const crudo = resultado?.data?.text ?? "";
      setTexto(crudo);
      const s = parseOcrTexto(crudo);
      setForm((f) => ({
        ...f,
        agente: s.agente ?? f.agente,
        capacidad: s.capacidad ?? f.capacidad,
        recargadora: s.recargadora ?? f.recargadora,
        nroTarjeta: s.nroTarjeta ?? f.nroTarjeta,
        nroExtintor: s.nroExtintor ?? f.nroExtintor,
        nroSerie: s.nroSerie ?? f.nroSerie,
        fechaMantenimiento: s.fechas[0] ?? f.fechaMantenimiento,
        vencMantenimiento: s.fechas[1] ?? f.vencMantenimiento,
        vencPh: s.fechas[2] ?? f.vencPh,
      }));
    } catch {
      setError("No se pudo procesar la imagen. Probá con mejor luz y foco.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <label className="block text-sm font-medium text-slate-700">
          Foto de la etiqueta de la recargadora / tarjeta AGC
        </label>
        <input
          type="file"
          accept="image/*"
          disabled={procesando}
          className="mt-2 text-sm"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void procesar(f);
          }}
        />
        {procesando && (
          <p className="mt-2 text-sm text-slate-600">Procesando OCR… {progreso}% (todo local, gratis)</p>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {texto && (
          <div className="mt-3">
            <p className="text-sm font-medium text-slate-700">Texto detectado (conciliá antes de guardar):</p>
            <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
              {texto}
            </pre>
          </div>
        )}
      </div>

      <form action={crearExtintorOcr} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <input type="hidden" name="textoOcr" value={texto} />
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
          <Input name="agente" titulo="Agente extintor *" valor={form.agente} onChange={(v) => setCampo("agente", v)} requerido />
          <Input name="capacidad" titulo="Capacidad *" valor={form.capacidad} onChange={(v) => setCampo("capacidad", v)} requerido />
          <Input name="nroTarjeta" titulo="Nro. tarjeta AGC" valor={form.nroTarjeta} onChange={(v) => setCampo("nroTarjeta", v)} />
          <Input name="nroExtintor" titulo="Nro. extintor" valor={form.nroExtintor} onChange={(v) => setCampo("nroExtintor", v)} />
          <Input name="nroSerie" titulo="Nro. serie" valor={form.nroSerie} onChange={(v) => setCampo("nroSerie", v)} />
          <Input name="fabricante" titulo="Fabricante" valor={form.fabricante} onChange={(v) => setCampo("fabricante", v)} />
          <Input name="recargadora" titulo="Recargadora (sugerida por OCR)" valor={form.recargadora} onChange={(v) => setCampo("recargadora", v)} />
          <Input name="uso" titulo="Uso" valor={form.uso} onChange={(v) => setCampo("uso", v)} />
          <Input name="fechaMantenimiento" titulo="Fecha mantenimiento (MM/AAAA)" valor={form.fechaMantenimiento} onChange={(v) => setCampo("fechaMantenimiento", v)} />
          <Input name="vencMantenimiento" titulo="Venc. mantenimiento (MM/AAAA)" valor={form.vencMantenimiento} onChange={(v) => setCampo("vencMantenimiento", v)} />
          <Input name="fechaFabricacion" titulo="Fecha fabricación" valor={form.fechaFabricacion} onChange={(v) => setCampo("fechaFabricacion", v)} />
          <Input name="vencVidaUtil" titulo="Venc. vida útil" valor={form.vencVidaUtil} onChange={(v) => setCampo("vencVidaUtil", v)} />
          <Input name="vencPh" titulo="Venc. PH" valor={form.vencPh} onChange={(v) => setCampo("vencPh", v)} />
        </div>
        <p className="text-xs text-slate-500">Se guarda con origen OCR y estado no verificado hasta tu conciliación.</p>
        <button type="submit" className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-white hover:bg-violet-500 sm:w-auto">
          Guardar extintor desde OCR
        </button>
      </form>
    </div>
  );
}

function Input({
  name,
  titulo,
  valor,
  onChange,
  requerido,
}: {
  name: string;
  titulo: string;
  valor: string;
  onChange: (v: string) => void;
  requerido?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">{titulo}</label>
      <input
        id={name}
        name={name}
        value={valor}
        required={requerido}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
      />
    </div>
  );
}
