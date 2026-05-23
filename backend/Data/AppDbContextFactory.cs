using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Sabrikom.API.Data;

// Used only by EF Core CLI tools (dotnet ef migrations) — not loaded at runtime.
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        // Placeholder connection string for migration generation only.
        // The real connection string is read from appsettings at runtime.
        optionsBuilder.UseMySql(
            "Server=localhost;Port=3306;Database=sabrikom;User=root;Password=root;",
            new MySqlServerVersion(new Version(8, 0, 0)));

        return new AppDbContext(optionsBuilder.Options);
    }
}
