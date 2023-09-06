namespace WealthManager.Models
{
    public class TransactionCategoryCreateDto
    {
        public string iconName;
        public string type;
        public string Name { get; set; }
        public int? ParentId { get; set; }
    }
}
