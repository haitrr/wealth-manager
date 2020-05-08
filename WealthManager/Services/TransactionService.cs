namespace WealthManager.Services
{
    using System.Threading.Tasks;
    using WealthManager.Exceptions;
    using WealthManager.JwtToken;
    using WealthManager.Models;
    using WealthManager.Repositories.Abstracts;
    using WealthManager.Services.Abstracts;

    public class TransactionService : ITransactionService
    {
        private readonly ITransactionRepository transactionRepository;
        private readonly IWmDbTransaction wmDbTransaction;
        private readonly ILoggedInUserInfoProvider loggedInUserInfoProvider;
        private readonly IWalletRepository walletRepository;

        public TransactionService(
            ITransactionRepository transactionRepository,
            IWmDbTransaction wmDbTransaction,
            ILoggedInUserInfoProvider loggedInUserInfoProvider,
            IWalletRepository walletRepository)
        {
            this.transactionRepository = transactionRepository;
            this.wmDbTransaction = wmDbTransaction;
            this.loggedInUserInfoProvider = loggedInUserInfoProvider;
            this.walletRepository = walletRepository;
        }

        public async Task<int> CreateAsync(TransactionCreateDto transactionCreateDto)
        {
            var user = this.loggedInUserInfoProvider.GetLoggedInUser();
            var wallet = await this.walletRepository.GetByIdAsync(transactionCreateDto.WalletId);
            if (wallet.UserId != user.Id)
            {
                throw new ForbiddenException("Wallet not belong to user");
            }

            var newTransaction = new Transaction()
            {
                Amount = transactionCreateDto.Amount, UserId = user.Id, WalletId = transactionCreateDto.WalletId
            };
            this.transactionRepository.Create(newTransaction);
            await this.wmDbTransaction.CommitAsync();
            return newTransaction.Id;
        }
    }
}