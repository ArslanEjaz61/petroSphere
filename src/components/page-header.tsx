type Props = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
};

export function PageHeader({ title, description, actions, tabs }: Props) {
  return (
    <div className="border-b border-border bg-panel">
      <div className="flex items-start justify-between gap-4 px-5 py-3.5">
        <div className="space-y-0.5 min-w-0">
          <h1 className="text-[17px] font-semibold tracking-tight truncate leading-tight">{title}</h1>
          {description && <p className="text-[12px] text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {tabs && <div className="px-5">{tabs}</div>}
    </div>
  );
}
