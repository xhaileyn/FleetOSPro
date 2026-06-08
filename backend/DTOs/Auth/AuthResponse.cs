namespace FleetOS.Api.DTOs.Auth;

public record AuthResponse(
    string Token,
    string Role,
    string Email,
    string FullName,
    Guid? TenantId,
    string? TenantName,
    string? TenantSlug
);
