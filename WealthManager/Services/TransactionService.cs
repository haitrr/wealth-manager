namespace WealthManager.Services
{
    using System.Collections.Generic;
    using System.Linq;
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
        private readonly ITransactionCategoryRepository transactionCategoryRepository;

        public TransactionService(
            ITransactionRepository transactionRepository,
            IWmDbTransaction wmDbTransaction,
            ILoggedInUserInfoProvider loggedInUserInfoProvider,
            IWalletRepository walletRepository,
            ITransactionCategoryRepository transactionCategoryRepository)
        {
            this.transactionRepository = transactionRepository;
            this.wmDbTransaction = wmDbTransaction;
            this.loggedInUserInfoProvider = loggedInUserInfoProvider;
            this.walletRepository = walletRepository;
            this.transactionCategoryRepository = transactionCategoryRepository;
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
                Amount = transactionCreateDto.Amount,
                UserId = user.Id,
                WalletId = transactionCreateDto.WalletId,
                CategoryId = transactionCreateDto.CategoryId,
            };
            this.transactionRepository.Create(newTransaction);
            await this.wmDbTransaction.CommitAsync();
            return newTransaction.Id;
        }

        public async Task<IEnumerable<Transaction>> ListAsync(TransactionQuery transactionQuery)
        {
            var query = PredicateBuilder.True<Transaction>();
            var user = this.loggedInUserInfoProvider.GetLoggedInUser();
            query = query.And(t => t.UserId == user.Id);
            if (transactionQuery.WalletId != null)
            {
                query = query.And(t => t.WalletId == transactionQuery.WalletId);
            }


            if (transactionQuery.CategoryId != null)
            {
                TransactionCategory category = await this.transactionCategoryRepository.GetByIdAsync(transactionQuery.CategoryId.Value);
                if (category == null || category.UserId != user.Id)
                {
                    throw new BadRequestException("Category is not exist");
                }
                var childCategories = await this.transactionCategoryRepository.GetChildrenCategoriesAsync(transactionQuery.CategoryId.Value);
                var allCategories = new List<TransactionCategory>(childCategories);
                allCategories.Add(category);
                var allIds = allCategories.Select(c => (int?)c.Id);
                query = query.And(t => allIds.Contains(t.CategoryId));
            }

            return await this.transactionRepository.FindAsync(query);
        }
    }
}