namespace WealthManager.Models
{
    public class Transaction
    {
        public int WalletId { get; set; }
        public int UserId { get; set; }
        public decimal Amount { get; set; }
        public int Id { get; set; }
        public int? CategoryId { get; set; }
    }
}