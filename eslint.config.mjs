import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable this rule since we intentionally use <a> tags for full page reloads
      "@next/next/no-html-link-for-pages": "off",
      // Downgrade to warning for dependency array issues
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;
