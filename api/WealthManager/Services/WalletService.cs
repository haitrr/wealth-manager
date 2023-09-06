namespace WealthManager.Services
{
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using WealthManager.Exceptions;
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
            var user = this.loggedInUserInfoProvider.GetLoggedInUser();
            return this.walletRepository.FindAsync(wallet => wallet.UserId == user.Id);
        }

        public async Task<Wallet> GetByIdAsync(int id)
        {
            var user = this.loggedInUserInfoProvider.GetLoggedInUser();
            var wallet = await this.walletRepository.GetByIdAsync(id);
            if (wallet == null || wallet.UserId != user.Id)
            {
                throw new NotFoundException("Wallet not found");
            }

            return wallet;
        }
    }
}