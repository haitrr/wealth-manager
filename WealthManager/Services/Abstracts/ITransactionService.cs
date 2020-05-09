namespace WealthManager.Services.Abstracts
{
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using WealthManager.Models;

    public interface ITransactionService
    {
        Task<int> CreateAsync(TransactionCreateDto transactionCreateDto);
        Task<IEnumerable<Transaction>> ListAsync(TransactionQuery transactionQuery);
    }
}