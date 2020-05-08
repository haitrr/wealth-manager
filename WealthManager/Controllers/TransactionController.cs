namespace WealthManager.Controllers
{
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;
    using WealthManager.Models;
    using WealthManager.Services.Abstracts;

    [Route("transactions")]
    [Authorize]
    public class TransactionController : Controller
    {
        private readonly ITransactionService transactionService;

        public TransactionController(ITransactionService transactionService)
        {
            this.transactionService = transactionService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateAsync([FromBody]TransactionCreateDto transactionCreateDto)
        {
            int id = await this.transactionService.CreateAsync(transactionCreateDto);
            return Ok(new { Id = id });
        }
    }
}