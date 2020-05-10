namespace WealthManager.Models
{
    public class TransactionCreateDto
    {
        public decimal Amount { get; set; }
        public int WalletId { get; set; }
        public int? CategoryId { get; set; }
    }
}