namespace WealthManager.Models
{
    public class TransactionCategoryCreateDto
    {
        public string Name { get; set; }
        public int? ParentId { get; set; }
    }
}