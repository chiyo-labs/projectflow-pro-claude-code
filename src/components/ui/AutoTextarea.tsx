'use client';

import { useEffect, useRef } from 'react';

interface AutoTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  readOnly?: boolean;
  className?: string;
}

export function AutoTextarea({
  value,
  onChange,
  placeholder,
  minRows = 3,
  readOnly = false,
  className = '',
}: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const minHeight = `${minRows * 1.625}rem`;

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      style={{ minHeight }}
      className={`
        w-full resize-none rounded-lg border border-zinc-200 bg-white px-4 py-3
        text-base text-zinc-900 placeholder:text-zinc-400
        focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100
        read-only:bg-zinc-50 read-only:text-zinc-700 read-only:border-zinc-100
        transition-colors overflow-hidden leading-relaxed
        ${className}
      `}
    />
  );
}
