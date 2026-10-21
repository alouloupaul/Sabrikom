using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Sabrikom.API.Data;
using Sabrikom.API.Models;
using Sabrikom.API.Services;

namespace Sabrikom.API.Tests;

internal sealed class TestDatabase : IDisposable
{
    private readonly SqliteConnection _connection = new("Data Source=:memory:");
    private readonly ServiceProvider _services;

    public AppDbContext Db { get; }
    public UserManager<AppUser> Users => _services.GetRequiredService<UserManager<AppUser>>();
    public TokenService Tokens { get; } = new(new ConfigurationBuilder().AddInMemoryCollection(
        new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "test-only-signing-key-at-least-32-characters",
            ["Jwt:Issuer"] = "tests",
            ["Jwt:Audience"] = "tests"
        }).Build());

    public TestDatabase()
    {
        _connection.Open();
        Db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(_connection).Options);
        Db.Database.EnsureCreated();
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton(Db);
        services.AddIdentityCore<AppUser>().AddEntityFrameworkStores<AppDbContext>();
        _services = services.BuildServiceProvider();
    }

    public async Task<AppUser> AddUser(string id, UserRole role = UserRole.Buyer)
    {
        var user = new AppUser
        {
            Id = id, UserName = id, Email = $"{id}@example.test",
            FirstName = id, Role = role
        };
        Db.Users.Add(user);
        await Db.SaveChangesAsync();
        return user;
    }

    public async Task<Listing> AddListing(AppUser seller, ListingStatus status = ListingStatus.Published)
    {
        var listing = new Listing
        {
            SellerId = seller.Id, CategoryId = 1, Status = status,
            TitleFr = "Brake pads", TitleAr = "Test", Price = 100
        };
        Db.Listings.Add(listing);
        await Db.SaveChangesAsync();
        return listing;
    }

    public static void SignIn(ControllerBase controller, string userId)
    {
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    new[] { new Claim(ClaimTypes.NameIdentifier, userId) }, "Test"))
            }
        };
    }

    public void Dispose()
    {
        _services.Dispose();
        Db.Dispose();
        _connection.Dispose();
    }
}
