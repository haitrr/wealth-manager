namespace WealthManager.Repositories
{
    using WealthManager.Models;
    using WealthManager.Repositories.Abstracts;

    public class WalletRepository : BaseRepository<Wallet>, IWalletRepository
    {
        public WalletRepository(WealthManagerDbContext wealthManagerDbContext)
            : base(wealthManagerDbContext)
        {
        }
    }
}