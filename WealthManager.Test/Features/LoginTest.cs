namespace WealthManager.Test.Features
{
    using System.Net;
    using System.Net.Http;
    using System.Net.Mime;
    using System.Text;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Identity;
    using Microsoft.AspNetCore.Mvc.Testing;
    using Microsoft.Extensions.DependencyInjection;
    using Newtonsoft.Json;
    using WealthManager.Models;
    using Xunit;

    public class LoginTest : IClassFixture<WebApplicationFactory<Startup>>
    {
        private readonly WebApplicationFactory<Startup> factory;

        public LoginTest(WebApplicationFactory<Startup> factory)
        {
            this.factory = factory;
        }

        [Fact]
        public async Task ShouldAbleToLogin()
        {
            var client = this.factory.CreateClient();
            await client.PostAsync(
                "/user",
                new StringContent(
                    JsonConvert.SerializeObject(new { UserName = "hai", Password = "hai" }),
                    Encoding.UTF8,
                    MediaTypeNames.Application.Json));

            var response = await client.PostAsync(
                "/authentication",
                new StringContent(
                    JsonConvert.SerializeObject(new { UserName = "hai", Password = "hai" }),
                    Encoding.UTF8,
                    MediaTypeNames.Application.Json));
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var rs = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync());
            Assert.NotNull(rs.token);
        }
    }
}