# Project Architecture

## 1. Overview

This is a static Astro-based anime game website.

Core architecture:

* Astro + TypeScript
* Static question/data files inside `database/`
* Client-side game logic
* `localStorage` for player identity and question progress
* Google Sheets for persistent game results and leaderboard
* Google Apps Script Web App as the intermediary between the website and Google Sheets

---

## 2. Data Structure

```text
database/
├── gamescategory.json
├── animecategory.json
│
├── game_id1/
│   ├── anime_id1/
│   │   └── question.json
│   ├── anime_id2/
│   │   └── question.json
│   └── ...
├── game_id2/
│   ├── anime_id1/
│   │   └── question.json
│   └── ...
```

`database/` is a static data directory, not a database.

Questions are stored at:

```text
database/<game_id>/<anime_id>/question.json
```

Each Game + Anime combination has its own question file.

Do not create a global questions folder or question-search system.

Every question must have a unique, stable `id`.

---

## 3. Game Categories

`gamescategory.json` defines available game categories.

Each game contains:

* `id` — unique stable ID and game folder name
* `name` — display name
* `show` — whether it appears on the Games Category page
* `gamepath` — game UI/page implementation path
* `questionLimit` — number of questions used for one game session

Example:

```json
{
  "id": "typing",
  "name": "Guess the Character",
  "show": true,
  "gamepath": "/games/typing",
  "questionLimit": 5
}
```

`gamepath` identifies the UI/game implementation, not the question-data path.

`questionLimit` is dynamic and must be read from `gamescategory.json`.

Different game categories may use different gameplay mechanics.

---

## 4. Anime Categories

`animecategory.json` contains shared anime definitions.

Each anime contains:

* `id` — unique anime ID and folder name
* `name`
* `bgimage`
* `gameCategoryIds` — game IDs that support this anime

Example:

```json
{
  "id": "naruto",
  "name": "Naruto",
  "bgimage": "/images/anime/naruto.webp",
  "gameCategoryIds": ["typing", "mcq"]
}
```

Do not duplicate anime definitions for different games.

---

## 5. Dynamic Content

All major navigation/content lists must be data-driven.

### Navbar

Maintain navigation items containing:

* name
* path

Adding/removing a valid navigation item must automatically update the navbar.

### Game Categories

Use `gamescategory.json`.

### Anime Categories

Use `animecategory.json` and `gameCategoryIds` to determine where each anime appears.

### Game Question Limit

The number of questions in a game session must come from that game's `questionLimit` in `gamescategory.json`.

UI and game logic must never assume a fixed number of questions, navbar items, games, or anime categories.

---

## 6. Navigation Flow

```text
Home
  ↓
Browse Games
  ↓
Games Category Page
  ↓
Select Game Category
  ↓
Anime Categories
  ↓
Select Anime Category
  ↓
gamepath
  ↓
database/game_id/anime_id/question.json
  ↓
Load questions according to progress + questionLimit
  ↓
Game UI
  ↓
Answer questions
  ↓
Result Page
```

The selected `game_id`, `anime_id`, and `questionLimit` must be available to the game session.

---

## 7. Game Page Architecture

`gamepath` determines which gameplay implementation is used.

After the user selects an Anime Category, the game must:

1. Load the selected Game + Anime `question.json`.
2. Read the game's `questionLimit` from `gamescategory.json`.
3. Determine the starting point from saved progress.
4. Select/load up to `questionLimit` questions.
5. Start the game using those questions.
6. Show the Result Page after all selected questions have been answered.

Different mechanics should have separate implementations.

Do not create one oversized component containing every game mechanic.

Do not duplicate question data inside game pages.

---

## 8. Game Session and Scoring

The following behavior is common to every game type.

For each session:

* Load questions from the selected `question.json`.
* Use the dynamic `questionLimit`.
* Start from the saved progress when applicable.
* Ask up to `questionLimit` questions, or all available questions if fewer remain.
* Track correct and wrong answers.
* After the selected questions are answered, show the Result Page.

The Result Page must display:

* Total number of questions
* Correctly answered questions
* Wrong questions
* Total score percentage

Score percentage:

