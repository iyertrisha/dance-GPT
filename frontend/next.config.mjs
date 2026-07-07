import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Repo has multiple package-lock.json files (root + api + frontend). Next/Turbopack
  // otherwise picks the repo root and resolves `tailwindcss` from there (no node_modules).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
