using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Sabrikom.API.Models;

namespace Sabrikom.API.Data;

public class AppDbContext : IdentityDbContext<AppUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<VehicleModel> VehicleModels => Set<VehicleModel>();
    public DbSet<Listing> Listings => Set<Listing>();
    public DbSet<ListingPhoto> ListingPhotos => Set<ListingPhoto>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Favorite> Favorites => Set<Favorite>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Category self-reference
        builder.Entity<Category>()
            .HasOne(c => c.Parent)
            .WithMany(c => c.Children)
            .HasForeignKey(c => c.ParentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Listing -> Seller
        builder.Entity<Listing>()
            .HasOne(l => l.Seller)
            .WithMany(u => u.Listings)
            .HasForeignKey(l => l.SellerId)
            .OnDelete(DeleteBehavior.Cascade);

        // Listing -> ValidatedBy (no cascade)
        builder.Entity<Listing>()
            .HasOne(l => l.ValidatedBy)
            .WithMany()
            .HasForeignKey(l => l.ValidatedById)
            .OnDelete(DeleteBehavior.SetNull);

        // Message -> Sender
        builder.Entity<Message>()
            .HasOne(m => m.Sender)
            .WithMany(u => u.SentMessages)
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        // Message -> Receiver
        builder.Entity<Message>()
            .HasOne(m => m.Receiver)
            .WithMany(u => u.ReceivedMessages)
            .HasForeignKey(m => m.ReceiverId)
            .OnDelete(DeleteBehavior.Restrict);

        // Message -> Listing (no cascade to avoid multiple paths)
        builder.Entity<Message>()
            .HasOne(m => m.Listing)
            .WithMany(l => l.Messages)
            .HasForeignKey(m => m.ListingId)
            .OnDelete(DeleteBehavior.Cascade);

        // Favorite unique constraint
        builder.Entity<Favorite>()
            .HasIndex(f => new { f.UserId, f.ListingId })
            .IsUnique();

        // Listing price precision
        builder.Entity<Listing>()
            .Property(l => l.Price)
            .HasPrecision(12, 2);

        // Seed categories
        builder.Entity<Category>().HasData(
            new Category { Id = 1, NameAr = "المحرك وناقل الحركة", NameFr = "Moteur & Transmission", Slug = "moteur-transmission", SortOrder = 1 },
            new Category { Id = 2, NameAr = "الهيكل والزجاج", NameFr = "Carrosserie & Vitrerie", Slug = "carrosserie-vitrerie", SortOrder = 2 },
            new Category { Id = 3, NameAr = "الكهرباء والإلكترونيات", NameFr = "Électrique & Électronique", Slug = "electrique-electronique", SortOrder = 3 },
            new Category { Id = 4, NameAr = "الفرامل والتعليق", NameFr = "Freinage & Suspension", Slug = "freinage-suspension", SortOrder = 4 },
            new Category { Id = 5, NameAr = "تكييف الهواء", NameFr = "Climatisation", Slug = "climatisation", SortOrder = 5 },
            new Category { Id = 6, NameAr = "الداخلية والإكسسوارات", NameFr = "Intérieur & Accessoires", Slug = "interieur-accessoires", SortOrder = 6 },
            new Category { Id = 7, NameAr = "أخرى", NameFr = "Autres", Slug = "autres", SortOrder = 7 }
        );

        // Seed brands
        builder.Entity<Brand>().HasData(
            new Brand { Id = 1, Name = "Renault" },
            new Brand { Id = 2, Name = "Peugeot" },
            new Brand { Id = 3, Name = "Volkswagen" },
            new Brand { Id = 4, Name = "Toyota" },
            new Brand { Id = 5, Name = "Hyundai" },
            new Brand { Id = 6, Name = "Kia" },
            new Brand { Id = 7, Name = "Dacia" },
            new Brand { Id = 8, Name = "Ford" },
            new Brand { Id = 9, Name = "Citroën" },
            new Brand { Id = 10, Name = "Fiat" },
            new Brand { Id = 11, Name = "Mercedes-Benz" },
            new Brand { Id = 12, Name = "BMW" },
            new Brand { Id = 13, Name = "Audi" },
            new Brand { Id = 14, Name = "Nissan" },
            new Brand { Id = 15, Name = "Honda" }
        );

        // Seed vehicle models
        builder.Entity<VehicleModel>().HasData(
            new VehicleModel { Id = 1, Name = "Clio", BrandId = 1 },
            new VehicleModel { Id = 2, Name = "Megane", BrandId = 1 },
            new VehicleModel { Id = 3, Name = "Symbol", BrandId = 1 },
            new VehicleModel { Id = 4, Name = "Logan", BrandId = 7 },
            new VehicleModel { Id = 5, Name = "Sandero", BrandId = 7 },
            new VehicleModel { Id = 6, Name = "208", BrandId = 2 },
            new VehicleModel { Id = 7, Name = "308", BrandId = 2 },
            new VehicleModel { Id = 8, Name = "Golf", BrandId = 3 },
            new VehicleModel { Id = 9, Name = "Polo", BrandId = 3 },
            new VehicleModel { Id = 10, Name = "Corolla", BrandId = 4 },
            new VehicleModel { Id = 11, Name = "Yaris", BrandId = 4 },
            new VehicleModel { Id = 12, Name = "i10", BrandId = 5 },
            new VehicleModel { Id = 13, Name = "i20", BrandId = 5 },
            new VehicleModel { Id = 14, Name = "Picanto", BrandId = 6 },
            new VehicleModel { Id = 15, Name = "Sportage", BrandId = 6 }
        );
    }
}
