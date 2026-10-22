using System.Net.Http.Headers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Sabrikom.API.Controllers;
using Sabrikom.API.Data;
using Sabrikom.API.Models;
using Sabrikom.API.Services;

namespace Sabrikom.API.Tests;

// Using a public controller as the entry point keeps test hooks out of production code.
public sealed class ApiFactory : WebApplicationFactory<AuthController>
{
    private readonly SqliteConnection _connection = new("Data Source=:memory:");
    private bool _initialized;

    public ApiFactory() => _connection.Open();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseContentRoot(Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../backend")));
        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "test-only-signing-key-with-at-least-32-bytes",
            ["Jwt:Issuer"] = "sabrikom-tests",
            ["Jwt:Audience"] = "sabrikom-tests",
            ["Jwt:AccessTokenExpiryMinutes"] = "60"
        }));
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<AppDbContext>();
            services.AddDbContext<AppDbContext>(options => options.UseSqlite(_connection));
        });
    }

    private void Initialize()
    {
        if (_initialized) return;
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        // Production migrations target MySQL; tests build the same EF model in SQLite.
        db.Database.EnsureDeleted();
        db.Database.EnsureCreated();
        _initialized = true;
    }

    public new HttpClient CreateClient()
    {
        Initialize();
        return base.CreateClient();
    }

    public HttpClient ClientFor(AppUser user)
    {
        var client = CreateClient();
        using var scope = Services.CreateScope();
        var token = scope.ServiceProvider.GetRequiredService<TokenService>().CreateAccessToken(user);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    public async Task SeedAsync(params object[] entities)
    {
        await InDbAsync(async db =>
        {
            db.AddRange(entities);
            return await db.SaveChangesAsync();
        });
    }

    public async Task<T> InDbAsync<T>(Func<AppDbContext, Task<T>> action)
    {
        Initialize();
        using var scope = Services.CreateScope();
        return await action(scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }

    public static AppUser NewUser(string id, UserRole role = UserRole.Buyer) => new()
    {
        Id = id, UserName = $"{id}@example.test", Email = $"{id}@example.test",
        FirstName = id, LastName = "Test", Role = role
    };

    public static Listing NewListing(AppUser seller, ListingStatus status = ListingStatus.Published) => new()
    {
        Seller = seller, CategoryId = 1, Status = status,
        TitleAr = "قطعة", TitleFr = "Pièce", Price = 100,
        Country = "DZ", City = "Alger", PhoneNumber = "0000000000"
    };

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing) _connection.Dispose();
    }
}
