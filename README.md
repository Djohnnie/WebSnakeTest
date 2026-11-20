# WebSnakeTest

Web Snake is a browser-based Snake game served as a static site by ASP.NET 10. Run it with the .NET 10 SDK:

```sh
dotnet run
```

Open the local URL printed by the app, choose a player name, and start a run with the arrow keys or WASD. The chosen name and personal best are saved in the browser on that device.

Food appears at a randomly selected empty board cell at the start of a run and each time the snake eats.

Run the game-logic tests with:

```sh
node --test
```
