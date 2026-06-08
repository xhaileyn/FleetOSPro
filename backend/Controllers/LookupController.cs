using FleetOS.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FleetOS.Api.Controllers;

[ApiController]
[Route("api/lookup")]
[AllowAnonymous]          // reference data is not sensitive
public class LookupController(FleetDbContext db) : ControllerBase
{
    /// <summary>
    /// GET /api/lookup?category=country
    /// GET /api/lookup                   (all categories)
    /// Returns items sorted by SortOrder then Label.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? category)
    {
        var q = db.LookupItems.AsQueryable();
        if (!string.IsNullOrWhiteSpace(category))
            q = q.Where(x => x.Category == category);

        var items = await q
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Label)
            .Select(x => new {
                x.Id, x.Category, x.Value, x.Label,
                x.Parent, x.Region, x.SortOrder,
            })
            .ToListAsync();

        return Ok(items);
    }
}
