using System.ComponentModel.DataAnnotations;

namespace FleetOS.Api.Models;

public class Vehicle
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    /// <summary>Frontend short ID, e.g. "v1", "v-ind-001". Used for client-side compatibility.</summary>
    [MaxLength(50)]
    public string ShortId { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Plate { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Vin { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Make { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Model { get; set; } = string.Empty;

    public int Year { get; set; }

    // Truck | Van | Pickup | Car | Bus | Motorcycle | Trailer
    [MaxLength(50)]
    public string Category { get; set; } = "Truck";

    [MaxLength(50)]
    public string BodyType { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Color { get; set; } = string.Empty;

    [MaxLength(50)]
    public string EngineNo { get; set; } = string.Empty;

    [MaxLength(20)]
    public string EngineCapacity { get; set; } = string.Empty;

    // Diesel | Petrol | Electric | Hybrid | CNG
    [MaxLength(20)]
    public string FuelType { get; set; } = "Diesel";

    // Manual | Automatic
    [MaxLength(20)]
    public string Transmission { get; set; } = "Manual";

    public int Axles { get; set; } = 2;
    public int GrossWeightKg { get; set; }
    public int PayloadKg { get; set; }
    public int SeatingCapacity { get; set; } = 2;

    [MaxLength(100)]
    public string RegistrationCountry { get; set; } = "Kenya";

    public DateTime? RegistrationDate { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public decimal PurchasePrice { get; set; }

    [MaxLength(200)]
    public string Supplier { get; set; } = string.Empty;

    // Company | Individual | Government | Leased | Finance
    [MaxLength(30)]
    public string? OwnerType { get; set; }

    [MaxLength(200)]
    public string? OwnerName { get; set; }

    [MaxLength(100)]
    public string? OwnerIdNo { get; set; }

    [MaxLength(50)]
    public string? OwnerContact { get; set; }

    // active | idle | offline | maintenance | disposed
    public string Status { get; set; } = "active";

    public int Odometer { get; set; }

    public double FuelLevel { get; set; } = 0;  // 0-100 percent

    // Assignment
    public string? CustomerId   { get; set; }   // references Customer (string FK for flexibility)
    public string? CustomerName { get; set; }
    public string? Department   { get; set; }

    public string? AssignedDriverName { get; set; }
    public Guid?   AssignedDriverId   { get; set; }

    // GPS
    public double? Latitude  { get; set; }
    public double? Longitude { get; set; }
    public double? SpeedKmh  { get; set; }

    public DateTime? LastSeenAt { get; set; }
    public DateTime  CreatedAt  { get; set; } = DateTime.UtcNow;

    public ICollection<Alert> Alerts { get; set; } = [];
}
