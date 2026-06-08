using System.ComponentModel.DataAnnotations;

namespace FleetOS.Api.Models;

public class Customer
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Frontend short ID, e.g. "c-001".</summary>
    [MaxLength(50)]
    public string ShortId { get; set; } = string.Empty;

    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public Guid? ParentId { get; set; }         // null = top-level company

    [Required, MaxLength(300)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Type { get; set; } = "Company";  // Company | Individual

    [MaxLength(20)]
    public string Status { get; set; } = "Active"; // Active | Inactive | Prospect

    [MaxLength(100)]
    public string Industry { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Country { get; set; } = string.Empty;

    [MaxLength(100)]
    public string City { get; set; } = string.Empty;

    [MaxLength(400)]
    public string Address { get; set; } = string.Empty;

    [MaxLength(30)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(200)]
    public string Website { get; set; } = string.Empty;

    [MaxLength(50)]
    public string TaxId { get; set; } = string.Empty;

    public decimal CreditLimit { get; set; }

    [MaxLength(20)]
    public string ComplianceStatus { get; set; } = "Compliant"; // Compliant | Pending Review | Flagged

    public string ComplianceNotes { get; set; } = string.Empty;

    public int VehiclesAssigned { get; set; }
    public int ActiveContracts  { get; set; }

    public string Notes { get; set; } = string.Empty;

    [MaxLength(150)]
    public string AccountManager { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
