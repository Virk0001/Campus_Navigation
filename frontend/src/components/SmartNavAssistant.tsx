import { FormEvent, memo, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Location, Event } from '../types';
import { cn } from '../utils';
import {
  SmartNavAssistantResult,
  SmartNavAssistantService,
} from '../services/smartNavAssistantService';

interface SmartNavAssistantProps {
  locations: Location[];
  events: Event[];
  onApply: (result: SmartNavAssistantResult) => void;
  className?: string;
}

const SmartNavAssistant = memo<SmartNavAssistantProps>(({
  locations,
  events,
  onApply,
  className,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const hasData = useMemo(
    () => Array.isArray(locations) && locations.length > 0,
    [locations]
  );

  const runAssistant = async (nextPrompt: string) => {
    const trimmedPrompt = nextPrompt.trim();
    if (!trimmedPrompt || !hasData) return;

    setIsThinking(true);

    try {
      const nextResult = await SmartNavAssistantService.interpret(trimmedPrompt, locations, events);
      onApply(nextResult);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runAssistant(prompt);
  };

  return (
    <div
      className={cn('card overflow-hidden', className)}
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 248, 0.95), rgba(240, 253, 250, 0.92))',
        borderColor: 'rgba(16, 185, 129, 0.25)',
      }}
    >
      <div className="border-b border-emerald-100 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900">Ask SmartNav</h3>
            <p className="mt-1 text-sm text-gray-600">
              Use plain English to search the map, filter events, or create a route.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 py-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={3}
            placeholder="Try: take me from main gate to library"
            className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-gray-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
          />

          <button
            type="submit"
            disabled={isThinking || !prompt.trim() || !hasData}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isThinking ? 'Thinking...' : 'Apply to Map'}
          </button>
        </form>
      </div>
    </div>
  );
});

SmartNavAssistant.displayName = 'SmartNavAssistant';

export default SmartNavAssistant;
