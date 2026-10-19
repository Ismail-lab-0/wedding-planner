# Wedding Planner

A simple wedding planner web app: budget, guests and RSVPs, vendors, checklist and day-of timeline in one place. Works offline; your data stays in your browser.

**Try the free demo:** https://ismail-lab-0.github.io/wedding-planner/ (feature-limited preview)

## Features

- Guided five-minute setup from wedding date, budget and guest count
- Budget by category with over-budget warnings
- Guest list with RSVP, meal and table counts
- Vendor list with deposits and due dates
- Month-by-month checklist
- Day-of timeline with print layout
- Backup and restore as a file

## Setup

This is a static, self-contained HTML app — no build step required to run it.
Open `index.html` directly, or serve the repo's `docs/` folder (this is what
GitHub Pages does automatically for this repo).

## Limitations

- Data is stored in the browser only — export a backup periodically.
- The demo limits the guest list to 10; that limit is a client-side nudge, not access control.

## Deployment

Published via GitHub Pages from the `docs/` folder on `main`. The demo build (if any) and the full build are generated from the same source by `tools/app_bundle.js` — see that script for the `--demo` flag.