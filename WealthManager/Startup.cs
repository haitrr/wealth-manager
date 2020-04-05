using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace WealthManager
{
    using Microsoft.EntityFrameworkCore;
    using WealthManager.Middleware;
    using WealthManager.Models;
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
            services.AddSingleton<ExceptionHandleMiddleware>();
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

            app.UseRouting();

            app.UseAuthentication();
            app.UseAuthorization();
            app.UseMiddleware<ExceptionHandleMiddleware>();

            app.UseEndpoints(endpoints => { endpoints.MapControllers(); });
        }
    }
}