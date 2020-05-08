namespace WealthManager.Repositories
{
    using System.Collections.Generic;
    using System.Threading.Tasks;
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

        public async Task<IEnumerable<T>> FindAsync()
        {
            return await this.dbSet.ToListAsync();
        }

        public Task<T> GetByIdAsync(int id)
        {
            return this.dbSet.FindAsync(id).AsTask();
        }
    }
}