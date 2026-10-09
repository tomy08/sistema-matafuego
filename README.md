# Sistema de Gestión de Matafuegos

Aplicación web para gestión de extintores en CABA con stack 100% en plan gratuito.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Auth.js (NextAuth) con Google
- Neon Postgres + Drizzle ORM + `@neondatabase/serverless`
- Deploy target: Vercel Hobby

## Estado actual (Etapa 2)

Implementado:

- Login con Google.
- Alta de edificios con umbrales de alerta configurables.
- Alta **manual** de extintores (estado `no_verificado`, origen `manual`).
- Alta por **QR + integración AGC** (`/extintores/scan`: cámara, foto o URL; guarda `verificado`/`qr` con `datos_agc_crudos`).
- Alta por **OCR + conciliación** (`/extintores/ocr`: Tesseract.js local en `spa`, guarda `no_verificado`/`ocr`).
- Alta **por marbete** sin etiquetas (`/extintores/marbete`: estimación conservadora enero/año+1, `estimado`/`marbete`).
- Motor de vencimientos + dashboard visual con semáforo (vencido/crítico/próximo/vigente/sin datos) según umbrales por edificio.
- Fichas de edificio (`/edificios/[id]`) y extintor (`/extintores/[id]`).
- Inspecciones visuales (`/inspecciones/nuevo`).
- Esquema base en Postgres para:
  - `edificios`
  - `extintores`
  - `inspecciones_visuales`
- Migración SQL inicial con Drizzle.

Pendiente / a mejorar:

- Alertas por email (hoy solo dashboard visual) + cron.
- Tabla oficial color→año de marbete (hoy se pide el año manualmente).

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
