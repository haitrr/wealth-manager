namespace WealthManager.JwtToken
{
    using WealthManager.Models;

    public interface IJwtTokenGenerator
    {
        string Generate(User user);
    }
}