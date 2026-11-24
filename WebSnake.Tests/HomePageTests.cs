using Bunit;
using Microsoft.Extensions.DependencyInjection;
using WebSnake.Game;
using WebSnake.Pages;

namespace WebSnake.Tests;

public sealed class HomePageTests : BunitContext
{
    public HomePageTests()
    {
        Services.AddSingleton(new Leaderboard());
    }

    [Fact]
    public void NewGame_DisplaysStandardTwentyFiveByTwentyFiveGrid()
    {
        var page = Render<Home>();

        Assert.Equal("25 × 25", page.Find(".score-block.align-right strong").TextContent);
        Assert.Equal("03", page.Find(".score-block.align-center strong").TextContent);
        Assert.NotNull(page.Find(".food[role='img'][aria-label]"));
    }

    [Fact]
    public void StartWithoutRegistration_ShowsErrorAndKeepsGameStopped()
    {
        var page = Render<Home>();

        page.Find(".start-button").Click();

        Assert.NotNull(page.Find("[role='alert']"));
        Assert.Contains("Waiting for player", page.Markup);
        Assert.Contains("Register a valid player name before starting.", page.Markup);
    }

    [Fact]
    public void RegisteredName_IsDisplayedOnPage()
    {
        var page = Render<Home>();

        page.Find("#player-name").Input("Neon Viper");
        page.Find("form").Submit();

        Assert.Contains("Registered as Neon Viper", page.Markup);
        Assert.Contains("Ready, Neon Viper?", page.Markup);
        Assert.Equal("Neon Viper", page.Find(".player-chip strong").TextContent);
    }

    [Fact]
    public void EditedRegisteredName_MustBeUpdatedBeforeStarting()
    {
        var page = Render<Home>();
        page.Find("#player-name").Input("Alice");
        page.Find("form").Submit();

        page.Find("#player-name").Input("Bob");

        Assert.True(page.Find(".start-button").HasAttribute("disabled"));
        Assert.Contains("Name changed. Select Update before starting.", page.Markup);
        Assert.Equal("Alice", page.Find(".player-chip strong").TextContent);
    }

    [Fact]
    public void Leaderboard_DisplaysTheTopTenPlayersAndSnakeLengths()
    {
        var leaderboard = Services.GetRequiredService<Leaderboard>();
        var seededEntries = new (string PlayerName, int SnakeLength)[]
        {
            ("Neon Viper", 42),
            ("Pixel Fox", 38),
            ("Byte Rider", 34),
            ("Luna Loop", 31),
            ("Arcade Ace", 29),
            ("Pink Cobra", 26),
            ("Grid Ghost", 22),
            ("Coil Kid", 19),
            ("Nova Noodle", 16),
            ("Snack Jack", 16),
            ("Blue Circuit", 14),
            ("Tiny Python", 12)
        };

        foreach (var entry in seededEntries)
        {
            leaderboard.Add(entry.PlayerName, entry.SnakeLength);
        }

        var page = Render<Home>();
        var entries = page.FindAll(".leaderboard-list li");

        Assert.Equal(10, entries.Count);
        Assert.Equal("Neon Viper", entries[0].QuerySelector(".leaderboard-player")!.TextContent);
        Assert.Equal("42", entries[0].QuerySelector(".leaderboard-length strong")!.TextContent);
        Assert.Equal("9", entries[8].QuerySelector(".rank")!.TextContent);
        Assert.Equal("9", entries[9].QuerySelector(".rank")!.TextContent);
    }
}
