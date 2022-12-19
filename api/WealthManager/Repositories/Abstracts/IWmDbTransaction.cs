namespace WealthManager.Repositories.Abstracts
{
    using System.Threading.Tasks;

    public interface IWmDbTransaction
    {
        public Task CommitAsync();
    }
}