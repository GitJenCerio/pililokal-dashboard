# Design System Migration Prompt

**Copy everything below the line into your other project and paste as a prompt to the AI. Replace the current theme and styling with this design system.**

---

Apply this complete design system to replace my existing theme and styling. Implement everything described below.

---

## 1. DEPENDENCIES

Install (if not present):

```bash
npm install clsx tailwind-merge class-variance-authority lucide-react
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-select @radix-ui/react-slot
npm install -D tailwindcss-animate
```

---

## 2. UTILITY: `cn()` (lib/utils.ts)

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 3. GLOBALS.CSS – Theme Variables & Base Styles

Replace or merge into your globals.css:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 30 75% 98%;
    --foreground: 0 0% 20%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 20%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 20%;
    --primary: 24 40% 26%;
    --primary-foreground: 0 0% 100%;
    --secondary: 35 75% 95%;
    --secondary-foreground: 0 0% 20%;
    --muted: 35 50% 94%;
    --muted-foreground: 0 0% 60%;
    --accent: 35 75% 95%;
    --accent-foreground: 24 40% 26%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 100%;
    --border: 30 20% 90%;
    --input: 30 20% 90%;
    --ring: 24 40% 26%;
  }

  .dark {
    --background: 24 30% 12%;
    --foreground: 30 20% 95%;
    --card: 24 25% 15%;
    --card-foreground: 30 20% 95%;
    --popover: 24 25% 15%;
    --popover-foreground: 30 20% 95%;
    --primary: 27 68% 55%;
    --primary-foreground: 0 0% 100%;
    --secondary: 24 25% 20%;
    --secondary-foreground: 30 20% 95%;
    --muted: 24 20% 25%;
    --muted-foreground: 0 0% 60%;
    --accent: 24 25% 20%;
    --accent-foreground: 30 20% 95%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 100%;
    --border: 24 20% 25%;
    --input: 24 20% 25%;
    --ring: 27 68% 55%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## 4. TAILWIND CONFIG

Set `darkMode: ["class"]` and extend theme with:

```js
theme: {
  extend: {
    colors: {
      border: "hsl(var(--border))",
      input: "hsl(var(--input))",
      ring: "hsl(var(--ring))",
      background: "hsl(var(--background))",
      foreground: "hsl(var(--foreground))",
      primary: {
        DEFAULT: "hsl(var(--primary))",
        foreground: "hsl(var(--primary-foreground))",
      },
      secondary: {
        DEFAULT: "hsl(var(--secondary))",
        foreground: "hsl(var(--secondary-foreground))",
      },
      destructive: {
        DEFAULT: "hsl(var(--destructive))",
        foreground: "hsl(var(--destructive-foreground))",
      },
      muted: {
        DEFAULT: "hsl(var(--muted))",
        foreground: "hsl(var(--muted-foreground))",
      },
      accent: {
        DEFAULT: "hsl(var(--accent))",
        foreground: "hsl(var(--accent-foreground))",
      },
      popover: {
        DEFAULT: "hsl(var(--popover))",
        foreground: "hsl(var(--popover-foreground))",
      },
      card: {
        DEFAULT: "hsl(var(--card))",
        foreground: "hsl(var(--card-foreground))",
      },
    },
  },
},
plugins: [require("tailwindcss-animate")],
```

---

## 5. TYPOGRAPHY

Use **Inter** as the main font:

- **Next.js**: `import { Inter } from "next/font/google"; const inter = Inter({ subsets: ["latin"] });` then `className={inter.className}` on `<body>`
- **Vite/other**: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');` and `font-family: 'Inter', sans-serif` on body

---

## 6. CARD COMPONENT (components/ui/card.tsx)

Full component code:

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

---

## 7. BUTTON COMPONENT (components/ui/button.tsx)

Uses `@radix-ui/react-slot` and `class-variance-authority`. Variants: default, destructive, outline, secondary, ghost, link. Sizes: default, sm, lg, icon. Base: `inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50`

---

## 8. BADGE COMPONENT (components/ui/badge.tsx)

Variants: default (primary), secondary, destructive, outline, success (emerald), warning (amber). Base: `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold`

---

## 9. INPUT COMPONENT (components/ui/input.tsx)

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
```

---

## 10. LABEL COMPONENT (components/ui/label.tsx)

```tsx
"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
```

---

## 11. TEXTAREA COMPONENT (components/ui/textarea.tsx)

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
```

---

## 12. LAYOUT PATTERNS

**Page wrapper:** `space-y-6` between major sections

**Main content area:** `flex-1 overflow-auto p-4 md:p-6`

**Dashboard layout (sidebar + main):**
- Root: `flex min-h-screen flex-col md:flex-row`
- Sidebar: `w-full border-b bg-card md:w-56 md:border-b-0 md:border-r`
- Sidebar header: `flex h-14 items-center border-b px-4 md:h-16`
- Nav: `flex flex-row gap-2 p-4 md:flex-col md:gap-1`
- Nav links: `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent`
- Main header: `flex h-14 items-center justify-between border-b bg-card px-4 md:h-16`

---

## 13. CARD USAGE PATTERNS

**KPI / stat cards:**
```
Card: border-0 shadow-sm transition-shadow hover:shadow-md
CardHeader: flex flex-row items-center justify-between pb-2
CardDescription: label text
CardTitle: text-3xl (the number)
Optional highlight: border-l-4 border-l-emerald-500
```

**Content cards (charts, lists):**
```
Card: overflow-hidden border-0 shadow-sm
CardHeader: pb-2
CardTitle + CardDescription
CardContent: space-y-4 or space-y-3
```

**Form section cards:**
```
Card: mb-6
CardContent: grid gap-4 sm:grid-cols-2 (or sm:grid-cols-3)
```

---

## 14. GRID PATTERNS

- KPI row: `grid gap-4 sm:grid-cols-2 lg:grid-cols-4` or `lg:grid-cols-6`
- Two-column layout: `grid gap-6 lg:grid-cols-2`
- Form fields: `grid gap-4 sm:grid-cols-2`

---

## 15. SELECT, DROPDOWN, DIALOG

If you need Select, DropdownMenu, or Dialog, use shadcn/ui versions with `border-input`, `bg-popover`, `text-popover-foreground`, `focus:bg-accent`, etc., so they match the theme.

---

**Implement this design system fully. Replace existing theme, globals.css, Tailwind config, and add or update the listed UI components. Adjust file paths (e.g. @/lib/utils, @/components/ui) to match my project structure.**
