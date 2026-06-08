using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FleetOS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStarTechVehicles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Vehicles",
                columns: new[] { "Id", "AssignedDriverId", "AssignedDriverName", "Axles", "BodyType", "Category", "Color", "CreatedAt", "CustomerId", "CustomerName", "Department", "EngineCapacity", "EngineNo", "FuelLevel", "FuelType", "GrossWeightKg", "LastSeenAt", "Latitude", "Longitude", "Make", "Model", "Odometer", "OwnerContact", "OwnerIdNo", "OwnerName", "OwnerType", "PayloadKg", "Plate", "PurchaseDate", "PurchasePrice", "RegistrationCountry", "RegistrationDate", "SeatingCapacity", "ShortId", "SpeedKmh", "Status", "Supplier", "TenantId", "Transmission", "Vin", "Year" },
                values: new object[,]
                {
                    { new Guid("25b8d42f-0363-1635-52f4-bc158807a1e1"), null, null, 3, "Cargo", "Truck", "White", new DateTime(2022, 4, 15, 0, 0, 0, 0, DateTimeKind.Utc), "c-t7-001", "Punjab Transport Group", "Punjab Operations", "11.0L", "FAW-J6-LH001", 72.0, "Diesel", 25000, new DateTime(2026, 5, 31, 0, 0, 0, 0, DateTimeKind.Utc), 31.451000000000001, 74.349999999999994, "FAW", "J6 6x4", 32400, null, null, null, null, 16000, "LHR-0001", new DateTime(2022, 3, 20, 0, 0, 0, 0, DateTimeKind.Utc), 10200000m, "Pakistan", new DateTime(2022, 4, 15, 0, 0, 0, 0, DateTimeKind.Utc), 2, "vs7-001", 65.0, "active", "Al-Haj FAW Motors Pakistan", new Guid("00000000-0000-0000-0000-000000000007"), "Manual", "LFAN7LHR0012022A0", 2022 },
                    { new Guid("7e584c17-2aad-1107-6910-c02957f5ecce"), null, null, 2, "Box Body", "Truck", "Blue", new DateTime(2021, 9, 20, 0, 0, 0, 0, DateTimeKind.Utc), "c-t7-004", "Multan Cotton Board", "Cotton Trade", "4.0L", "HINO3-ML001", 45.0, "Diesel", 6000, new DateTime(2026, 5, 31, 0, 0, 0, 0, DateTimeKind.Utc), 30.149999999999999, 71.519999999999996, "Hino", "300 Series 616", 41600, null, null, null, null, 3500, "MLT-0001", new DateTime(2021, 8, 25, 0, 0, 0, 0, DateTimeKind.Utc), 4500000m, "Pakistan", new DateTime(2021, 9, 20, 0, 0, 0, 0, DateTimeKind.Utc), 2, "vs7-004", 48.0, "active", "Ghandhara Industries Ltd", new Guid("00000000-0000-0000-0000-000000000007"), "Manual", "JH1FAMLT0012021A0", 2021 },
                    { new Guid("bfa08a03-89c1-ec49-f9ef-7f79c9e5f537"), null, null, 2, "Double Cab", "Pickup", "Silver", new DateTime(2023, 3, 10, 0, 0, 0, 0, DateTimeKind.Utc), "c-t7-003", "Federal Government Supplies", "Islamabad Capital", "2.8L", "1GD-FTV-IS001", 81.0, "Diesel", 3200, new DateTime(2026, 5, 31, 0, 0, 0, 0, DateTimeKind.Utc), 33.649999999999999, 73.079999999999998, "Toyota", "Hilux Revo D/C", 14200, null, null, null, null, 1000, "ISB-0001", new DateTime(2023, 2, 15, 0, 0, 0, 0, DateTimeKind.Utc), 7200000m, "Pakistan", new DateTime(2023, 3, 10, 0, 0, 0, 0, DateTimeKind.Utc), 5, "vs7-003", 55.0, "active", "Indus Motor Company", new Guid("00000000-0000-0000-0000-000000000007"), "Manual", "JTDBXISB0012023A0", 2023 },
                    { new Guid("e777fa97-52d5-d3f5-b0cd-47303e8a8a66"), null, null, 2, "Box Body", "Truck", "White", new DateTime(2022, 6, 10, 0, 0, 0, 0, DateTimeKind.Utc), "c-t7-002", "Karachi Port Authority", "Port Operations", "7.7L", "HINO5-KH001", 58.0, "Diesel", 12000, new DateTime(2026, 5, 31, 0, 0, 0, 0, DateTimeKind.Utc), 24.850000000000001, 67.010000000000005, "Hino", "500 Series FC9JJSB", 28700, null, null, null, null, 7500, "KHI-0001", new DateTime(2022, 5, 20, 0, 0, 0, 0, DateTimeKind.Utc), 7800000m, "Pakistan", new DateTime(2022, 6, 10, 0, 0, 0, 0, DateTimeKind.Utc), 2, "vs7-002", 42.0, "active", "Ghandhara Industries Ltd", new Guid("00000000-0000-0000-0000-000000000007"), "Manual", "JH1FCKHI0012022A0", 2022 },
                    { new Guid("fd0f2848-7266-1e7d-d1b9-1fe5a156eadf"), null, null, 3, "Cargo", "Truck", "Orange", new DateTime(2022, 8, 5, 0, 0, 0, 0, DateTimeKind.Utc), "c-t7-005", "CPEC Logistics Gwadar", "CPEC Corridor", "11.0L", "FAW-J6-GW001", 63.0, "Diesel", 25000, new DateTime(2026, 5, 31, 0, 0, 0, 0, DateTimeKind.Utc), 25.120000000000001, 62.32, "FAW", "J6 6x4", 19800, null, null, null, null, 16000, "GWD-0001", new DateTime(2022, 7, 10, 0, 0, 0, 0, DateTimeKind.Utc), 10200000m, "Pakistan", new DateTime(2022, 8, 5, 0, 0, 0, 0, DateTimeKind.Utc), 2, "vs7-005", 52.0, "active", "Al-Haj FAW Motors Pakistan", new Guid("00000000-0000-0000-0000-000000000007"), "Manual", "LFAN7GWD0012022A0", 2022 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("25b8d42f-0363-1635-52f4-bc158807a1e1"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("7e584c17-2aad-1107-6910-c02957f5ecce"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("bfa08a03-89c1-ec49-f9ef-7f79c9e5f537"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("e777fa97-52d5-d3f5-b0cd-47303e8a8a66"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("fd0f2848-7266-1e7d-d1b9-1fe5a156eadf"));
        }
    }
}
