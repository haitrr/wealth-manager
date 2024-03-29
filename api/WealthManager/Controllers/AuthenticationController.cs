namespace WealthManager.Controllers
{
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Mvc;
    using WealthManager.Models;
    using WealthManager.Services.Abstracts;

    [Route("authentication")]
    public class AuthenticationController : Controller
    {
        private readonly IWmAuthenticationService authenticationService;

        public AuthenticationController(IWmAuthenticationService authenticationService)
        {
            this.authenticationService = authenticationService;
        }

        [HttpPost]
        public async Task<IActionResult> LoginAsync([FromBody] LoginDto loginDto)
        {
            var token = await this.authenticationService.LoginAsync(loginDto);
            CookieOptions options = new CookieOptions
            {
                Expires = DateTime.Now.AddDays(7),
                HttpOnly = true,
            };
            this.Response.Cookies.Append("token", token, options);
            return Ok(new { Token = token });
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            this.Response.Cookies.Delete("token");
            return Ok(new { });
        }
    }
}
