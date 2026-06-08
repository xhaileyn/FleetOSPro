using System.ComponentModel.DataAnnotations;

namespace FleetOS.Api.Models;

public class AppUser
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required, MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    // super_admin | platform_admin | partner | fleet_admin | fleet_manager | dispatcher | billing_admin | viewer
    public string Role { get; set; } = "viewer";

    public string Status { get; set; } = "active"; // active | suspended | invited

    public bool MfaEnabled { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // null for super_admin and platform_admin (they are not scoped to a tenant)
    public Guid? TenantId { get; set; }
    public Tenant? Tenant { get; set; }
}
