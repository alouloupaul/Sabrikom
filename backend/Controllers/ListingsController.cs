using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sabrikom.API.Data;
using Sabrikom.API.DTOs;
using Sabrikom.API.Models;
using Sabrikom.API.Services;
using System.Security.Claims;

namespace Sabrikom.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ListingsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly PhotoService _photoService;

    public ListingsController(AppDbContext db, PhotoService photoService)
    {
        _db = db;
        _photoService = photoService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<ListingDto>>> Search([FromQuery] ListingSearchParams p)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var query = _db.Listings
            .Include(l => l.Category)
            .Include(l => l.Brand)
            .Include(l => l.VehicleModel)
            .Include(l => l.Seller)
            .Include(l => l.Photos)
            .Where(l => l.Status == ListingStatus.Published)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(p.Query))
        {
            var q = p.Query.ToLower();
            query = query.Where(l =>
                l.TitleAr.ToLower().Contains(q) ||
                l.TitleFr.ToLower().Contains(q) ||
                l.DescriptionAr.ToLower().Contains(q) ||
                l.DescriptionFr.ToLower().Contains(q));
        }

        if (!string.IsNullOrWhiteSpace(p.OemReference))
            query = query.Where(l => l.OemReference != null && l.OemReference.ToLower().Contains(p.OemReference.ToLower()));

        if (p.CategoryId.HasValue)
            query = query.Where(l => l.CategoryId == p.CategoryId);

        if (p.BrandId.HasValue)
            query = query.Where(l => l.BrandId == p.BrandId);

        if (p.VehicleModelId.HasValue)
            query = query.Where(l => l.VehicleModelId == p.VehicleModelId);

        if (p.Year.HasValue)
            query = query.Where(l =>
                (!l.YearFrom.HasValue || l.YearFrom <= p.Year) &&
                (!l.YearTo.HasValue || l.YearTo >= p.Year));

        if (!string.IsNullOrWhiteSpace(p.Condition) && Enum.TryParse<PartCondition>(p.Condition, true, out var cond))
            query = query.Where(l => l.Condition == cond);

        if (!string.IsNullOrWhiteSpace(p.Country))
            query = query.Where(l => l.Country == p.Country);

        if (!string.IsNullOrWhiteSpace(p.City))
            query = query.Where(l => l.City.ToLower().Contains(p.City.ToLower()));

        if (p.MinPrice.HasValue)
            query = query.Where(l => l.Price >= p.MinPrice);

        if (p.MaxPrice.HasValue)
            query = query.Where(l => l.Price <= p.MaxPrice);

        query = p.SortBy switch
        {
            "price_asc" => query.OrderBy(l => l.Price),
            "price_desc" => query.OrderByDescending(l => l.Price),
            _ => query.OrderByDescending(l => l.CreatedAt)
        };

        var total = await query.CountAsync();
        var items = await query
            .Skip((p.Page - 1) * p.PageSize)
            .Take(p.PageSize)
            .ToListAsync();

        var favoriteIds = currentUserId != null
            ? (await _db.Favorites.Where(f => f.UserId == currentUserId).Select(f => f.ListingId).ToListAsync()).ToHashSet()
            : new HashSet<int>();

        return Ok(new PagedResult<ListingDto>
        {
            Items = items.Select(l => MapListing(l, favoriteIds.Contains(l.Id))).ToList(),
            TotalCount = total,
            Page = p.Page,
            PageSize = p.PageSize
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ListingDto>> GetById(int id)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var listing = await _db.Listings
            .Include(l => l.Category)
            .Include(l => l.Brand)
            .Include(l => l.VehicleModel)
            .Include(l => l.Seller)
            .Include(l => l.Photos.OrderBy(p => p.SortOrder))
            .FirstOrDefaultAsync(l => l.Id == id && l.Status == ListingStatus.Published);

        if (listing == null) return NotFound();

        var isFav = currentUserId != null &&
            await _db.Favorites.AnyAsync(f => f.UserId == currentUserId && f.ListingId == id);

        return Ok(MapListing(listing, isFav));
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ListingDto>> Create([FromBody] ListingCreateDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var user = await _db.Users.FindAsync(userId);
        if (user == null || user.Role == UserRole.Buyer)
            return Forbid();

        if (!Enum.TryParse<PartCondition>(dto.Condition, true, out var condition))
            return BadRequest(new { message = "Invalid condition" });

        var listing = new Listing
        {
            TitleAr = dto.TitleAr,
            TitleFr = dto.TitleFr,
            DescriptionAr = dto.DescriptionAr,
            DescriptionFr = dto.DescriptionFr,
            Price = dto.Price,
            Currency = dto.Currency,
            Condition = condition,
            CategoryId = dto.CategoryId,
            BrandId = dto.BrandId,
            VehicleModelId = dto.VehicleModelId,
            YearFrom = dto.YearFrom,
            YearTo = dto.YearTo,
            OemReference = dto.OemReference,
            Country = dto.Country,
            City = dto.City,
            PhoneNumber = dto.PhoneNumber,
            SellerId = userId,
            Status = ListingStatus.Pending,
            ExpiresAt = DateTime.UtcNow.AddDays(60)
        };

        _db.Listings.Add(listing);
        await _db.SaveChangesAsync();

        var full = await _db.Listings
            .Include(l => l.Category).Include(l => l.Brand)
            .Include(l => l.VehicleModel).Include(l => l.Seller)
            .Include(l => l.Photos)
            .FirstAsync(l => l.Id == listing.Id);

        return CreatedAtAction(nameof(GetById), new { id = listing.Id }, MapListing(full, false));
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<ActionResult<ListingDto>> Update(int id, [FromBody] ListingUpdateDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var listing = await _db.Listings
            .Include(l => l.Category).Include(l => l.Brand)
            .Include(l => l.VehicleModel).Include(l => l.Seller)
            .Include(l => l.Photos)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (listing == null) return NotFound();
        if (listing.SellerId != userId) return Forbid();

        if (!Enum.TryParse<PartCondition>(dto.Condition, true, out var condition))
            return BadRequest(new { message = "Invalid condition" });

        listing.TitleAr = dto.TitleAr;
        listing.TitleFr = dto.TitleFr;
        listing.DescriptionAr = dto.DescriptionAr;
        listing.DescriptionFr = dto.DescriptionFr;
        listing.Price = dto.Price;
        listing.Currency = dto.Currency;
        listing.Condition = condition;
        listing.CategoryId = dto.CategoryId;
        listing.BrandId = dto.BrandId;
        listing.VehicleModelId = dto.VehicleModelId;
        listing.YearFrom = dto.YearFrom;
        listing.YearTo = dto.YearTo;
        listing.OemReference = dto.OemReference;
        listing.Country = dto.Country;
        listing.City = dto.City;
        listing.PhoneNumber = dto.PhoneNumber;
        listing.Status = ListingStatus.Pending; // re-submit for validation
        listing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(MapListing(listing, false));
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var userRole = User.FindFirstValue("role");
        var listing = await _db.Listings.Include(l => l.Photos).FirstOrDefaultAsync(l => l.Id == id);

        if (listing == null) return NotFound();
        if (listing.SellerId != userId && userRole != "Admin") return Forbid();

        foreach (var photo in listing.Photos)
        {
            _photoService.DeletePhoto(photo.Url);
            if (photo.ThumbnailUrl != null) _photoService.DeletePhoto(photo.ThumbnailUrl);
        }

        listing.Status = ListingStatus.Deleted;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [Authorize]
    [HttpPost("{id}/photos")]
    public async Task<ActionResult<List<PhotoDto>>> UploadPhotos(int id, [FromForm] List<IFormFile> files)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var listing = await _db.Listings.Include(l => l.Photos).FirstOrDefaultAsync(l => l.Id == id);

        if (listing == null) return NotFound();
        if (listing.SellerId != userId) return Forbid();

        var currentCount = listing.Photos.Count;
        if (currentCount + files.Count > 10)
            return BadRequest(new { message = "Maximum 10 photos per listing" });

        var photos = new List<ListingPhoto>();
        foreach (var file in files)
        {
            if (file.Length == 0) continue;
            var (url, thumbUrl) = await _photoService.SavePhotoAsync(file);
            var photo = new ListingPhoto
            {
                ListingId = id,
                Url = url,
                ThumbnailUrl = thumbUrl,
                IsMain = currentCount == 0 && photos.Count == 0,
                SortOrder = currentCount + photos.Count
            };
            photos.Add(photo);
        }

        _db.ListingPhotos.AddRange(photos);
        await _db.SaveChangesAsync();

        return Ok(photos.Select(p => new PhotoDto
        {
            Id = p.Id, Url = p.Url, ThumbnailUrl = p.ThumbnailUrl,
            IsMain = p.IsMain, SortOrder = p.SortOrder
        }).ToList());
    }

    [Authorize]
    [HttpDelete("{id}/photos/{photoId}")]
    public async Task<IActionResult> DeletePhoto(int id, int photoId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var listing = await _db.Listings.FirstOrDefaultAsync(l => l.Id == id);
        if (listing == null) return NotFound();
        if (listing.SellerId != userId) return Forbid();

        var photo = await _db.ListingPhotos.FirstOrDefaultAsync(p => p.Id == photoId && p.ListingId == id);
        if (photo == null) return NotFound();

        _photoService.DeletePhoto(photo.Url);
        if (photo.ThumbnailUrl != null) _photoService.DeletePhoto(photo.ThumbnailUrl);
        _db.ListingPhotos.Remove(photo);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // Admin: validate or reject
    [Authorize]
    [HttpPost("{id}/validate")]
    public async Task<ActionResult<ListingDto>> Validate(int id, [FromBody] ListingValidateDto dto)
    {
        var userRole = User.FindFirstValue("role");
        if (userRole != "Admin") return Forbid();

        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var listing = await _db.Listings
            .Include(l => l.Category).Include(l => l.Brand)
            .Include(l => l.VehicleModel).Include(l => l.Seller)
            .Include(l => l.Photos)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (listing == null) return NotFound();

        listing.Status = dto.Approve ? ListingStatus.Published : ListingStatus.Rejected;
        listing.RejectionReason = dto.Approve ? null : dto.RejectionReason;
        listing.ValidatedById = adminId;
        listing.ValidatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(MapListing(listing, false));
    }

    // Admin: get all listings with any status
    [Authorize]
    [HttpGet("admin/all")]
    public async Task<ActionResult<PagedResult<ListingDto>>> AdminGetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? status = null)
    {
        var userRole = User.FindFirstValue("role");
        if (userRole != "Admin") return Forbid();

        var query = _db.Listings
            .Include(l => l.Category).Include(l => l.Brand)
            .Include(l => l.VehicleModel).Include(l => l.Seller)
            .Include(l => l.Photos)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ListingStatus>(status, true, out var s))
            query = query.Where(l => l.Status == s);

        query = query.OrderByDescending(l => l.CreatedAt);

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return Ok(new PagedResult<ListingDto>
        {
            Items = items.Select(l => MapListing(l, false)).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        });
    }

    // Seller: my listings
    [Authorize]
    [HttpGet("my")]
    public async Task<ActionResult<PagedResult<ListingDto>>> MyListings([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var query = _db.Listings
            .Include(l => l.Category).Include(l => l.Brand)
            .Include(l => l.VehicleModel).Include(l => l.Seller)
            .Include(l => l.Photos)
            .Where(l => l.SellerId == userId && l.Status != ListingStatus.Deleted)
            .OrderByDescending(l => l.CreatedAt);

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return Ok(new PagedResult<ListingDto>
        {
            Items = items.Select(l => MapListing(l, false)).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        });
    }

    // Buyer: favorites
    [Authorize]
    [HttpPost("{id}/favorite")]
    public async Task<IActionResult> ToggleFavorite(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var existing = await _db.Favorites.FirstOrDefaultAsync(f => f.UserId == userId && f.ListingId == id);
        if (existing != null)
        {
            _db.Favorites.Remove(existing);
            await _db.SaveChangesAsync();
            return Ok(new { isFavorite = false });
        }

        _db.Favorites.Add(new Favorite { UserId = userId, ListingId = id });
        await _db.SaveChangesAsync();
        return Ok(new { isFavorite = true });
    }

    [Authorize]
    [HttpGet("favorites")]
    public async Task<ActionResult<PagedResult<ListingDto>>> GetFavorites([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var query = _db.Favorites
            .Where(f => f.UserId == userId)
            .Include(f => f.Listing).ThenInclude(l => l.Category)
            .Include(f => f.Listing).ThenInclude(l => l.Brand)
            .Include(f => f.Listing).ThenInclude(l => l.VehicleModel)
            .Include(f => f.Listing).ThenInclude(l => l.Seller)
            .Include(f => f.Listing).ThenInclude(l => l.Photos)
            .OrderByDescending(f => f.SavedAt);

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return Ok(new PagedResult<ListingDto>
        {
            Items = items.Select(f => MapListing(f.Listing, true)).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        });
    }

    private static ListingDto MapListing(Listing l, bool isFavorite) => new()
    {
        Id = l.Id,
        TitleAr = l.TitleAr,
        TitleFr = l.TitleFr,
        DescriptionAr = l.DescriptionAr,
        DescriptionFr = l.DescriptionFr,
        Price = l.Price,
        Currency = l.Currency,
        Condition = l.Condition.ToString(),
        Status = l.Status.ToString(),
        RejectionReason = l.RejectionReason,
        CategoryId = l.CategoryId,
        CategoryNameAr = l.Category?.NameAr ?? string.Empty,
        CategoryNameFr = l.Category?.NameFr ?? string.Empty,
        BrandId = l.BrandId,
        BrandName = l.Brand?.Name,
        VehicleModelId = l.VehicleModelId,
        VehicleModelName = l.VehicleModel?.Name,
        YearFrom = l.YearFrom,
        YearTo = l.YearTo,
        OemReference = l.OemReference,
        Country = l.Country,
        City = l.City,
        PhoneNumber = l.PhoneNumber,
        SellerId = l.SellerId,
        SellerName = $"{l.Seller?.FirstName} {l.Seller?.LastName}".Trim(),
        CreatedAt = l.CreatedAt,
        UpdatedAt = l.UpdatedAt,
        Photos = l.Photos?.OrderBy(p => p.SortOrder).Select(p => new PhotoDto
        {
            Id = p.Id, Url = p.Url, ThumbnailUrl = p.ThumbnailUrl,
            IsMain = p.IsMain, SortOrder = p.SortOrder
        }).ToList() ?? new(),
        IsFavorite = isFavorite
    };
}
