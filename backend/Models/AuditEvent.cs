using System.ComponentModel.DataAnnotations;

namespace FleetOS.Api.Models;

public class AuditEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(20)]
    public string ShortId { get; set; } = string.Empty;   // e.g. "ae-001"

    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public DateTime Timestamp { get; set; }

    [MaxLength(120)]
    public string Actor { get; set; } = string.Empty;

    [MaxLength(40)]
    public string ActorRole { get; set; } = string.Empty;

    [MaxLength(40)]
    public string Action { get; set; } = string.Empty;

    [MaxLength(40)]
    public string Resource { get; set; } = string.Empty;

    [MaxLength(60)]
    public string ResourceId { get; set; } = string.Empty;

    [MaxLength(10)]
    public string Outcome { get; set; } = string.Empty;   // success | blocked | error

    [MaxLength(20)]
    public string IpAddress { get; set; } = string.Empty;

    public string Details { get; set; } = string.Empty;

    public bool CrossTenantAttempt { get; set; }
}
