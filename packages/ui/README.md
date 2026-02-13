# @nexora/ui

A reusable UI component library for Astro projects, designed for easy integration in monorepos and supporting Tailwind CSS v4.

## 📦 Install

To install this package locally in another project within your monorepo:

```json
  // Required: Add this to your dependencies
  "dependencies": {
    "@nexora/ui": "workspace:*"
  }
```

> 🛠️ For local development, you can use `pnpm link` for quick testing between packages.

Required: Import the UI package styles or ensure Tailwind scans the UI components

```css
@source 'node_modules/@nexora/ui';
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command     | Action                                                                                                    |
| :---------- | :-------------------------------------------------------------------------------------------------------- |
| `pnpm link` | Registers this package locally. Run `pnpm link @nexora/ui` in an Astro project to install your components |
