"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountCard } from "@/components/accounts/account-card";
import { AccountForm } from "@/components/accounts/account-form";
import {
  Account,
  Currency,
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  setDefaultAccount,
} from "@/lib/api/accounts";

export default function AccountsSettingsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["accounts"] });

  const createMutation = useMutation({ mutationFn: createAccount, onSuccess: invalidate });
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; currency?: Currency }) =>
      updateAccount(id, data),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({ mutationFn: deleteAccount, onSuccess: invalidate });
  const defaultMutation = useMutation({ mutationFn: setDefaultAccount, onSuccess: invalidate });

  function openAdd() {
    setEditingAccount(null);
    setFormOpen(true);
  }

  function openEdit(account: Account) {
    setEditingAccount(account);
    setFormOpen(true);
  }

  async function handleSubmit(data: { name: string; currency: Currency }) {
    if (editingAccount) {
      await updateMutation.mutateAsync({ id: editingAccount.id, ...data });
    } else {
      await createMutation.mutateAsync(data);
    }
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <Button onClick={openAdd} size="sm">
          <Plus className="size-4 mr-1" />
          Add Account
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

      {!isLoading && accounts.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No accounts yet. Add one to get started.
        </p>
      )}

      <div className="space-y-3">
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onEdit={openEdit}
            onSetDefault={(a) => defaultMutation.mutate(a.id)}
          />
        ))}
      </div>

      <AccountForm
        open={formOpen}
        account={editingAccount}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        onDelete={(a) => deleteMutation.mutate(a.id)}
      />
    </main>
  );
}
