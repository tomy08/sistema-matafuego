CREATE TYPE "public"."estado_cilindro" AS ENUM('bueno', 'corrosion', 'golpes', 'danado');--> statement-breakpoint
CREATE TYPE "public"."estado_verificacion" AS ENUM('verificado', 'no_verificado', 'estimado', 'sin_datos');--> statement-breakpoint
CREATE TYPE "public"."manometro" AS ENUM('en_verde', 'fuera_de_rango', 'no_tiene');--> statement-breakpoint
CREATE TYPE "public"."origen_extintor" AS ENUM('qr', 'ocr', 'manual', 'marbete');--> statement-breakpoint
CREATE TABLE "edificios" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"direccion" text NOT NULL,
	"administrador_email" text NOT NULL,
	"umbral_vencido_dias" integer DEFAULT 30 NOT NULL,
	"umbral_proximo_60_dias" integer DEFAULT 60 NOT NULL,
	"umbral_proximo_90_dias" integer DEFAULT 90 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "extintores" (
	"id" serial PRIMARY KEY NOT NULL,
	"edificio_id" integer NOT NULL,
	"ubicacion_interna" text NOT NULL,
	"nro_extintor" text,
	"nro_tarjeta" text,
	"nro_serie" text,
	"agente" text NOT NULL,
	"capacidad" text NOT NULL,
	"fabricante" text,
	"recargadora" text,
	"uso" text,
	"fecha_mantenimiento" date,
	"venc_mantenimiento" date,
	"fecha_fabricacion" date,
	"venc_vida_util" date,
	"venc_ph" date,
	"fecha_mantenimiento_estimada" boolean DEFAULT false NOT NULL,
	"venc_mantenimiento_estimada" boolean DEFAULT false NOT NULL,
	"fecha_fabricacion_estimada" boolean DEFAULT false NOT NULL,
	"venc_vida_util_estimada" boolean DEFAULT false NOT NULL,
	"venc_ph_estimada" boolean DEFAULT false NOT NULL,
	"color_marbete" text,
	"url_qr" text,
	"estado_verificacion" "estado_verificacion" DEFAULT 'no_verificado' NOT NULL,
	"origen" "origen_extintor" DEFAULT 'manual' NOT NULL,
	"datos_agc_crudos" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspecciones_visuales" (
	"id" serial PRIMARY KEY NOT NULL,
	"extintor_id" integer NOT NULL,
	"fecha" date NOT NULL,
	"manometro" "manometro" NOT NULL,
	"precinto_intacto" boolean NOT NULL,
	"estado_cilindro" "estado_cilindro" NOT NULL,
	"observaciones" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "extintores" ADD CONSTRAINT "extintores_edificio_id_edificios_id_fk" FOREIGN KEY ("edificio_id") REFERENCES "public"."edificios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspecciones_visuales" ADD CONSTRAINT "inspecciones_visuales_extintor_id_extintores_id_fk" FOREIGN KEY ("extintor_id") REFERENCES "public"."extintores"("id") ON DELETE cascade ON UPDATE no action;