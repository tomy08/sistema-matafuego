import { readFile } from "fs/promises";
import path from "path";

const CACHE = "public, max-age=31536000, immutable";

const CORES = new Set([
  "tesseract-core.wasm.js",
  "tesseract-core-lstm.wasm.js",
  "tesseract-core-simd.wasm.js",
  "tesseract-core-simd-lstm.wasm.js",
  "tesseract-core-relaxedsimd.wasm.js",
  "tesseract-core-relaxedsimd-lstm.wasm.js",
]);

async function servir(rutaRelativa: string, tipo: string): Promise<Response> {
  const ruta = path.join(process.cwd(), "node_modules", ...rutaRelativa.split("/"));
  try {
    const datos = await readFile(ruta);
    return new Response(new Uint8Array(datos), {
      headers: { "Content-Type": tipo, "Cache-Control": CACHE },
    });
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ archivo: string[] }> },
) {
  const { archivo } = await params;
  const partes = archivo ?? [];

  if (partes.length === 1 && partes[0] === "worker.min.js") {
    return servir("tesseract.js/dist/worker.min.js", "application/javascript; charset=utf-8");
  }
  if (partes.length === 2 && partes[0] === "core" && CORES.has(partes[1] ?? "")) {
    return servir(`tesseract.js-core/${partes[1]}`, "application/javascript; charset=utf-8");
  }
  if (partes.length === 2 && partes[0] === "lang" && partes[1] === "spa.traineddata.gz") {
    return servir(
      "@tesseract.js-data/spa/4.0.0_best_int/spa.traineddata.gz",
      "application/gzip",
    );
  }
  return new Response("No encontrado", { status: 404 });
}
