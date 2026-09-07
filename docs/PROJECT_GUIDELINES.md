# Project Guidelines

## 1. General Rules

* Use Astro + TypeScript.
* Read `AGENTS.md`, `ARCHITECTURE.md`, and `DESIGN.md` before making changes.
* Follow the architecture defined in `ARCHITECTURE.md`.
* Use `DESIGN.md` **only to maintain UI consistency within this project**.
* Keep implementations simple, maintainable, and scalable.
* Do not unnecessarily refactor working code.
* Do not hardcode data that belongs in project JSON files.
* Do not add features or abstractions that are not required.
* When relevant, use the Astro Docs MCP server and applicable skills, including Tailwind CSS and web design guidelines, to ensure implementations follow current documentation and best practices.

---

## 2. Design Direction

* **Do NOT make the website resemble Vercel.**
* Avoid copying Vercel's overall visual language, layouts, spacing patterns, navigation style, component appearance, or monochrome aesthetic.
* The website must have its **own anime/game identity**.
* `DESIGN.md` defines project-specific consistency such as typography, spacing, responsiveness, accessibility, and component consistency.
* `DESIGN.md` does **not** mean the website should look like Vercel or any other reference site.
* When implementing new UI, prioritize the project's existing visual identity over generic SaaS/AI/developer-site patterns.

---

## 3. Data

* Treat `database/` as static project data, not a real database.
* Keep question files at:
  `database/<game_id>/<anime_id>/question.json`
* Do not create a global questions file/folder.
* Do not create a question search/filter system.
* Keep game definitions in `gamescategory.json`.
* Keep anime definitions in `animecategory.json`.
* Every question must have a unique, stable `id`.
* New questions will be manually added to the top of the relevant `question.json`.

---

## 4. Game Implementation

* Use the configured `gamepath` for the appropriate game implementation.
* Read `questionLimit` dynamically from `gamescategory.json`.
* Never hardcode question limits.
* Keep different game mechanics in separate implementations.
* Do not build one giant component for all game types.
* Reuse common game functionality where appropriate.
* Follow the common session, scoring, progress, Troll Mode, and Result Page behavior defined in `ARCHITECTURE.md`.

---

## 5. Dynamic Content

Do not assume fixed numbers of:

* navbar items
* game categories
* anime categories
* questions

UI must adapt automatically to the available data.

Adding or modifying normal content should not require unnecessary component changes.

---

## 6. Components

* Prefer small, focused components.
* Reuse common UI components.
* Avoid unnecessary duplication.
* Keep data, gameplay logic, and UI responsibilities separated.
* Do not duplicate question or category data inside components.

---

## 7. Responsive Design

* Follow `DESIGN.md` for project-wide UI consistency.
* Do not use fixed dimensions where content must expand dynamically.
* Ensure layouts work across screen sizes and varying content counts.
* Preserve the project's unique anime/game visual identity across responsive layouts.

---

## 8. Performance

* Keep the site lightweight.
* Avoid unnecessary client-side JavaScript.
* Avoid unnecessary dependencies.
* Load only the data required for the current experience where practical.
* Optimize images appropriately.
* Keep static content statically rendered where possible.

---

## 9. Accessibility

Use:

* semantic HTML
* accessible controls
* keyboard-accessible interactions
* visible focus states
* meaningful labels
* sufficient contrast
* appropriate image alt text

Do not rely only on color to communicate state.

---

## 10. Error Handling

Gracefully handle failures involving:

* missing or invalid JSON data
* unsupported Game + Anime combinations
* unavailable questions
* insufficient questions for `questionLimit`
* Troll Mode with no matching questions
* missing localStorage data
* missing saved question IDs
* Apps Script/Google Sheets requests
* invalid API responses
* leaderboard loading

Do not allow these failures to produce a broken or unusable page.

---

## 11. External Services

* Never expose private Google credentials in frontend code.
* Keep Google Sheets access through the Apps Script layer.
* Validate external request data.
* Handle external service failures gracefully.

---

## 12. Special Guidelines

General project rules apply by default.

Check the `Special Guidelines` section/folder before implementing functionality that has explicitly defined exceptions.

Special Guidelines override general rules when they conflict.

Examples include:

* special question pages
* unusual game mechanics
* homepage-specific layouts
* exceptional UI behavior
