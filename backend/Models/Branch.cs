using System.ComponentModel.DataAnnotations;

namespace FleetOS.Api.Models;

public class Branch
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Frontend short ID, e.g. "b-101".</summary>
    [MaxLength(50)]
    public string ShortId { get; set; } = string.Empty;

    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(100)]
    public string City { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Region { get; set; } = string.Empty;

    public int VehicleCount { get; set; }
    public int DriverCount  { get; set; }
    public int UserCount    { get; set; }

    public bool Active { get; set; } = true;

    public string? ManagerId { get; set; }   // references AppUser (string FK for simplicity)

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
