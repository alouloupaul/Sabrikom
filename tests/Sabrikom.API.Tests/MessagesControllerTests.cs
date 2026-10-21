using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sabrikom.API.Controllers;
using Sabrikom.API.DTOs;
using Sabrikom.API.Models;

namespace Sabrikom.API.Tests;

public class MessagesControllerTests
{
    [Fact]
    public async Task GetConversation_ReturnsOnlyRequestedPairChronologically_AndMarksOnlyItsIncomingMessagesRead()
    {
        using var database = new TestDatabase();
        var currentUser = await database.AddUser("current");
        var otherUser = await database.AddUser("other", UserRole.Seller);
        var thirdUser = await database.AddUser("third", UserRole.Seller);
        var listing = await database.AddListing(otherUser);
        var otherListing = await database.AddListing(otherUser);
        var start = DateTime.UtcNow;
        var incoming = NewMessage(listing, otherUser, currentUser, "incoming", start);
        var outgoing = NewMessage(listing, currentUser, otherUser, "outgoing", start.AddMinutes(1));
        var incomingAlreadyRead = NewMessage(listing, otherUser, currentUser, "already read", start.AddMinutes(2), isRead: true);
        var differentListing = NewMessage(otherListing, otherUser, currentUser, "different listing", start.AddMinutes(3));
        var differentPerson = NewMessage(listing, thirdUser, currentUser, "different person", start.AddMinutes(4));
        database.Db.Messages.AddRange(incoming, outgoing, incomingAlreadyRead, differentListing, differentPerson);
        await database.Db.SaveChangesAsync();

        var controller = new MessagesController(database.Db);
        TestDatabase.SignIn(controller, currentUser.Id);

        var result = await controller.GetConversation(listing.Id, otherUser.Id);

        var messages = GetOkValue<List<MessageDto>>(result);
        Assert.Equal(new[] { "incoming", "outgoing", "already read" }, messages.Select(message => message.Content));
        Assert.All(messages, message => Assert.Equal(listing.Id, message.ListingId));

        database.Db.ChangeTracker.Clear();
        var readStates = await database.Db.Messages.ToDictionaryAsync(message => message.Id, message => message.IsRead);
        Assert.True(readStates[incoming.Id]);
        Assert.False(readStates[outgoing.Id]);
        Assert.True(readStates[incomingAlreadyRead.Id]);
        Assert.False(readStates[differentListing.Id]);
        Assert.False(readStates[differentPerson.Id]);
    }

    [Fact]
    public async Task GetConversations_GroupsByListingAndCounterparty_AndCountsOnlyIncomingUnreadMessages()
    {
        using var database = new TestDatabase();
        var currentUser = await database.AddUser("current");
        var firstOther = await database.AddUser("first", UserRole.Seller);
        var secondOther = await database.AddUser("second", UserRole.Seller);
        var outsider = await database.AddUser("outsider", UserRole.Seller);
        var firstListing = await database.AddListing(firstOther);
        var secondListing = await database.AddListing(firstOther);
        var start = DateTime.UtcNow;
        database.Db.Messages.AddRange(
            NewMessage(firstListing, firstOther, currentUser, "first unread", start),
            NewMessage(firstListing, firstOther, currentUser, "second unread", start.AddMinutes(1)),
            NewMessage(firstListing, currentUser, firstOther, "outgoing", start.AddMinutes(2)),
            NewMessage(firstListing, secondOther, currentUser, "second counterparty", start.AddMinutes(3)),
            NewMessage(secondListing, firstOther, currentUser, "other listing", start.AddMinutes(4)),
            NewMessage(firstListing, outsider, secondOther, "outsider thread", start.AddMinutes(5)));
        await database.Db.SaveChangesAsync();

        var controller = new MessagesController(database.Db);
        TestDatabase.SignIn(controller, currentUser.Id);

        var result = await controller.GetConversations();

        var conversations = GetOkValue<List<ConversationDto>>(result);
        Assert.Equal(3, conversations.Count);
        Assert.Equal(
            new[] { (secondListing.Id, firstOther.Id), (firstListing.Id, secondOther.Id), (firstListing.Id, firstOther.Id) },
            conversations.Select(conversation => (conversation.ListingId, conversation.OtherUserId)));
        Assert.Equal(new[] { "other listing", "second counterparty", "outgoing" }, conversations.Select(conversation => conversation.LastMessage));
        Assert.Equal(new[] { 1, 1, 2 }, conversations.Select(conversation => conversation.UnreadCount));
    }

    [Fact]
    public async Task UnreadCount_CountsOnlyUnreadMessagesReceivedByCurrentUser()
    {
        using var database = new TestDatabase();
        var currentUser = await database.AddUser("current");
        var otherUser = await database.AddUser("other", UserRole.Seller);
        var thirdUser = await database.AddUser("third", UserRole.Seller);
        var listing = await database.AddListing(otherUser);
        database.Db.Messages.AddRange(
            NewMessage(listing, otherUser, currentUser, "unread one"),
            NewMessage(listing, thirdUser, currentUser, "unread two"),
            NewMessage(listing, otherUser, currentUser, "already read", isRead: true),
            NewMessage(listing, currentUser, otherUser, "outgoing unread"),
            NewMessage(listing, thirdUser, otherUser, "for another user"));
        await database.Db.SaveChangesAsync();

        var controller = new MessagesController(database.Db);
        TestDatabase.SignIn(controller, currentUser.Id);

        var result = await controller.UnreadCount();

        Assert.Equal(2, GetOkValue<int>(result));
    }

    [Fact]
    public async Task Send_RejectsSelfUnpublishedAndMissingListings_WithoutPersistingMessages()
    {
        using var database = new TestDatabase();
        var currentUser = await database.AddUser("current");
        var otherUser = await database.AddUser("other", UserRole.Seller);
        var publishedListing = await database.AddListing(otherUser);
        var unpublishedListing = await database.AddListing(otherUser, ListingStatus.Pending);
        var controller = new MessagesController(database.Db);
        TestDatabase.SignIn(controller, currentUser.Id);

        var selfResult = await controller.Send(new SendMessageDto(publishedListing.Id, currentUser.Id, "self"));
        var unpublishedResult = await controller.Send(new SendMessageDto(unpublishedListing.Id, otherUser.Id, "unpublished"));
        var missingResult = await controller.Send(new SendMessageDto(int.MaxValue, otherUser.Id, "missing"));

        Assert.IsType<BadRequestObjectResult>(selfResult.Result);
        Assert.IsType<BadRequestObjectResult>(unpublishedResult.Result);
        Assert.IsType<BadRequestObjectResult>(missingResult.Result);
        database.Db.ChangeTracker.Clear();
        Assert.Equal(0, await database.Db.Messages.CountAsync());
    }

    private static Message NewMessage(
        Listing listing,
        AppUser sender,
        AppUser receiver,
        string content,
        DateTime? sentAt = null,
        bool isRead = false) => new()
    {
        ListingId = listing.Id,
        SenderId = sender.Id,
        ReceiverId = receiver.Id,
        Content = content,
        SentAt = sentAt ?? DateTime.UtcNow,
        IsRead = isRead
    };

    private static T GetOkValue<T>(ActionResult<T> result) =>
        Assert.IsType<T>(Assert.IsType<OkObjectResult>(result.Result).Value);
}
