namespace WealthManager.Repositories.Abstracts
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Linq.Expressions;
    using System.Threading.Tasks;

    public interface IRepository<T>
        where T : class
    {
        void Create(T obj);
        Task<IEnumerable<T>> FindAsync();
        Task<IEnumerable<T>> FindAsync(Expression<Func<T,bool>> filter);
        Task<bool> AnyAsync(Expression<Func<T,bool>> filter);
        Task<T> GetByIdAsync(int id);
        IQueryable<T> Query();
    }
}