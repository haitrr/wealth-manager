using WealthManager;
using Microsoft.EntityFrameworkCore;
using WealthManager.Services.Abstracts;
using WealthManager.Services;
using WealthManager.Models;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using WealthManager.Middleware;
using WealthManager.JwtToken;
using WealthManager.Repositories.Abstracts;
using WealthManager.Repositories;
using WealthManager.DbSeeders;
using WealthManager.DbSeeders.Abstract;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
var services = builder.Services;

services.AddCors(options =>
{
    options.AddDefaultPolicy(
        builder =>
        {
            builder.SetIsOriginAllowed(origin => true).AllowAnyMethod().AllowAnyHeader().AllowCredentials();
        });
});
services.AddControllers();
services.AddResponseCompression();
var Configuration = builder.Configuration;

if (builder.Environment.IsDevelopment())
{
    services.AddDbContext<WealthManagerDbContext>(options => options.UseInMemoryDatabase("WealthManager"));
}
else
{
    services.AddDbContext<WealthManagerDbContext>(
        options => options.UseMySql(
            Configuration.GetConnectionString("WealthManager"),
            ServerVersion.AutoDetect(Configuration.GetConnectionString("WealthManager"))));
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
        })
    .AddEntityFrameworkStores<WealthManagerDbContext>();

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
        })
    .AddJwtBearer(
        options =>
        {
             options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    context.Token = context.Request.Cookies["token"];
                    return Task.CompletedTask;
                }
            };
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
services.AddScoped<ITransactionService, TransactionService>();
services.AddScoped<ITransactionRepository, TransactionRepository>();
services.AddScoped<ITransactionCategoryRepository, TransactionCategoryRepository>();
services.AddTransient<IDbSeeder, DbSeeder>();
services.AddScoped<ITransactionCategoryService, TransactionCategoryService>();
services.AddLogging(
    options => options.AddConsole()
        .AddDebug());
services.AddHttpContextAccessor();
builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseDeveloperExceptionPage();

    using (var scope = app.Services.CreateScope())
    {
        var seedServices = scope.ServiceProvider;
        var context = seedServices.GetRequiredService<WealthManagerDbContext>();
        context.Database.EnsureCreated();
        var dbSeeder = seedServices.GetRequiredService<IDbSeeder>();
        dbSeeder.Seed();
    }

}

if (app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}
app.UseMiddleware<ExceptionHandleMiddleware>();
app.UseCors();
app.UseResponseCompression();
app.UseAuthorization();

app.MapControllers();

app.Run();
