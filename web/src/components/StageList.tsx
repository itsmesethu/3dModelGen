import { CheckCircle, Circle, AlertCircle, Loader } from 'lucide-react';
import type { StageStatus } from '../services/reconstruction';

interface StageListProps {
  stages: StageStatus[];
}

export default function StageList({ stages }: StageListProps) {
  return (
    <div className="space-y-3">
      {stages.map(stage => (
        <div key={stage.key} className="flex items-center gap-3">
          {stage.state === 'done' && <CheckCircle size={20} className="text-green-500" />}
          {stage.state === 'running' && <Loader size={20} className="text-blue-500 animate-spin" />}
          {stage.state === 'waiting' && <Circle size={20} className="text-slate-500" />}
          {stage.state === 'failed' && <AlertCircle size={20} className="text-red-500" />}
          <span
            className={`text-sm font-medium ${
              stage.state === 'running'
                ? 'text-blue-400'
                : stage.state === 'done'
                  ? 'text-green-400'
                  : stage.state === 'failed'
                    ? 'text-red-400'
                    : 'text-slate-400'
            }`}
          >
            {stage.label}
          </span>
        </div>
      ))}
    </div>
  );
}
