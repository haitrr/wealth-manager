namespace WealthManager.Models
{
    public class TransactionCategory
    {
        public int Id { get; set; }
        public int? ParentId { get; set; }
        public string Name { get; set; }
        public int UserId { get; set; }
    }
}