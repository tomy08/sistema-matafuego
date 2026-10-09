"use client";

import { useRef, useState } from "react";
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
  const [estadoOcr, setEstadoOcr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
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

  function contarDetectados() {
    return Object.values(form).filter((v) => v.trim().length > 0).length;
  }

  async function procesar(file: File) {
    setProcesando(true);
    setProgreso(0);
    setEstadoOcr(null);
    setError(null);
    try {
      const Tesseract = await import("tesseract.js");
      // Sin workerPath/corePath/langPath custom: usa CDN oficial jsdelivr
      // (el /api/tesseract local no existe en Vercel y tira NetworkError).
      const resultado = await Tesseract.recognize(file, "spa", {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") {
            setEstadoOcr(null);
            setProgreso(Math.round((m.progress ?? 0) * 100));
          } else {
            setEstadoOcr(
              m.status === "loading tesseract core"
                ? "Cargando motor OCR…"
                : m.status === "loading language traineddata"
                  ? "Cargando diccionario español…"
                  : m.status === "initializing tesseract" || m.status === "initializing api"
                    ? "Inicializando OCR…"
                    : null,
            );
          }
        },
      });
      const crudo = resultado?.data?.text ?? "";
      if (!crudo.trim()) {
        setError("No se detectó texto. Acercá la etiqueta, con buena luz y sin reflejos.");
        return;
      }
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
    } catch (e) {
      const detalle = e instanceof Error ? e.message : String(e);
      setError(`No se pudo procesar la imagen: ${detalle}`);
    } finally {
      setProcesando(false);
      setEstadoOcr(null);
    }
  }

  function onArchivo(file: File | undefined) {
    if (!file) return;
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFotoPreview(URL.createObjectURL(file));
    void procesar(file);
  }

  async function iniciarCamara() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setCamaraActiva(true);
      // esperar al video montado
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      setError("No se pudo abrir la cámara. Subí una foto en su lugar.");
    }
  }

  function detenerCamara() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamaraActiva(false);
  }

  async function capturarDeCamara() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const blob: Blob | null = await new Promise((res) =>
      canvas.toBlob((b) => res(b), "image/jpeg", 0.92),
    );
    if (!blob) {
      setError("No se pudo capturar la foto.");
      return;
    }
    const file = new File([blob], "captura-ocr.jpg", { type: "image/jpeg" });
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFotoPreview(URL.createObjectURL(file));
    detenerCamara();
    await procesar(file);
  }

  const listo = texto.trim().length > 0 && !procesando;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-medium text-slate-900">
          1. Sacá foto a la etiqueta — detectamos todo solo
        </p>
        <p className="mt-1 text-xs text-slate-500">
          No escribas nada: agente, capacidad, fechas, tarjeta y recargadora se completan desde la foto.
          Solo vas a elegir edificio y ubicación (la foto no sabe dónde está instalado).
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <label className="cursor-pointer rounded-lg bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-500">
            {fotoPreview ? "Cambiar foto" : "Sacar / subir foto"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              disabled={procesando}
              onChange={(e) => {
                onArchivo(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {!camaraActiva ? (
            <button
              type="button"
              onClick={() => void iniciarCamara()}
              disabled={procesando}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-50"
            >
              Usar cámara en vivo
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void capturarDeCamara()}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
              >
                Capturar
              </button>
              <button
                type="button"
                onClick={detenerCamara}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
              >
                Cerrar cámara
              </button>
            </>
          )}
        </div>

        {camaraActiva && (
          <div className="mt-3">
            <video ref={videoRef} playsInline muted className="w-full max-w-md rounded-lg bg-black" />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}
        {!camaraActiva && <canvas ref={canvasRef} className="hidden" />}

        {fotoPreview && (
          <div className="mt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fotoPreview}
              alt="Etiqueta a procesar"
              className="max-h-64 rounded-lg border border-slate-200 object-contain"
            />
          </div>
        )}

        {procesando && (
          <p className="mt-2 text-sm text-slate-600">
            {estadoOcr
              ? `${estadoOcr} (todo local, gratis)`
              : `Leyendo etiqueta… ${progreso}% (todo local, gratis)`}
          </p>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {listo && (
          <p className="mt-2 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-800">
            Detectamos {contarDetectados()} campos desde la foto. Revisá abajo y guardá.
          </p>
        )}
        {texto && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-slate-500">Ver texto detectado</summary>
            <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
              {texto}
            </pre>
          </details>
        )}
      </div>

      <form action={crearExtintorOcr} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <input type="hidden" name="textoOcr" value={texto} />
        <p className="text-sm font-medium text-slate-900">
          2. Solo elegí dónde está — el resto ya viene detectado
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="edificioId" className="block text-sm font-medium text-slate-700">Edificio *</label>
            <select id="edificioId" name="edificioId" required defaultValue={edificioPreseleccionado ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="">Seleccionar…</option>
              {edificios.map((e) => (
                <option key={e.id} value={e.id}>{e.nombre} · {e.direccion}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ubicacionInterna" className="block text-sm font-medium text-slate-700">Ubicación interna *</label>
            <input id="ubicacionInterna" name="ubicacionInterna" required placeholder="Piso 3 - Palier" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
        </div>

        {!listo ? (
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
            Sacá primero la foto para autocompletar agente, capacidad, fechas y números.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 text-xs">
              {form.agente && <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-900">Agente: {form.agente}</span>}
              {form.capacidad && <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-900">Cap: {form.capacidad}</span>}
              {form.fechaMantenimiento && <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-900">Mant: {form.fechaMantenimiento}</span>}
              {form.vencMantenimiento && <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-900">Vence: {form.vencMantenimiento}</span>}
              {form.nroTarjeta && <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-900">Tarjeta: {form.nroTarjeta}</span>}
              {form.recargadora && <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-900">{form.recargadora}</span>}
            </div>
            <details>
              <summary className="cursor-pointer text-sm text-blue-700 hover:underline">
                Corregir datos detectados (solo si hay un error)
              </summary>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Input name="agente" titulo="Agente extintor *" valor={form.agente} onChange={(v) => setCampo("agente", v)} requerido />
                <Input name="capacidad" titulo="Capacidad *" valor={form.capacidad} onChange={(v) => setCampo("capacidad", v)} requerido />
                <Input name="nroTarjeta" titulo="Nro. tarjeta AGC" valor={form.nroTarjeta} onChange={(v) => setCampo("nroTarjeta", v)} />
                <Input name="nroExtintor" titulo="Nro. extintor" valor={form.nroExtintor} onChange={(v) => setCampo("nroExtintor", v)} />
                <Input name="nroSerie" titulo="Nro. serie" valor={form.nroSerie} onChange={(v) => setCampo("nroSerie", v)} />
                <Input name="fabricante" titulo="Fabricante" valor={form.fabricante} onChange={(v) => setCampo("fabricante", v)} />
                <Input name="recargadora" titulo="Recargadora" valor={form.recargadora} onChange={(v) => setCampo("recargadora", v)} />
                <Input name="uso" titulo="Uso" valor={form.uso} onChange={(v) => setCampo("uso", v)} />
                <Input name="fechaMantenimiento" titulo="Fecha mantenimiento (MM/AAAA)" valor={form.fechaMantenimiento} onChange={(v) => setCampo("fechaMantenimiento", v)} />
                <Input name="vencMantenimiento" titulo="Venc. mantenimiento (MM/AAAA)" valor={form.vencMantenimiento} onChange={(v) => setCampo("vencMantenimiento", v)} />
                <Input name="fechaFabricacion" titulo="Fecha fabricación" valor={form.fechaFabricacion} onChange={(v) => setCampo("fechaFabricacion", v)} />
                <Input name="vencVidaUtil" titulo="Venc. vida útil" valor={form.vencVidaUtil} onChange={(v) => setCampo("vencVidaUtil", v)} />
                <Input name="vencPh" titulo="Venc. PH" valor={form.vencPh} onChange={(v) => setCampo("vencPh", v)} />
              </div>
            </details>
            {/* inputs ocultos para enviar aunque el details esté cerrado: los Input ya envían */}
          </>
        )}

        <p className="text-xs text-slate-500">Se guarda con origen OCR y estado no verificado.</p>
        <button
          type="submit"
          disabled={!listo}
          className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-white hover:bg-violet-500 disabled:opacity-40 sm:w-auto"
        >
          {listo ? "Guardar extintor desde foto" : "Sacá foto para guardar"}
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
