namespace WealthManager.Models
{
    using System;

    public class TransactionCreateDto
    {
        public decimal Amount { get; set; }
        public int WalletId { get; set; }
        public int? CategoryId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
