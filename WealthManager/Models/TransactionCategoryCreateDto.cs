namespace WealthManager.Models
{
    public class TransactionCategoryCreateDto
    {
        public string iconName;
        public TransactionCategoryType type;
        public string Name { get; set; }
        public int? ParentId { get; set; }
    }
}
