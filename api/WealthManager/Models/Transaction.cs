namespace WealthManager.Models
{
    using System;

    public class Transaction
    {
        public int WalletId { get; set; }
        public int UserId { get; set; }
        public decimal Amount { get; set; }
        public int Id { get; set; }
        public int? CategoryId { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CategoryType { get; set; }
    }
}