```text
(correct answers / total questions) × 100
```

The score must use the actual number of questions answered.

The saved Google Sheet result must match the Result Page values.

---

## 9. Questions

Each `question.json` contains questions for exactly one Game + Anime combination.

Every question must have a unique stable `id`.

The question `id` is the permanent identifier. It is not the serial number shown in the UI.

The UI may display temporary serial numbers such as:

```text
Question 1
Question 2
Question 3
```

Question serial numbers must not be used as permanent identifiers.

New questions will be manually added to the **top** of the relevant `question.json` file. The website does not provide a question-management or question-creation UI.

The question files are maintained directly as project data.


## 10. Troll Mode

Every game page must provide a Troll Mode toggle.

The same `question.json` is always used.

* Troll Mode OFF → show questions whose `troll` flag is `false`
* Troll Mode ON → show questions whose `troll` flag is `true`

Filtering must be based exclusively on the `troll` flag.

Apply Troll Mode filtering before selecting session questions.

The configured `questionLimit` applies after filtering.

Handle cases where fewer matching questions exist than the configured limit or no matching questions exist.

---

## 11. Miscellaneous

`Miscellaneous` is a special virtual option displayed inside each Game Category accordion alongside supported Anime Categories.

It is **not** an entry in `animecategory.json` and does not have its own `question.json`.

When Miscellaneous is selected:

1. Find all anime supported by the selected game.
2. Load the `question.json` from each supported anime.
3. Combine the questions into one pool.
4. Apply Troll Mode filtering.
5. Exclude questions already played in the current Miscellaneous cycle.
6. Shuffle the remaining questions.
7. Select up to `questionLimit` questions.

Miscellaneous questions must be shuffled across all supported anime so the game does not play one anime's questions sequentially.

Miscellaneous has independent progress from individual Anime Categories.

---

## 12. Player Identity

Player identity is stored locally in the user's browser.

### First Visit

If no player identity exists in `localStorage`:

```text
Ask for name
    ↓
Request new Player ID
    ↓
Apps Script generates/checks ID
    ↓
Return unique Player ID
    ↓
Store name + Player ID in localStorage
```

### Returning Visit

Read the existing name + Player ID from `localStorage`.

Do not ask for the name again or generate a new ID.

### Cleared Storage

If localStorage is cleared, treat the visitor as a new player and create a new identity.

---

## 13. Player ID

Player ID is not stored in a separate player registry.

The Player ID is:

* generated/check-checked through Google Apps Script
* checked against existing Player IDs in Google Sheets
* stored locally in the browser
* reused on future visits

Prefer generating/checking the ID through Apps Script rather than relying entirely on browser-side generation.

---

## 14. Google Sheets + Apps Script

Google Sheets is the persistent store for completed game results and leaderboard data.

Because the website is static, do not expose private Google credentials in browser code.

Use a Google Apps Script Web App as the intermediary:

```text
Astro Website
     ↓
Apps Script Web App
     ↓
Google Sheet
```

The Web App can be publicly callable by the website while executing with the owner's authorization.

Visitors do not need Google authentication.

The Apps Script must validate incoming requests and reject invalid/malformed operations.

---

## 15. Game Results

Save a result only after the player completes the selected session.

Result data:

```text
Name
Player ID
Game
Anime
Score
Percentage
```

Each completed game session is a separate result record.

The saved score and percentage must match the Result Page values.

---

## 16. Leaderboard

The homepage displays a global leaderboard.

```text
Homepage
   ↓
Apps Script Web App
   ↓
Google Sheet
   ↓
Leaderboard data
   ↓
Homepage UI
```

Leaderboard data must be fetched dynamically.

Handle loading, empty, and request-error states gracefully.

---

## 17. Core Separation

```text
localStorage
→ Player identity + question progress

question.json
→ Question data

gamescategory.json
→ Game configuration including questionLimit

Game Page
→ Gameplay and answer mechanics

Result Page
→ Final totals, percentage, and Play Again

Apps Script
→ Google Sheets communication + Player ID validation/generation

Google Sheet
→ Persistent completed-game results

Leaderboard UI
→ Display fetched results
```

Keep these responsibilities separate.
