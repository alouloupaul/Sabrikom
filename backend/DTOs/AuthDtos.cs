namespace Sabrikom.API.DTOs;

public record RegisterDto(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    string PhoneNumber,
    string Country,
    string City,
    string Role // "Buyer" or "Seller"
);

public record LoginDto(string Email, string Password);

public record RefreshTokenDto(string RefreshToken);

public record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    string UserId,
    string Email,
    string FirstName,
    string LastName,
    string Role
);

public record UserProfileDto(
    string Id,
    string FirstName,
    string LastName,
    string Email,
    string? PhoneNumber,
    string Country,
    string City,
    string Role,
    bool IsActive,
    DateTime CreatedAt
);
