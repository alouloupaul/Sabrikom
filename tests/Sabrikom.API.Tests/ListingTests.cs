using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Sabrikom.API.Models;
using Xunit;

namespace Sabrikom.API.Tests;

public class ListingTests
{
    [Theory]
    [InlineData(UserRole.Buyer, HttpStatusCode.Forbidden, 0)]
    [InlineData(UserRole.Seller, HttpStatusCode.Created, 1)]
    public async Task Create_requires_seller_role_and_creates_pending_listing(
        UserRole role, HttpStatusCode expectedStatus, int expectedRows)
    {
        using var app = new ApiFactory();
        var user = ApiFactory.NewUser($"create-{role}", role);
        await app.SeedAsync(user);
        using var client = app.ClientFor(user);

        var response = await client.PostAsJsonAsync("/api/listings", CreatePayload());

        Assert.Equal(expectedStatus, response.StatusCode);
        var rows = await app.InDbAsync(db => db.Listings.AsNoTracking()
            .Where(l => l.SellerId == user.Id).ToListAsync());
        Assert.Equal(expectedRows, rows.Count);
        if (role == UserRole.Seller)
            Assert.Equal(ListingStatus.Pending, Assert.Single(rows).Status);
    }

    [Theory]
    [InlineData(ListingStatus.Pending)]
    [InlineData(ListingStatus.Rejected)]
    [InlineData(ListingStatus.Expired)]
    [InlineData(ListingStatus.Deleted)]
    public async Task Public_search_and_detail_hide_non_published_listings(ListingStatus status)
    {
        using var app = new ApiFactory();
        var seller = ApiFactory.NewUser($"seller-{status}", UserRole.Seller);
        var listing = ApiFactory.NewListing(seller, status);
        await app.SeedAsync(seller, listing);
        using var client = app.CreateClient();

        var search = await client.GetAsync("/api/listings");
        search.EnsureSuccessStatusCode();
        using var searchJson = JsonDocument.Parse(await search.Content.ReadAsStringAsync());
        var items = searchJson.RootElement.GetProperty("items");
        Assert.DoesNotContain(items.EnumerateArray(), item => item.GetProperty("id").GetInt32() == listing.Id);

        var detail = await client.GetAsync($"/api/listings/{listing.Id}");
        Assert.Equal(HttpStatusCode.NotFound, detail.StatusCode);
    }

    [Fact]
    public async Task Non_owner_cannot_update_listing_or_change_its_data()
    {
        using var app = new ApiFactory();
        var seller = ApiFactory.NewUser("update-owner", UserRole.Seller);
        var otherUser = ApiFactory.NewUser("update-other");
        var listing = ApiFactory.NewListing(seller);
        await app.SeedAsync(seller, otherUser, listing);
        using var client = app.ClientFor(otherUser);

        var response = await client.PutAsJsonAsync($"/api/listings/{listing.Id}", UpdatePayload("Changed title", 999));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var persisted = await app.InDbAsync(db => db.Listings.AsNoTracking().SingleAsync(l => l.Id == listing.Id));
        Assert.Equal("قطعة", persisted.TitleAr);
        Assert.Equal(100, persisted.Price);
        Assert.Equal(ListingStatus.Published, persisted.Status);
        Assert.Equal(seller.Id, persisted.SellerId);
    }

    [Fact]
    public async Task Non_owner_cannot_delete_listing_or_change_its_status()
    {
        using var app = new ApiFactory();
        var seller = ApiFactory.NewUser("delete-owner", UserRole.Seller);
        var otherUser = ApiFactory.NewUser("delete-other");
        var listing = ApiFactory.NewListing(seller);
        await app.SeedAsync(seller, otherUser, listing);
        using var client = app.ClientFor(otherUser);

        var response = await client.DeleteAsync($"/api/listings/{listing.Id}");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var persisted = await app.InDbAsync(db => db.Listings.AsNoTracking().SingleAsync(l => l.Id == listing.Id));
        Assert.Equal(ListingStatus.Published, persisted.Status);
        Assert.Equal(seller.Id, persisted.SellerId);
    }

