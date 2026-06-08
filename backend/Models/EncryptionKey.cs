using System.ComponentModel.DataAnnotations;

namespace FleetOS.Api.Models;

public class EncryptionKey
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    [Required, MaxLength(60)]
    public string KeyId { get; set; } = string.Empty;   // e.g. "kms-key-acme-2024-001"

    [MaxLength(20)]
    public string Algorithm { get; set; } = string.Empty;

    public int BitLength { get; set; }

    public DateOnly Created { get; set; }
    public DateOnly LastRotated { get; set; }
    public DateOnly NextRotation { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = string.Empty;   // Active | Rotating | Scheduled

    [MaxLength(60)]
    public string KmsProvider { get; set; } = string.Empty;
}
