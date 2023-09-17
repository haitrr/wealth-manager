import { getWallets } from "@/api"
import { useState } from "react"
import { useQuery } from "react-query"

const useWallets = () => {
    const [wallets, setWallets] = useState([])
    useQuery('wallets', async () => {
        try {

        const data = await getWallets()
        setWallets(data["items"])
        }
        catch {
            setWallets([])
        }
    })
    return [wallets]
}


export default useWallets;