# WebSnakeTest

.NET 10 Blazor WebAssembly implementation of a classic Snake game. Player names
are validated and registered before a game can start.

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

## Capture the registration flow

With the development server running and Playwright available, run:

```bash
node tools/ui/capture-registration.cjs
```

This local tooling captures blocked-start and registered-player screenshots plus
a short interaction video. It is not included in the published application.