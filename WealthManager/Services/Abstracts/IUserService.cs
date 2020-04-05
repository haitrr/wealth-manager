namespace WealthManager.Services.Abstracts
{
    using System.Threading.Tasks;
    using WealthManager.Controllers;

    public interface IUserService
    {
        Task CreateAsync(UserCreateDto userCreateDto);
    }
}