namespace WealthManager.Test.Features
{
    using System.Linq;
    using System.Net;
    using System.Net.Http;
    using System.Net.Mime;
    using System.Text;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Identity;
    using Microsoft.AspNetCore.Mvc.Testing;
    using Microsoft.EntityFrameworkCore;
    using Microsoft.Extensions.DependencyInjection;
    using Newtonsoft.Json;
    using WealthManager.Models;
    using Xunit;

    public class CreateUserTest : IClassFixture<WebApplicationFactory<Startup>>
    {
        private readonly WebApplicationFactory<Startup> applicationFactory;

        public CreateUserTest(WebApplicationFactory<Startup> applicationFactory)
        {
            this.applicationFactory = applicationFactory;
        }

        [Fact]
        public async Task ShouldWork()
        {
            var client = this.applicationFactory.CreateClient();
            var content = JsonConvert.SerializeObject(new { username = "hai", password = "hai" });
            var response = await client.PostAsync(
                "/user",
                new StringContent(content, Encoding.UTF8, MediaTypeNames.Application.Json));
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            using (var scope = this.applicationFactory.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<WealthManagerDbContext>();
                var user = await dbContext.Users.Where(u => u.UserName == "hai")
                    .SingleOrDefaultAsync();
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
                Assert.NotNull(user);
                Assert.True(await userManager.CheckPasswordAsync(user, "hai"));
            }
        }
    }
}