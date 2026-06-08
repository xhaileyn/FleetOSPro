namespace FleetOS.Api.DTOs.Dashboard;

public record DashboardSummaryDto(
    int TotalVehicles,
    int ActiveVehicles,
    int IdleVehicles,
    int OfflineVehicles,
    int MaintenanceVehicles,
    int TotalDrivers,
    int DriversOnDuty,
    int OpenAlerts,
    int CriticalAlerts,
    decimal FuelSavedToday,
    IReadOnlyList<AlertSummaryDto> RecentAlerts
);

public record AlertSummaryDto(
    Guid Id,
    string Severity,
    string Type,
    string Title,
    string Description,
    string? VehiclePlate,
    DateTime OccurredAt,
    bool Acknowledged
);
