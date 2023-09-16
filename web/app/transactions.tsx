import { getTransactionCategories, getTransactions } from "@/api"
import { useState } from "react"
import { useQuery } from "react-query"

const useTransactionCategories = () => {
    const [categories, setCategories] = useState([])
    useQuery('transactionCategories', async () => {
        try {

        const data = await getTransactionCategories()
        console.log(data)
        setCategories(data["items"])
        }
        catch {
            setCategories([])
        }
    })
    return [categories]
}

const useTransactions = () => {
    const [transactions, setTransactions] = useState([])
    useQuery('transactions', async () => {
        try {

        const data = await getTransactions()
        console.log(data)
        setTransactions(data["items"])
        }
        catch {
            setTransactions([])
        }
    })
    return [transactions]
} 
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
            return <div>{transaction.amount} - {getCategoryName(transaction.categoryId)}</div>
        })}
        </div>
}

export default Transactions;