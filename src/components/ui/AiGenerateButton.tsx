'use client';

interface AiGenerateButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
  label: string;
  disabledReason?: string;
  className?: string;
}

function SparkleIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function AiGenerateButton({
  onClick,
  isLoading,
  disabled = false,
  label,
  disabledReason,
  className = '',
}: AiGenerateButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <div className={`relative inline-flex flex-col items-start gap-1 ${className}`}>
      <button
        type="button"
        onClick={onClick}
        disabled={isDisabled}
        title={disabled && disabledReason ? disabledReason : undefined}
        className={`
          inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium
          border transition-colors min-h-[2.75rem]
          ${isDisabled
            ? 'bg-zinc-50 border-zinc-200 text-zinc-400 cursor-not-allowed'
            : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 cursor-pointer'
          }
        `}
      >
        {isLoading ? <Spinner /> : <SparkleIcon />}
        <span>{isLoading ? '生成中...' : label}</span>
      </button>
      {disabled && disabledReason && (
        <p className="text-xs text-zinc-400 pl-1">{disabledReason}</p>
      )}
    </div>
  );
}
