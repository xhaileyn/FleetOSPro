using System.ComponentModel.DataAnnotations;

namespace FleetOS.Api.Models;

public class Device
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(60)]
    public string ShortId { get; set; } = string.Empty;   // e.g. "dev-v1-gps"

    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    [MaxLength(20)]
    public string VehicleShortId { get; set; } = string.Empty;   // e.g. "v1"

    [MaxLength(20)]
    public string VehiclePlate { get; set; } = string.Empty;

    [MaxLength(40)]
    public string Type { get; set; } = string.Empty;   // GPS Tracker | OBD Dongle | Dashcam | Temp Sensor | Fuel Sensor

    [MaxLength(100)]
    public string Model { get; set; } = string.Empty;

    [MaxLength(60)]
    public string SerialNo { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Imei { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Firmware { get; set; } = string.Empty;

    [MaxLength(10)]
    public string Signal { get; set; } = string.Empty;   // Strong | Medium | Weak | None

    public int? Battery { get; set; }   // % for battery-powered; null = hardwired

    [MaxLength(40)]
    public string LastSeen { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Status { get; set; } = string.Empty;   // Online | Offline | Maintenance

    [MaxLength(60)]
    public string? SimShortId { get; set; }

    public DateOnly InstalledAt { get; set; }

    public string Notes { get; set; } = string.Empty;
}
