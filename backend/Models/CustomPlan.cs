using System.ComponentModel.DataAnnotations;

namespace FleetOS.Api.Models;

public class CustomPlan
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(60)]
    public string ShortId { get; set; } = string.Empty;   // e.g. "cp-acme-standard"

    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    [Required, MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string Tagline { get; set; } = string.Empty;

    public decimal Price { get; set; }

    [MaxLength(20)]
    public string Color { get; set; } = string.Empty;

    public bool Highlight { get; set; }

    /// <summary>JSON array of ServiceKey strings</summary>
    public string ServicesJson { get; set; } = "[]";

    /// <summary>JSON object of ServiceLimits</summary>
    public string LimitsJson { get; set; } = "{}";

    [MaxLength(20)]
    public string Status { get; set; } = string.Empty;   // draft | active | archived

    public bool IsDefault { get; set; }

    public int VehicleCount { get; set; }

    public DateOnly CreatedAt { get; set; }
    public DateOnly UpdatedAt { get; set; }
}
