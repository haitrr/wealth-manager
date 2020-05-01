namespace WealthManager.Test.Features
{
    using System.Linq;
    using System.Net;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Mvc.Testing;
    using Microsoft.EntityFrameworkCore;
    using Microsoft.Extensions.DependencyInjection;
    using Newtonsoft.Json;
    using WealthManager.Models;
    using WealthManager.Test.Actions;
    using Xunit;

    public class CreateWalletTest : IClassFixture<WebApplicationFactory<Startup>>
    {
        private readonly WebApplicationFactory<Startup> applicationFactory;

        public CreateWalletTest(WebApplicationFactory<Startup> applicationFactory)
        {
            this.applicationFactory = applicationFactory;
        }

        [Fact]
        public async Task UserShouldAbleToCreateWallet()
        {
            var userAction = new UserActions(this.applicationFactory);
            await userAction.CreateAsync("hai", "hai");
            string token = await userAction.LoginAsync("hai", "hai");
            var walletAction = new WalletActions(this.applicationFactory);
            var response = await walletAction.CreateAsync("wallet", token);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            int id = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync()).id;
            using var scope = this.applicationFactory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<WealthManagerDbContext>();
            Wallet wallet = await dbContext.Wallets.Where(w => w.Id == id)
                .SingleAsync();
            Assert.Equal("wallet", wallet.Name);
        }
    }
}