namespace WealthManager.JwtToken
{
    using Microsoft.AspNetCore.Http;
    using WealthManager.Models;

    public interface ILoggedInUserInfoProvider
    {
        LoggedInUser GetLoggedInUser();
    }

    public class LoggedInUserInfoProvider : ILoggedInUserInfoProvider
    {
        private readonly IHttpContextAccessor httpContextAccessor;

        public LoggedInUserInfoProvider(IHttpContextAccessor httpContextAccessor)
        {
            this.httpContextAccessor = httpContextAccessor;
        }

        public LoggedInUser GetLoggedInUser()
        {
            var userId = int.Parse(
                this.httpContextAccessor.HttpContext.User.FindFirst(Constants.UserIdClaimType)
                    .Value);
            return new LoggedInUser() { Id = userId };
        }
    }
}