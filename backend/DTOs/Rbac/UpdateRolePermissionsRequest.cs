using System.ComponentModel.DataAnnotations;

namespace FleetOS.Api.DTOs.Rbac;

public class UpdateRolePermissionsRequest
{
    [Required]
    public string[] AllowedModules { get; set; } = [];
}
