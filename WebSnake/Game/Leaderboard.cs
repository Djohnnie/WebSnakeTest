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

#if DEBUG
public static class LeaderboardDemoData
{
    public static void SeedWhenRequested(Leaderboard leaderboard, string uri)
    {
        if (!uri.Contains("?demo=leaderboard", StringComparison.OrdinalIgnoreCase) &&
            !uri.Contains("&demo=leaderboard", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        foreach (var entry in SampleEntries)
        {
            leaderboard.Add(entry.PlayerName, entry.SnakeLength);
        }
    }

    private static readonly LeaderboardEntry[] SampleEntries =
    [
        new("Neon Viper", 42),
        new("Pixel Fox", 38),
        new("Byte Rider", 34),
        new("Luna Loop", 31),
        new("Arcade Ace", 29),
        new("Pink Cobra", 26),
        new("Grid Ghost", 22),
        new("Coil Kid", 19),
        new("Nova Noodle", 16),
        new("Snack Jack", 16),
        new("Blue Circuit", 14),
        new("Tiny Python", 12)
    ];
}
#endif
