using System.ComponentModel.DataAnnotations;

namespace FleetOS.Api.DTOs.Drivers;

public record CreateDriverRequest(
    [Required, MaxLength(150)] string Name,
    [MaxLength(50)] string LicenseNumber,
    string LicenseClass,
    string PhoneNumber
);