    [Fact]
    public async Task Owner_update_hides_listing_until_admin_approves_it()
    {
        using var app = new ApiFactory();
        var seller = ApiFactory.NewUser("lifecycle-owner", UserRole.Seller);
        var admin = ApiFactory.NewUser("lifecycle-admin", UserRole.Admin);
        var listing = ApiFactory.NewListing(seller);
        await app.SeedAsync(seller, admin, listing);
        using var sellerClient = app.ClientFor(seller);
        using var adminClient = app.ClientFor(admin);

        var update = await sellerClient.PutAsJsonAsync($"/api/listings/{listing.Id}", UpdatePayload("Updated title", 250));
        update.EnsureSuccessStatusCode();
        var pending = await app.InDbAsync(db => db.Listings.AsNoTracking().SingleAsync(l => l.Id == listing.Id));
        Assert.Equal("Updated title", pending.TitleFr);
        Assert.Equal(250, pending.Price);
        Assert.Equal(ListingStatus.Pending, pending.Status);
        await AssertNotPublicAsync(sellerClient, listing.Id);

        var adminListings = await adminClient.GetAsync("/api/listings/admin/all?status=Pending");
        adminListings.EnsureSuccessStatusCode();
        using (var adminJson = JsonDocument.Parse(await adminListings.Content.ReadAsStringAsync()))
            Assert.Contains(adminJson.RootElement.GetProperty("items").EnumerateArray(),
                item => item.GetProperty("id").GetInt32() == listing.Id);

        var approval = await adminClient.PostAsJsonAsync($"/api/listings/{listing.Id}/validate", new { approve = true });
        approval.EnsureSuccessStatusCode();

        var published = await app.InDbAsync(db => db.Listings.AsNoTracking().SingleAsync(l => l.Id == listing.Id));
        Assert.Equal(ListingStatus.Published, published.Status);
        Assert.Equal(admin.Id, published.ValidatedById);
        Assert.True(published.ValidatedAt.HasValue);
        Assert.True(await SearchContainsAsync(sellerClient, listing.Id));
        Assert.Equal(HttpStatusCode.OK, (await sellerClient.GetAsync($"/api/listings/{listing.Id}")).StatusCode);
    }

    [Fact]
    public async Task Admin_can_delete_another_sellers_listing()
    {
        using var app = new ApiFactory();
        var seller = ApiFactory.NewUser("admin-delete-owner", UserRole.Seller);
        var admin = ApiFactory.NewUser("admin-delete-admin", UserRole.Admin);
        var listing = ApiFactory.NewListing(seller);
        await app.SeedAsync(seller, admin, listing);
        using var client = app.ClientFor(admin);

        var response = await client.DeleteAsync($"/api/listings/{listing.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var persisted = await app.InDbAsync(db => db.Listings.AsNoTracking().SingleAsync(l => l.Id == listing.Id));
        Assert.Equal(ListingStatus.Deleted, persisted.Status);
        Assert.False(await SearchContainsAsync(client, listing.Id));
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/listings/{listing.Id}")).StatusCode);
    }

    private static object CreatePayload() => new
    {
        titleAr = "قطعة جديدة",
        titleFr = "Nouvelle pièce",
        descriptionAr = "وصف القطعة",
        descriptionFr = "Description de la pièce",
        price = 150,
        currency = "DZD",
        condition = "Used",
        categoryId = 1,
        country = "DZ",
        city = "Alger",
        phoneNumber = "0000000000"
    };

    private static object UpdatePayload(string title, decimal price) => new
    {
        titleAr = title,
        titleFr = title,
        descriptionAr = "وصف جديد",
        descriptionFr = "Description mise à jour",
        price,
        currency = "DZD",
        condition = "Used",
        categoryId = 1,
        country = "DZ",
        city = "Alger",
        phoneNumber = "0000000000"
    };

    private static async Task AssertNotPublicAsync(HttpClient client, int listingId)
    {
        Assert.False(await SearchContainsAsync(client, listingId));
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/listings/{listingId}")).StatusCode);
    }

    private static async Task<bool> SearchContainsAsync(HttpClient client, int listingId)
    {
        var response = await client.GetAsync("/api/listings");
        response.EnsureSuccessStatusCode();
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return json.RootElement.GetProperty("items").EnumerateArray()
            .Any(item => item.GetProperty("id").GetInt32() == listingId);
    }
}
