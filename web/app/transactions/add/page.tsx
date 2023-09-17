'use client';
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
    return <form onSubmit={addTransaction}>
        <input type="number" placeholder="Amount"/>
        <input type="select" placeholder="Categories"/>
        <input type="text" placeholder="Description"/>
        <button type="submit">Add Transaction</button>
    </form>
}

export default AddTransactionPage;