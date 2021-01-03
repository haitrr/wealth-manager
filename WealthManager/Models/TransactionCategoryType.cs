using System;

namespace WealthManager.Models
{
  public class TransactionCategoryType
  {
    private TransactionCategoryType(string value) { Value = value; }

    public string Value { get; set; }

    public static TransactionCategoryType Expense { get { return new TransactionCategoryType("Expense"); } }
    public static TransactionCategoryType Income { get { return new TransactionCategoryType("Income"); } }
    public static TransactionCategoryType FromString(string value)
    {
      switch(value){ 
        case "Expense": return Expense;
        case "Income": return Income;
        default: throw new NotImplementedException();
      }
    }
  }
}