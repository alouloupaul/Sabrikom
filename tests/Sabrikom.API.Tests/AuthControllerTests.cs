using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sabrikom.API.Controllers;
using Sabrikom.API.DTOs;
using Sabrikom.API.Models;

namespace Sabrikom.API.Tests;

public class AuthControllerTests
{
    [Fact]
    public async Task Refresh_rotates_token_and_rejects_replay_without_issuing_more_tokens()
    {
        using var database = new TestDatabase();
        var user = await database.AddUser("seller", UserRole.Seller);
        database.Db.RefreshTokens.Add(new RefreshToken
        {
            Token = "original", UserId = user.Id, ExpiresAt = DateTime.UtcNow.AddDays(1)
        });
        await database.Db.SaveChangesAsync();
        var controller = new AuthController(database.Users, database.Db, database.Tokens);

        var response = await controller.Refresh(new RefreshTokenDto("original"));

        var tokens = Assert.IsType<AuthResponseDto>(response.Value);
        Assert.Equal(user.Id, tokens.UserId);
        Assert.NotEqual("original", tokens.RefreshToken);
        var principal = database.Tokens.GetPrincipalFromExpiredToken(tokens.AccessToken);
        Assert.NotNull(principal);
        Assert.Equal(user.Id, principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
        database.Db.ChangeTracker.Clear();
        var stored = await database.Db.RefreshTokens.ToListAsync();
        Assert.True(Assert.Single(stored, t => t.Token == "original").IsRevoked);
        var replacement = Assert.Single(stored, t => t.Token == tokens.RefreshToken);
        Assert.False(replacement.IsRevoked);
        Assert.Equal(user.Id, replacement.UserId);
        Assert.True(replacement.ExpiresAt > DateTime.UtcNow.AddDays(29));

        var replay = await controller.Refresh(new RefreshTokenDto("original"));

        Assert.IsType<UnauthorizedObjectResult>(replay.Result);
        Assert.Equal(2, await database.Db.RefreshTokens.CountAsync());
    }

    [Theory]
    [InlineData("unknown")]
    [InlineData("expired")]
    [InlineData("revoked")]
    public async Task Refresh_rejects_invalid_tokens_without_changing_stored_tokens(string token)
    {
        using var database = new TestDatabase();
        var user = await database.AddUser("buyer");
        database.Db.RefreshTokens.AddRange(
            new RefreshToken { Token = "expired", UserId = user.Id, ExpiresAt = DateTime.UtcNow.AddDays(-1) },
            new RefreshToken { Token = "revoked", UserId = user.Id, ExpiresAt = DateTime.UtcNow.AddDays(1), IsRevoked = true });
        await database.Db.SaveChangesAsync();
        var controller = new AuthController(database.Users, database.Db, database.Tokens);

        var result = await controller.Refresh(new RefreshTokenDto(token));

        Assert.IsType<UnauthorizedObjectResult>(result.Result);
        database.Db.ChangeTracker.Clear();
        Assert.Equal(2, await database.Db.RefreshTokens.CountAsync());
        Assert.False((await database.Db.RefreshTokens.SingleAsync(t => t.Token == "expired")).IsRevoked);
        Assert.True((await database.Db.RefreshTokens.SingleAsync(t => t.Token == "revoked")).IsRevoked);
    }

    [Fact]
    public async Task Logout_revokes_all_current_user_sessions_but_not_another_users_session()
    {
        using var database = new TestDatabase();
        var user = await database.AddUser("buyer");
        var other = await database.AddUser("other");
        foreach (var (token, owner, revoked) in new[]
        {
            ("session-one", user.Id, false), ("session-two", user.Id, false),
            ("already-revoked", user.Id, true), ("other-session", other.Id, false)
        })
            database.Db.RefreshTokens.Add(new RefreshToken
            {
                Token = token, UserId = owner, IsRevoked = revoked, ExpiresAt = DateTime.UtcNow.AddDays(1)
            });
        await database.Db.SaveChangesAsync();
        var controller = new AuthController(database.Users, database.Db, database.Tokens);
        TestDatabase.SignIn(controller, user.Id);

        Assert.IsType<NoContentResult>(await controller.Logout());

        database.Db.ChangeTracker.Clear();
        Assert.All(await database.Db.RefreshTokens.Where(t => t.UserId == user.Id).ToListAsync(),
            t => Assert.True(t.IsRevoked));
        Assert.False((await database.Db.RefreshTokens.SingleAsync(t => t.UserId == other.Id)).IsRevoked);
        Assert.IsType<UnauthorizedObjectResult>((await controller.Refresh(new RefreshTokenDto("session-two"))).Result);
        Assert.NotNull((await controller.Refresh(new RefreshTokenDto("other-session"))).Value);
    }
}
