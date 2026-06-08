using System.ComponentModel.DataAnnotations;

namespace FleetOS.Api.Models;

public class Trip
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(40)]
    public string ShortId { get; set; } = string.Empty;   // e.g. "t1", "v2-t1"

    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    [MaxLength(20)]
    public string VehicleShortId { get; set; } = string.Empty;   // e.g. "v1"

    [MaxLength(30)]
    public string Date { get; set; } = string.Empty;    // "2026-05-28 07:14"

    [MaxLength(12)]
    public string DateIso { get; set; } = string.Empty;  // "2026-05-28"

    [MaxLength(120)]
    public string From { get; set; } = string.Empty;

    [MaxLength(120)]
    public string To { get; set; } = string.Empty;

    public double DistanceKm { get; set; }
    public int    DurationMin { get; set; }
    public double AvgSpeed { get; set; }
    public double MaxSpeed { get; set; }
    public double FuelUsedL { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = string.Empty;   // Completed | In Progress

    /// <summary>
    /// JSON-serialised RoutePoint[] array for map playback.
    /// Schema: [{lat,lng,time,speed,event}]
    /// </summary>
    public string RouteJson { get; set; } = "[]";
}
