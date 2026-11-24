using WebSnake.Game;

namespace WebSnake.Tests;

public sealed class SnakeGameTests
{
    [Fact]
    public void NewGame_UsesStandardTwentyFiveByTwentyFiveBoard()
    {
        var game = new SnakeGame(new Random(7));

        Assert.Equal(25, SnakeGame.BoardSize);
        Assert.All(
            game.Snake.Append(game.Food),
            point =>
            {
                Assert.InRange(point.X, 0, SnakeGame.BoardSize - 1);
                Assert.InRange(point.Y, 0, SnakeGame.BoardSize - 1);
            });
    }

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

    [Fact]
    public void Tick_WhenRunning_MovesSnakeOneTile()
    {
        var game = StartGame();
        var previousHead = game.Snake[0];

        game.Tick();

        var head = game.Snake[0];
        Assert.Equal(1, Math.Abs(head.X - previousHead.X) + Math.Abs(head.Y - previousHead.Y));
    }

    [Theory]
    [InlineData(Direction.Right, 13, 0, 12)]
    [InlineData(Direction.Down, 13, 12, 0)]
    [InlineData(Direction.Up, 13, 12, 24)]
    public void Tick_WhenCrossingEdge_WrapsToOppositeEdge(
        Direction direction,
        int ticks,
        int expectedX,
        int expectedY)
    {
        var game = StartGame();

        Assert.True(game.Turn(direction));
        for (var tick = 0; tick < ticks; tick++)
        {
            Assert.True(game.Tick());
        }

        Assert.True(game.IsRunning);
        Assert.Equal(new GridPoint(expectedX, expectedY), game.Snake[0]);
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

    private static SnakeGame StartGame()
    {
        var game = new SnakeGame(new Random(7));
        Assert.True(game.TryRegisterPlayer("Neon Viper", out _));
        Assert.True(game.TryStart());
        return game;
    }
}
