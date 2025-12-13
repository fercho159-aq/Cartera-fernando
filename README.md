# FinTrack - Finanzas Personales PWA

Una aplicación web progresiva (PWA) moderna, responsiva e instalable para el seguimiento de finanzas personales. Construida con Next.js 14, optimizada para uso móvil con un diseño "amigable para el pulgar".

![FinTrack Screenshot](public/icon-512x512.png)

## ✨ Características

### 📱 UX Mobile-First
- Experiencia similar a una app nativa
- Botón de Acción Flotante (FAB) para entrada rápida de transacciones
- Entradas grandes y táctiles
- Navegación inferior para fácil acceso con el pulgar

### 💰 Gestión de Transacciones
- Entrada rápida de gastos/ingresos
- Múltiples categorías con iconos emoji
- Transacciones recurrentes (Diario, Semanal, Mensual)
- Generación automática de transacciones recurrentes

### 📊 Dashboard y Visualizaciones
- Resumen de balance actual, ingresos y gastos
- Gráfica de dona para categorías de gastos
- Gráfica de barras para ingresos vs gastos (tendencia de 6 meses)
- Historial de transacciones agrupado por fecha

### 🔔 PWA y Notificaciones
- Instalable en pantalla de inicio Android/iOS
- Soporte offline con Service Worker
- Recordatorios diarios a las 8 PM
- Modo oscuro por defecto

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Estilos**: Tailwind CSS + Shadcn UI
- **Base de Datos**: PostgreSQL (Neon Tech)
- **ORM**: Drizzle ORM
- **Gráficas**: Recharts
- **Estado**: Zustand
- **Iconos**: Lucide React

## 🚀 Comenzar

### Prerrequisitos

- Node.js 18+ 
- npm/yarn/pnpm
- Base de datos PostgreSQL (o usar Neon Tech)

### Instalación

1. Clonar el repositorio:
```bash
git clone <url-repositorio>
cd finanzas
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env.local
```

Editar `.env.local` con tu cadena de conexión:
```env
DATABASE_URL=postgres://usuario:password@host/database?sslmode=require
```

4. Enviar esquema a la base de datos:
```bash
npm run db:push
```

5. Iniciar servidor de desarrollo:
```bash
npm run dev
```

6. Abrir [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
finanzas/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── transactions/route.ts  # API CRUD de transacciones
│   │   │   └── stats/route.ts         # API de estadísticas
│   │   ├── transactions/page.tsx      # Historial de transacciones
│   │   ├── stats/page.tsx             # Página de estadísticas
│   │   ├── settings/page.tsx          # Ajustes e instalación PWA
│   │   ├── layout.tsx                 # Layout principal
│   │   ├── page.tsx                   # Inicio/Dashboard
│   │   └── globals.css                # Estilos globales
│   ├── components/
│   │   ├── ui/                        # Componentes Shadcn UI
│   │   ├── bottom-nav.tsx             # Navegación inferior
│   │   ├── add-transaction-sheet.tsx  # Formulario de transacción
│   │   ├── dashboard.tsx              # Dashboard principal
│   │   ├── stat-card.tsx              # Tarjetas Balance/Ingresos/Gastos
│   │   ├── category-chart.tsx         # Gráfica de dona
│   │   ├── monthly-chart.tsx          # Gráfica de barras
│   │   ├── transaction-list.tsx       # Lista de transacciones
│   │   └── notification-provider.tsx  # Notificaciones push
│   └── lib/
│       ├── db/
│       │   ├── schema.ts              # Esquema de base de datos
│       │   └── index.ts               # Conexión a base de datos
│       ├── store.ts                   # Store de Zustand
│       └── utils.ts                   # Utilidades
├── public/
│   ├── manifest.json                  # Manifest PWA
│   ├── sw.js                          # Service worker
│   ├── icon-192x192.png               # Icono de app
│   └── icon-512x512.png               # Icono grande de app
├── drizzle.config.ts                  # Configuración Drizzle ORM
└── package.json
```

## 📊 Esquema de Base de Datos

```sql
-- Tabla de transacciones
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  amount DECIMAL(12, 2) NOT NULL,
  title VARCHAR(255) NOT NULL,
  type transaction_type NOT NULL,  -- 'income' | 'expense'
  category category NOT NULL,       -- 'food', 'transport', etc.
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_period recurrence_period DEFAULT 'none',  -- 'daily' | 'weekly' | 'monthly' | 'none'
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  next_occurrence TIMESTAMP,
  parent_id INTEGER
);
```

## 🎨 Categorías

| Categoría | Emoji | Tipo |
|-----------|-------|------|
| Comida | 🍔 | Gasto |
| Transporte | 🚗 | Gasto |
| Entretenimiento | 🎮 | Gasto |
| Salud | 🏥 | Gasto |
| Compras | 🛍️ | Gasto |
| Servicios | 💡 | Gasto |
| Salario | 💰 | Ingreso |
| Freelance | 💻 | Ingreso |
| Inversión | 📈 | Ingreso |
| Otro | 📦 | Ambos |

## 📱 Instalación PWA

### Android
1. Abre la app en Chrome
2. Toca "Agregar a pantalla de inicio" en el menú del navegador
3. O espera la solicitud de instalación

### iOS
1. Abre la app en Safari
2. Toca el botón Compartir
3. Selecciona "Agregar a pantalla de inicio"

## 🔔 Notificaciones

La app envía un recordatorio diario a las 8:00 PM preguntando "¿Ya registraste tus gastos de hoy?"

Para habilitar notificaciones:
1. Ve a Ajustes
2. Haz clic en "Activar Notificaciones"
3. Acepta el permiso del navegador

## 🧪 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Iniciar servidor de desarrollo |
| `npm run build` | Construir para producción |
| `npm run start` | Iniciar servidor de producción |
| `npm run lint` | Ejecutar ESLint |
| `npm run db:generate` | Generar migraciones de base de datos |
| `npm run db:push` | Enviar esquema a base de datos |
| `npm run db:studio` | Abrir Drizzle Studio |

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama de feature
3. Haz commit de tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Licencia MIT - ¡siéntete libre de usar este proyecto para tus propios propósitos!

---

Hecho con 💜 para una mejor salud financiera
