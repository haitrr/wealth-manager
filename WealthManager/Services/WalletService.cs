namespace WealthManager.Services
{
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using WealthManager.JwtToken;
    using WealthManager.Models;
    using WealthManager.Repositories.Abstracts;
    using WealthManager.Services.Abstracts;

    public class WalletService : IWalletService
    {
        private readonly ILoggedInUserInfoProvider loggedInUserInfoProvider;
        private readonly IWalletRepository walletRepository;
        private readonly IWmDbTransaction wmDbTransaction;

        public WalletService(
            ILoggedInUserInfoProvider loggedInUserInfoProvider,
            IWalletRepository walletRepository,
            IWmDbTransaction wmDbTransaction)
        {
            this.loggedInUserInfoProvider = loggedInUserInfoProvider;
            this.walletRepository = walletRepository;
            this.wmDbTransaction = wmDbTransaction;
        }

        public async Task<int> CreateAsync(WalletCreateDto walletCreateDto)
        {
            var user = this.loggedInUserInfoProvider.GetLoggedInUser();
            var wallet = new Wallet() { UserId = user.Id, Name = walletCreateDto.Name };
            this.walletRepository.Create(wallet);
            await this.wmDbTransaction.CommitAsync();
            return wallet.Id;
        }

        public Task<IEnumerable<Wallet>> ListAsync()
        {
            return this.walletRepository.FindAsync();
        }
    }
}