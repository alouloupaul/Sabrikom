using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Sabrikom.API.DTOs;
using Sabrikom.API.Models;

namespace Sabrikom.API.Tests;

public class MessageTests
{
    [Theory]
    [InlineData("api/Messages/conversations")]
    [InlineData("api/Messages/conversation/1/other")]
    [InlineData("api/Messages/unread-count")]
    public async Task Message_reads_require_authentication(string path)
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync(path);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Conversation_contains_only_messages_for_that_listing_and_participant_pair()
    {
        using var factory = new ApiFactory();
        var buyer = ApiFactory.NewUser("buyer");
        var seller = ApiFactory.NewUser("seller", UserRole.Seller);
        var other = ApiFactory.NewUser("other");
        var listing = ApiFactory.NewListing(seller);
        var secondListing = ApiFactory.NewListing(seller);
        var messages = new[]
        {
            NewMessage(listing, seller, buyer, "first", 1),
            NewMessage(listing, buyer, seller, "second", 2),
            NewMessage(listing, seller, other, "different participant", 3),
            NewMessage(secondListing, seller, buyer, "different listing", 4)
        };
        await factory.SeedAsync(buyer, seller, other, listing, secondListing, messages);
        using var client = factory.ClientFor(buyer);

        var response = await client.GetAsync($"api/Messages/conversation/{listing.Id}/{seller.Id}");
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<List<MessageDto>>();

        Assert.NotNull(result);
        Assert.Equal(new[] { "first", "second" }, result.Select(m => m.Content));
    }

    [Fact]
    public async Task Opening_conversation_marks_only_its_incoming_messages_read()
    {
        using var factory = new ApiFactory();
        var buyer = ApiFactory.NewUser("buyer");
        var seller = ApiFactory.NewUser("seller", UserRole.Seller);
        var other = ApiFactory.NewUser("other", UserRole.Seller);
        var listing = ApiFactory.NewListing(seller);
        var secondListing = ApiFactory.NewListing(seller);
        var selectedIncoming = NewMessage(listing, seller, buyer, "selected incoming", 1);
        var selectedOutgoing = NewMessage(listing, buyer, seller, "selected outgoing", 2);
        var otherListingIncoming = NewMessage(secondListing, seller, buyer, "other listing", 3);
        var otherParticipantIncoming = NewMessage(listing, other, buyer, "other participant", 4);
        await factory.SeedAsync(buyer, seller, other, listing, secondListing,
            selectedIncoming, selectedOutgoing, otherListingIncoming, otherParticipantIncoming);
        using var client = factory.ClientFor(buyer);

        var response = await client.GetAsync($"api/Messages/conversation/{listing.Id}/{seller.Id}");
        response.EnsureSuccessStatusCode();
        var readStates = await factory.InDbAsync(async db => await db.Messages
            .ToDictionaryAsync(m => m.Content, m => m.IsRead));
        var unreadResponse = await client.GetAsync("api/Messages/unread-count");
        unreadResponse.EnsureSuccessStatusCode();
        var unreadCount = await unreadResponse.Content.ReadFromJsonAsync<int>();

        Assert.True(readStates["selected incoming"]);
        Assert.False(readStates["selected outgoing"]);
        Assert.False(readStates["other listing"]);
        Assert.False(readStates["other participant"]);
        Assert.Equal(2, unreadCount);
    }

    [Fact]
    public async Task Conversation_summaries_are_per_user_and_use_latest_message()
    {
        using var factory = new ApiFactory();
        var alice = ApiFactory.NewUser("alice");
        var bob = ApiFactory.NewUser("bob", UserRole.Seller);
        var carol = ApiFactory.NewUser("carol");
        var firstListing = ApiFactory.NewListing(bob);
        var secondListing = ApiFactory.NewListing(bob);
        var start = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        await factory.SeedAsync(alice, bob, carol, firstListing, secondListing,
            NewMessage(firstListing, alice, bob, "alice to bob", start),
            NewMessage(secondListing, alice, bob, "second listing", start.AddMinutes(1)),
            NewMessage(firstListing, bob, alice, "latest with bob", start.AddMinutes(2)),
            NewMessage(firstListing, carol, alice, "latest with carol", start.AddMinutes(3)));
        using var aliceClient = factory.ClientFor(alice);
        using var bobClient = factory.ClientFor(bob);

        var summariesResponse = await aliceClient.GetAsync("api/Messages/conversations");
        summariesResponse.EnsureSuccessStatusCode();
        var summaries = await summariesResponse.Content.ReadFromJsonAsync<List<ConversationDto>>();
        var aliceUnreadResponse = await aliceClient.GetAsync("api/Messages/unread-count");
        var bobUnreadResponse = await bobClient.GetAsync("api/Messages/unread-count");
        aliceUnreadResponse.EnsureSuccessStatusCode();
        bobUnreadResponse.EnsureSuccessStatusCode();

        Assert.NotNull(summaries);
        Assert.Equal(3, summaries.Count);
        Assert.Equal("latest with carol", summaries[0].LastMessage);
        Assert.Equal(carol.Id, summaries[0].OtherUserId);
        Assert.Equal("latest with bob", summaries[1].LastMessage);
        Assert.Equal(firstListing.Id, summaries[1].ListingId);
        Assert.Equal(1, summaries[1].UnreadCount);
        Assert.Equal("second listing", summaries[2].LastMessage);
        Assert.Equal(secondListing.Id, summaries[2].ListingId);
        Assert.Equal(0, summaries[2].UnreadCount);
        Assert.Equal(2, await aliceUnreadResponse.Content.ReadFromJsonAsync<int>());
        Assert.Equal(2, await bobUnreadResponse.Content.ReadFromJsonAsync<int>());
    }

    [Fact]
    public async Task Sending_to_self_or_for_missing_or_inactive_listing_is_rejected_without_persisting()
    {
        using var factory = new ApiFactory();
        var sender = ApiFactory.NewUser("sender");
        var receiver = ApiFactory.NewUser("receiver");
        var publishedListing = ApiFactory.NewListing(ApiFactory.NewUser("seller", UserRole.Seller));
        var inactiveListing = ApiFactory.NewListing(ApiFactory.NewUser("inactive-seller", UserRole.Seller), ListingStatus.Pending);
        await factory.SeedAsync(sender, receiver, publishedListing.Seller, inactiveListing.Seller,
            publishedListing, inactiveListing);
        using var client = factory.ClientFor(sender);
        var invalidRequests = new[]
        {
            new SendMessageDto(publishedListing.Id, sender.Id, "self"),
            new SendMessageDto(999999, receiver.Id, "missing listing"),
            new SendMessageDto(inactiveListing.Id, receiver.Id, "inactive listing")
        };

        foreach (var request in invalidRequests)
        {
            var response = await client.PostAsJsonAsync("api/Messages", request);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        var persistedCount = await factory.InDbAsync(db => db.Messages.CountAsync());
        Assert.Equal(0, persistedCount);
    }

    private static Message NewMessage(Listing listing, AppUser sender, AppUser receiver, string content, int minute) =>
        NewMessage(listing, sender, receiver, content, new DateTime(2025, 1, 1, 0, 0, minute, DateTimeKind.Utc));

    private static Message NewMessage(Listing listing, AppUser sender, AppUser receiver, string content, DateTime sentAt) => new()
    {
        Listing = listing,
        Sender = sender,
        Receiver = receiver,
        Content = content,
        IsRead = false,
        SentAt = sentAt
    };
}
