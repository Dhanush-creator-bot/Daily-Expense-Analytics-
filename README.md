# Daily Expense Analytics Dashboard 📊

A sophisticated, full-stack personal finance tracking and spending analysis application. Built with **React 19**, **Vite**, **Express**, and **Tailwind CSS**, it features seamless visual transitions with **Framer Motion**, immersive high-contrast dark/light mode, and advanced financial coaching powered by **Gemini 3.5 Flash** (`@google/genai` SDK).

---

## 🌟 Key Features

*   **Continuous Transaction Logging**: Effortlessly create, update, delete, search, sort, and filter transaction logs (Income vs. Expenses). Support for automatic dataset seeding, database wiping (for testing empty states), and standard CSV data export.
*   **Rich Interactive Charting**: Uses `recharts` to render beautiful, responsive visual representations of financial data:
    *   *Balance Trend*: A smooth cubic-spline Area chart mapping your net worth trajectory.
    *   *Expense Distribution*: A precise Donut Pie chart showing category portions.
    *   *Income vs. Expense*: Side-by-side Bar charts outlining cash flow ratios.
*   **Gemini Financial Coach**: Harnesses the `gemini-3.5-flash` model using structured JSON schemas to analyze spending logs and output:
    *   An objective posture summary of your financial health.
    *   Actionable recommendation cards graded by priority levels (**High**, **Medium**, **Low**).
    *   An estimated monthly savings efficiency potential indicator.
*   **Aesthetic Materiality**: Styled with a highly polished design system using modern off-whites, ambient glassmorphic dark-mode backgrounds, refined letter-spacing, and tailored micro-animations.

---

## 📁 Technical Architecture & Code Structure

The project separates client-side interface components from server-side proxy routes to secure sensitive integration endpoints.

```text
├── server.ts                  # ESM Express backend & Gemini API proxy routing
├── metadata.json              # App metadata and major capability declarations
├── package.json               # Scripts, engines, and dependency configurations
├── index.html                 # Main application document entry point
├── src/
│   ├── main.tsx               # Client bootstrap entry point
│   ├── App.tsx                # Dashboard layout & main state manager
│   ├── index.css              # Tailwind global styling configuration
│   └── components/            # Modular React components
│       ├── BalanceCard.tsx    # Summary metrics (Net Balance, Income, Outgoings)
│       ├── AnalyticsCharts.tsx# Recharts visualizers and top category suggestions
│       ├── TransactionList.tsx# Grouped history, searching, filters, and operations
│       ├── TransactionModal.tsx# Form controls for logging transactions
│       ├── SpendingInsights.tsx# AI coach presentation & shimmer loading skeletons
│       ├── ThemeToggle.tsx    # Spring-based light/dark theme switch
│       └── CategoryIcon.tsx   # Icon map dictionary based on lucide-react
```

---

## 🛠️ Technology Stack

*   **Frontend**: React 19, TypeScript, Tailwind CSS, Framer Motion (`motion/react`), Lucide React, Canvas Confetti.
*   **Backend**: Express, TSX, dotenv.
*   **API Integrations**: Google Gen AI SDK (`@google/genai`).
*   **Build Tooling**: Vite, ESBuild (bundles TypeScript backend code into structured CommonJS outputs).

---

## 🚦 Getting Started

### 1. Environment Configuration

To unlock AI coach analytics, declare your API keys inside a `.env` file at the root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Dependency Installation

Populate the project packages:

```bash
npm install
```

### 3. Execution Commands

Use these scripts from `package.json` to coordinate development and production environments:

*   **Development**: Boots the Express server in development mode with active hot-reloading for client assets via Vite.
    ```bash
    npm run dev
    ```
*   **Build Compilation**: Bundles client assets into high-performance static files (`dist/`) and packages the Express backend into `dist/server.cjs` via `esbuild`.
    ```bash
    npm run build
    ```
*   **Production Launch**: Runs the fully compiled self-contained bundle.
    ```bash
    npm run start
    ```
*   **Type Checking**: Checks the codebase for TypeScript errors.
    ```bash
    npm run lint
    ```

---

## 📐 Design System & Usability Focus

*   **Responsive Desktop & Mobile Layouts**: Clean sticky sidebars for wide screens collapsing into fluid bottom navigation bars for tactile mobile device use.
*   **Interactive Delight**: Includes physical spring mechanics on modal triggers, hover-staggered lists, and celebratory confetti showers upon successful income logging.
*   **Graceful Degradation**: Built-in state-check blocks guard the AI coaching view, prompting users with informative instructions if environment configuration values are missing.

