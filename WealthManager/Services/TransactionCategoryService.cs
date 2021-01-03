namespace WealthManager.Services
{
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;
    using Microsoft.EntityFrameworkCore;
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

        public async Task<IEnumerable<TransactionCategory>> ListAsync()
        {
            var user = this.loggedInUserInfoProvider.GetLoggedInUser();
            return await this.transactionCategoryRepository.Query()
                .Where(t => t.UserId == user.Id)
                .OrderBy(t => t.Name)
                .ToListAsync();
        }

        public async Task<int> CreateAsync(
            TransactionCategoryCreateDto transactionCategoryCreateDto)
        {
            var user = this.loggedInUserInfoProvider.GetLoggedInUser();
            var validParent = transactionCategoryCreateDto.ParentId == null ||
                              await this.transactionCategoryRepository.AnyAsync(
                                  c => c.Id == transactionCategoryCreateDto.ParentId &&
                                       c.UserId == user.Id);
            if (!validParent)
            {
                throw new BadRequestException("Invalid parent category");
            }

            var transactionCategory = new TransactionCategory(
                transactionCategoryCreateDto.Name,
                transactionCategoryCreateDto.iconName,
                transactionCategoryCreateDto.type,
                user.Id) { ParentId = transactionCategoryCreateDto.ParentId };

            this.transactionCategoryRepository.Create(transactionCategory);
            await this.wmDbTransaction.CommitAsync();
            return transactionCategory.Id;
        }
    }
}
