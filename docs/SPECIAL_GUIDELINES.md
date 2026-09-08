# Game Type Guidelines

This document defines the specific gameplay behavior for the currently supported game types.

These are special game rules and override general implementation assumptions when necessary.

---

# 1. Supported Game Types

Currently there are three game types:

1. Description Game
2. Zoomed Image Game
3. Colour Guessing Game

The appropriate game implementation is selected through the configured `gamepath`.

All game types must follow the common session, progress, persistence, and leaderboard architecture defined in `ARCHITECTURE.md`.

### Scoring Rule

* The maximum score for **one question is always 1 point**.
* Individual question scores are between `0` and `1`.
* Each game category has its own score.
* The player's **best score for each game category** is used for leaderboard calculations.
* Anime categories do not have separate leaderboard score entries.

---

# 2. Description Game

## Gameplay

Each question contains **5 description lines**.

Only the first description line is visible initially.

The player enters an answer after each visible description.

### Correct Answer

If the answer is correct:

* Reveal all remaining description lines.
* Mark the question as correct.
* Award points based on which description line produced the correct answer.
* End the question.

### Incorrect Answer

If the answer is incorrect:

* Do not end the question.
* Automatically reveal the next description line.
* Allow the player to try again.

The process continues until the player answers correctly or all 5 descriptions have been attempted.

## Scoring

| Correct on         | Score |
| ------------------ | ----: |
| Line 1             |   1.0 |
| Line 2             |   0.8 |
| Line 3             |   0.6 |
| Line 4             |   0.4 |
| Line 5             |   0.2 |
| Wrong after Line 5 |     0 |

* One question can award a maximum of **1 point**.
* All 5 descriptions belong to the same question.
* Do not treat each description as a separate question.
* Once the correct answer is given, reveal the remaining descriptions.
* After an incorrect answer on line 5, the question ends with 0 points.

## Correct Image Reveal

Each question provides the path of its correct image in `question.json`.

When the question ends:

1. Flip the description question card/box to reveal the correct image.
2. Display the image using the path stored in `question.json`.
3. The image is the back side of the same question card/box.
4. Clicking/tapping the correct image flips the card back to the description/question side.
5. The player can switch between both sides by clicking/tapping.

The image path must come from `question.json`; do not hardcode it in the game component.

The flip should be a smooth card-flip interaction.

---

# 3. Zoomed Image Game

## Gameplay

Each question displays a **zoomed portion of an image**.

The player identifies the subject from the visible portion and types an answer.

### Correct Answer

If correct:

1. Smoothly zoom out to the full original image.
2. Show that the answer is correct.
3. Award **1 point**.
4. Allow progression to the next question.

### Incorrect Answer

If incorrect:

1. Still smoothly zoom out to the full original image.
2. Show that the answer is incorrect.
3. Award **0 points**.
4. Allow progression to the next question.

The full-image reveal happens regardless of the answer.

## Variable Zoom Configuration

The zoom must vary between questions.

Each question can define:

* zoom amount
* horizontal position
* vertical position

The visible area can be anywhere on the image, including the center, edges, corners, or other custom positions.

Example:

```json id="x42caj"
{
  "id": "naruto-q001",
  "image": "/images/naruto/q001.webp",
  "answer": "Naruto",
  "zoom": {
    "scale": 2.5,
    "position": {
      "x": 75,
      "y": 25
    }
  }
}
```

The exact field names may be adjusted to match the established question schema.

### Efficient Implementation

* Use one original image.
* Use CSS positioning/transforms to create the zoomed view.
* Do not create separate cropped files for each question.
* Transition the same image from its configured zoom/position to the normal full-image view.
* The zoom-out transition should be smooth.

---

# 4. Colour Guessing Game

## Image

Each question contains an image with a manually prepared transparent area.

The transparent image is provided in the project's `public` folder.

The game logic does not need to create, detect, or modify the transparency.

The transparent area displays the background colour of the question area.

---

## Controls

