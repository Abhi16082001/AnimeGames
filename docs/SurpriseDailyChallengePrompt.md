Implement a new *Surprise Daily Challenge* feature using the existing game, result, leaderboard, and player-registration systems. *Do not create new result or leaderboard pages.*

### 1. Daily Question
- I have added dailyquestion.json inside every game category folder:
  - /database/description/dailyquestion.json
  - /database/colour/dailyquestion.json
  - /database/zoom/dailyquestion.json
- Each file contains exactly *one question*.
- The Daily Challenge always consists of only this one question.
- The game category is returned by the API as dailypath.
- Load the question from:
  /database/[dailypath]/dailyquestion.json
- Open/use the correct existing game page for that category even though the user does not select a category first.
- After answering the single question, immediately go to the *existing result page*. There must be no Next Question button.

### 2. Existing Result Page
Detect whether the result is for the Daily Challenge.
- For Daily Challenge results, change the relevant button text to *View Daily Leaderboard*.
- Clicking it should open the existing leaderboard page with *Daily Challenge automatically selected* in the category/filter dropdown.
- Normal game results must remain unchanged.

### 3. Daily Score Submission
On the first Daily Challenge result:
- Calculate the score using the same score already calculated/displayed on the result page.
- Get playerId and playerName from localStorage.
- Send exactly one POST request:
text
action: addDailyScore
playerId: <localStorage player ID>
playerName: <localStorage player name>
score: <result score>

- The API should be called *only once per Daily Challenge period for each user*, not every time they replay it.
- Use a localStorage flag to track whether the Daily Challenge score has already been submitted.
- After a successful API response, set the flag to true.
- If the Daily Challenge is replayed while active, allow the user to play again, but do not submit another score.
- The server already accepts only the first Daily score, so the frontend flag is mainly to avoid unnecessary API calls.

### 4. Daily Challenge API
On *every Home page load/refresh*, make one GET request:

text
?action=getDailyChallengeInfo


The API returns:

js
{
  success: true,
  timer: true,
  duration: duration,
  notice: 'Sample notice',
  dailypath: 'game_category'
}


Do not poll this API repeatedly. One request per Home page load is enough.

### 5. Home Page Daily Challenge Section
Add the Daily Challenge section *below the About section*.

#### If timer === false
Show nothing:
- No heading
- No button

#### If timer === true and duration !== null
The challenge is currently inactive/upcoming.

Show:

*Surprise Daily Challenge will be available in HH hrs MM min SS sec*

with a *disabled Play Daily Challenge* button.

- duration is returned in minutes.
- Convert it to hours/minutes/seconds.
- Run the countdown locally; do not make additional API requests.
- When the challenge becomes active, the local countdown should reach zero and the UI should update to the active state.

Also *clear the Daily Challenge localStorage submission flag* while the challenge is inactive so the next challenge can accept a new stored result.

#### If timer === true and duration === null
The challenge is active.

Show:

*Surprise Daily Challenge is active, play and rank leaderboard*

with an active *Play Daily Challenge* button.

Clicking the button should:
1. Use dailypath from the API response.
2. Open the existing game page for that category.
3. Load /database/[dailypath]/dailyquestion.json.
4. Start the one-question Daily Challenge.

### 6. Notice
If notice is a string and notice !== 'false':
- Show a notice bar *below the Hero section*.
- Background: salmon pink.
- Text: blood red.
- Display exactly the notice returned by the API.

If notice === 'false', show nothing.

### 7. Daily Leaderboard
Do not create a separate leaderboard page.

Modify the existing leaderboard:
- Add *Daily Challenge* as an option in the existing filter dropdown.
- When selected, display only entries whose Google Sheet Game category is exactly *Daily*.
- Clicking View Daily Leaderboard from a Daily result must automatically open the leaderboard with *Daily Challenge selected*.
- Normal categories and their existing behavior must remain unchanged.

### 8. Player Registration
Keep the existing nickname/player-registration flow unchanged.

If a new user directly clicks *Play Daily Challenge* without an existing player ID:
- Show the existing nickname UI.
- Create the player using the existing createPlayer API.
- Then continue into the Daily Challenge.

Do not create a separate registration system.


### 9. Daily Challenge Question Handling — Important
The Daily Challenge has *exactly one question*, so it must use a simplified question flow.

For Daily Challenge:
- Load only /database/[dailypath]/dailyquestion.json.
- Do *not* load the normal question.json.
- Do *not* load or process the full question list.
- Do *not* shuffle questions.
- Do *not* apply question limits.
- Do *not* track question progress.
- Do *not* remove/filter already-played questions.
- Do *not* use the normal "next question" flow.
- Do *not* perform any other normal multi-question game procedures that are unnecessary for a single-question challenge.
- After the user answers this one question, immediately finish the Daily Challenge and show the existing result page.

*Important:* These changes apply *only to the Surprise Daily Challenge*.

Do *not* remove, simplify, or alter any of these existing procedures for normal gameplay. Normal games must continue using their current question loading, filtering, shuffling, limits, progress tracking, replay behavior, and other existing logic exactly as before.

The Daily Challenge should be treated as a separate one-question gameplay path while reusing the existing game UI/components where practical.

### Important
- Reuse existing game/result/leaderboard/player-registration components and logic wherever possible.
- Do not create duplicate pages or duplicate leaderboard systems.
- Do not modify the Google Apps Script implementation unless specifically required; the addDailyScore and getDailyChallengeInfo APIs already exist.
- Preserve all existing normal game behavior.
- Run the project build after implementation and fix any errors.