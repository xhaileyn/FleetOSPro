using FleetOS.Api.DTOs.Auth;
using FleetOS.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FleetOS.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await authService.LoginAsync(request);
        if (result is null)
            return Unauthorized(new { message = "Invalid email or password." });
        return Ok(result);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await authService.RegisterAsync(request);
        if (result is null)
            return Conflict(new { message = "Email already in use." });
        return Ok(result);
    }
}
