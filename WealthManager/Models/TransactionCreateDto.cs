namespace WealthManager.Models
{
    public class TransactionCreateDto
    {
        public decimal Amount { get; set; }
        public int WalletId { get; set; }
    }
}