namespace Sabrikom.API.Models;

public class Brand
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<VehicleModel> Models { get; set; } = new List<VehicleModel>();
}
