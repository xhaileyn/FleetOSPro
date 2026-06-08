namespace FleetOS.Api.DTOs.Drivers;

public record DriverDto(
    Guid Id,
    string Name,
    string LicenseNumber,
    string LicenseClass,
    string Status,
    int SafetyScore,
    double HosDriven,
    double HosRemaining,
    string? AssignedVehiclePlate
);
