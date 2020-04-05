namespace WealthManager
{
    using Microsoft.EntityFrameworkCore;
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

        public DbSet<User> Users { get; set; }
    }
}