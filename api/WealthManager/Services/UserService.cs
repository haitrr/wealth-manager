namespace WealthManager.Services
{
    using System;
    using System.Linq;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Identity;
    using Microsoft.EntityFrameworkCore;
    using WealthManager.Controllers;
    using WealthManager.Exceptions;
    using WealthManager.JwtToken;
    using WealthManager.Models;
    using WealthManager.Services.Abstracts;

    public class UserService : IUserService
    {
        private readonly ILoggedInUserInfoProvider loggedInUserInfoProvider;
        private readonly UserManager<User> userManager;

        public UserService(UserManager<User> userManager, ILoggedInUserInfoProvider loggedInUserInfoProvider)
        {
            this.userManager = userManager;
            this.loggedInUserInfoProvider = loggedInUserInfoProvider;
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

        public Task<User?> GetLoggedInUserAsync()
        {
            var loggedInUserInfo = this.loggedInUserInfoProvider.GetLoggedInUser();
            return this.userManager.Users.FirstOrDefaultAsync(user => user.Id == loggedInUserInfo.Id);
        }
    }
}
