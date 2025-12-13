# FinTrack - Personal Finance PWA

A modern, responsive, and installable Progressive Web App (PWA) for Personal Finance Tracking. Built with Next.js 14, optimized for mobile usage with a "thumb-friendly" design.

![FinTrack Screenshot](public/icon-512x512.png)

## ✨ Features

### 📱 Mobile-First UX
- Native app-like experience
- Floating Action Button (FAB) for quick transaction entry
- Large, touch-friendly inputs and targets
- Bottom navigation for easy thumb access

### 💰 Transaction Management
- Quick expense/income entry
- Multiple categories with emoji icons
- Recurring transactions (Daily, Weekly, Monthly)
- Automatic recurring transaction generation

### 📊 Dashboard & Visualizations
- Current balance, income, and expense summaries
- Donut chart for expense categories
- Bar chart for income vs expenses (6-month trend)
- Transaction history with date grouping

### 🔔 PWA & Notifications
- Installable on Android/iOS home screen
- Offline support with Service Worker
- Daily 8 PM reminder notifications
- Dark mode by default

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Shadcn UI
- **Database**: PostgreSQL (Neon Tech)
- **ORM**: Drizzle ORM
- **Charts**: Recharts
- **State Management**: Zustand
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- PostgreSQL database (or use Neon Tech)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd finanzas
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your database connection string:
```env
DATABASE_URL=postgres://user:password@host/database?sslmode=require
```

4. Push the database schema:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
finanzas/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── transactions/route.ts  # Transaction CRUD API
│   │   │   └── stats/route.ts         # Statistics API
│   │   ├── transactions/page.tsx      # Transaction history
│   │   ├── stats/page.tsx             # Statistics page
│   │   ├── settings/page.tsx          # Settings & PWA install
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Home/Dashboard
│   │   └── globals.css                # Global styles
│   ├── components/
│   │   ├── ui/                        # Shadcn UI components
│   │   ├── bottom-nav.tsx             # Bottom navigation
│   │   ├── add-transaction-sheet.tsx  # Transaction form
│   │   ├── dashboard.tsx              # Main dashboard
│   │   ├── stat-card.tsx              # Balance/Income/Expense cards
│   │   ├── category-chart.tsx         # Donut chart
│   │   ├── monthly-chart.tsx          # Bar chart
│   │   ├── transaction-list.tsx       # Transaction list
│   │   └── notification-provider.tsx  # Push notifications
│   └── lib/
│       ├── db/
│       │   ├── schema.ts              # Database schema
│       │   └── index.ts               # Database connection
│       ├── store.ts                   # Zustand store
│       └── utils.ts                   # Utilities
├── public/
│   ├── manifest.json                  # PWA manifest
│   ├── sw.js                          # Service worker
│   ├── icon-192x192.png               # App icon
│   └── icon-512x512.png               # Large app icon
├── drizzle.config.ts                  # Drizzle ORM config
└── package.json
```

## 📊 Database Schema

```sql
-- Transactions table
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

## 🎨 Categories

| Category | Emoji | Type |
|----------|-------|------|
| Food | 🍔 | Expense |
| Transport | 🚗 | Expense |
| Entertainment | 🎮 | Expense |
| Health | 🏥 | Expense |
| Shopping | 🛍️ | Expense |
| Utilities | 💡 | Expense |
| Salary | 💰 | Income |
| Freelance | 💻 | Income |
| Investment | 📈 | Income |
| Other | 📦 | Both |

## 📱 PWA Installation

### Android
1. Open the app in Chrome
2. Tap "Add to Home Screen" in the browser menu
3. Or wait for the install prompt

### iOS
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

## 🔔 Notifications

The app sends a daily reminder at 8:00 PM asking "Did you record your expenses today?"

To enable notifications:
1. Go to Settings
2. Click "Enable Notifications"
3. Accept the browser permission

## 🧪 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate database migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for your own purposes!

---

Made with 💜 for better financial health
