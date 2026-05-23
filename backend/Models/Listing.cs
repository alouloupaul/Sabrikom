namespace Sabrikom.API.Models;

public class Listing
{
    public int Id { get; set; }
    public string TitleAr { get; set; } = string.Empty;
    public string TitleFr { get; set; } = string.Empty;
    public string DescriptionAr { get; set; } = string.Empty;
    public string DescriptionFr { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Currency { get; set; } = "DZD"; // DZD, MAD, TND
    public PartCondition Condition { get; set; } = PartCondition.Used;
    public ListingStatus Status { get; set; } = ListingStatus.Pending;
    public string? RejectionReason { get; set; }

    // Vehicle compatibility
    public int? BrandId { get; set; }
    public Brand? Brand { get; set; }
    public int? VehicleModelId { get; set; }
    public VehicleModel? VehicleModel { get; set; }
    public int? YearFrom { get; set; }
    public int? YearTo { get; set; }

    // Part reference
    public string? OemReference { get; set; }

    // Category
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    // Location
    public string Country { get; set; } = "DZ";
    public string City { get; set; } = string.Empty;

    // Seller contact
    public string PhoneNumber { get; set; } = string.Empty;

    // Seller
    public string SellerId { get; set; } = string.Empty;
    public AppUser Seller { get; set; } = null!;

    // Admin who validated
    public string? ValidatedById { get; set; }
    public AppUser? ValidatedBy { get; set; }
    public DateTime? ValidatedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }

    public ICollection<ListingPhoto> Photos { get; set; } = new List<ListingPhoto>();
    public ICollection<Message> Messages { get; set; } = new List<Message>();
    public ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();
}

public enum PartCondition
{
    New = 0,
    Used = 1
}

public enum ListingStatus
{
    Pending = 0,
    Published = 1,
    Rejected = 2,
    Expired = 3,
    Deleted = 4
}
