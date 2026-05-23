namespace Sabrikom.API.DTOs;

public class CategoryDto
{
    public int Id { get; set; }
    public string NameAr { get; set; } = string.Empty;
    public string NameFr { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public int? ParentId { get; set; }
    public int SortOrder { get; set; }
    public List<CategoryDto> Children { get; set; } = new();
}

public record CategoryCreateDto(string NameAr, string NameFr, string Slug, string? Icon, int? ParentId, int SortOrder);
public record CategoryUpdateDto(string NameAr, string NameFr, string Slug, string? Icon, int? ParentId, int SortOrder, bool IsActive);

public class BrandDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public List<VehicleModelDto> Models { get; set; } = new();
}

public record BrandCreateDto(string Name, string? LogoUrl);
public record BrandUpdateDto(string Name, string? LogoUrl, bool IsActive);

public class VehicleModelDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int BrandId { get; set; }
    public string BrandName { get; set; } = string.Empty;
}

public record VehicleModelCreateDto(string Name, int BrandId);
public record VehicleModelUpdateDto(string Name, int BrandId, bool IsActive);

public class AdminStatsDto
{
    public int TotalListings { get; set; }
    public int PendingListings { get; set; }
    public int PublishedListings { get; set; }
    public int TotalUsers { get; set; }
    public int TotalSellers { get; set; }
    public int TotalMessages { get; set; }
}
