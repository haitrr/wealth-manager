namespace WealthManager
{
    using Microsoft.EntityFrameworkCore;
    using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
    using WealthManager.Models;

    public class WealthManagerDbContext : DbContext
    {
        protected WealthManagerDbContext()
        {
        }

        public WealthManagerDbContext(DbContextOptions options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Wallet>()
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(wallet => wallet.UserId);
            
            
            modelBuilder.Entity<Transaction>()
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(transaction => transaction.UserId);
            
            modelBuilder.Entity<Transaction>()
                .HasOne<Wallet>()
                .WithMany()
                .HasForeignKey(transaction => transaction.WalletId);
            
            modelBuilder.Entity<TransactionCategory>()
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(transaction => transaction.UserId);
            base.OnModelCreating(modelBuilder);
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Wallet> Wallets { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<TransactionCategory> TransactionCategories { get; set; }
    }
}
