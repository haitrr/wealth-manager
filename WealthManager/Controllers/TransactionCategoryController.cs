namespace WealthManager.Controllers
{
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;
    using WealthManager.Models;
    using WealthManager.Services.Abstracts;

    [Route("transaction-categories")]
    [Authorize]
    public class TransactionCategoryController : Controller
    {
        private readonly ITransactionCategoryService transactionCategoryService;

        public TransactionCategoryController(ITransactionCategoryService transactionCategoryService)
        {
            this.transactionCategoryService = transactionCategoryService;
        }

        [HttpGet]
        public async Task<IActionResult> ListAsync()
        {
            IEnumerable<TransactionCategory> categories = await this.transactionCategoryService.ListAsync();
            return this.Ok(new { Items = categories });
        }

        [HttpPost]
        public async Task<IActionResult> CreateAsync(
            [FromBody] TransactionCategoryCreateDto transactionCategoryCreateDto)
        {
            int id = await this.transactionCategoryService.CreateAsync(transactionCategoryCreateDto);
            return this.Ok(new { Id = id });
        }
    }
}