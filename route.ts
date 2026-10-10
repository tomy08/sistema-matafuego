import { auth } from "@/auth";
import { extraerDatosExtintor } from "@/lib/grok";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ~4 MB de base64: el cliente reduce la foto antes de mandarla.
const MAX_LARGO_IMAGEN = 4_000_000;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "No autenticado." }, { status: 401 });
  }
  let body: { imagen?: string };
  try {
    body = (await req.json()) as { imagen?: string };
  } catch {
    return Response.json({ error: "Body inválido." }, { status: 400 });
  }
  const imagen = body.imagen ?? "";
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(imagen)) {
    return Response.json({ error: "Falta la imagen (JPG/PNG/WebP)." }, { status: 400 });
  }
  if (imagen.length > MAX_LARGO_IMAGEN) {
    return Response.json({ error: "La imagen es demasiado grande." }, { status: 413 });
  }
  try {
    const datos = await extraerDatosExtintor(imagen);
    return Response.json(datos);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Error consultando Grok." },
      { status: 502 },
    );
  }
}
