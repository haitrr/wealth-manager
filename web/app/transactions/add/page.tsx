'use client';

import useTransactionCategories from "@/app/hooks/useTransactionCategories";

const AddTransactionPage = () => {
    return (
        <div>
            <h1>Add Transaction</h1>
            <AddTransactionForm/>
        </div>
    )
}

const AddTransactionForm = () => {
    const addTransaction = () => {

    }
    const [categories] = useTransactionCategories()
    return <form onSubmit={addTransaction}>
        <input type="number" placeholder="Amount"/>
        <select placeholder="Categories">
            {categories.map((category) => {
                return <option key={category.id} value={category.id}>{category.name}</option>
            })}
            </select>
        <input type="text" placeholder="Description"/>
        <button type="submit">Add Transaction</button>
    </form>
}

export default AddTransactionPage;