using Bunit;
using WebSnake.Pages;

namespace WebSnake.Tests;

public sealed class HomePageTests : BunitContext
{
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
}
