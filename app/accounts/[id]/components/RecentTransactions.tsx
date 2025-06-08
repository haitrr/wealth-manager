"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TransactionItem } from "@/app/TransactionItem";
import { TransactionWithCategory } from "@/utils/types";

interface RecentTransactionsProps {
  accountId: string;
  transactions: TransactionWithCategory[];
}

export function RecentTransactions({ accountId, transactions: initialTransactions }: RecentTransactionsProps) {
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>(initialTransactions);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(initialTransactions.length);
  const observer = useRef<IntersectionObserver>();

  const loadMoreTransactions = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/accounts/${accountId}/transactions?limit=20&offset=${offset}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      
      const data = await response.json();
      const newTransactions = data.transactions || [];
      
      if (newTransactions.length === 0) {
        setHasMore(false);
      } else {
        setTransactions(prev => [...prev, ...newTransactions]);
        setOffset(prev => prev + newTransactions.length);
      }
    } catch (error) {
      console.error('Error loading more transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [accountId, offset, loading, hasMore]);

  const lastTransactionElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreTransactions();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadMoreTransactions]);

  return (
    <div className="bg-card rounded-lg shadow-sm border p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Transactions</h2>
      </div>

      {transactions.length === 0 && !loading ? (
        <p className="text-muted-foreground text-center py-8">No transactions found for this account.</p>
      ) : (
        <div className="space-y-0 border rounded-lg overflow-hidden">
          {transactions.map((transaction, index) => (
            <div 
              key={transaction.id}
              ref={index === transactions.length - 1 ? lastTransactionElementRef : null}
            >
              <TransactionItem transaction={transaction} />
            </div>
          ))}
          
          {loading && (
            <div className="p-4 text-center">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                Loading more transactions...
              </div>
            </div>
          )}
          
          {!hasMore && transactions.length > 0 && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No more transactions to load
            </div>
          )}
        </div>
      )}
    </div>
  );
}