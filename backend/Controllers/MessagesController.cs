using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sabrikom.API.Data;
using Sabrikom.API.DTOs;
using Sabrikom.API.Models;
using System.Security.Claims;

namespace Sabrikom.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly AppDbContext _db;

    public MessagesController(AppDbContext db) => _db = db;

    [HttpPost]
    public async Task<ActionResult<MessageDto>> Send([FromBody] SendMessageDto dto)
    {
        var senderId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        if (senderId == dto.ReceiverId) return BadRequest(new { message = "Cannot message yourself" });

        var listing = await _db.Listings.FindAsync(dto.ListingId);
        if (listing == null || listing.Status != ListingStatus.Published)
            return BadRequest(new { message = "Listing not found or not active" });

        var message = new Message
        {
            ListingId = dto.ListingId,
            SenderId = senderId,
            ReceiverId = dto.ReceiverId,
            Content = dto.Content
        };

        _db.Messages.Add(message);
        await _db.SaveChangesAsync();

        var full = await _db.Messages
            .Include(m => m.Sender).Include(m => m.Receiver)
            .Include(m => m.Listing)
            .FirstAsync(m => m.Id == message.Id);

        return CreatedAtAction(nameof(GetConversation), new { listingId = dto.ListingId, otherUserId = dto.ReceiverId }, MapMessage(full));
    }

    [HttpGet("conversations")]
    public async Task<ActionResult<List<ConversationDto>>> GetConversations()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var messages = await _db.Messages
            .Include(m => m.Listing).ThenInclude(l => l.Photos)
            .Include(m => m.Sender)
            .Include(m => m.Receiver)
            .Where(m => m.SenderId == userId || m.ReceiverId == userId)
            .OrderByDescending(m => m.SentAt)
            .ToListAsync();

        var conversations = messages
            .GroupBy(m => new
            {
                m.ListingId,
                OtherUserId = m.SenderId == userId ? m.ReceiverId : m.SenderId
            })
            .Select(g =>
            {
                var last = g.First();
                var otherUser = last.SenderId == userId ? last.Receiver : last.Sender;
                var mainPhoto = last.Listing.Photos.FirstOrDefault(p => p.IsMain)?.ThumbnailUrl
                    ?? last.Listing.Photos.FirstOrDefault()?.ThumbnailUrl;
                return new ConversationDto
                {
                    ListingId = g.Key.ListingId,
                    ListingTitleAr = last.Listing.TitleAr,
                    ListingTitleFr = last.Listing.TitleFr,
                    ListingMainPhoto = mainPhoto,
                    OtherUserId = g.Key.OtherUserId,
                    OtherUserName = $"{otherUser.FirstName} {otherUser.LastName}".Trim(),
                    LastMessage = last.Content,
                    LastMessageAt = last.SentAt,
                    UnreadCount = g.Count(m => m.ReceiverId == userId && !m.IsRead)
                };
            })
            .OrderByDescending(c => c.LastMessageAt)
            .ToList();

        return Ok(conversations);
    }

    [HttpGet("conversation/{listingId}/{otherUserId}")]
    public async Task<ActionResult<List<MessageDto>>> GetConversation(int listingId, string otherUserId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var messages = await _db.Messages
            .Include(m => m.Sender).Include(m => m.Receiver).Include(m => m.Listing)
            .Where(m => m.ListingId == listingId &&
                ((m.SenderId == userId && m.ReceiverId == otherUserId) ||
                 (m.SenderId == otherUserId && m.ReceiverId == userId)))
            .OrderBy(m => m.SentAt)
            .ToListAsync();

        // Mark received messages as read
        var unread = messages.Where(m => m.ReceiverId == userId && !m.IsRead).ToList();
        unread.ForEach(m => m.IsRead = true);
        if (unread.Any()) await _db.SaveChangesAsync();

        return Ok(messages.Select(MapMessage).ToList());
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<int>> UnreadCount()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var count = await _db.Messages.CountAsync(m => m.ReceiverId == userId && !m.IsRead);
        return Ok(count);
    }

    private static MessageDto MapMessage(Message m) => new()
    {
        Id = m.Id,
        ListingId = m.ListingId,
        ListingTitleAr = m.Listing?.TitleAr ?? string.Empty,
        ListingTitleFr = m.Listing?.TitleFr ?? string.Empty,
        SenderId = m.SenderId,
        SenderName = $"{m.Sender?.FirstName} {m.Sender?.LastName}".Trim(),
        ReceiverId = m.ReceiverId,
        ReceiverName = $"{m.Receiver?.FirstName} {m.Receiver?.LastName}".Trim(),
        Content = m.Content,
        IsRead = m.IsRead,
        SentAt = m.SentAt
    };
}
