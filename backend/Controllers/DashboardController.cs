using FleetOS.Api.Data;
using FleetOS.Api.DTOs.Dashboard;
using FleetOS.Api.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FleetOS.Api.Controllers;

[ApiController]
[Route("api/v1/dashboard")]
[Authorize]
public class DashboardController(FleetDbContext db) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var tenantId = HttpContext.GetTenantId();

        var vehicleQuery = db.Vehicles.AsQueryable();
        var driverQuery  = db.Drivers.AsQueryable();
        var alertQuery   = db.Alerts.AsQueryable();

        if (tenantId.HasValue)
        {
            vehicleQuery = vehicleQuery.Where(v => v.TenantId == tenantId.Value);
            driverQuery  = driverQuery.Where(d => d.TenantId == tenantId.Value);
            alertQuery   = alertQuery.Where(a => a.TenantId == tenantId.Value);
        }

        var totalVehicles       = await vehicleQuery.CountAsync();
        var activeVehicles      = await vehicleQuery.CountAsync(v => v.Status == "active");
        var idleVehicles        = await vehicleQuery.CountAsync(v => v.Status == "idle");
        var offlineVehicles     = await vehicleQuery.CountAsync(v => v.Status == "offline");
        var maintenanceVehicles = await vehicleQuery.CountAsync(v => v.Status == "maintenance");
        var totalDrivers        = await driverQuery.CountAsync();
        var driversOnDuty       = await driverQuery.CountAsync(d => d.Status == "driving" || d.Status == "on_duty");
        var openAlerts          = await alertQuery.CountAsync(a => !a.Acknowledged);
        var criticalAlerts      = await alertQuery.CountAsync(a => a.Severity == "critical" && !a.Acknowledged);

        var recentAlerts = await alertQuery
            .Include(a => a.Vehicle)
            .Where(a => !a.Acknowledged)
            .OrderByDescending(a => a.OccurredAt)
            .Take(5)
            .Select(a => new AlertSummaryDto(a.Id, a.Severity, a.Type, a.Title, a.Description,
                a.Vehicle != null ? a.Vehicle.Plate : null, a.OccurredAt, a.Acknowledged))
            .ToListAsync();

        return Ok(new DashboardSummaryDto(
            totalVehicles, activeVehicles, idleVehicles, offlineVehicles, maintenanceVehicles,
            totalDrivers, driversOnDuty, openAlerts, criticalAlerts,
            840m, // fuel saved today (static for now)
            recentAlerts
        ));
    }

    [HttpPost("alerts/{id:guid}/acknowledge")]
    public async Task<IActionResult> AcknowledgeAlert(Guid id)
    {
        var tenantId = HttpContext.GetTenantId();
        var alert    = await db.Alerts.FindAsync(id);

        if (alert is null) return NotFound();
        if (tenantId.HasValue && alert.TenantId != tenantId.Value) return Forbid();

        alert.Acknowledged = true;
        await db.SaveChangesAsync();
        return NoContent();
    }
}
