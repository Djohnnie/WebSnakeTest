# WebSnakeTest

Web Snake is a browser-based Snake game served as a static site by ASP.NET 10. Run it with the .NET 10 SDK:

```sh
dotnet run
```

Open the local URL printed by the app, choose a player name, and start a run with the arrow keys, WASD, the on-screen arrows, or a swipe on the board. Rapid turns are queued, but the snake cannot reverse directly into itself. The chosen name and personal best are saved in the browser on that device.

Food appears at a randomly selected empty board cell at the start of a run and each time the snake eats. A blue slow power-up appears on another empty cell at the same time. Collecting it cuts the snake's movement speed in half for five seconds; collecting another refreshes the timer.

Run the movement, placement, and power-up timing tests with:

```sh
node --test tests/*.test.js
```

With Playwright installed, capture the game in motion with:

```sh
NODE_PATH=$(npm root -g) node scripts/screenshot-game.js http://localhost:5000 screenshots/game.png
```
