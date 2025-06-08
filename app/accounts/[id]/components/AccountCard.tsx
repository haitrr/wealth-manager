interface AccountCardProps {
  title: string;
  emoji: string;
  badge: string;
  titleColor: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function AccountCard({ title, emoji, badge, titleColor, children, actions }: AccountCardProps) {
  return (
    <div className="bg-card border-border border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className={`text-2xl font-bold ${titleColor} flex items-center gap-2`}>
          {emoji} {title}
        </h1>
        <div className="flex items-center gap-3">
          {actions}
          <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
            {badge}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}