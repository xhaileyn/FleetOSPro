using FleetOS.Api.Data;
using FleetOS.Api.DTOs.Drivers;
using FleetOS.Api.Middleware;
using FleetOS.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FleetOS.Api.Controllers;

[ApiController]
[Route("api/v1/drivers")]
[Authorize]
public class DriversController(FleetDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] string? search)
    {
        var tenantId = HttpContext.GetTenantId();
        if (tenantId is null && !User.IsInRole("super_admin") && !User.IsInRole("platform_admin"))
            return Forbid();

        var query = db.Drivers.AsQueryable();

        if (tenantId.HasValue)
            query = query.Where(d => d.TenantId == tenantId.Value);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(d => d.Status == status);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(d => d.Name.Contains(search) || d.LicenseNumber.Contains(search));

        var drivers = await query
            .OrderByDescending(d => d.SafetyScore)
            .Select(d => new DriverDto(d.Id, d.Name, d.LicenseNumber, d.LicenseClass,
                d.Status, d.SafetyScore, d.HosDriven, d.HosRemaining, d.AssignedVehiclePlate))
            .ToListAsync();

        return Ok(drivers);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var tenantId = HttpContext.GetTenantId();
        var driver   = await db.Drivers.FindAsync(id);

        if (driver is null) return NotFound();
        if (tenantId.HasValue && driver.TenantId != tenantId.Value) return Forbid();

        return Ok(new DriverDto(driver.Id, driver.Name, driver.LicenseNumber, driver.LicenseClass,
            driver.Status, driver.SafetyScore, driver.HosDriven, driver.HosRemaining, driver.AssignedVehiclePlate));
    }

    [HttpPost]
    [Authorize(Roles = "fleet_admin,fleet_manager,super_admin")]
    public async Task<IActionResult> Create([FromBody] CreateDriverRequest request)
    {
        var tenantId = HttpContext.GetTenantId();
        if (tenantId is null) return Forbid();

        var driver = new Driver
        {
            TenantId      = tenantId.Value,
            Name          = request.Name,
            LicenseNumber = request.LicenseNumber,
            LicenseClass  = request.LicenseClass,
            PhoneNumber   = request.PhoneNumber
        };

        db.Drivers.Add(driver);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = driver.Id },
            new DriverDto(driver.Id, driver.Name, driver.LicenseNumber, driver.LicenseClass,
                driver.Status, driver.SafetyScore, driver.HosDriven, driver.HosRemaining, null));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "fleet_admin,super_admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var tenantId = HttpContext.GetTenantId();
        var driver   = await db.Drivers.FindAsync(id);

        if (driver is null) return NotFound();
        if (tenantId.HasValue && driver.TenantId != tenantId.Value) return Forbid();

        db.Drivers.Remove(driver);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
