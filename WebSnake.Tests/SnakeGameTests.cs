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

    [Fact]
    public void Tick_WhenSnakeTouchesFood_GrowsAndRespawnsFoodAwayFromSnake()
    {
        var game = new SnakeGame(new ScriptedRandom(0, 310, 0));
        Assert.True(game.TryRegisterPlayer("Neon Viper", out _));
        Assert.True(game.TryStart());
        var food = game.Food;
        var previousLength = game.Length;

        game.Tick();

        Assert.Equal(previousLength + 1, game.Length);
        Assert.Equal(food, game.Snake[0]);
        Assert.Equal(10, game.Score);
        Assert.NotEqual(food, game.Food);
        Assert.DoesNotContain(game.Food, game.Snake);
    }

    [Fact]
    public void Tick_WhenSnakeRunsIntoItsBody_EndsGame()
    {
        var leaderboard = new Leaderboard();
        var game = new SnakeGame(new ScriptedRandom(0, 310, 310, 0), leaderboard);
        Assert.True(game.TryRegisterPlayer("Neon Viper", out _));
        Assert.True(game.TryStart());
        Assert.True(game.Tick());
        Assert.True(game.Tick());
        Assert.Equal(5, game.Length);

        Assert.True(game.Turn(Direction.Down));
        Assert.True(game.Tick());
        Assert.True(game.Turn(Direction.Left));
        Assert.True(game.Tick());
        Assert.True(game.Turn(Direction.Up));
        var snakeBeforeCollision = game.Snake.ToArray();

        Assert.True(game.Tick());

        Assert.False(game.IsRunning);
        Assert.True(game.IsGameOver);
        Assert.Equal(GameEndReason.SelfCollision, game.EndReason);
        Assert.Equal(snakeBeforeCollision, game.Snake);
        var result = Assert.Single(leaderboard.Entries);
        Assert.Equal("Neon Viper", result.PlayerName);
        Assert.Equal(snakeBeforeCollision.Length, result.SnakeLength);
        Assert.False(game.Tick());
        Assert.Equal(snakeBeforeCollision, game.Snake);
        Assert.Single(leaderboard.Entries);
    }

    [Fact]
    public void TryStart_AfterCompletedGame_AddsAnotherResultAndKeepsPreviousRank()
    {
        var leaderboard = new Leaderboard();
        var firstGame = new SnakeGame(new ScriptedRandom(0, 310, 310, 0, 0), leaderboard);
        Assert.True(firstGame.TryRegisterPlayer("Neon Viper", out _));
        Assert.True(firstGame.TryStart());

        Assert.True(firstGame.Tick());
        Assert.True(firstGame.Tick());
        Assert.True(firstGame.Turn(Direction.Down));
        Assert.True(firstGame.Tick());
        Assert.True(firstGame.Turn(Direction.Left));
        Assert.True(firstGame.Tick());
        Assert.True(firstGame.Turn(Direction.Up));
        Assert.True(firstGame.Tick());

        Assert.True(firstGame.TryRegisterPlayer("Pixel Fox", out _));
        Assert.True(firstGame.TryStart());

        var entry = Assert.Single(leaderboard.Entries);
        Assert.Equal("Neon Viper", entry.PlayerName);
        Assert.Equal(5, entry.SnakeLength);
        Assert.True(firstGame.IsRunning);
    }

    [Fact]
    public void Leaderboard_RanksEntriesBySnakeLength()
    {
        var leaderboard = new Leaderboard();

        leaderboard.Add("Neon Viper", 5);
        leaderboard.Add("Pixel Fox", 12);
        leaderboard.Add("Byte Rider", 8);

        Assert.Collection(
            leaderboard.Entries,
            entry => Assert.Equal(("Pixel Fox", 12), (entry.PlayerName, entry.SnakeLength)),
            entry => Assert.Equal(("Byte Rider", 8), (entry.PlayerName, entry.SnakeLength)),
            entry => Assert.Equal(("Neon Viper", 5), (entry.PlayerName, entry.SnakeLength)));
    }

    [Fact]
    public void Leaderboard_KeepsOnlyTheTenHighestScores()
    {
        var leaderboard = new Leaderboard();

        for (var score = 3; score <= 14; score++)
        {
            leaderboard.Add($"Player {score}", score);
        }

        Assert.Equal(Leaderboard.MaximumEntries, leaderboard.Entries.Count);
        Assert.Equal(14, leaderboard.Entries[0].SnakeLength);
        Assert.Equal(5, leaderboard.Entries[^1].SnakeLength);
        Assert.All(leaderboard.Entries, entry => Assert.InRange(entry.SnakeLength, 5, 14));
    }

    [Fact]
    public void Leaderboard_TiedScoresKeepResultOrder()
    {
        var leaderboard = new Leaderboard();

        leaderboard.Add("First Finisher", 12);
        leaderboard.Add("Second Finisher", 12);
        leaderboard.Add("Third Finisher", 11);

        Assert.Equal(
            ["First Finisher", "Second Finisher", "Third Finisher"],
            leaderboard.Entries.Select(entry => entry.PlayerName));
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

    private sealed class ScriptedRandom(params int[] values) : Random
    {
        private readonly Queue<int> _values = new(values);

        public override int Next(int maxValue)
        {
            var value = _values.Dequeue();
            Assert.InRange(value, 0, maxValue - 1);
            return value;
        }
    }
}
