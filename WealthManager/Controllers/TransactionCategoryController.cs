namespace WealthManager.Controllers
{
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Mvc;
    using WealthManager.Models;
    using WealthManager.Services.Abstracts;

    [Route("transaction-categories")]
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
            return this.Ok(new { Items= categories });
        }
    }
}
