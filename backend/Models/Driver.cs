using System.ComponentModel.DataAnnotations;

namespace FleetOS.Api.Models;

public class Driver
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Frontend short ID, e.g. "d1".</summary>
    [MaxLength(50)]
    public string ShortId { get; set; } = string.Empty;

    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(50)]
    public string LicenseNumber { get; set; } = string.Empty;

    public string LicenseClass { get; set; } = "C"; // A | B | C | D

    // on_duty | off_duty | driving | resting
    public string Status { get; set; } = "off_duty";

    // 0-100
    public int SafetyScore { get; set; } = 80;

    // HOS = Hours of Service
    public double HosDriven { get; set; } // hours today
    public double HosRemaining { get; set; } = 11.0; // hours

    public string? AssignedVehiclePlate { get; set; }
    public Guid? AssignedVehicleId { get; set; }

    public string PhoneNumber { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
