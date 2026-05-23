namespace Sabrikom.API.Models;

public class Category
{
    public int Id { get; set; }
    public string NameAr { get; set; } = string.Empty;
    public string NameFr { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public int? ParentId { get; set; }
    public Category? Parent { get; set; }
    public ICollection<Category> Children { get; set; } = new List<Category>();
    public ICollection<Listing> Listings { get; set; } = new List<Listing>();
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; } = 0;
}
