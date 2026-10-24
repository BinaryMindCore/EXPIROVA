<div align="center">

  <img
    width="100%"
    src="https://capsule-render.vercel.app/api?type=waving&height=200&color=0d5f94&text=Expirova&fontColor=ffffff&fontSize=60&fontAlignY=38&animation=fadeIn"
    alt="Expirova Banner"
  />

  <p align="center">
    <a href="https://react.dev"><img src="https://skillicons.dev/icons?i=react" height="48" alt="React" /></a>
    <a href="https://vitejs.dev"><img src="https://skillicons.dev/icons?i=vite" height="48" alt="Vite" /></a>
    <a href="https://tailwindcss.com"><img src="https://skillicons.dev/icons?i=tailwind" height="48" alt="Tailwind CSS" /></a>
    <a href="https://nodejs.org"><img src="https://skillicons.dev/icons?i=nodejs" height="48" alt="Node.js" /></a>
    <a href="https://expressjs.com"><img src="https://skillicons.dev/icons?i=express" height="48" alt="Express" /></a>
    <a href="https://supabase.com"><img src="https://skillicons.dev/icons?i=supabase" height="48" alt="Supabase" /></a>
    <a href="https://git-scm.com"><img src="https://skillicons.dev/icons?i=git" height="48" alt="Git" /></a>
    <a href="https://vercel.com"><img src="https://skillicons.dev/icons?i=vercel" height="48" alt="Vercel" /></a>
  </p>

  <h3>AI-Powered Smart Expiry & Inventory Management System</h3>
  <p><em>Scan • Track • Monitor • Prevent Product Waste Before It Happens</em></p>

  <p align="center">
    <a href="#-features-at-a-glance">Features</a> •
    <a href="#-system-architecture">Architecture</a> •
    <a href="#-user-flow">User Flow</a> •
    <a href="#-application-walkthrough">Walkthrough</a> •
    <a href="#-installation--setup">Setup</a>
  </p>

</div>

---

## 📌 Overview

**Expirova** is an automated inventory intelligence engine engineered to prevent perishable and regulated product waste across pharmacies, healthcare facilities, pantry storage, and households[cite: 13, 16]. 

By unifying **multi-database barcode lookup**, **Multimodal Vision OCR**, and **FEFO (First-Expired, First-Out) shelf-life prioritization**[cite: 13, 15, 16], Expirova turns the tedious chore of manual stock logging into an instant, automated operation.

---

## ✨ Features at a Glance

<table>
<tr>
<td align="center" width="25%">

### 📸 Universal Vision Scan
Captures multi-category packaging, reads 1D/2D barcodes, and extracts expiry stamps via OCR and Multimodal AI[cite: 13, 15, 18].

</td>
<td align="center" width="25%">

### 📦 FEFO Inventory
Prioritizes and organizes stock using First-Expired, First-Out principles with automated shelf-life categorization[cite: 13, 16].

</td>
<td align="center" width="25%">

### 🚨 Tri-Tier Smart Alerts
Proactive flags categorized by **Urgent**, **Expiring Soon**, and **Stable** to prevent waste before deadlines hit[cite: 16, 17].

</td>
<td align="center" width="25%">

### 📊 Real-Time Analytics
Live dashboard tracking total managed items, urgency flags, and real-time inventory health status[cite: 14, 16].

</td>
</tr>
</table>

---

## ⚡ User Flow

```mermaid
flowchart LR
    A[📷 Scan Product / Upload Packaging] --> B{Standard Barcode Found?}
    B -- Yes --> C[Query Open Food & Beauty Registries]
    B -- No / Damaged --> D[Multimodal Vision AI Engine]
    C -- Registry Miss --> D
    C -- Match Found --> E[Auto-Fill Product Details]
    D --> F[OCR Batch, Label & EXP Stamp Extraction]
    F --> E
    E --> G[💾 Sync to Supabase Database]
    G --> H[📦 FEFO Priority Queue]
    H --> I[🚨 Automated Multi-Cadence Expiry Alerts]
