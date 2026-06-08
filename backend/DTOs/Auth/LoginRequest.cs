using System.ComponentModel.DataAnnotations;

namespace FleetOS.Api.DTOs.Auth;

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password
);
