import { useEffect, useState } from 'react';

interface AIScoreGaugeProps {
  score: number; // 0-100
  confidence: number;
  modelUsed: string;
}

function getScoreColor(score: number): string {
  if (score <= 30) return 'var(--color-cyber-green)';
  if (score <= 69) return 'var(--color-cyber-yellow)';
  return 'var(--color-cyber-red)';
}

function getVerdict(score: number): string {
  if (score <= 30) return 'LIKELY AUTHENTIC';
  if (score <= 69) return 'INCONCLUSIVE';
  return 'LIKELY MANIPULATED';
}

export default function AIScoreGauge({ score, confidence, modelUsed }: AIScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const color = getScoreColor(score);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    let frame: number;
    let start: number | null = null;
    const duration = 1200;

    function animate(ts: number) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setAnimatedScore(Math.round(score * ease));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="border border-cyber-gray rounded-lg bg-cyber-charcoal p-4 flex flex-col items-center">
      <h3 className="text-sm font-bold tracking-widest text-cyber-green glow-text mb-4 self-start">
        [ AI DETECTION ]
      </h3>
      <div className="text-xs text-cyber-gray mb-3 self-start">{'='.repeat(36)}</div>

      {/* SVG Gauge */}
      <div className="relative w-40 h-40 my-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--color-cyber-gray)"
            strokeWidth="6"
          />
          {/* Score arc */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 0.1s linear',
              filter: `drop-shadow(0 0 6px ${color})`,
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl font-bold"
            style={{ color, textShadow: `0 0 10px ${color}` }}
          >
            {animatedScore}%
          </span>
          <span className="text-[10px] text-gray-500 tracking-wider mt-1">
            DEEPFAKE PROB.
          </span>
        </div>
      </div>

      {/* Verdict */}
      <p
        className="text-xs font-bold tracking-widest mt-2"
        style={{ color }}
      >
        {getVerdict(score)}
      </p>

      {/* Details */}
      <div className="mt-4 w-full space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">Confidence</span>
          <span className="text-cyber-green">{(confidence * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Model</span>
          <span className="text-gray-400">{modelUsed}</span>
        </div>
      </div>
    </div>
  );
}
