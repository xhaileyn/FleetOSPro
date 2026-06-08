using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FleetOS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStarTechDevicesAndSims : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Devices",
                columns: new[] { "Id", "Battery", "Firmware", "Imei", "InstalledAt", "LastSeen", "Model", "Notes", "SerialNo", "ShortId", "Signal", "SimShortId", "Status", "TenantId", "Type", "VehiclePlate", "VehicleShortId" },
                values: new object[,]
                {
                    { new Guid("046c8030-d98e-8578-8f0f-eb280c53c2a2"), null, "7.3.2", "356399070700003", new DateOnly(2023, 3, 15), "2 min ago", "CalAmp LMU-3030", "CalAmp LMU-3030. Islamabad federal vehicle — geofence enabled.", "CAL-LMU-ST7-003", "dev-vs7-003", "Strong", "sim-vs7-003-p", "Online", new Guid("00000000-0000-0000-0000-000000000007"), "GPS Tracker", "ISB-0001", "vs7-003" },
                    { new Guid("2f3b03b7-2cad-0f71-992c-56d7b593dc32"), null, "7.3.2", "356399070700005", new DateOnly(2022, 8, 10), "6 min ago", "CalAmp LMU-3030", "CalAmp LMU-3030. Gwadar CPEC corridor — remote area, signal varies.", "CAL-LMU-ST7-005", "dev-vs7-005", "Medium", "sim-vs7-005-p", "Online", new Guid("00000000-0000-0000-0000-000000000007"), "GPS Tracker", "GWD-0001", "vs7-005" },
                    { new Guid("976ca5d9-fe00-72ae-bdff-cdff26e12434"), null, "7.3.2", "356399070700002", new DateOnly(2022, 6, 15), "Just now", "CalAmp LMU-3030", "CalAmp LMU-3030. Karachi port operations — high-frequency pings.", "CAL-LMU-ST7-002", "dev-vs7-002", "Strong", "sim-vs7-002-p", "Online", new Guid("00000000-0000-0000-0000-000000000007"), "GPS Tracker", "KHI-0001", "vs7-002" },
                    { new Guid("c9a40b1b-5716-4ba5-83b1-3d7b59e97a8e"), null, "7.3.2", "356399070700004", new DateOnly(2021, 9, 25), "4 min ago", "CalAmp LMU-3030", "CalAmp LMU-3030. Multan cotton transport — seasonal high usage.", "CAL-LMU-ST7-004", "dev-vs7-004", "Medium", "sim-vs7-004-p", "Online", new Guid("00000000-0000-0000-0000-000000000007"), "GPS Tracker", "MLT-0001", "vs7-004" },
                    { new Guid("cf168cd1-0a31-bfb1-d521-450389a50ed3"), null, "7.3.2", "356399070700001", new DateOnly(2022, 4, 20), "Just now", "CalAmp LMU-3030", "CalAmp LMU-3030 with Jazz primary SIM. Lahore operations.", "CAL-LMU-ST7-001", "dev-vs7-001", "Strong", "sim-vs7-001-p", "Online", new Guid("00000000-0000-0000-0000-000000000007"), "GPS Tracker", "LHR-0001", "vs7-001" }
                });

            migrationBuilder.InsertData(
                table: "SimCards",
                columns: new[] { "Id", "ActivatedAt", "Apn", "Country", "DataPlanMb", "DataUsedMb", "ExpiresAt", "Iccid", "Msisdn", "Notes", "Operator", "ShortId", "Status", "TenantId", "Type", "VehiclePlate", "VehicleShortId" },
                values: new object[,]
                {
                    { new Guid("185882e1-3e21-8021-859e-a850a3969f64"), new DateOnly(2022, 8, 10), "internet.jazz.net", "Pakistan", 5120, 1850, new DateOnly(2027, 8, 10), "89920107000001234505", "+92 300 1234505", "Jazz primary SIM — CalAmp LMU-3030. Gwadar CPEC route, limited plan.", "Jazz", "sim-vs7-005-p", "Active", new Guid("00000000-0000-0000-0000-000000000007"), "Primary", "GWD-0001", "vs7-005" },
                    { new Guid("4aec50a4-f82c-8228-f68a-8563a3f20201"), new DateOnly(2021, 9, 25), "internet.jazz.net", "Pakistan", 10240, 4670, new DateOnly(2026, 9, 25), "89920107000001234504", "+92 300 1234504", "Jazz primary SIM — CalAmp LMU-3030. Multan cotton corridor.", "Jazz", "sim-vs7-004-p", "Active", new Guid("00000000-0000-0000-0000-000000000007"), "Primary", "MLT-0001", "vs7-004" },
                    { new Guid("4b592f8a-1418-1278-b6f7-315d8c393ca3"), new DateOnly(2023, 3, 15), "internet.jazz.net", "Pakistan", 10240, 2290, new DateOnly(2027, 3, 15), "89920107000001234503", "+92 300 1234503", "Jazz primary SIM — CalAmp LMU-3030. Islamabad federal vehicle.", "Jazz", "sim-vs7-003-p", "Active", new Guid("00000000-0000-0000-0000-000000000007"), "Primary", "ISB-0001", "vs7-003" },
                    { new Guid("792f1571-a78a-d063-726f-eeb883639230"), new DateOnly(2022, 4, 20), "internet.jazz.net", "Pakistan", 10240, 3820, new DateOnly(2027, 4, 20), "89920107000001234501", "+92 300 1234501", "Jazz primary SIM — CalAmp LMU-3030. Lahore coverage.", "Jazz", "sim-vs7-001-p", "Active", new Guid("00000000-0000-0000-0000-000000000007"), "Primary", "LHR-0001", "vs7-001" },
                    { new Guid("989aa88d-5ee2-eb94-01ae-c274393dcee2"), new DateOnly(2022, 6, 15), "internet.jazz.net", "Pakistan", 10240, 5140, new DateOnly(2027, 6, 15), "89920107000001234502", "+92 300 1234502", "Jazz primary SIM — CalAmp LMU-3030. Karachi port high-data route.", "Jazz", "sim-vs7-002-p", "Active", new Guid("00000000-0000-0000-0000-000000000007"), "Primary", "KHI-0001", "vs7-002" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("046c8030-d98e-8578-8f0f-eb280c53c2a2"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("2f3b03b7-2cad-0f71-992c-56d7b593dc32"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("976ca5d9-fe00-72ae-bdff-cdff26e12434"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("c9a40b1b-5716-4ba5-83b1-3d7b59e97a8e"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("cf168cd1-0a31-bfb1-d521-450389a50ed3"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("185882e1-3e21-8021-859e-a850a3969f64"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("4aec50a4-f82c-8228-f68a-8563a3f20201"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("4b592f8a-1418-1278-b6f7-315d8c393ca3"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("792f1571-a78a-d063-726f-eeb883639230"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("989aa88d-5ee2-eb94-01ae-c274393dcee2"));
        }
    }
}
