import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      "node_modules",
      ".next",
      "out",
      "public",
      "coverage",
      "backend",
      "src/generated"
    ]
  },
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
  ),
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