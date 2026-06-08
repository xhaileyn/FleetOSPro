using System.ComponentModel.DataAnnotations;

namespace FleetOS.Api.DTOs.Vehicles;

public record CreateVehicleRequest(
    [Required, MaxLength(20)] string Plate,
    [MaxLength(50)] string Make,
    [MaxLength(50)] string Model,
    int Year,
    string Category
);
