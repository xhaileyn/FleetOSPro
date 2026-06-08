using FleetOS.Api.Data;
using FleetOS.Api.DTOs.Rbac;
using FleetOS.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FleetOS.Api.Controllers;

[ApiController]
[Route("api/v1/rbac")]
[Authorize]
public class RbacController(FleetDbContext db) : ControllerBase
{
    /// <summary>
    /// Returns the allowed module list for every system role.
    /// Available to all authenticated users (they need to know what they can access).
    /// </summary>
    [HttpGet("permissions")]
    public async Task<IActionResult> GetPermissions()
    {
        var rows = await db.RolePermissions
            .GroupBy(p => p.RoleId)
            .Select(g => new RolePermissionsDto(
                g.Key,
                g.Select(p => p.ModuleId).OrderBy(m => m).ToArray()
            ))
            .ToListAsync();

        return Ok(rows);
    }

    /// <summary>
    /// Replaces the allowed-module set for a single system role.
    /// Super Admin only.
    /// </summary>
    [HttpPut("roles/{roleId}/permissions")]
    [Authorize(Roles = "super_admin")]
    public async Task<IActionResult> UpdatePermissions(
        string roleId,
        [FromBody] UpdateRolePermissionsRequest request)
    {
        if (string.IsNullOrWhiteSpace(roleId))
            return BadRequest(new { message = "roleId is required." });

        // Delete existing entries for this role then insert the new set
        var existing = await db.RolePermissions
            .Where(p => p.RoleId == roleId)
            .ToListAsync();

        db.RolePermissions.RemoveRange(existing);

        var newRows = request.AllowedModules
            .Distinct()
            .Select(moduleId => new RolePermission
            {
                Id       = Guid.NewGuid(),
                RoleId   = roleId,
                ModuleId = moduleId,
            });

        await db.RolePermissions.AddRangeAsync(newRows);
        await db.SaveChangesAsync();

        return NoContent();
    }
}
