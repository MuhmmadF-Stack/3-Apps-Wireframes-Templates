<div align="center">

# Three Apps, Three Identities

**Interactive, high-fidelity mobile prototypes for food delivery, fitness and budgeting**

Designed and built by **Muhammad Mohtashim** · UI/UX Designer · AI-assisted design workflow

[**▶ Live demo**](https://muhmmadf-stack.github.io/3-Apps-Wireframes-Templates/Index.dc.html) · [Figma file](#) · [Case study](#case-study)

<!-- Add a hero image or GIF here: three phone screens side by side -->
<!-- ![Daily Dish, Stride and Pocket](docs/hero.png) -->

</div>

---

## At a glance

| | App | Category | What you can do in it |
|---|---|---|---|
| 🍜 | **Daily Dish** | Food delivery | Discover restaurants, customize dishes, apply promo codes, check out and track the order live |
| 🏃 | **Stride** | Fitness | Hit a weekly goal, find workouts, run a real interval timer, review progress |
| 💰 | **Pocket** | Budgeting | See what's left this month, search transactions, add and review expenses, edit budgets |

All three are **clickable end to end**. These aren't static mockups; every screen, flow and state actually works. No install, no backend: open a file in the browser and use it like a real app.

---

## Case study

### The challenge
I wanted to prove one thing: **a single designer can give three products in completely different categories their own personality**, while still following the same usability rules underneath.

So each app had to:
- Feel like its own brand (typeface, colour, tone), not three recolours of one template
- Cover a **complete user journey**, not just the happy-path home screen
- Handle the boring-but-important states: empty, error, validation and confirmation
- Be testable on a real phone, so stakeholders and test users can click through instead of imagining it

### My process

```
Research & references  →  User flows  →  Wireframes  →  Visual identity per app  →  Interactive prototype  →  Edge states & polish
```

1. **Mapped the core journeys first:** order → track (Daily Dish), plan → train → review (Stride), log → review → save (Pocket)
2. **Wireframed** each flow at 390 × 844 (iPhone frame) with 44 pt minimum touch targets
3. **Gave each app its own identity** (see table below)
4. **Built the prototypes** as working HTML so the interactions could be tested, not just described
5. **Designed the "unhappy paths":** wrong promo code, empty cart, no search results, over-budget categories, ending a workout early

### Visual identity: one designer, three personalities

| App | Mood | Typography | Accent |
|---|---|---|---|
| Daily Dish | Warm, appetizing, friendly | Bricolage Grotesque + Figtree | Tomato red-orange |
| Stride | Loud, energetic, sporty | Archivo (extra-wide, uppercase) | Electric lime |
| Pocket | Calm, editorial, trustworthy | Newsreader (serif) + IBM Plex Sans | Deep teal |

Every app also has a full **light and dark mode**, built on CSS variables (`--accent`, `--bg`, `--ink`) so the whole theme switches from one place.

### Key UX decisions

- **Daily Dish: one restaurant per cart.** Adding from a second restaurant shows a confirmation instead of silently clearing the cart, so the user never loses an order by accident.
- **Daily Dish: live price on customization.** Required vs. optional modifiers, selection limits and the total update as you choose, so there's no surprise at checkout.
- **Stride: a real timer, not a fake screen.** Work/rest phases, a progress ring, pause/resume, skip, and optional beeps. Ending early lets you *save the partial session or discard it*, because real workouts get interrupted.
- **Pocket: review before saving.** Before an expense is saved, you see what it does to that category's budget. Money apps should show consequences *before* commit, not after.
- **Pocket: data that adds up.** Totals, budgets and progress are calculated from the transactions, not hard-coded, so deleting an expense updates everything instantly.

---

## Features

<details>
<summary><b>🍜 Daily Dish: food delivery</b></summary>

- Restaurant discovery with live search across restaurants **and** dishes
- Cuisine filters, sorting (top rated, fastest, lowest fee), delivery-time and fee filters
- Favorites from any screen + dedicated Favorites tab
- Restaurant menu with section navigation and in-menu search
- Item customization: required/optional modifier groups, limits, special instructions, quantity, live price
- Cart & checkout: edit/remove lines, standard vs. priority delivery, editable address, payment method
- Promo codes with validation and error states:
  - `DISH10`: 10% off
  - `FREEDEL`: free delivery
  - `WELCOME5`: $5 off orders of $15+
- Live order tracking: Confirmed → Preparing → On the way → Delivered (cancel available before pickup)
- Order history with one-tap reorder
</details>

<details>
<summary><b>🏃 Stride: fitness tracking</b></summary>

- Daily dashboard: weekly goal progress, minutes, calories, 7-day activity chart, recommended workout
- Workout search by name or exercise; filters for type (Strength, Cardio, Mobility, Saved), duration and level
- Workout detail: warm-up / rounds / cool-down structure and full move list; save for later
- Active workout: interval timer, progress ring, segmented session bar, pause/resume, skip, audio cues
- End early: save partial session or discard
- Summary: minutes, calories, average heart rate, goal progress, effort rating
- Progress: weekly minutes chart + full workout history
- Profile: adjustable weekly goal, sound and appearance settings
</details>

<details>
<summary><b>💰 Pocket: personal budgeting</b></summary>

- Overview: remaining monthly budget, spending progress, income, top categories
- Transactions grouped by day, searchable by merchant, category or note; All / Expenses / Income views
- Transaction detail with delete confirmation; budgets recalculate instantly
- Add expense: validated amount and merchant, category picker, date, account, note, live budget impact preview
- Review step → saved confirmation with reference number and updated balances
- Budgets: 8 categories, over-budget and near-limit warnings, editable monthly limits
- Month switcher (September / October 2026 sample data)
</details>

---

## 🤖 How I used AI in this project

I use AI as part of my design workflow, the way a designer uses Figma plugins. It speeds up the work, but the decisions are mine.

| Stage | My role | AI's role |
|---|---|---|
| Flows & structure | Defined journeys, screens and edge cases | Helped stress-test flows for missing states |
| Visual identity | Chose mood, type pairings and colour direction | Generated variations to compare against |
| Prototype build | Specified behaviour and reviewed every screen | Assisted with writing and debugging the HTML/JS |
| Content | Directed tone per brand | Drafted realistic sample data (menus, workouts, transactions) |

**Why mention it?** Because that's how modern product teams actually work. The skill isn't avoiding AI; it's knowing what to ask for, judging the output, and shipping something that holds up.

---

## Run it locally

```bash
git clone https://github.com/MuhmmadF-Stack/3-Apps-Wireframes-Templates.git
cd 3-Apps-Wireframes-Templates
python3 -m http.server 8000      # or: npx serve .
```

Open **http://localhost:8000/Index.dc.html**. You can also double-click `Index.dc.html` to open it directly.

> Keep `support.js` in the same folder as the `.dc.html` files; every prototype loads it.

### Publish on GitHub Pages
1. Push the repo to GitHub
2. **Settings → Pages → Deploy from a branch** → `main` / `(root)` → Save
3. Live at `https://muhmmadf-stack.github.io/3-Apps-Wireframes-Templates/Index.dc.html`

---

## Project structure

```
├── Index.dc.html        # Landing page linking all three apps
├── Daily Dish.dc.html   # Food delivery prototype
├── Stride.dc.html       # Fitness prototype
├── Pocket.dc.html       # Budgeting prototype
├── support.js           # Small runtime the prototypes load (uses React from a CDN)
└── LICENSE
```

Each app file has three parts: **markup** (screens), **logic** (a `Component` class holding state and sample data) and **theme** (CSS variables at the top).

**Quick customizations**
- Brand colour → `--accent` in the `<style>` block
- Sample data → `this.R` (restaurants), `this.W` (workouts), `seed()` (transactions)
- Promo codes → `this.PROMOS` in `Daily Dish.dc.html`
- Budget categories → `this.CATS` in `Pocket.dc.html`

---

## What I learned

- **Edge states take longer than the main screens,** and they're what make a prototype feel real.
- **Personality comes from type first, colour second.** Swapping the typeface changed each app's feel more than any colour did.
- **Clickable beats static.** A working prototype gets far better feedback than a set of screenshots.

### Next steps
- [ ] Run a 5-user usability test on the Daily Dish checkout flow and document findings
- [ ] Replace image placeholders with real photography
- [ ] Rebuild the design system as a Figma component library

---

## Notes
- Front-end prototypes only: no real payments, accounts or location tracking. Data lives in memory and resets on reload.
- Works in recent Chrome, Edge, Safari and Firefox (uses `oklch()` colours and `conic-gradient()`).
- Fonts: Google Fonts (Bricolage Grotesque, Figtree, Archivo, Newsreader, IBM Plex Sans/Mono, JetBrains Mono).

---

<div align="center">

**Muhammad Mohtashim**: UI/UX Designer · BSCS student, Iqra University

Open to UI/UX and AI-workflow roles · [LinkedIn](#) · [Portfolio](#) · [Email](mailto:mohtashim.20445@gmail.com)

Released under the [MIT License](LICENSE).

</div>
