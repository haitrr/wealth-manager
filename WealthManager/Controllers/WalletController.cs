namespace WealthManager.Controllers
{
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;
    using Newtonsoft.Json.Serialization;
    using WealthManager.Models;
    using WealthManager.Services.Abstracts;

    [Authorize]
    [Route("wallets")]
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

        [HttpGet]
        public async Task<IActionResult> ListAsync()
        {
            IEnumerable<Wallet> wallets = await this.walletService.ListAsync();
            return this.Ok(new { Items = wallets });
        }
        
        [HttpGet("{id}")]
        public async Task<IActionResult> GetByIdAsync([FromRoute] int id)
        {
            var wallet = await this.walletService.GetByIdAsync(id);
            return this.Ok(wallet);
        }
    }
}