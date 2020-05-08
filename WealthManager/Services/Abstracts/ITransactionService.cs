namespace WealthManager.Services.Abstracts
{
    using System.Threading.Tasks;
    using WealthManager.Models;

    public interface ITransactionService
    {
        Task<int> CreateAsync(TransactionCreateDto transactionCreateDto);
    }
}