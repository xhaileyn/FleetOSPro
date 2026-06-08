namespace FleetOS.Api.DTOs.Vehicles;

public record VehicleDto(
    Guid Id,
    string Plate,
    string Make,
    string Model,
    int Year,
    string Category,
    string Status,
    double? Latitude,
    double? Longitude,
    double? SpeedKmh,
    double? FuelLevel,
    int? Odometer,
    string? AssignedDriverName,
    DateTime? LastSeenAt
);
