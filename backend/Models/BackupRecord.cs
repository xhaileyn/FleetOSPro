using System.ComponentModel.DataAnnotations;

namespace FleetOS.Api.Models;

public class BackupRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    [Required, MaxLength(40)]
    public string BackupId { get; set; } = string.Empty;   // e.g. "bkp-acme-240"

    [MaxLength(20)]
    public string Type { get; set; } = string.Empty;   // Full | Incremental | Snapshot

    public DateTime StartedAt { get; set; }
    public DateTime CompletedAt { get; set; }

    public decimal SizeGb { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = string.Empty;   // Completed | Running | Failed

    [MaxLength(60)]
    public string EncryptedWith { get; set; } = string.Empty;

    [MaxLength(120)]
    public string StorageLocation { get; set; } = string.Empty;

    public int RpoHours { get; set; }
    public int RtoHours { get; set; }
}
