# Frostgrave Campaign Tracker — Deployment Guide

## Overview

This project has three layers:
1. **Google Sheet** — the database
2. **Apps Script Web App** — the backend API
3. **GitHub Pages** — the frontend forms and dashboard

Complete these steps in order.

---

## Step 1: Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet
2. Name it: `Frostgrave Campaign Tracker`
3. Create the following tabs (click the + at the bottom to add tabs):
   - `WARBANDS`
   - `SOLDIERS`
   - `SPELLS`
   - `INJURIES`
   - `ITEMS`
   - `GAMES`
   - `TRANSACTIONS`
4. In each tab, paste the headers from `docs/SCHEMA.md` into Row 1
5. Copy the Sheet ID from the URL:
   - URL looks like: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
   - Copy the long string between `/d/` and `/edit`

---

## Step 2: Deploy the Apps Script

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any existing code in the editor
3. Paste the entire contents of `apps-script/Code.gs`
4. Replace `YOUR_GOOGLE_SHEET_ID_HERE` with the Sheet ID you copied in Step 1
5. Click **Save** (the floppy disk icon)
6. Click **Deploy → New deployment**
7. Settings:
   - Type: **Web app**
   - Description: `Frostgrave Tracker v1`
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Click **Deploy**
9. Authorize the app when prompted (you may need to click "Advanced" → "Go to ... (unsafe)" if Google warns you — this is expected for personal scripts)
10. Copy the **Web App URL** — it will look like:
    `https://script.google.com/macros/s/XXXXXXX/exec`

> **Important:** Every time you edit Code.gs, you must create a **New Deployment** (not update existing) to push changes. Keep track of the latest URL.

---

## Step 3: Create the GitHub Repository

1. Go to [github.com](https://github.com) and create a new repository
2. Suggested name: `frostgrave-tracker`
3. Set to **Public** (required for free GitHub Pages)
4. Initialize with a README

---

## Step 4: Add Your Files

Upload or commit these files to the repository root:

```
frostgrave-tracker/
├── index.html          ← rename forms/setup.html to this, OR create a landing page
├── setup.html          ← pre-campaign warband setup form
├── postgame.html       ← post-game report form
├── dashboard.html      ← campaign standings (build in Phase 5)
└── README.md
```

In both `setup.html` and `postgame.html`, replace:
```
YOUR_APPS_SCRIPT_WEB_APP_URL_HERE
```
with your actual Web App URL from Step 2.

---

## Step 5: Enable GitHub Pages

1. In your repository, go to **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** (or master), folder: **/ (root)**
4. Click **Save**
5. Your site will be live at:
   `https://YOUR_GITHUB_USERNAME.github.io/frostgrave-tracker/`

It may take 1–2 minutes to go live the first time.

---

## Step 6: Create the Drive Photo Folder

1. Go to [drive.google.com](https://drive.google.com)
2. Create a folder named `frostgrave_minis`
3. Right-click the folder → **Share** → **Anyone with the link can view**
4. Share this folder link with all players

**File naming convention:**
- `WB001_wizard.jpg` — wizard photo
- `WB001_apprentice.jpg` — apprentice photo
- `WB001_SOL001.jpg` — soldier photo

Players upload their photos, then paste the individual file's shareable link into the appropriate `photo_url` field when filling out the setup form.

---

## Step 7: Pre-Campaign Setup

Walk each player through `setup.html`:

1. Open `https://YOUR_GITHUB_USERNAME.github.io/frostgrave-tracker/setup.html`
2. Fill in wizard details, stats, apprentice name, spells, and starting soldiers
3. Submit — this writes directly to the Google Sheet
4. Verify the row appeared in the WARBANDS tab

Repeat for all players before the first game.

---

## Ongoing Use

**After each game:**
1. Open `postgame.html`
2. Select player count (2, 3, or 4)
3. Fill in game details together at the table
4. Submit

**To make a between-game purchase or update:**
Edit the Google Sheet directly for now (Phase 5 will add a form for this).

---

## Troubleshooting

**Form submits but nothing appears in the sheet:**
- Check that the Apps Script is deployed as a Web App with "Anyone" access
- Open the Apps Script editor → **Executions** to see error logs

**CORS errors in browser console:**
- This is normal for Apps Script — make sure you're using `fetch` without custom headers (the forms are already set up this way)

**Apps Script changes not taking effect:**
- Remember to create a **New Deployment** each time, not update existing

---

## What's Next (Phase 5)

- Campaign dashboard: warband standings, soldier rosters, game history
- Between-game actions form: purchases, recruitment, spell improvements
- Map module (separate planning phase — aesthetic-first)
