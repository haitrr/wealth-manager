namespace WealthManager.DbSeeders
{
    using System;
    using System.Linq;
    using Microsoft.AspNetCore.Identity;
    using Microsoft.Extensions.Logging;
    using WealthManager.DbSeeders.Abstract;
    using WealthManager.Models;

    public class DbSeeder : IDbSeeder
    {
        private readonly WealthManagerDbContext dbContext;
        private readonly UserManager<User> userManager;
        private readonly ILogger<DbSeeder> logger;

        public DbSeeder(WealthManagerDbContext dbContext, UserManager<User> userManager, ILogger<DbSeeder> logger)
        {
            this.dbContext = dbContext;
            this.userManager = userManager;
            this.logger = logger;
        }

        public void Seed()
        {
            string userName = "hai";
            var user = this.dbContext.Users.SingleOrDefault(u => u.UserName == userName);
            if (user != null)
            {
                this.logger.LogInformation("User hai exists. Skip seeding database");
                return;
            }
            else
            {
                user = new User { UserName = userName };
            }

            this.logger.LogInformation("Start seeding database");
            this.logger.LogInformation("Create user hai");
            string passwordVar = "WM_PASSWORD";
            string? password = Environment.GetEnvironmentVariable(passwordVar);
            if (password == null)
            {
                this.logger.LogWarning(
                    $"Environment variable {passwordVar} not found, using default password {userName}");
                password = userName;
            }

            var result = this.userManager.CreateAsync(user, password)
                .GetAwaiter()
                .GetResult();
            if (!result.Succeeded)
            {
                this.logger.LogError("Fail to create test user");
                this.logger.LogError(
                    result.Errors.First()
                        .Description);
                return;
            }

            this.logger.LogInformation("Created test user");
        }
    }
}