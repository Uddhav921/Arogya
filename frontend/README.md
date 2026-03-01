# Arogya Frontend

The frontend for **Arogya by VAKR**, a Next-Generation Preventive Health Intelligence Platform. 
Built using a highly-polished, monochrome semantic design system featuring buttery-smooth micro-interactions.

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org) 16 (App Router)
- **Styling**: Tailwind CSS v4, utilizing css semantic variables (`--background`, `--foreground`) for intuitive Light/Dark scaling.
- **Animation**: [Framer Motion](https://www.framer.com/motion/) for staggered list reveals, fluid transitions, and component mounts.
- **Icons**: [Lucide React](https://lucide.dev/)

## 📦 Getting Started

First, ensure the backend (`/backend`) is running on port 8000. Then run the frontend development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🎨 Design System

The application uses an immersive, strictly black-and-white (monochrome) theme to reduce visual noise and highlight critical medical vectors. All active states, buttons, and typography rely on a custom high-contrast CSS variable configuration located in `src/app/globals.css`.

- **Dark Mode First**: The UI is optimized for dark environments with deep blacks (`#000000`) and high-contrast texts.
- **Light Mode Transition**: Full semantic variable support enables automatic fallback to clean, clinical light backgrounds.
- **Brand Colors**: We explicitly avoid aggressive accent colors (like greens or blues) favoring a sleek `foreground` vs `muted` hierarchy.

## 🗂️ Core Pages Structure

- `/landing`: The public-facing entry point, showcasing architecture and deterministic features.
- `/auth`: Seamless registration and login flow.
- `/dashboard`: The personalized health hub tracking live vitals and displaying quick actions.
- `/chat`: Engaging conversational interface with Arogya AI, fully responsive with history management.
- `/assess`: A symptom triage engine flow wrapped in smooth Framer Motion transitions.
- `/records`: Document upload and analysis integration points.
- `/profile`: Rich longitudinal context builder.

---

<div align="center">
  <b>Developed by VAKR</b>
</div>
