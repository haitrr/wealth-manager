namespace WealthManager.Services
{
    using System;
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
            TransactionCategory category = null;
            if (transactionCreateDto.CategoryId != null)
            {
                category =
                    await this.transactionCategoryRepository.GetByIdAsync(
                        transactionCreateDto.CategoryId.Value);
            }

            var transactionType = TransactionCategoryType.Expense;
            if (category != null)
            {
                transactionType = category.Type;
            }

            if (wallet.UserId != user.Id)
            {
                throw new ForbiddenException("Wallet not belong to user");
            }

            if (wallet.Balance < transactionCreateDto.Amount)
            {
                throw new BadRequestException("Balance in wallet not enought");
            }

            var newTransaction = new Transaction()
            {
                Amount = transactionCreateDto.Amount,
                UserId = user.Id,
                WalletId = transactionCreateDto.WalletId,
                CategoryId = transactionCreateDto.CategoryId,
                CreatedAt = transactionCreateDto.CreatedAt,
                CategoryType = transactionType,
            };
            if (transactionType == TransactionCategoryType.Expense)
            {
                wallet.Balance -= transactionCreateDto.Amount;
            }
            else if (transactionType == TransactionCategoryType.Income)
            {
                wallet.Balance += transactionCreateDto.Amount;
            }
            else
            {
                throw new NotSupportedException("Transaction category type not supported");
            }

            this.transactionRepository.Create(newTransaction);
            this.walletRepository.Update(wallet);
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
                TransactionCategory category =
                    await this.transactionCategoryRepository.GetByIdAsync(
                        transactionQuery.CategoryId.Value);
                if (category == null || category.UserId != user.Id)
                {
                    throw new BadRequestException("Category is not exist");
                }

                var childCategories =
                    await this.transactionCategoryRepository.GetChildrenCategoriesAsync(
                        transactionQuery.CategoryId.Value);
                var allCategories = new List<TransactionCategory>(childCategories);
                allCategories.Add(category);
                var allIds = allCategories.Select(c => (int?)c.Id);
                query = query.And(t => allIds.Contains(t.CategoryId));
            }

            if (transactionQuery.DateFrom != null)
            {
                query = query.And(t => t.CreatedAt >= transactionQuery.DateFrom);
            }

            if (transactionQuery.DateTo != null)
            {
                query = query.And(t => t.CreatedAt <= transactionQuery.DateTo);
            }

            return await this.transactionRepository.FindAsync(query);
        }
    }
}
