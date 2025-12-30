
-- 1. Crear la tabla de categorías personalizadas
CREATE TABLE IF NOT EXISTS "custom_categories" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer REFERENCES "users"("id"),
    "name" varchar(50) NOT NULL,
    "label" varchar(50) NOT NULL,
    "icon" varchar(50) NOT NULL,
    "color" varchar(20) NOT NULL,
    "type" varchar(20) DEFAULT 'expense' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- 2. Modificar la columna category en transactions para aceptar texto libre
-- Nota: Esto convertirá el ENUM existente a VARCHAR.
ALTER TABLE "transactions" ALTER COLUMN "category" TYPE varchar(100);

-- Opcional: Si quieres borrar el tipo ENUM antiguo después de verificar que todo funciona
-- DROP TYPE IF EXISTS "category_enum";
