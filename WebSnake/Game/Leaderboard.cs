namespace WebSnake.Game;

public sealed class Leaderboard
{
    public const int MaximumEntries = 10;

    private readonly List<LeaderboardEntry> _entries = [];

    public IReadOnlyList<LeaderboardEntry> Entries =>
        _entries
            .OrderByDescending(entry => entry.SnakeLength)
            .Take(MaximumEntries)
            .ToList();

    public void Add(string playerName, int snakeLength)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(playerName);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(snakeLength);

        _entries.Add(new LeaderboardEntry(playerName, snakeLength));

        if (_entries.Count > MaximumEntries)
        {
            var retainedEntries = Entries;
            _entries.Clear();
            _entries.AddRange(retainedEntries);
        }
    }
}

public sealed record LeaderboardEntry(string PlayerName, int SnakeLength);
