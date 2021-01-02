namespace WealthManager.Models
{
  public record TransactionCategory
  {
    public int Id { get; set; }
    public int? ParentId { get; set; }
    public string Name { get; set; }
    public int UserId { get; set; }
    public string IconName { get; set; }
  }
}