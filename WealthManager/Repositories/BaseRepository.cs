namespace WealthManager.Repositories
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Linq.Expressions;
    using System.Threading.Tasks;
    using Microsoft.EntityFrameworkCore;
    using WealthManager.Repositories.Abstracts;

    public class BaseRepository<T> : IRepository<T> where T : class
    {
        private readonly DbSet<T> dbSet;

        public IQueryable<T> Query()
        {
            return this.dbSet.AsQueryable();
        }

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

        public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> filter)
        {
            return await this.dbSet.Where(filter)
                .ToListAsync();
        }

        public Task<bool> AnyAsync(Expression<Func<T, bool>> filter)
        {
            return this.dbSet.Where(filter)
                .AnyAsync();
        }

        public Task<T> GetByIdAsync(int id)
        {
            return this.dbSet.FindAsync(id).AsTask();
        }
    }
}