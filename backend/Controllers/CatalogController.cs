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
public class CatalogController : ControllerBase
{
    private readonly AppDbContext _db;

    public CatalogController(AppDbContext db) => _db = db;

    // ── Categories ──────────────────────────────────────────────────────────

    [HttpGet("categories")]
    public async Task<ActionResult<List<CategoryDto>>> GetCategories()
    {
        var cats = await _db.Categories
            .Where(c => c.IsActive && c.ParentId == null)
            .Include(c => c.Children.Where(ch => ch.IsActive))
            .OrderBy(c => c.SortOrder)
            .ToListAsync();

        return Ok(cats.Select(MapCategory).ToList());
    }

    [Authorize]
    [HttpPost("categories")]
    public async Task<ActionResult<CategoryDto>> CreateCategory([FromBody] CategoryCreateDto dto)
    {
        if (User.FindFirstValue("role") != "Admin") return Forbid();
        var cat = new Category
        {
            NameAr = dto.NameAr, NameFr = dto.NameFr, Slug = dto.Slug,
            Icon = dto.Icon, ParentId = dto.ParentId, SortOrder = dto.SortOrder
        };
        _db.Categories.Add(cat);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetCategories), MapCategory(cat));
    }

    [Authorize]
    [HttpPut("categories/{id}")]
    public async Task<ActionResult<CategoryDto>> UpdateCategory(int id, [FromBody] CategoryUpdateDto dto)
    {
        if (User.FindFirstValue("role") != "Admin") return Forbid();
        var cat = await _db.Categories.FindAsync(id);
        if (cat == null) return NotFound();
        cat.NameAr = dto.NameAr; cat.NameFr = dto.NameFr; cat.Slug = dto.Slug;
        cat.Icon = dto.Icon; cat.ParentId = dto.ParentId; cat.SortOrder = dto.SortOrder;
        cat.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();
        return Ok(MapCategory(cat));
    }

    [Authorize]
    [HttpDelete("categories/{id}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        if (User.FindFirstValue("role") != "Admin") return Forbid();
        var cat = await _db.Categories.FindAsync(id);
        if (cat == null) return NotFound();
        cat.IsActive = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Brands ──────────────────────────────────────────────────────────────

    [HttpGet("brands")]
    public async Task<ActionResult<List<BrandDto>>> GetBrands([FromQuery] bool withModels = false)
    {
        var query = _db.Brands.Where(b => b.IsActive).AsQueryable();
        if (withModels) query = query.Include(b => b.Models.Where(m => m.IsActive));
        var brands = await query.OrderBy(b => b.Name).ToListAsync();
        return Ok(brands.Select(b => MapBrand(b, withModels)).ToList());
    }

    [HttpGet("brands/{id}/models")]
    public async Task<ActionResult<List<VehicleModelDto>>> GetModels(int id)
    {
        var models = await _db.VehicleModels
            .Where(m => m.BrandId == id && m.IsActive)
            .Include(m => m.Brand)
            .OrderBy(m => m.Name)
            .ToListAsync();
        return Ok(models.Select(MapModel).ToList());
    }

    [Authorize]
    [HttpPost("brands")]
    public async Task<ActionResult<BrandDto>> CreateBrand([FromBody] BrandCreateDto dto)
    {
        if (User.FindFirstValue("role") != "Admin") return Forbid();
        var brand = new Brand { Name = dto.Name, LogoUrl = dto.LogoUrl };
        _db.Brands.Add(brand);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetBrands), MapBrand(brand, false));
    }

    [Authorize]
    [HttpPut("brands/{id}")]
    public async Task<ActionResult<BrandDto>> UpdateBrand(int id, [FromBody] BrandUpdateDto dto)
    {
        if (User.FindFirstValue("role") != "Admin") return Forbid();
        var brand = await _db.Brands.FindAsync(id);
        if (brand == null) return NotFound();
        brand.Name = dto.Name; brand.LogoUrl = dto.LogoUrl; brand.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();
        return Ok(MapBrand(brand, false));
    }

    [Authorize]
    [HttpPost("brands/{brandId}/models")]
    public async Task<ActionResult<VehicleModelDto>> CreateModel(int brandId, [FromBody] VehicleModelCreateDto dto)
    {
        if (User.FindFirstValue("role") != "Admin") return Forbid();
        var model = new VehicleModel { Name = dto.Name, BrandId = brandId };
        _db.VehicleModels.Add(model);
        await _db.SaveChangesAsync();
        var full = await _db.VehicleModels.Include(m => m.Brand).FirstAsync(m => m.Id == model.Id);
        return CreatedAtAction(nameof(GetModels), new { id = brandId }, MapModel(full));
    }

    [Authorize]
    [HttpPut("models/{id}")]
    public async Task<ActionResult<VehicleModelDto>> UpdateModel(int id, [FromBody] VehicleModelUpdateDto dto)
    {
        if (User.FindFirstValue("role") != "Admin") return Forbid();
        var model = await _db.VehicleModels.Include(m => m.Brand).FirstOrDefaultAsync(m => m.Id == id);
        if (model == null) return NotFound();
        model.Name = dto.Name; model.BrandId = dto.BrandId; model.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();
        return Ok(MapModel(model));
    }

    // ── Admin Stats ──────────────────────────────────────────────────────────

    [Authorize]
    [HttpGet("admin/stats")]
    public async Task<ActionResult<AdminStatsDto>> GetStats()
    {
        if (User.FindFirstValue("role") != "Admin") return Forbid();
        return Ok(new AdminStatsDto
        {
            TotalListings = await _db.Listings.CountAsync(l => l.Status != ListingStatus.Deleted),
            PendingListings = await _db.Listings.CountAsync(l => l.Status == ListingStatus.Pending),
            PublishedListings = await _db.Listings.CountAsync(l => l.Status == ListingStatus.Published),
            TotalUsers = await _db.Users.CountAsync(),
            TotalSellers = await _db.Users.CountAsync(u => u.Role == UserRole.Seller),
            TotalMessages = await _db.Messages.CountAsync()
        });
    }

    // ── Admin Users ──────────────────────────────────────────────────────────

    [Authorize]
    [HttpGet("admin/users")]
    public async Task<ActionResult<PagedResult<UserProfileDto>>> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (User.FindFirstValue("role") != "Admin") return Forbid();
        var query = _db.Users.OrderByDescending(u => u.CreatedAt);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(new PagedResult<UserProfileDto>
        {
            Items = items.Select(u => new UserProfileDto(u.Id, u.FirstName, u.LastName, u.Email!, u.PhoneNumber, u.Country, u.City, u.Role.ToString(), u.IsActive, u.CreatedAt)).ToList(),
            TotalCount = total, Page = page, PageSize = pageSize
        });
    }

    [Authorize]
    [HttpPatch("admin/users/{id}/toggle")]
    public async Task<IActionResult> ToggleUser(string id)
    {
        if (User.FindFirstValue("role") != "Admin") return Forbid();
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();
        user.IsActive = !user.IsActive;
        await _db.SaveChangesAsync();
        return Ok(new { isActive = user.IsActive });
    }

    // ── Mappers ──────────────────────────────────────────────────────────────

    private static CategoryDto MapCategory(Category c) => new()
    {
        Id = c.Id, NameAr = c.NameAr, NameFr = c.NameFr, Slug = c.Slug,
        Icon = c.Icon, ParentId = c.ParentId, SortOrder = c.SortOrder,
        Children = c.Children?.Select(MapCategory).ToList() ?? new()
    };

    private static BrandDto MapBrand(Brand b, bool withModels) => new()
    {
        Id = b.Id, Name = b.Name, LogoUrl = b.LogoUrl,
        Models = withModels ? b.Models?.Select(MapModel).ToList() ?? new() : new()
    };

    private static VehicleModelDto MapModel(VehicleModel m) => new()
    {
        Id = m.Id, Name = m.Name, BrandId = m.BrandId, BrandName = m.Brand?.Name ?? string.Empty
    };
}
