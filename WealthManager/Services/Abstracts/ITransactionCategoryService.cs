namespace WealthManager.Services.Abstracts
{
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using WealthManager.Models;

    public interface ITransactionCategoryService
    {
        Task<IEnumerable<TransactionCategory>> ListAsync();
        Task<int> CreateAsync(TransactionCategoryCreateDto transactionCategoryCreateDto);
    }
}