'use client';

import { addTransaction } from "@/api";
import useTransactionCategories from "@/app/hooks/useTransactionCategories";
import useWallets from "@/app/hooks/useWallets";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "react-query";

const AddTransactionPage = () => {
    return (
        <div>
            <h1>Add Transaction</h1>
            <AddTransactionForm/>
        </div>
    )
}

const AddTransactionForm = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({});
    const handleChange = (e) => {
        e.preventDefault();
        const {name, value} = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    }

    const {mutate} = useMutation('addTransaction', async () => {
        await addTransaction(formData.amount, formData.categoryId, formData.walletId, formData.description);
        router.push('/transactions');
    })

    const handleSubmit = (e) => {
        e.preventDefault();
        mutate()
    }
    const [categories] = useTransactionCategories()
    const [wallets] = useWallets()
    return <form onSubmit={handleSubmit} >
        <input type="number" placeholder="Amount" name="amount" onChange={handleChange}/>
        <select placeholder="Categories" name="categoryId" onChange={handleChange}>
            {categories.map((category) => {
                return <option key={category.id} value={category.id}>{category.name}</option>
            })}
            </select>
        <select placeholder="Wallets" name="walletId" onChange={handleChange}>
            {wallets.map((wallet) => {
                return <option key={wallet.id} value={wallet.id}>{wallet.name}</option>
            })}
            </select>
        <input type="text" placeholder="Description" onChange={handleChange}/>
        <button type="submit">Add Transaction</button>
    </form>
}

export default AddTransactionPage;