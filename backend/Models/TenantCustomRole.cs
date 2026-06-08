using System.ComponentModel.DataAnnotations;

namespace FleetOS.Api.Models;

public class TenantCustomRole
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(20)]
    public string ShortId { get; set; } = string.Empty;   // e.g. "tr-1"

    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    [Required, MaxLength(80)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(40)]
    public string Slug { get; set; } = string.Empty;

    [MaxLength(300)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Color { get; set; } = string.Empty;

    public int UserCount { get; set; }

    public DateOnly CreatedAt { get; set; }

    /// <summary>JSON array of ModulePermission objects</summary>
    public string PermissionsJson { get; set; } = "[]";

    /// <summary>JSON object mapping featureId → bool</summary>
    public string FeaturePermissionsJson { get; set; } = "{}";
}