The question area contains:

* Circular colour picker
* Saturation slider
* Brightness slider

These controls change the question area's background and therefore change the apparent colour of the transparent image area.

---

## Correct Answer Data

Each question stores:

* accurate colour value/code
* saturation value
* brightness value
* path to the correct/reference colour image

Example:

```json id="59ynks"
{
  "id": "naruto-q001",
  "image": "/images/naruto/q001.webp",
  "color": {
    "hex": "#FF0000",
    "saturation": 100,
    "brightness": 100
  },
  "correctImage": "/images/naruto/q001-correct.webp"
}
```

The exact schema may be adjusted to match the established question schema.

---

## Matching Calculation

Compare the player's:

* colour
* saturation
* brightness

against the correct values stored in `question.json`.

Calculate a matching percentage based on how closely they match.

The displayed matching percentage is **not itself the stored score**.

---

## Scoring

**Question Score = Matching Percentage ÷ 100**

| Matching | Question Score |
| -------: | -------------: |
|     100% |           1.00 |
|      90% |           0.90 |
|      75% |           0.75 |
|      50% |           0.50 |
|       0% |           0.00 |

Display the matching percentage to the player while using the `0–1` score internally.

Example:

`90% match` → score `0.90`

---

## Correct Colour Image Comparison

When the colour question ends:

1. Take the correct/reference image path from `question.json`.
2. Display the correct image on top of the player's generated colour result.
3. When the player hovers over the correct image, immediately hide it.
4. While hovering, the player sees their generated result underneath.
5. When the pointer leaves, immediately show the correct image again.
6. On touch devices, holding/pressing the image hides it; releasing shows it again.
7. There must be **no transition or animation** for this hide/show behavior.
8. The change must be instantaneous so the difference is immediately visible.

Do not use fade, opacity transition, slide, or any other animation for this comparison.

---

# 5. Game Scores and Leaderboard

There is **no master/shared Result Page**.

Each game implementation handles its own result display.

However, all games use the same underlying score range:

**0–1 per question**

The leaderboard uses the player's **best score in each game category**, regardless of which Anime Category the score was achieved in.

## Best Score Per Game Category

For each game category:

1. The player may play multiple Anime Categories.
2. The score achieved in each completed session is evaluated.
3. The player's best score for that game category is retained.
4. Anime Category does not create a separate leaderboard score.

Example:

| Game        | Anime     | Score |
| ----------- | --------- | ----: |
| Description | Naruto    |  0.80 |
| Description | Bleach    |  0.95 |
| Description | One Piece |  0.70 |

The player's **best Description Game score = 0.95**.

The same process applies independently to every game category.

---

## Overall / Combined Score

The player's best score for each game category is then averaged.

For three game categories:

```text
Overall Score =
(Best Description Score
 + Best Zoomed Image Score
 + Best Colour Guessing Score)
÷ 3
```

The resulting average is the player's **Overall / Combined Score**.

Convert this average to a percentage for leaderboard display:

```text
Overall Percentage = Overall Score × 100
```

Example:

```text
Description best = 0.90
Zoomed Image best = 0.80
Colour Guessing best = 0.70

Overall Score = (0.90 + 0.80 + 0.70) ÷ 3
              = 0.80

Overall Percentage = 80%
```

The overall leaderboard entry should use a clear label such as:

**`Combined`**

This represents the player's combined performance across all game categories.

---

# 6. Google Sheet Leaderboard Data

Google Sheets must store both:

### Individual Game Category Best Scores

The player's best score for each game category should be stored separately so the leaderboard can be filtered by a specific game.

For example:

```text
Name | Player ID | Game | Score | Percentage
Abhishek | P001 | Description | 0.90 | 90%
Abhishek | P001 | Zoomed Image | 0.80 | 80%
Abhishek | P001 | Colour Guessing | 0.70 | 70%
```

### Combined Score

The calculated overall score should also be stored:

