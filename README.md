# WebSnakeTest

Web Snake is a browser-based Snake game served as a static site by ASP.NET 10. Run it with the .NET 10 SDK:

```sh
dotnet run
```

Open the local URL printed by the app, choose a player name, and start a run with the arrow keys, WASD, the on-screen arrows, or a swipe on the board. Rapid turns are queued, but the snake cannot reverse directly into itself. The chosen name, personal best, and local leaderboard are saved in the browser on that device. Open the leaderboard from the header to see the best completed runs or an empty-state message before the first result.

Food appears at a randomly selected empty board cell at the start of a run and each time the snake eats.

Run the movement and food-placement tests with:

```sh
node --test tests/*.test.js
```

With Playwright installed, capture the game in motion with:

```sh
NODE_PATH=$(npm root -g) node scripts/screenshot-game.js http://localhost:5000 screenshots/game.png
```
