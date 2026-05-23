using Sabrikom.API.Models;

namespace Sabrikom.API.DTOs;

public record ListingCreateDto(
    string TitleAr,
    string TitleFr,
    string DescriptionAr,
    string DescriptionFr,
    decimal Price,
    string Currency,
    string Condition, // "New" or "Used"
    int CategoryId,
    int? BrandId,
    int? VehicleModelId,
    int? YearFrom,
    int? YearTo,
    string? OemReference,
    string Country,
    string City,
    string PhoneNumber
);

public record ListingUpdateDto(
    string TitleAr,
    string TitleFr,
    string DescriptionAr,
    string DescriptionFr,
    decimal Price,
    string Currency,
    string Condition,
    int CategoryId,
    int? BrandId,
    int? VehicleModelId,
    int? YearFrom,
    int? YearTo,
    string? OemReference,
    string Country,
    string City,
    string PhoneNumber
);

public record ListingValidateDto(bool Approve, string? RejectionReason);

public class ListingDto
{
    public int Id { get; set; }
    public string TitleAr { get; set; } = string.Empty;
    public string TitleFr { get; set; } = string.Empty;
    public string DescriptionAr { get; set; } = string.Empty;
    public string DescriptionFr { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string Condition { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? RejectionReason { get; set; }
    public int CategoryId { get; set; }
    public string CategoryNameAr { get; set; } = string.Empty;
    public string CategoryNameFr { get; set; } = string.Empty;
    public int? BrandId { get; set; }
    public string? BrandName { get; set; }
    public int? VehicleModelId { get; set; }
    public string? VehicleModelName { get; set; }
    public int? YearFrom { get; set; }
    public int? YearTo { get; set; }
    public string? OemReference { get; set; }
    public string Country { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string SellerId { get; set; } = string.Empty;
    public string SellerName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<PhotoDto> Photos { get; set; } = new();
    public bool IsFavorite { get; set; }
}

public class PhotoDto
{
    public int Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public bool IsMain { get; set; }
    public int SortOrder { get; set; }
}

public class ListingSearchParams
{
    public string? Query { get; set; }
    public string? OemReference { get; set; }
    public int? CategoryId { get; set; }
    public int? BrandId { get; set; }
    public int? VehicleModelId { get; set; }
    public int? Year { get; set; }
    public string? Condition { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string SortBy { get; set; } = "date_desc";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}
