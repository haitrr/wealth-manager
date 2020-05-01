namespace WealthManager.Repositories
{
    using Microsoft.EntityFrameworkCore;
    using WealthManager.Repositories.Abstracts;

    public class BaseRepository<T> : IRepository<T> where T : class
    {
        private readonly DbSet<T> dbSet;

        public BaseRepository(WealthManagerDbContext wealthManagerDbContext)
        {
            this.dbSet = wealthManagerDbContext.Set<T>();
        }

        public void Create(T obj)
        {
            this.dbSet.Add(obj);
        }
    }
}