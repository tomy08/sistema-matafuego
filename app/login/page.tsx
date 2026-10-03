export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { loginWithGoogle } from "@/app/actions/auth-actions";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <section className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">
          Sistema de Gestión de Matafuegos
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Ingresá con tu cuenta de Google para administrar edificios y
          extintores.
        </p>
        <form action={loginWithGoogle} className="mt-6">
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            Ingresar con Google
          </button>
        </form>
      </section>
    </main>
  );
}
