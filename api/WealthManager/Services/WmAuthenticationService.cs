namespace WealthManager.Services
{
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Identity;
    using WealthManager.Exceptions;
    using WealthManager.JwtToken;
    using WealthManager.Models;
    using WealthManager.Services.Abstracts;

    public class WmAuthenticationService : IWmAuthenticationService
    {
        private readonly UserManager<User> userManager;
        private readonly IJwtTokenGenerator jwtTokenGenerator;

        public WmAuthenticationService(UserManager<User> userManager, IJwtTokenGenerator jwtTokenGenerator)
        {
            this.userManager = userManager;
            this.jwtTokenGenerator = jwtTokenGenerator;
        }

        public async Task<string> LoginAsync(LoginDto loginDto)
        {
            User user = await this.userManager.FindByNameAsync(loginDto.UserName);
            if (user == null)
            {
                throw new BadRequestException("User not exist.");
            }

            if (await this.userManager.CheckPasswordAsync(user, loginDto.Password))
            {
                return this.jwtTokenGenerator.Generate(user);
            }
            else
            {
                throw new BadRequestException("Username and password not match");
            }
        }
    }
}