interface ScoreBoardProps {
  score: number;
  total: number;
}

const ScoreBoard = ({ score, total }: ScoreBoardProps) => {
  return (
    <div className="flex items-center gap-4">
      <div className="score-badge">
        🏆 <span>{score}</span> / <span>{total}</span>
      </div>
    </div>
  );
};

export default ScoreBoard;
