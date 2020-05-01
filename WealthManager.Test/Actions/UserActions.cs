namespace WealthManager.Test.Actions
{
    using System.Net.Http;
    using System.Net.Mime;
    using System.Text;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Mvc.Testing;
    using Newtonsoft.Json;

    public class UserActions
    {
        private readonly WebApplicationFactory<Startup> applicationFactory;

        public UserActions(WebApplicationFactory<Startup> applicationFactory)
        {
            this.applicationFactory = applicationFactory;
        }

        public Task CreateAsync(string userName, string password)
        {
            var client = this.applicationFactory.CreateClient();
            var content = JsonConvert.SerializeObject(new { username = userName, password = password });
            return client.PostAsync(
                "/user",
                new StringContent(content, Encoding.UTF8, MediaTypeNames.Application.Json));
        }

        public async Task<string> LoginAsync(string userName, string password)
        {
            
            var client = this.applicationFactory.CreateClient();
            var response = await client.PostAsync(
                "/authentication",
                new StringContent(
                    JsonConvert.SerializeObject(new { UserName = userName, Password = password }),
                    Encoding.UTF8,
                    MediaTypeNames.Application.Json));
            var rs = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync());
            return rs.token;
        }
    }
}