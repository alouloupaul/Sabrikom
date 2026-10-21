using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sabrikom.API.Controllers;
using Sabrikom.API.DTOs;
using Sabrikom.API.Models;

namespace Sabrikom.API.Tests;

public class ListingsControllerTests
{
    [Fact]
    public async Task Public_search_counts_and_pages_only_published_listings()
    {
        using var database = new TestDatabase();
        var seller = await database.AddUser("seller", UserRole.Seller);
        var older = await database.AddListing(seller);
        older.CreatedAt = DateTime.UtcNow.AddDays(-2);
        var newer = await database.AddListing(seller);
        newer.CreatedAt = DateTime.UtcNow.AddDays(-1);
        foreach (var status in new[] { ListingStatus.Pending, ListingStatus.Rejected, ListingStatus.Expired, ListingStatus.Deleted })
            await database.AddListing(seller, status);
        await database.Db.SaveChangesAsync();
        var controller = Controller(database);

        var response = await controller.Search(new ListingSearchParams { Page = 2, PageSize = 1 });

        var page = Assert.IsType<PagedResult<ListingDto>>(Assert.IsType<OkObjectResult>(response.Result).Value);
        Assert.Equal(2, page.TotalCount);
        Assert.Equal(2, page.Page);
        Assert.Equal(1, page.PageSize);
        Assert.Equal(older.Id, Assert.Single(page.Items).Id);
    }

    [Theory]
    [InlineData(ListingStatus.Pending)]
    [InlineData(ListingStatus.Rejected)]
    [InlineData(ListingStatus.Expired)]
    [InlineData(ListingStatus.Deleted)]
    public async Task Public_detail_hides_unpublished_listings_even_from_the_owner(ListingStatus status)
    {
        using var database = new TestDatabase();
        var seller = await database.AddUser("seller", UserRole.Seller);
        var listing = await database.AddListing(seller, status);
        var controller = Controller(database, seller.Id);

        Assert.IsType<NotFoundResult>((await controller.GetById(listing.Id)).Result);
    }

    [Fact]
    public async Task Buyer_cannot_create_a_listing()
    {
        using var database = new TestDatabase();
        var buyer = await database.AddUser("buyer");
        var controller = Controller(database, buyer.Id);

        Assert.IsType<ForbidResult>((await controller.Create(CreateDto())).Result);
        Assert.Empty(await database.Db.Listings.ToListAsync());
    }

    [Fact]
    public async Task Seller_creation_requires_moderation_and_owner_edits_remove_public_visibility()
    {
        using var database = new TestDatabase();
        var seller = await database.AddUser("seller", UserRole.Seller);
        var controller = Controller(database, seller.Id);
        var before = DateTime.UtcNow;

        var created = await controller.Create(CreateDto());

        var dto = Assert.IsType<ListingDto>(Assert.IsType<CreatedAtActionResult>(created.Result).Value);
        database.Db.ChangeTracker.Clear();
        var listing = await database.Db.Listings.SingleAsync();
        Assert.Equal(dto.Id, listing.Id);
        Assert.Equal(seller.Id, listing.SellerId);
        Assert.Equal(ListingStatus.Pending, listing.Status);
        Assert.InRange(listing.ExpiresAt!.Value, before.AddDays(60), DateTime.UtcNow.AddDays(60));
        listing.Status = ListingStatus.Published;
        await database.Db.SaveChangesAsync();
        Assert.IsType<OkObjectResult>((await controller.GetById(listing.Id)).Result);

        Assert.IsType<NoContentResult>(await controller.Update(listing.Id, UpdateDto()));

        database.Db.ChangeTracker.Clear();
        listing = await database.Db.Listings.SingleAsync();
        Assert.Equal("Updated title", listing.TitleFr);
        Assert.Equal(ListingStatus.Pending, listing.Status);
        Assert.IsType<NotFoundResult>((await controller.GetById(listing.Id)).Result);
    }

    [Fact]
    public async Task Non_owner_cannot_update_or_delete_another_sellers_listing()
    {
        using var database = new TestDatabase();
        var owner = await database.AddUser("owner", UserRole.Seller);
        var other = await database.AddUser("other", UserRole.Seller);
        var listing = await database.AddListing(owner);
        var controller = Controller(database, other.Id);

        Assert.IsType<ForbidResult>(await controller.Update(listing.Id, UpdateDto()));
        Assert.IsType<ForbidResult>(await controller.Delete(listing.Id));

        database.Db.ChangeTracker.Clear();
        var stored = await database.Db.Listings.SingleAsync();
        Assert.Equal("Brake pads", stored.TitleFr);
        Assert.Equal(ListingStatus.Published, stored.Status);
        Assert.Equal(owner.Id, stored.SellerId);
    }

    private static ListingsController Controller(TestDatabase database, string? userId = null)
    {
        // These paths do not perform photo I/O.
        var controller = new ListingsController(database.Db, null!);
        TestDatabase.SignIn(controller, userId ?? "anonymous");
        return controller;
    }

    private static ListingCreateDto CreateDto() => new(
        "Test", "Brake pads", "Description", "Description", 100, "DZD", "Used", 1,
        null, null, null, null, null, "DZ", "Algiers", "000000000");

    private static ListingUpdateDto UpdateDto() => new(
        "Test", "Updated title", "Description", "Description", 150, "DZD", "New", 1,
        null, null, null, null, null, "DZ", "Algiers", "000000000");
}
