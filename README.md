# 🎾 Liga de Tenis 2026

Sistema web para gestionar liga de tenis con 4 categorías, ~80 jugadores totales, sistema de todos contra todos, carga de resultados y tabla de posiciones.

## 🚀 Stack Tecnológico

- **Frontend:** Next.js 14 (App Router) + React + TypeScript
- **Backend:** Next.js API Routes + Server Actions
- **Base de Datos:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (solo para admin)
- **Styling:** Tailwind CSS

## 📦 Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.local.example .env.local
```

Luego editar `.env.local` con tus credenciales de Supabase.

3. Iniciar servidor de desarrollo:
```bash
npm run dev
```

4. Abrir [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
ligatenis/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # Componentes React
│   ├── lib/              # Utilidades y helpers
│   └── types/            # Tipos TypeScript
├── supabase/
│   └── migrations/       # Migraciones de BD
└── package.json
```

## 🔧 Comandos Disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Construye para producción
- `npm run start` - Inicia servidor de producción
- `npm run lint` - Ejecuta linter

## 📝 Estado del Proyecto

🚧 En desarrollo - Fase 1: Setup
