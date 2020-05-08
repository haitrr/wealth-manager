namespace WealthManager.Repositories.Abstracts
{
    using System.Collections.Generic;
    using System.Threading.Tasks;

    public interface IRepository<T>
        where T : class
    {
        void Create(T obj);
        Task<IEnumerable<T>> FindAsync();
        Task<T> GetByIdAsync(int id);
    }
}