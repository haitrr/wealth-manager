using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace WealthManager
{
    using System.Text;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Authentication.JwtBearer;
    using Microsoft.EntityFrameworkCore;
    using Microsoft.IdentityModel.Tokens;
    using WealthManager.Controllers;
    using WealthManager.JwtToken;
    using WealthManager.Middleware;
    using WealthManager.Models;
    using WealthManager.Repositories;
    using WealthManager.Repositories.Abstracts;
    using WealthManager.Services;
    using WealthManager.Services.Abstracts;

    public class Startup
    {
        public Startup(IConfiguration configuration, IWebHostEnvironment env)
        {
            Configuration = configuration;
            CurrentEnvironment = env;
        }

        public IConfiguration Configuration { get; }
        private IWebHostEnvironment CurrentEnvironment{ get; set; } 

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllers();

            if (CurrentEnvironment.IsDevelopment())
            {
                services.AddDbContext<WealthManagerDbContext>(
                    options => options.UseInMemoryDatabase("WealthManager"));
            }
            else
            {
                services.AddDbContext<WealthManagerDbContext>(
                    options => options.UseMySql(Configuration.GetConnectionString("WealthManager")));
            }

            services.AddScoped<IUserService, UserService>();
            services.AddIdentity<User, Role>(
                options =>
                {
                    // password
                    options.Password.RequireDigit = false;
                    options.Password.RequiredLength = 1;
                    options.Password.RequireLowercase = false;
                    options.Password.RequireUppercase = false;
                    options.Password.RequiredUniqueChars = 0;
                    options.Password.RequireNonAlphanumeric = false;
                    
                    
                }).AddEntityFrameworkStores<WealthManagerDbContext>();

            // configure strongly typed settings objects
            var jwtSettingsSection = Configuration.GetSection("Jwt");
            var jwtSettings = new JwtSettings();
            jwtSettingsSection.Bind(jwtSettings);
            services.AddSingleton(jwtSettings);

            // configure jwt authentication
            var appSettings = jwtSettingsSection.Get<JwtSettings>();
            var key = Encoding.ASCII.GetBytes(appSettings.Secret);
            services.AddAuthentication(
                options =>
                {
                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                }).AddJwtBearer(
                options =>
                {
                    options.RequireHttpsMetadata = false;
                    options.RequireHttpsMetadata = false;
                    options.SaveToken = true;
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(key),
                        ValidateIssuer = false,
                        ValidateAudience = false
                    };
                });
            services.AddSingleton<ExceptionHandleMiddleware>();
            services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
            services.AddScoped<IWmAuthenticationService, WmAuthenticationService>();
            services.AddScoped<IWalletService, WalletService>();
            services.AddScoped<ILoggedInUserInfoProvider, LoggedInUserInfoProvider>();
            services.AddScoped<IWmDbTransaction, WmDbTransaction>();
            services.AddScoped<IWalletRepository, WalletRepository>();
            services.AddHttpContextAccessor();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            if (env.IsProduction())
            {
                app.UseHttpsRedirection();
            }
            
            // global cors policy
            app.UseCors(x => x
                .AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader());
            
            app.UseRouting();
            
            app.UseAuthentication();
            app.UseAuthorization();
            app.UseMiddleware<ExceptionHandleMiddleware>();

            app.UseEndpoints(endpoints => { endpoints.MapControllers(); });
        }
    }

    public class WmDbTransaction : IWmDbTransaction
    {
        private readonly WealthManagerDbContext wealthManagerDbContext;

        public WmDbTransaction(WealthManagerDbContext wealthManagerDbContext)
        {
            this.wealthManagerDbContext = wealthManagerDbContext;
        }

        public Task CommitAsync()
        {
            return this.wealthManagerDbContext.SaveChangesAsync();
        }
    }
}