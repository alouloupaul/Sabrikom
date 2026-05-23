namespace Sabrikom.API.DTOs;

public record SendMessageDto(int ListingId, string ReceiverId, string Content);

public class MessageDto
{
    public int Id { get; set; }
    public int ListingId { get; set; }
    public string ListingTitleAr { get; set; } = string.Empty;
    public string ListingTitleFr { get; set; } = string.Empty;
    public string SenderId { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string ReceiverId { get; set; } = string.Empty;
    public string ReceiverName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime SentAt { get; set; }
}

public class ConversationDto
{
    public int ListingId { get; set; }
    public string ListingTitleAr { get; set; } = string.Empty;
    public string ListingTitleFr { get; set; } = string.Empty;
    public string? ListingMainPhoto { get; set; }
    public string OtherUserId { get; set; } = string.Empty;
    public string OtherUserName { get; set; } = string.Empty;
    public string LastMessage { get; set; } = string.Empty;
    public DateTime LastMessageAt { get; set; }
    public int UnreadCount { get; set; }
}
