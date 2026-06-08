using System.ComponentModel.DataAnnotations;

namespace FleetOS.Api.Models;

public class Alert
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public Guid? VehicleId { get; set; }
    public Vehicle? Vehicle { get; set; }

    // critical | warning | info
    public string Severity { get; set; } = "warning";

    // geofence_breach | low_fuel | speeding | hos_violation | obd_fault | unauthorized_use
    public string Type { get; set; } = "geofence_breach";

    [Required, MaxLength(300)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    public bool Acknowledged { get; set; }

    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
}
