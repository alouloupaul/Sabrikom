namespace Sabrikom.API.Models;

public class VehicleModel
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int BrandId { get; set; }
    public Brand Brand { get; set; } = null!;
    public bool IsActive { get; set; } = true;
    public ICollection<Listing> Listings { get; set; } = new List<Listing>();
}
