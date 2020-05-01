namespace WealthManager.Test.Actions
{
    using System.Net.Http;
    using System.Net.Http.Headers;
    using System.Net.Mime;
    using System.Text;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Mvc.Testing;
    using Newtonsoft.Json;

    public class WalletActions
    {
        private readonly WebApplicationFactory<Startup> applicationFactory;

        public WalletActions(WebApplicationFactory<Startup> applicationFactory)
        {
            this.applicationFactory = applicationFactory;
        }

        public Task<HttpResponseMessage> CreateAsync(string name, string userToken)
        {
            var content = new { Name = name };
            var client = this.applicationFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", userToken);
            return client.PostAsync(
                "wallet",
                new StringContent(
                    JsonConvert.SerializeObject(content),
                    Encoding.UTF8,
                    MediaTypeNames.Application.Json));
        }
    }
}