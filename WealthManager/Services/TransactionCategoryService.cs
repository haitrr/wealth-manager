namespace WealthManager.Services
{
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using WealthManager.Models;
    using WealthManager.Repositories.Abstracts;
    using WealthManager.Services.Abstracts;

    public class TransactionCategoryService : ITransactionCategoryService
    {
        private readonly ITransactionCategoryRepository transactionCategoryRepository;

        public TransactionCategoryService(ITransactionCategoryRepository transactionCategoryRepository)
        {
            this.transactionCategoryRepository = transactionCategoryRepository;
        }

        public Task<IEnumerable<TransactionCategory>> ListAsync()
        {
            return this.transactionCategoryRepository.FindAsync();
        }
    }
}