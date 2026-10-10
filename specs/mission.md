# mission.md — Download Organizer Pro
## Product Mission & Definition of Done

---

## What We Are Building

**Product Name:** Download Organizer Pro
**Type:** Chrome Browser Extension (Manifest V3)
**Tagline:** "Every download, in its place. Automatically."

---

## The Problem

Chrome saves every download — images, PDFs, videos, ZIPs — into one flat Downloads folder.
Users waste time manually sorting files every week.
Power users download hundreds of files. The problem compounds daily.

---

## The Solution

A Chrome Extension that intercepts every download the instant Chrome starts it,
detects the file type via MIME type and file extension,
and automatically routes it into the correct subfolder inside Downloads.

Zero clicks. Zero friction. It just works in the background.

---

## Who It's For (ICP)

- Students downloading lecture slides, videos, and assignments daily
- Designers collecting reference images, fonts, and assets constantly
- Professionals managing PDFs, spreadsheets, and reports
- Anyone whose Downloads folder has become a dumping ground

---

## Core Value Proposition

The user installs it once and never thinks about it again.
Every file lands exactly where it belongs, forever.

---

## What Makes It Different

- Works automatically on every download — no manual action required
- Respects the user's existing Downloads location
- Customisable folder names (Pro)
- Date-based subfolders for power users (Pro)
- One-time purchase option — no forced subscription

---

## Definition of Done

The project is complete when ALL of the following are true:

- [ ] Extension loads in Chrome with zero errors in chrome://extensions
- [ ] Downloading a JPG automatically goes to Images/ subfolder
- [ ] Downloading a PDF automatically goes to Documents/ subfolder
- [ ] Downloading an MP4 automatically goes to Videos/ subfolder
- [ ] Downloading an MP3 on Free plan saves to default location (not sorted)
- [ ] Downloading an MP3 on Pro plan automatically goes to Music/ subfolder
- [ ] License key input → validates → Pro features unlock without extension restart
- [ ] Stats screen shows accurate per-category counts for Pro users
- [ ] Custom folder names persist after popup is closed and reopened
- [ ] Toggle to OFF disables all sorting immediately
- [ ] Date subfolder creates correct year/month path (Pro only)
- [ ] Vercel API returns { valid: true } for a real active Lemon Squeezy license
- [ ] Vercel API returns { valid: false } for an invalid or expired key
- [ ] Extension ZIP passes Chrome Web Store validator with no errors
- [ ] Privacy Policy is live at a public URL
- [ ] Both Lemon Squeezy checkout URLs are live and accepting payments
