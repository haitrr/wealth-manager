namespace WealthManager.Services.Abstracts
{
    using System.Threading.Tasks;
    using WealthManager.Models;

    public interface IWalletService
    {
        Task<int> CreateAsync(WalletCreateDto walletCreateDto);
    }
}