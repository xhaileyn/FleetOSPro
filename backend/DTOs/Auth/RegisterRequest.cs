using System.ComponentModel.DataAnnotations;

namespace FleetOS.Api.DTOs.Auth;

public record RegisterRequest(
    [Required, MaxLength(100)] string FirstName,
    [Required, MaxLength(100)] string LastName,
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password,
    string CompanyName,
    string Industry,
    string FleetSize,
    string Country,
    string Plan
);
