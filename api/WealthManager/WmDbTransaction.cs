namespace WealthManager
{
    using System.Threading.Tasks;
    using WealthManager.Repositories.Abstracts;

    public class WmDbTransaction : IWmDbTransaction
    {
        private readonly WealthManagerDbContext wealthManagerDbContext;

        public WmDbTransaction(WealthManagerDbContext wealthManagerDbContext)
        {
            this.wealthManagerDbContext = wealthManagerDbContext;
        }

        public Task CommitAsync()
        {
            return this.wealthManagerDbContext.SaveChangesAsync();
        }
    }
}