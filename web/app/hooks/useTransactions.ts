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

export default useTransactions;