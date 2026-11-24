namespace WebSnake.Game;

public sealed class SnakeGame
{
    private static readonly char[] AllowedSeparators = [' ', '-', '\'', '_'];
    private readonly List<GridPoint> _snake = [];
    private readonly Random _random;

    public SnakeGame(Random? random = null)
    {
        _random = random ?? Random.Shared;
        ResetBoard();
    }

    public const int BoardSize = 20;

    public string? RegisteredPlayerName { get; private set; }
    public string? ActivePlayerName { get; private set; }
    public IReadOnlyList<GridPoint> Snake => _snake;
    public GridPoint Food { get; private set; }
    public int Score { get; private set; }
    public bool IsRunning { get; private set; }
    public bool IsGameOver { get; private set; }
    public Direction Direction { get; private set; } = Direction.Right;

    public bool TryRegisterPlayer(string? requestedName, out string error)
    {
        var name = requestedName?.Trim();

        if (string.IsNullOrWhiteSpace(name))
        {
            error = "Enter a player name to join the board.";
            return false;
        }

        if (name.Length is < 2 or > 20)
        {
            error = "Player names must be between 2 and 20 characters.";
            return false;
        }

        if (!name.All(character =>
                char.IsLetterOrDigit(character) ||
                AllowedSeparators.Contains(character)))
        {
            error = "Use letters, numbers, spaces, hyphens, apostrophes, or underscores.";
            return false;
        }

        RegisteredPlayerName = name;
        error = string.Empty;
        return true;
    }

    public bool TryStart()
    {
        if (RegisteredPlayerName is null)
        {
            IsRunning = false;
            return false;
        }

        ActivePlayerName = RegisteredPlayerName;
        Score = 0;
        IsGameOver = false;
        IsRunning = true;
        ResetBoard();
        return true;
    }

    public bool Turn(Direction direction)
    {
        if (!IsRunning || IsOpposite(direction, Direction))
        {
            return false;
        }

        Direction = direction;
        return true;
    }

    public bool Tick()
    {
        if (!IsRunning)
        {
            return false;
        }

        var head = _snake[0];
        var nextHead = Direction switch
        {
            Direction.Up => head with { Y = head.Y - 1 },
            Direction.Right => head with { X = head.X + 1 },
            Direction.Down => head with { Y = head.Y + 1 },
            Direction.Left => head with { X = head.X - 1 },
            _ => head
        };

        var ateFood = nextHead == Food;
        var collisionBody = ateFood ? _snake : _snake.Take(_snake.Count - 1);

        if (nextHead.X < 0 ||
            nextHead.X >= BoardSize ||
            nextHead.Y < 0 ||
            nextHead.Y >= BoardSize ||
            collisionBody.Contains(nextHead))
        {
            EndGame();
            return true;
        }

        _snake.Insert(0, nextHead);

        if (ateFood)
        {
            Score += 10;
            PlaceFood();
        }
        else
        {
            _snake.RemoveAt(_snake.Count - 1);
        }

        return true;
    }

    private void ResetBoard()
    {
        _snake.Clear();
        var middle = BoardSize / 2;
        _snake.AddRange(
        [
            new GridPoint(middle, middle),
            new GridPoint(middle - 1, middle),
            new GridPoint(middle - 2, middle)
        ]);
        Direction = Direction.Right;
        PlaceFood();
    }

    private void PlaceFood()
    {
        var available = Enumerable.Range(0, BoardSize)
            .SelectMany(y => Enumerable.Range(0, BoardSize)
                .Select(x => new GridPoint(x, y)))
            .Where(point => !_snake.Contains(point))
            .ToList();

        if (available.Count == 0)
        {
            EndGame();
            return;
        }

        Food = available[_random.Next(available.Count)];
    }

    private void EndGame()
    {
        IsRunning = false;
        IsGameOver = true;
    }

    private static bool IsOpposite(Direction next, Direction current) =>
        (next, current) is
            (Direction.Up, Direction.Down) or
            (Direction.Down, Direction.Up) or
            (Direction.Left, Direction.Right) or
            (Direction.Right, Direction.Left);
}
