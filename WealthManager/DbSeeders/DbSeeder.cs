namespace WealthManager.DbSeeders
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Microsoft.AspNetCore.Identity;
    using Microsoft.Extensions.Logging;
    using WealthManager.DbSeeders.Abstract;
    using WealthManager.Models;

    public class DbSeeder : IDbSeeder
    {
        private readonly WealthManagerDbContext dbContext;
        private readonly UserManager<User> userManager;
        private readonly ILogger<DbSeeder> logger;

        public DbSeeder(
            WealthManagerDbContext dbContext,
            UserManager<User> userManager,
            ILogger<DbSeeder> logger)
        {
            this.dbContext = dbContext;
            this.userManager = userManager;
            this.logger = logger;
        }

        public void Seed()
        {
            string userName = "hai";
            var user = this.dbContext.Users.SingleOrDefault(u => u.UserName == userName);
            if (user != null)
            {
                this.logger.LogInformation("User hai exists. Skip seeding database");
                return;
            }
            else
            {
                user = new User { UserName = userName };
            }

            this.logger.LogInformation("Start seeding database");
            this.logger.LogInformation("Create user hai");
            string passwordVar = "WM_PASSWORD";
            string? password = Environment.GetEnvironmentVariable(passwordVar);
            if (password == null)
            {
                this.logger.LogWarning(
                    $"Environment variable {passwordVar} not found, using default password {userName}");
                password = userName;
            }

            var result = this.userManager.CreateAsync(user, password)
                .GetAwaiter()
                .GetResult();
            if (!result.Succeeded)
            {
                this.logger.LogError("Fail to create test user");
                this.logger.LogError(
                    result.Errors.First()
                        .Description);
                return;
            }

            var categories = CreateTestTransactionCategories(user);

            var wallets = CreateTestWallets(user);

            var transactions = CreateTestTransaction(user, categories, wallets);

            this.logger.LogInformation("Created test user");
        }

        private IEnumerable<Transaction> CreateTestTransaction(
            User user,
            IEnumerable<TransactionCategory> categories,
            IEnumerable<Wallet> wallets)
        {
            this.logger.LogInformation("Creating test transactions");
            var random = new Random();
            var randomDate = new Random();
            var transactions = new List<Transaction>();
            foreach (var transactionCategory in categories)
            {
                foreach (var wallet in wallets)
                {
                    for (int i = 0; i < 300; i++)
                    {
                        var t = new Transaction(transactionCategory.Type)
                        {
                            UserId = user.Id,
                            Amount = new Random().Next(1000, 2000000),
                            CategoryId = transactionCategory.Id,
                            WalletId = wallet.Id,
                            CreatedAt = DateTime.Now.AddDays(-randomDate.Next(0, 500)),
                        };
                        this.dbContext.Transactions.Add(t);
                        transactions.Add(t);
                    }
                }
            }

            this.dbContext.SaveChanges();
            this.logger.LogInformation("Done creating test transaction");
            return transactions;
        }

        private IEnumerable<TransactionCategory> CreateTestTransactionCategories(User user)
        {
            this.logger.LogInformation("Creating test transaction categories");
            var categories = new List<TransactionCategory>()
            {
                new("Food and beverage", "utensils", TransactionCategoryType.Expense, user.Id)
                {
                    Id = 1,
                },
                new("Transportation", "car-alt", TransactionCategoryType.Expense, user.Id)
                {
                    Id = 2,
                },
                new("Taxi", "taxi", TransactionCategoryType.Expense, user.Id) { Id = 3, },
                new("Health and fitness", "medkit", TransactionCategoryType.Expense, user.Id)
                {
                    Id = 4,
                },
                new("Entertainment", "dice", TransactionCategoryType.Expense, user.Id)
                {
                    Id = 5,
                },
                new(
                    "Friend and lovers",
                    "grin-hearts",
                    TransactionCategoryType.Expense,
                    user.Id) { Id = 6, },
                new("Education", "book-reader", TransactionCategoryType.Expense, user.Id)
                {
                    Id = 7,
                },
                new("Shopping", "shopping-basket", TransactionCategoryType.Expense, user.Id)
                {
                    Id = 8,
                },
                new(
                    "Bills and Utilities",
                    "file-invoice-dollar",
                    TransactionCategoryType.Expense,
                    user.Id) { Id = 9, },
                new("Salary", "money-bill", TransactionCategoryType.Income, user.Id)
                {
                    Id = 10,
                }
            };
            this.dbContext.TransactionCategories.AddRange(categories);
            this.dbContext.SaveChanges();
            this.logger.LogInformation("Done creating test transaction categories");
            return categories;
        }

        private IEnumerable<Wallet> CreateTestWallets(User user)
        {
            this.logger.LogInformation("Creating test wallets");
            var wallets = new List<Wallet>()
            {
                new() { Name = "Cash", Id = 1, Balance = 1000000, UserId = user.Id },
                new() { Name = "Bank", Id = 2, Balance = 20000000, UserId = user.Id },
            };

            foreach (var wallet in wallets)
            {
                this.dbContext.Wallets.Add(wallet);
            }

            this.dbContext.SaveChanges();
            this.logger.LogInformation("Done creating test wallets");
            return wallets;
        }
    }
}
