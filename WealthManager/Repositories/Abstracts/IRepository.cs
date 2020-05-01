namespace WealthManager.Repositories.Abstracts
{
    public interface IRepository<T> where T : class
    {
        public void Create(T obj);
    }
}