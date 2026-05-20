interface SectionShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  'data-section'?: string;
}

export function SectionShell({
  title,
  description,
  children,
  'data-section': dataSection,
}: SectionShellProps) {
  return (
    <div className="max-w-3xl mx-auto w-full" data-section={dataSection}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-zinc-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        )}
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}
