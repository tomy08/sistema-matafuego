import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const estadoVerificacionEnum = pgEnum("estado_verificacion", [
  "verificado",
  "no_verificado",
  "estimado",
  "sin_datos",
]);

export const origenExtintorEnum = pgEnum("origen_extintor", [
  "qr",
  "ocr",
  "manual",
  "marbete",
]);

export const manometroEnum = pgEnum("manometro", [
  "en_verde",
  "fuera_de_rango",
  "no_tiene",
]);

export const estadoCilindroEnum = pgEnum("estado_cilindro", [
  "bueno",
  "corrosion",
  "golpes",
  "danado",
]);

export const edificios = pgTable("edificios", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  direccion: text("direccion").notNull(),
  administradorEmail: text("administrador_email").notNull(),
  umbralVencidoDias: integer("umbral_vencido_dias").notNull().default(30),
  umbralProximo60Dias: integer("umbral_proximo_60_dias").notNull().default(60),
  umbralProximo90Dias: integer("umbral_proximo_90_dias").notNull().default(90),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const extintores = pgTable("extintores", {
  id: serial("id").primaryKey(),
  edificioId: integer("edificio_id")
    .notNull()
    .references(() => edificios.id, { onDelete: "cascade" }),
  ubicacionInterna: text("ubicacion_interna").notNull(),
  nroExtintor: text("nro_extintor"),
  nroTarjeta: text("nro_tarjeta"),
  nroSerie: text("nro_serie"),
  agente: text("agente").notNull(),
  capacidad: text("capacidad").notNull(),
  fabricante: text("fabricante"),
  recargadora: text("recargadora"),
  uso: text("uso"),
  fechaMantenimiento: date("fecha_mantenimiento"),
  vencMantenimiento: date("venc_mantenimiento"),
  fechaFabricacion: date("fecha_fabricacion"),
  vencVidaUtil: date("venc_vida_util"),
  vencPh: date("venc_ph"),
  fechaMantenimientoEstimada: boolean("fecha_mantenimiento_estimada")
    .notNull()
    .default(false),
  vencMantenimientoEstimada: boolean("venc_mantenimiento_estimada")
    .notNull()
    .default(false),
  fechaFabricacionEstimada: boolean("fecha_fabricacion_estimada")
    .notNull()
    .default(false),
  vencVidaUtilEstimada: boolean("venc_vida_util_estimada")
    .notNull()
    .default(false),
  vencPhEstimada: boolean("venc_ph_estimada").notNull().default(false),
  colorMarbete: text("color_marbete"),
  urlQr: text("url_qr"),
  estadoVerificacion: estadoVerificacionEnum("estado_verificacion")
    .notNull()
    .default("no_verificado"),
  origen: origenExtintorEnum("origen").notNull().default("manual"),
  datosAgcCrudos: jsonb("datos_agc_crudos"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const inspeccionesVisuales = pgTable("inspecciones_visuales", {
  id: serial("id").primaryKey(),
  extintorId: integer("extintor_id")
    .notNull()
    .references(() => extintores.id, { onDelete: "cascade" }),
  fecha: date("fecha").notNull(),
  manometro: manometroEnum("manometro").notNull(),
  precintoIntacto: boolean("precinto_intacto").notNull(),
  estadoCilindro: estadoCilindroEnum("estado_cilindro").notNull(),
  observaciones: text("observaciones"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
