# Sistema de Gestión de Matafuegos

Aplicación web para gestión de extintores en CABA con stack 100% en plan gratuito.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Auth.js (NextAuth) con Google
- Neon Postgres + Drizzle ORM + `@neondatabase/serverless`
- Deploy target: Vercel Hobby

## Estado actual (Etapa 1)

Implementado:

- Login con Google.
- Alta de edificios con umbrales de alerta configurables.
- Alta **manual** de extintores (estado `no_verificado`, origen `manual`).
- Esquema base en Postgres para:
  - `edificios`
  - `extintores`
  - `inspecciones_visuales`
- Migración SQL inicial con Drizzle.

Pendiente para próximas etapas:

- Escaneo de QR + integración AGC.
- Motor de vencimientos y alertas completas.
- Alta sin etiquetas + estimación por marbete.
- OCR + conciliación.

## Configuración local

1. Copiar variables de entorno:

```bash
cp .env.example .env.local
```

2. Completar `.env.local`:

- `DATABASE_URL`: cadena de conexión de Neon (pooler/serverless).
- `AUTH_SECRET`: secreto para Auth.js (`openssl rand -base64 32`).
- `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET`: credenciales OAuth de Google.

3. Instalar dependencias:

```bash
npm install
```

4. Generar/aplicar esquema con Drizzle:

```bash
npm run db:generate
npm run db:migrate
```

5. Levantar entorno local:

```bash
npm run dev
```

Abrir `http://localhost:3000`.

## Flujo de uso (Etapa 1)

1. Iniciar sesión con Google.
2. Crear edificio.
3. Cargar extintor manualmente desde la ficha.

## Neon (plan gratuito)

1. Crear proyecto en Neon.
2. Crear base Postgres.
3. Copiar `DATABASE_URL`.
4. Configurar la misma variable en Vercel y local.

## Vercel (Hobby)

1. Importar el repositorio en Vercel.
2. Configurar variables de entorno:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `AUTH_GOOGLE_ID`
   - `AUTH_GOOGLE_SECRET`
3. En Google OAuth, agregar callback:
   - `https://<tu-app>.vercel.app/api/auth/callback/google`
4. Deploy.

> Nota: la región `gru1` ya está fijada para el Route Handler de Auth.
