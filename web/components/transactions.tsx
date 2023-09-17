import useTransactionCategories from "@/app/hooks/useTransactionCategories"
import useTransactions from "@/app/hooks/useTransactions"

const Transactions = () => {
    const [transactions] = useTransactions()
    const [categories] = useTransactionCategories()
    const getCategoryName = (id) => {
        const category = categories.find((category) => category.id === id)
        if(category) {
            return category.name
        }
        return "Unknown"
    }
    return <div>
        <h1>Transactions</h1>
        {transactions.map((transaction) => {
            return <div key={transaction.id}>{transaction.amount} - {getCategoryName(transaction.categoryId)}</div>
        })}
        </div>
}

export default Transactions;