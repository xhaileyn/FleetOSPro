using System.ComponentModel.DataAnnotations;

namespace FleetOS.Api.Models;

public class SimCard
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(60)]
    public string ShortId { get; set; } = string.Empty;   // e.g. "sim-v1-p"

    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    [MaxLength(20)]
    public string VehicleShortId { get; set; } = string.Empty;

    [MaxLength(20)]
    public string VehiclePlate { get; set; } = string.Empty;

    [MaxLength(22)]
    public string Iccid { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Msisdn { get; set; } = string.Empty;

    [MaxLength(60)]
    public string Operator { get; set; } = string.Empty;

    [MaxLength(40)]
    public string Country { get; set; } = string.Empty;

    [MaxLength(10)]
    public string Type { get; set; } = string.Empty;   // Primary | Backup

    [MaxLength(20)]
    public string Status { get; set; } = string.Empty;   // Active | Inactive | Suspended | Expired

    public int DataUsedMb { get; set; }

    public int DataPlanMb { get; set; }

    [MaxLength(80)]
    public string Apn { get; set; } = string.Empty;

    public DateOnly ActivatedAt { get; set; }

    public DateOnly ExpiresAt { get; set; }

    public string Notes { get; set; } = string.Empty;
}
