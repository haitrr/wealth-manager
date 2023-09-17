import { getTransactionCategories } from "@/api"
import { useState } from "react"
import { useQuery } from "react-query"

const useTransactionCategories = () => {
    const [categories, setCategories] = useState([])
    useQuery('transactionCategories', async () => {
        try {

        const data = await getTransactionCategories()
        setCategories(data["items"])
        }
        catch {
            setCategories([])
        }
    })
    return [categories]
}


export default useTransactionCategories;