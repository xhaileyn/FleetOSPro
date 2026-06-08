using FleetOS.Api.Data;
using FleetOS.Api.DTOs.Vehicles;
using FleetOS.Api.Middleware;
using FleetOS.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FleetOS.Api.Controllers;

[ApiController]
[Route("api/v1/vehicles")]
[Authorize]
public class VehiclesController(FleetDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] string? search)
    {
        var tenantId = HttpContext.GetTenantId();
        if (tenantId is null && !User.IsInRole("super_admin") && !User.IsInRole("platform_admin"))
            return Forbid();

        var query = db.Vehicles.AsQueryable();

        if (tenantId.HasValue)
            query = query.Where(v => v.TenantId == tenantId.Value);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(v => v.Status == status);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(v => v.Plate.Contains(search) || v.Make.Contains(search) || v.Model.Contains(search));

        var vehicles = await query
            .OrderBy(v => v.Plate)
            .Select(v => new VehicleDto(v.Id, v.Plate, v.Make, v.Model, v.Year, v.Category, v.Status,
                v.Latitude, v.Longitude, v.SpeedKmh, v.FuelLevel, v.Odometer,
                v.AssignedDriverName, v.LastSeenAt))
            .ToListAsync();

        return Ok(vehicles);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var tenantId = HttpContext.GetTenantId();
        var vehicle  = await db.Vehicles.FindAsync(id);

        if (vehicle is null) return NotFound();
        if (tenantId.HasValue && vehicle.TenantId != tenantId.Value) return Forbid();

        var dto = new VehicleDto(vehicle.Id, vehicle.Plate, vehicle.Make, vehicle.Model,
            vehicle.Year, vehicle.Category, vehicle.Status, vehicle.Latitude, vehicle.Longitude,
            vehicle.SpeedKmh, vehicle.FuelLevel, vehicle.Odometer, vehicle.AssignedDriverName, vehicle.LastSeenAt);

        return Ok(dto);
    }

    [HttpPost]
    [Authorize(Roles = "fleet_admin,fleet_manager,super_admin")]
    public async Task<IActionResult> Create([FromBody] CreateVehicleRequest request)
    {
        var tenantId = HttpContext.GetTenantId();
        if (tenantId is null) return Forbid();

        if (await db.Vehicles.AnyAsync(v => v.TenantId == tenantId && v.Plate == request.Plate))
            return Conflict(new { message = "Plate already registered." });

        var vehicle = new Vehicle
        {
            TenantId = tenantId.Value,
            Plate    = request.Plate,
            Make     = request.Make,
            Model    = request.Model,
            Year     = request.Year,
            Category = request.Category
        };

        db.Vehicles.Add(vehicle);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = vehicle.Id },
            new VehicleDto(vehicle.Id, vehicle.Plate, vehicle.Make, vehicle.Model,
                vehicle.Year, vehicle.Category, vehicle.Status, null, null, null, null, null, null, null));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "fleet_admin,fleet_manager,super_admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateVehicleRequest request)
    {
        var tenantId = HttpContext.GetTenantId();
        var vehicle  = await db.Vehicles.FindAsync(id);

        if (vehicle is null) return NotFound();
        if (tenantId.HasValue && vehicle.TenantId != tenantId.Value) return Forbid();

        vehicle.Plate = request.Plate;
        vehicle.Make  = request.Make;
        vehicle.Model = request.Model;
        vehicle.Year  = request.Year;
        vehicle.Category = request.Category;

        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "fleet_admin,super_admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var tenantId = HttpContext.GetTenantId();
        var vehicle  = await db.Vehicles.FindAsync(id);

        if (vehicle is null) return NotFound();
        if (tenantId.HasValue && vehicle.TenantId != tenantId.Value) return Forbid();

        db.Vehicles.Remove(vehicle);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
