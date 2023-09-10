namespace WealthManager.Models
{
    using Microsoft.AspNetCore.Identity;

    public class AuthUserView
    {
        public string? UserName { get; set; }
        public string? Email { get; set; }
        public int Id { get; set; }
    }

    public class User : IdentityUser<int>
    {
        public AuthUserView SerializeAuthView()
        {
            return new AuthUserView
            {
                Id = Id,
                UserName = UserName,
                Email = Email,
            };
        }
    }
}
