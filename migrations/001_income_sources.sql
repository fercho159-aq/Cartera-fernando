-- Migración: Agregar tablas para fuentes de ingreso y comisiones
-- Ejecutar en tu base de datos PostgreSQL

-- 1. Crear Enums
DO $$ BEGIN
    CREATE TYPE payment_frequency AS ENUM ('weekly', 'biweekly', 'monthly', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE income_type AS ENUM ('fixed', 'variable');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE commission_status AS ENUM ('pending', 'confirmed', 'paid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Crear tabla de fuentes de ingreso
CREATE TABLE IF NOT EXISTS income_sources (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    type income_type NOT NULL DEFAULT 'fixed',
    
    base_amount DECIMAL(12, 2) NOT NULL,
    frequency payment_frequency NOT NULL DEFAULT 'monthly',
    pay_days TEXT NOT NULL DEFAULT '[15, 30]',
    
    min_expected DECIMAL(12, 2),
    max_expected DECIMAL(12, 2),
    average_last_3_months DECIMAL(12, 2),
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    include_in_forecast BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Crear tabla de registros de comisiones
CREATE TABLE IF NOT EXISTS commission_records (
    id SERIAL PRIMARY KEY,
    income_source_id INTEGER NOT NULL REFERENCES income_sources(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    amount DECIMAL(12, 2) NOT NULL,
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    
    status commission_status NOT NULL DEFAULT 'pending',
    confirmed_at TIMESTAMP,
    paid_at TIMESTAMP,
    
    notes TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_income_sources_user ON income_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_income_sources_account ON income_sources(account_id);
CREATE INDEX IF NOT EXISTS idx_income_sources_active ON income_sources(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_commission_records_source ON commission_records(income_source_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_period ON commission_records(period_year, period_month);

-- 5. Crear función y trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_income_sources_updated_at ON income_sources;
CREATE TRIGGER update_income_sources_updated_at
    BEFORE UPDATE ON income_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ¡Listo! Tablas creadas exitosamente 🎉
