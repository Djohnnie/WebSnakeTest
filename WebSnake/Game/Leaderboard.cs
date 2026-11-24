namespace WebSnake.Game;

public sealed class Leaderboard
{
    private readonly List<LeaderboardEntry> _entries = [];

    public IReadOnlyList<LeaderboardEntry> Entries =>
        _entries
            .OrderByDescending(entry => entry.SnakeLength)
            .ToList();

    public void Add(string playerName, int snakeLength)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(playerName);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(snakeLength);

        _entries.Add(new LeaderboardEntry(playerName, snakeLength));
    }
}

public sealed record LeaderboardEntry(string PlayerName, int SnakeLength);
