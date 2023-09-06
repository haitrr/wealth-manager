namespace WealthManager.Repositories
{
    using WealthManager.Models;
    using WealthManager.Repositories.Abstracts;

    public class TransactionRepository : BaseRepository<Transaction>, ITransactionRepository
    {
        public TransactionRepository(WealthManagerDbContext wealthManagerDbContext)
            : base(wealthManagerDbContext)
        {
        }
    }
}