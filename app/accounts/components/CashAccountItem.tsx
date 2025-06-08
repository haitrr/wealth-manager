import { Account } from "@prisma/client";

interface CashAccountItemProps {
  account: Account;
  onClick: (id: string) => void;
}

export function CashAccountItem({ account, onClick }: CashAccountItemProps) {
  console.log(account);
  return (
    <li
      className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-card border-border"
      onClick={() => onClick(account.id)}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">💰 {account.name}</h3>
          {account.default && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full font-medium flex items-center gap-1">
              Default
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm bg-secondary text-secondary-foreground px-2 py-1 rounded">Cash</span>
        </div>
      </div>
      <div className="text-muted-foreground">
        <p className="text-sm">Click to view details and transactions</p>
      </div>
    </li>
  );
}