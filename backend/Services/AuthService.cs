using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FleetOS.Api.Data;
using FleetOS.Api.DTOs.Auth;
using FleetOS.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace FleetOS.Api.Services;

public class AuthService(FleetDbContext db, IConfiguration config) : IAuthService
{
    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await db.Users
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.Status == "active");

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        user.LastLoginAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return BuildResponse(user);
    }

    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request)
    {
        if (await db.Users.AnyAsync(u => u.Email == request.Email))
            return null;

        var tenant = new Tenant
        {
            Name    = request.CompanyName,
            Slug    = request.CompanyName.ToLower().Replace(" ", "-").Replace(".", ""),
            Plan    = request.Plan switch { "pro" => "Professional", "enterprise" => "Enterprise", _ => "Starter" },
            Status  = "trial"
        };

        var user = new AppUser
        {
            FirstName    = request.FirstName,
            LastName     = request.LastName,
            Email        = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role         = "fleet_admin",
            Tenant       = tenant
        };

        db.Tenants.Add(tenant);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        return BuildResponse(user);
    }

    private AuthResponse BuildResponse(AppUser user)
    {
        var token = GenerateToken(user);
        return new AuthResponse(
            token,
            user.Role,
            user.Email,
            $"{user.FirstName} {user.LastName}".Trim(),
            user.TenantId,
            user.Tenant?.Name,
            user.Tenant?.Slug
        );
    }

    private string GenerateToken(AppUser user)
    {
        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role),
            new("fullName", $"{user.FirstName} {user.LastName}".Trim())
        };

        if (user.TenantId.HasValue)
            claims.Add(new Claim("tenantId", user.TenantId.Value.ToString()));

        var expiry = int.Parse(config["Jwt:ExpiryMinutes"] ?? "1440");
        var token  = new JwtSecurityToken(
            issuer:   config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims:   claims,
            expires:  DateTime.UtcNow.AddMinutes(expiry),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
