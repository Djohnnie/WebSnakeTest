using WebSnake.Game;

namespace WebSnake.Tests;

public sealed class SnakeGameTests
{
    [Fact]
    public void TryStart_WithoutRegisteredPlayer_DoesNotStartGame()
    {
        var game = new SnakeGame(new Random(7));

        var started = game.TryStart();

        Assert.False(started);
        Assert.False(game.IsRunning);
        Assert.Null(game.ActivePlayerName);
    }

    [Fact]
    public void TryStart_WithRegisteredPlayer_AssociatesTrimmedName()
    {
        var game = new SnakeGame(new Random(7));
        Assert.True(game.TryRegisterPlayer("  Neon Viper  ", out _));

        var started = game.TryStart();

        Assert.True(started);
        Assert.True(game.IsRunning);
        Assert.Equal("Neon Viper", game.RegisteredPlayerName);
        Assert.Equal("Neon Viper", game.ActivePlayerName);
    }

    [Theory]
    [InlineData(null, "Enter a player name")]
    [InlineData(" ", "Enter a player name")]
    [InlineData("A", "between 2 and 20")]
    [InlineData("ThisPlayerNameIsFarTooLong", "between 2 and 20")]
    [InlineData("Player!", "Use letters")]
    [InlineData("--", "letter or number")]
    [InlineData("''", "letter or number")]
    public void TryRegisterPlayer_WithInvalidName_ReturnsHelpfulError(string? name, string expected)
    {
        var game = new SnakeGame(new Random(7));

        var registered = game.TryRegisterPlayer(name, out var error);

        Assert.False(registered);
        Assert.Contains(expected, error);
        Assert.Null(game.RegisteredPlayerName);
    }

    [Theory]
    [InlineData("Neon Viper")]
    [InlineData("Player_42")]
    [InlineData("O'Connor")]
    [InlineData("アリス")]
    public void TryRegisterPlayer_WithSupportedName_RegistersPlayer(string name)
    {
        var game = new SnakeGame(new Random(7));

        var registered = game.TryRegisterPlayer(name, out var error);

        Assert.True(registered);
        Assert.Empty(error);
        Assert.Equal(name, game.RegisteredPlayerName);
    }
}
