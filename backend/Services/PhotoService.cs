using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

namespace Sabrikom.API.Services;

public class PhotoService
{
    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _config;

    public PhotoService(IWebHostEnvironment env, IConfiguration config)
    {
        _env = env;
        _config = config;
    }

    public async Task<(string url, string thumbnailUrl)> SavePhotoAsync(IFormFile file)
    {
        var uploadsDir = Path.Combine(_env.WebRootPath ?? _env.ContentRootPath, "uploads");
        var thumbsDir = Path.Combine(uploadsDir, "thumbs");
        Directory.CreateDirectory(uploadsDir);
        Directory.CreateDirectory(thumbsDir);

        var fileName = $"{Guid.NewGuid()}.webp";
        var thumbName = $"thumb_{fileName}";

        var filePath = Path.Combine(uploadsDir, fileName);
        var thumbPath = Path.Combine(thumbsDir, thumbName);

        using var image = await Image.LoadAsync(file.OpenReadStream());

        // Main image: max 1200px wide
        image.Mutate(x => x.Resize(new ResizeOptions
        {
            Size = new Size(1200, 0),
            Mode = ResizeMode.Max
        }));
        await image.SaveAsWebpAsync(filePath);

        // Thumbnail: 300x300 crop
        image.Mutate(x => x.Resize(new ResizeOptions
        {
            Size = new Size(300, 300),
            Mode = ResizeMode.Crop
        }));
        await image.SaveAsWebpAsync(thumbPath);

        var baseUrl = _config["App:BaseUrl"] ?? string.Empty;
        return ($"{baseUrl}/uploads/{fileName}", $"{baseUrl}/uploads/thumbs/{thumbName}");
    }

    public void DeletePhoto(string url)
    {
        var baseUrl = _config["App:BaseUrl"] ?? string.Empty;
        var relativePath = url.Replace(baseUrl, "").TrimStart('/');
        var fullPath = Path.Combine(_env.WebRootPath ?? _env.ContentRootPath, relativePath.Replace('/', Path.DirectorySeparatorChar));
        if (File.Exists(fullPath)) File.Delete(fullPath);
    }
}
