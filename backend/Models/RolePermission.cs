using System.ComponentModel.DataAnnotations;

namespace FleetOS.Api.Models;

/// <summary>
/// Stores which platform modules a system role is allowed to access.
/// One row per (RoleId, ModuleId) pair.
/// </summary>
public class RolePermission
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>System role key, e.g. "fleet_manager"</summary>
    [Required, MaxLength(100)]
    public string RoleId { get; set; } = string.Empty;

    /// <summary>Nav/module id, e.g. "vehicles", "auth-rbac"</summary>
    [Required, MaxLength(100)]
    public string ModuleId { get; set; } = string.Empty;
}