```text
Name | Player ID | Game | Score | Percentage
Abhishek | P001 | Combined | 0.80 | 80%
```

`Combined` is treated as a special leaderboard category representing the average of the player's best scores across the game categories.

---

## Leaderboard Filtering

The leaderboard should allow users to compare:

* **Combined** — overall performance across all game categories.
* **Individual game category** — best performance in that specific game.

For example:

```text
Leaderboard: [ Combined ▼ ]

Combined
1. Player A — 92%
2. Player B — 88%
3. Player C — 84%
```

or:

```text
Leaderboard: [ Description ▼ ]

Description
1. Player B — 96%
2. Player A — 90%
3. Player C — 85%
```

The same filtering approach should work for every available game category.

Do not create separate leaderboard systems for each game. Use the same stored score structure with the game/category field identifying the leaderboard.

---

# 7. Score Updating Rules

* Only completed game sessions should affect best scores.
* A new session should replace the stored game-category best score **only when the new score is higher**.
* Lower scores must not overwrite an existing best score.
* Best scores are independent for each game category.
* Anime categories must not overwrite or replace one another directly.
* After a game-category best score changes, the player's Combined score must be recalculated from the current best scores.
* The Combined score should always represent the average of the player's current best scores across the game categories.
* The Google Sheet should contain the latest best score for each individual game category and the latest Combined score.

The website should not calculate ranking positions itself. The leaderboard should obtain the stored scores and sort/display them appropriately.

---

# 8. Implementation Rules

* Do not hardcode game-specific question data inside components.
* Read game-specific values from `question.json`.
* Keep each game mechanic in its own implementation.
* Do not create one giant component containing all three game mechanics.
* Reuse common session, progression, persistence, and result functionality where appropriate.
* Do not assume all games use simple correct/incorrect scoring.
* Every question must ultimately produce a score between `0` and `1`.
* There is no shared/master Result Page.
* Follow `ARCHITECTURE.md` for question loading, progress, Troll Mode, session limits, player data, and Google Sheets communication.
* Follow `DESIGN.md` only for project-wide UI consistency.
* Maintain the project's own anime/game identity and **do not make the UI resemble Vercel**.
* Game-specific interactions in this document must be implemented as specified, even when they differ from generic UI behavior.


# 9. Homepage Layout

The homepage must follow this section structure and visual direction:

## 9.1 **Hero**

   * Full-background hero image.
   * Right side: a black overlay/filter with **more than 50% opacity**, containing a short description and a **`Browse Game`** CTA button.
   * Left side: the unobstructed image area with floating bubbles in **lavender and red**, using varied sizes and positions.
   * The hero should feel distinctive and anime/game-oriented, not like a generic SaaS landing page.

## 9.2 **Short About Section**

   * A very small introductory About section directly below the hero.
   * Use a **lavender-to-red gradient background**.
   * Keep the content intentionally brief because a dedicated About page will exist later.

## 9.3 **Feature Badges**

   * Use a separate/different background from the About section.
   * Display badges highlighting:

     * No Sign Up
     * Free of Cost
     * Daily New Questions
     * Global Leaderboard
     * Different Categories
     * Anime Questions

## 9.4 **Global Leaderboard Introduction**

   * Briefly describe the Global Leaderboard.
   * Include a CTA to the dedicated **Global Leaderboard** page.
   * **Do not display the actual leaderboard on the homepage.**

## 9.5 **FAQ**

   * Add the FAQ section after the leaderboard introduction.

## 9.6 **Footer**

   * Include relevant navigation links, including:

     * Game Categories
     * Global Leaderboard
     * About
     * Other available site pages

## 9.7 Responsive Design

* The entire homepage must be fully responsive. Mobile layouts may **change, simplify, reposition, or remove** desktop elements when necessary—for example, the hero description, slanting overlay, or floating bubbles—to maintain a clean and usable experience on smaller screens.

The homepage layout should remain visually distinct from the site's regular content pages while maintaining overall project-wide UI consistency through `DESIGN.md`.
