namespace WealthManager.Controllers
{
    using System.Threading.Tasks;
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
    }

    public class UserCreateDto
    {
        public string UserName { get; set; }
        public string Password { get; set; }
    }
}