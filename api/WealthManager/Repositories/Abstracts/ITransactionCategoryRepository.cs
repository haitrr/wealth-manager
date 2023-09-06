namespace WealthManager.Repositories.Abstracts
{
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using WealthManager.Models;

    public interface ITransactionCategoryRepository : IRepository<TransactionCategory>
    {
        Task<IEnumerable<TransactionCategory>> GetChildrenCategoriesAsync(int parentId);
        Task<IEnumerable<TransactionCategory>> GetDirectChildrenAsync(int parentId);
    }
}