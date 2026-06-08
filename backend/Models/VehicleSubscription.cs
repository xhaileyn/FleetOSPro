using System.ComponentModel.DataAnnotations;

namespace FleetOS.Api.Models;

public class VehicleSubscription
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(30)]
    public string VehicleShortId { get; set; } = string.Empty;   // e.g. "v1"

    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    [Required, MaxLength(20)]
    public string Plan { get; set; } = string.Empty;   // Starter | Basic | Professional | Enterprise

    /// <summary>Custom plan ID from the CustomPlans table (optional override).</summary>
    [MaxLength(60)]
    public string? CustomPlanId { get; set; }

    public DateOnly StartDate { get; set; }
    public DateOnly ExpiryDate { get; set; }

    public bool AutoRenew { get; set; }

    [MaxLength(200)]
    public string? ContactEmail { get; set; }

    /// <summary>JSON array of SMS numbers, e.g. ["+254722110001"]</summary>
    public string SmsNumbersJson { get; set; } = "[]";
}
