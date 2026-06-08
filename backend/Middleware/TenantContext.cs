namespace FleetOS.Api.Middleware;

public static class TenantContext
{
    public static Guid? GetTenantId(this HttpContext ctx) =>
        ctx.Items.TryGetValue("TenantId", out var v) && v is Guid id ? id : null;
}

public class TenantMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        var claim = ctx.User?.FindFirst("tenantId")?.Value;
        if (Guid.TryParse(claim, out var tenantId))
            ctx.Items["TenantId"] = tenantId;

        await next(ctx);
    }
}
