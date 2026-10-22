using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Sabrikom.API.DTOs;
using Sabrikom.API.Models;
using Xunit;

namespace Sabrikom.API.Tests;

public class AuthTests
{
    [Fact]
    public async Task Refresh_rotates_token_rejects_replay_and_issues_usable_access_token()
    {
        using var app = new ApiFactory();
        var user = ApiFactory.NewUser("buyer");
        await app.SeedAsync(user, Token(user, "original"));
        using var client = app.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/refresh", new RefreshTokenDto("original"));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var session = (await response.Content.ReadFromJsonAsync<AuthResponseDto>())!;
        Assert.Equal(user.Id, session.UserId);
        Assert.NotEqual("original", session.RefreshToken);
        var tokens = await app.InDbAsync(db => db.RefreshTokens.AsNoTracking().ToListAsync());
        Assert.True(Assert.Single(tokens, t => t.Token == "original").IsRevoked);
        var replacement = Assert.Single(tokens, t => t.Token == session.RefreshToken);
        Assert.False(replacement.IsRevoked);
        Assert.Equal(user.Id, replacement.UserId);
        Assert.True(replacement.ExpiresAt > DateTime.UtcNow.AddDays(29));

        client.DefaultRequestHeaders.Authorization = new("Bearer", session.AccessToken);
        var profile = await client.GetFromJsonAsync<UserProfileDto>("/api/auth/me");
        Assert.Equal(user.Id, profile!.Id);
        var replay = await client.PostAsJsonAsync("/api/auth/refresh", new RefreshTokenDto("original"));
        Assert.Equal(HttpStatusCode.Unauthorized, replay.StatusCode);
        Assert.Equal(2, await app.InDbAsync(db => db.RefreshTokens.CountAsync()));

        var next = await client.PostAsJsonAsync("/api/auth/refresh", new RefreshTokenDto(session.RefreshToken));
        Assert.Equal(HttpStatusCode.OK, next.StatusCode);
    }

    [Theory]
    [InlineData("missing")]
    [InlineData("expired")]
    [InlineData("revoked")]
    public async Task Refresh_rejects_invalid_tokens_without_issuing_or_mutating_tokens(string kind)
    {
        using var app = new ApiFactory();
        var user = ApiFactory.NewUser("buyer");
        var stored = Token(user, "stored");
        stored.IsRevoked = kind == "revoked";
        if (kind == "expired") stored.ExpiresAt = DateTime.UtcNow.AddMinutes(-1);
        await app.SeedAsync(user, stored);
        using var client = app.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/refresh",
            new RefreshTokenDto(kind == "missing" ? "unknown" : stored.Token));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        var after = Assert.Single(await app.InDbAsync(db => db.RefreshTokens.AsNoTracking().ToListAsync()));
        Assert.Equal(stored.IsRevoked, after.IsRevoked);
        Assert.Equal(stored.ExpiresAt, after.ExpiresAt);
    }

    [Fact]
    public async Task Logout_revokes_all_callers_tokens_but_not_another_users_tokens()
    {
        using var app = new ApiFactory();
        var user = ApiFactory.NewUser("buyer");
        var other = ApiFactory.NewUser("other");
        await app.SeedAsync(user, other, Token(user, "one"), Token(user, "two"), Token(other, "other"));
        using var client = app.ClientFor(user);

        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync("/api/auth/logout", new { })).StatusCode);
        var tokens = await app.InDbAsync(db => db.RefreshTokens.AsNoTracking().ToListAsync());
        Assert.All(tokens.Where(t => t.UserId == user.Id), t => Assert.True(t.IsRevoked));
        Assert.False(Assert.Single(tokens, t => t.UserId == other.Id).IsRevoked);
        foreach (var token in new[] { "one", "two" })
        {
            var refresh = await client.PostAsJsonAsync("/api/auth/refresh", new RefreshTokenDto(token));
            Assert.Equal(HttpStatusCode.Unauthorized, refresh.StatusCode);
        }
    }

    [Theory]
    [InlineData("unknown")]
    [InlineData("wrong-password")]
    [InlineData("suspended")]
    public async Task Login_rejects_invalid_credentials_or_suspended_account_without_issuing_tokens(string kind)
    {
        using var app = new ApiFactory();
        var user = ApiFactory.NewUser("buyer");
        user.IsActive = kind != "suspended";
        user.PasswordHash = new PasswordHasher<AppUser>().HashPassword(user, "password123");
        await app.SeedAsync(user);
        using var client = app.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginDto(
            kind == "unknown" ? "missing@example.test" : user.Email!,
            kind == "wrong-password" ? "incorrect123" : "password123"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal(0, await app.InDbAsync(db => db.RefreshTokens.CountAsync()));
    }

    [Theory]
    [InlineData("Admin", "Buyer")]
    [InlineData("Seller", "Seller")]
    public async Task Registration_cannot_self_assign_admin_and_issues_a_working_session(string requestedRole, string expectedRole)
    {
        using var app = new ApiFactory();
        using var client = app.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterDto(
            "Test", "User", "new@example.test", "password123", "0000000000", "DZ", "Alger", requestedRole));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var session = (await response.Content.ReadFromJsonAsync<AuthResponseDto>())!;
        Assert.Equal(expectedRole, session.Role);
        client.DefaultRequestHeaders.Authorization = new("Bearer", session.AccessToken);
        var profile = await client.GetFromJsonAsync<UserProfileDto>("/api/auth/me");
        Assert.Equal(expectedRole, profile!.Role);
        var admin = await client.GetAsync("/api/listings/admin/all");
        Assert.Equal(HttpStatusCode.Forbidden, admin.StatusCode);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Logout_rejects_missing_or_tampered_access_token_without_revoking_sessions(bool tamper)
    {
        using var app = new ApiFactory();
        var user = ApiFactory.NewUser("buyer");
        await app.SeedAsync(user, Token(user, "session"));
        using var client = tamper ? app.ClientFor(user) : app.CreateClient();
        if (tamper)
        {
            var token = client.DefaultRequestHeaders.Authorization!.Parameter!;
            var signatureStart = token.LastIndexOf('.') + 1;
            var replacement = token[signatureStart] == 'A' ? 'B' : 'A';
            client.DefaultRequestHeaders.Authorization = new("Bearer",
                token[..signatureStart] + replacement + token[(signatureStart + 1)..]);
        }

        var response = await client.PostAsJsonAsync("/api/auth/logout", new { });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        var stored = Assert.Single(await app.InDbAsync(db => db.RefreshTokens.AsNoTracking().ToListAsync()));
        Assert.False(stored.IsRevoked);
    }

    private static RefreshToken Token(AppUser user, string value) => new()
    {
        User = user, Token = value, ExpiresAt = DateTime.UtcNow.AddDays(10)
    };
}
