namespace WealthManager.Services.Abstracts
{
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using WealthManager.Models;

    public interface IWalletService
    {
        Task<int> CreateAsync(WalletCreateDto walletCreateDto);
        Task<IEnumerable<Wallet>> ListAsync();
    }
}