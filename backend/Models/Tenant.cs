using System.ComponentModel.DataAnnotations;

namespace FleetOS.Api.Models;

public class Tenant
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Slug { get; set; } = string.Empty;

    [Required]
    public string Plan { get; set; } = "Starter"; // Starter | Professional | Enterprise

    public string Region { get; set; } = "EU West";

    public string Status { get; set; } = "trial"; // active | suspended | trial

    public string PrimaryColor { get; set; } = "#0D6E5E";

    public string LogoInitials { get; set; } = "??";

    public decimal Mrr { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<AppUser>          Users              { get; set; } = [];
    public ICollection<Vehicle>          Vehicles           { get; set; } = [];
    public ICollection<Driver>           Drivers            { get; set; } = [];
    public ICollection<Alert>            Alerts             { get; set; } = [];
    public ICollection<Branch>           Branches           { get; set; } = [];
    public ICollection<Customer>         Customers          { get; set; } = [];
    public ICollection<Device>           Devices            { get; set; } = [];
    public ICollection<SimCard>          SimCards           { get; set; } = [];
    public ICollection<Trip>             Trips              { get; set; } = [];
    public ICollection<VehicleSubscription> VehicleSubscriptions { get; set; } = [];
    public ICollection<CustomPlan>       CustomPlans        { get; set; } = [];
    public ICollection<TenantCustomRole> CustomRoles        { get; set; } = [];
    public ICollection<EncryptionKey>    EncryptionKeys     { get; set; } = [];
    public ICollection<AuditEvent>       AuditEvents        { get; set; } = [];
    public ICollection<BackupRecord>     BackupRecords      { get; set; } = [];
}
