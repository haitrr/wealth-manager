namespace WealthManager.Services.Abstracts
{
    using System.Threading.Tasks;
    using WealthManager.Models;

    public interface IWmAuthenticationService
    {
        Task<string> LoginAsync(LoginDto loginDto);
    }
}