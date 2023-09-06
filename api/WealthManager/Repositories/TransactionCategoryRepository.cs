namespace WealthManager.Repositories
{
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;
    using WealthManager.Models;
    using WealthManager.Repositories.Abstracts;

    public class TransactionCategoryRepository :
        BaseRepository<TransactionCategory>, ITransactionCategoryRepository 
    {
        public TransactionCategoryRepository(WealthManagerDbContext wealthManagerDbContext)
            : base(wealthManagerDbContext)
        {
        }

        public async Task<IEnumerable<TransactionCategory>> GetChildrenCategoriesAsync(int parentId)
        {
            var children = new Queue<int>();
            children.Enqueue(parentId);
            var results = new List<TransactionCategory>();
            while (children.Any())
            {
                var current = children.Dequeue();
                var thisChildren = await this.GetDirectChildrenAsync(current);
                var thisChildrenIds = thisChildren.Select(t => t.Id).ToList();
                results.AddRange(thisChildren);
                foreach (var id in thisChildrenIds)
                {
                    children.Enqueue(id);
                }
            }

            return results;
        }

        public async Task<IEnumerable<TransactionCategory>> GetDirectChildrenAsync(int parentId)
        {
            return await this.FindAsync(t => t.ParentId == parentId);
        }
    }
}