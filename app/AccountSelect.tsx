"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Account } from "@prisma/client";

type Props = {
  accounts: Account[];
  className?: string;
  value?: string;
  onChange: (value: string) => void;
};

const AccountSelect = ({
  accounts,
  className,
  value,
  onChange,
  ...props
}: Props) => {
  return (
    <Select {...props} value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select account" />
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            {account.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default AccountSelect;
