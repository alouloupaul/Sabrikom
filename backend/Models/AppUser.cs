using Microsoft.AspNetCore.Identity;

namespace Sabrikom.API.Models;

public class AppUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public new string? PhoneNumber { get; set; }
    public string Country { get; set; } = "DZ"; // DZ, MA, TN
    public string City { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Buyer;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Listing> Listings { get; set; } = new List<Listing>();
    public ICollection<Message> SentMessages { get; set; } = new List<Message>();
    public ICollection<Message> ReceivedMessages { get; set; } = new List<Message>();
    public ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}

public enum UserRole
{
    Buyer = 0,
    Seller = 1,
    Admin = 2
}
