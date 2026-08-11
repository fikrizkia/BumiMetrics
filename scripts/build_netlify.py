#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
BumiMetrics - Netlify Production Build & Package Script
Mengemas seluruh aset statis (HTML, CSS, JS, trained JSON data) ke dalam
folder 'netlify_deploy/' siap deploy ke Netlify (Drag & Drop / Git).
=============================================================================
"""

import os
import shutil

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEPLOY_DIR = os.path.join(BASE_DIR, "netlify_deploy")

def build():
    print("Memulai proses build Netlify untuk BumiMetrics...")

    # 1. Bersihkan direktori lama jika ada
    if os.path.exists(DEPLOY_DIR):
        shutil.rmtree(DEPLOY_DIR)
    
    os.makedirs(DEPLOY_DIR, exist_ok=True)
    os.makedirs(os.path.join(DEPLOY_DIR, "css"), exist_ok=True)
    os.makedirs(os.path.join(DEPLOY_DIR, "js"), exist_ok=True)
    os.makedirs(os.path.join(DEPLOY_DIR, "data"), exist_ok=True)

    # 2. Salin index.html
    shutil.copy2(os.path.join(BASE_DIR, "index.html"), os.path.join(DEPLOY_DIR, "index.html"))
    print("  [OK] index.html disalin")

    # 3. Salin folder CSS
    css_dir = os.path.join(BASE_DIR, "css")
    for f in os.listdir(css_dir):
        if f.endswith(".css"):
            shutil.copy2(os.path.join(css_dir, f), os.path.join(DEPLOY_DIR, "css", f))
    print("  [OK] File CSS (style.css, components.css, responsive.css) disalin")

    # 4. Salin folder JS
    js_dir = os.path.join(BASE_DIR, "js")
    for f in os.listdir(js_dir):
        if f.endswith(".js"):
            shutil.copy2(os.path.join(js_dir, f), os.path.join(DEPLOY_DIR, "js", f))
    print("  [OK] File JS (data-engine, local-ai-engine, charts, community, app) disalin")

    # 5. Salin Data JSON yang telah dilatih
    data_dir = os.path.join(BASE_DIR, "data")
    required_json = ["trained_var_climate_1996_2026.json", "disease_matrix.json", "model_metrics.json"]
    for f in required_json:
        src = os.path.join(data_dir, f)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(DEPLOY_DIR, "data", f))
            print(f"  [OK] Data JSON: {f} disalin ({os.path.getsize(src)} bytes)")
        else:
            print(f"  [WARN] File {f} tidak ditemukan di data/")

    # 6. Buat _redirects untuk Netlify SPA
    redirects_content = "/*    /index.html   200\n"
    with open(os.path.join(DEPLOY_DIR, "_redirects"), "w", encoding="utf-8") as f:
        f.write(redirects_content)
    with open(os.path.join(BASE_DIR, "_redirects"), "w", encoding="utf-8") as f:
        f.write(redirects_content)
    print("  [OK] File _redirects dibuat")

    # 7. Buat netlify.toml
    toml_content = """# BumiMetrics - Netlify Deployment Configuration

[build]
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/data/*.json"
  [headers.values]
    Content-Type = "application/json; charset=utf-8"
    Access-Control-Allow-Origin = "*"
    Cache-Control = "public, max-age=3600"

[[headers]]
  for = "/css/*"
  [headers.values]
    Cache-Control = "public, max-age=86400"

[[headers]]
  for = "/js/*"
  [headers.values]
    Cache-Control = "public, max-age=86400"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
"""
    with open(os.path.join(DEPLOY_DIR, "netlify.toml"), "w", encoding="utf-8") as f:
        f.write(toml_content)
    with open(os.path.join(BASE_DIR, "netlify.toml"), "w", encoding="utf-8") as f:
        f.write(toml_content)
    print("  [OK] File netlify.toml dibuat")

    print("\nBuild Selesai! Folder 'netlify_deploy/' siap di-upload ke Netlify!")

if __name__ == "__main__":
    build()
