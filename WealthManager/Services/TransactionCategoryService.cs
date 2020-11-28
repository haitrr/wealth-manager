namespace WealthManager.Services
{
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using WealthManager.Exceptions;
    using WealthManager.JwtToken;
    using WealthManager.Models;
    using WealthManager.Repositories.Abstracts;
    using WealthManager.Services.Abstracts;

    public class TransactionCategoryService : ITransactionCategoryService
    {
        private readonly ITransactionCategoryRepository transactionCategoryRepository;
        private readonly ILoggedInUserInfoProvider loggedInUserInfoProvider;
        private readonly IWmDbTransaction wmDbTransaction;

        public TransactionCategoryService(
            ITransactionCategoryRepository transactionCategoryRepository,
            ILoggedInUserInfoProvider loggedInUserInfoProvider,
            IWmDbTransaction wmDbTransaction)
        {
            this.transactionCategoryRepository = transactionCategoryRepository;
            this.loggedInUserInfoProvider = loggedInUserInfoProvider;
            this.wmDbTransaction = wmDbTransaction;
        }

        public Task<IEnumerable<TransactionCategory>> ListAsync()
        {
            var user = this.loggedInUserInfoProvider.GetLoggedInUser();
            return this.transactionCategoryRepository.FindAsync(t => t.UserId == user.Id);
        }

        public async Task<int> CreateAsync(TransactionCategoryCreateDto transactionCategoryCreateDto)
        {
            var user = this.loggedInUserInfoProvider.GetLoggedInUser();
            var validParent = transactionCategoryCreateDto.ParentId == null ||
                              await this.transactionCategoryRepository.AnyAsync(
                                  c => c.Id == transactionCategoryCreateDto.ParentId && c.UserId == user.Id);
            if (!validParent)
            {
                throw new BadRequestException("Invalid parent category");
            }

            var transactionCategory = new TransactionCategory()
            {
                Name = transactionCategoryCreateDto.Name,
                ParentId = transactionCategoryCreateDto.ParentId,
                UserId = user.Id
            };

            this.transactionCategoryRepository.Create(transactionCategory);
            await this.wmDbTransaction.CommitAsync();
            return transactionCategory.Id;
        }
    }
}