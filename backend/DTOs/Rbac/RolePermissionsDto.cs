namespace FleetOS.Api.DTOs.Rbac;

public record RolePermissionsDto(string RoleId, string[] AllowedModules);
