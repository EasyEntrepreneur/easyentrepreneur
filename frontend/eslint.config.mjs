import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 👉 Ajoute la propriété ignores ici
  {
    ignores: [
      "node_modules",
      ".next",
      "out",
      "public",
      "coverage",
      "backend"
    ]
  },
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
    // Tu peux ajouter ici d'autres extends si besoin
  ),
  // 👉 Ajoute une section custom rules à la fin
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "warn",
      "no-unused-vars": "warn",
      "@next/next/no-html-link-for-pages": "warn"
    }
  }
];

export default eslintConfig;
