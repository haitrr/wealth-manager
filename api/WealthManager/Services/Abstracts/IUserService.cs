namespace WealthManager.Services.Abstracts
{
    using System.Threading.Tasks;
    using WealthManager.Controllers;
    using WealthManager.Models;

    public interface IUserService
    {
        Task CreateAsync(UserCreateDto userCreateDto);
        Task<User?> GetLoggedInUserAsync();
    }
}
