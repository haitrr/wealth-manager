namespace WealthManager.Models
{
    public class TransactionCategory
    {
        public TransactionCategory(
            string name,
            string iconName,
            string type,
            int userId)
        {
            this.Name = name;
            this.IconName = iconName;
            this.Type = type;
            this.UserId = userId;
        }

        public int Id { get; set; }
        public int? ParentId { get; set; }
        public string Name { get; set; }
        public int UserId { get; set; }
        public string IconName { get; set; }
        public string Type { get; set; }
    }
}
