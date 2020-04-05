namespace WealthManager.Services
{
    using System.Linq;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Identity;
    using WealthManager.Controllers;
    using WealthManager.Exceptions;
    using WealthManager.Models;
    using WealthManager.Services.Abstracts;

    public class UserService : IUserService
    {
        private readonly UserManager<User> userManager;

        public UserService(UserManager<User> userManager)
        {
            this.userManager = userManager;
        }

        public async Task CreateAsync(UserCreateDto userCreateDto)
        {
            var user = new User { UserName = userCreateDto.UserName };
            var result = await this.userManager.CreateAsync(user, userCreateDto.Password);
            if (!result.Succeeded)
            {
                throw new BadRequestException(result.Errors.First().Description);
            }
        }
    }
}