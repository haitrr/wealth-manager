namespace WealthManager.Models
{
    public class Wallet
    {
        public string Name { get; set; }
        public int Id { get; set; }
        public int UserId { get; set; }
        public decimal Balance { get; set; } = 0;
    }
}