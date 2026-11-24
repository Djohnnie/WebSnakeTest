# WebSnakeTest

.NET 10 Blazor WebAssembly implementation of a classic Snake game on a 25 by 25
tile board. Player names are validated and registered before a game can start.
Use the arrow keys or on-screen controls to steer; each 130 ms tick moves the
snake one tile and crossing an edge wraps it to the opposite side. Blue food
spawns on an unoccupied tile. Eating it adds one segment, ten points, and causes
a new piece of food to appear elsewhere on the board.

## Run

```bash
DOTNET_ROLL_FORWARD=Major ASPNETCORE_URLS=http://127.0.0.1:5067 dotnet run --project WebSnake/WebSnake.csproj
```

## Test

```bash
DOTNET_ROLL_FORWARD=Major dotnet test WebSnake.slnx
```

The runtime roll-forward is only needed on development machines where the .NET
10 SDK is building the app but only a newer runtime is installed.

## Capture media

With the app running, capture a screenshot and demo of the snake eating food
and growing using:

```bash
BASE_URL=http://127.0.0.1:5067 \
SCREENSHOT_DIR=/tmp/websnake-screenshots \
DEMO_DIR=/tmp/websnake-demos \
node WebSnake.Tests/playwright/capture-media.cjs
```

`DEMO_OVERLAY_PATH` can point to another Playwright init script when the overlay
needs to be customized.
