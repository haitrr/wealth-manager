namespace WealthManager.Models
{
    using System;

    public class TransactionQuery
    {
        public int? WalletId { get; set; }
        public int? CategoryId { get; set; }
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
    }
}