namespace WealthManager.Controllers
{
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;
    using WealthManager.Services.Abstracts;

    [Route("/user")]
    public class UserController : Controller
    {
        private IUserService userService;

        public UserController(IUserService userService)
        {
            this.userService = userService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateAsync([FromBody]UserCreateDto userCreateDto)
        {
            await this.userService.CreateAsync(userCreateDto);
            return this.Ok();
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetAsync()
        {
            var user = await this.userService.GetLoggedInUserAsync();
            if(user == null)
            {
                return this.Unauthorized(new {});
            }
            return this.Ok(user.SerializeAuthView());
        }

    }

    public class UserCreateDto
    {
        public string UserName { get; set; }
        public string Password { get; set; }
    }
}
