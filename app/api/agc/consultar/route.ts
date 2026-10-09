import { auth } from "@/auth";
import { consultarAgc } from "@/lib/agc";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "No autenticado." }, { status: 401 });
  }
  let body: { url?: string };
  try {
    body = (await req.json()) as { url?: string };
  } catch {
    return Response.json({ error: "Body inválido." }, { status: 400 });
  }
  if (!body.url) {
    return Response.json({ error: "Falta la URL del QR." }, { status: 400 });
  }
  try {
    const resultado = await consultarAgc(body.url);
    return Response.json(resultado);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Error consultando AGC." },
      { status: 422 },
    );
  }
}
