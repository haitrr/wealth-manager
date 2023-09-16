import { getTransactions } from "@/api"
import { useState } from "react"
import { useQuery } from "react-query"

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
    return <div>
        <h1>Transactions</h1>
        {transactions.map((transaction) => {
            return <div>{transaction.amount} - {transaction.categoryId}</div>
        })}
        </div>
}

export default Transactions;