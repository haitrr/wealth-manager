namespace WealthManager.Controllers
{
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;
    using WealthManager.Models;
    using WealthManager.Services.Abstracts;

    [Authorize]
    [Route("wallet")]
    public class WalletController : Controller
    {
        private readonly IWalletService walletService;

        public WalletController(IWalletService walletService)
        {
            this.walletService = walletService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateAsync([FromBody]WalletCreateDto walletCreateDto)
        {
            int id = await this.walletService.CreateAsync(walletCreateDto);
            return this.Ok(new { Id = id });
        }
    }
}