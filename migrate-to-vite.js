#!/usr/bin/env node

/**
 * Script de migrare automată: Create React App -> React 19 + Vite
 * by ChatGPT 😎
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function run(cmd) {
    console.log(`👉 ${cmd}`);
    execSync(cmd, { stdio: "inherit" });
}

function updatePackageJson() {
    const pkgPath = path.resolve("package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

    console.log("🧹 Curăț react-scripts și adaug vite scripts...");
    delete pkg.dependencies["react-scripts"];
    delete pkg.devDependencies?.["react-scripts"];

    pkg.scripts = {
        dev: "vite",
        build: "vite build",
        preview: "vite preview",
    };

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

function createViteConfig() {
    const viteConfig = `
        import { defineConfig } from 'vite';
        import react from '@vitejs/plugin-react';
        import path from 'path';
        
        export default defineConfig({
          plugins: [react()],
          resolve: {
            alias: {
              '@': path.resolve(__dirname, './src'),
            },
          },
        });
`;
    fs.writeFileSync("vite.config.js", viteConfig);
    console.log("✅ vite.config.js creat");
}

function createIndexHtml() {
    const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React 19 + Vite</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;
    fs.writeFileSync("index.html", html);
    console.log("✅ index.html creat");
}

function ensureMainFile() {
    const possibleFiles = ["src/index.jsx", "src/index.js"];
    const existing = possibleFiles.find((f) => fs.existsSync(f));

    if (!existing) {
        console.warn("⚠️ Nu am găsit src/index.js — creez unul de bază");
        fs.mkdirSync("src", { recursive: true });
        fs.writeFileSync(
            "src/main.jsx",
            `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`
        );
    } else {
        fs.renameSync(existing, "src/main.jsx");
        console.log(`✅ ${existing} -> src/main.jsx`);
    }
}

function migrate() {
    console.log("🚀 Migrare CRA → React 19 + Vite");

    updatePackageJson();

    console.log("📦 Instalez Vite + plugin React + React 19...");
    run("npm install vite @vitejs/plugin-react react@19 react-dom@19");

    createViteConfig();
    createIndexHtml();
    ensureMainFile();

    console.log("\n🎉 Migrarea e completă!");
    console.log("➡️ Rulează acum:  npm run dev");
}

migrate();
