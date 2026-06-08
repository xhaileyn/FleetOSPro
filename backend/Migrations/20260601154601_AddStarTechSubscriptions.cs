using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FleetOS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStarTechSubscriptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "VehicleSubscriptions",
                columns: new[] { "Id", "AutoRenew", "ContactEmail", "CustomPlanId", "ExpiryDate", "Plan", "SmsNumbersJson", "StartDate", "TenantId", "VehicleShortId" },
                values: new object[,]
                {
                    { new Guid("1d8da807-e16f-293d-224b-9f25c92e18f8"), true, "fleet@starttech.io", null, new DateOnly(2027, 4, 19), "Enterprise", "[\"+92 300 1234501\"]", new DateOnly(2022, 4, 20), new Guid("00000000-0000-0000-0000-000000000007"), "vs7-001" },
                    { new Guid("397785a8-eca9-e35c-7bf3-44ad65450566"), true, "fleet@starttech.io", null, new DateOnly(2027, 9, 14), "Professional", "[\"+92 300 1234504\"]", new DateOnly(2023, 9, 15), new Guid("00000000-0000-0000-0000-000000000007"), "vs7-004" },
                    { new Guid("5f39d5ec-a6d9-1265-74f1-03cf78073df0"), true, "fleet@starttech.io", null, new DateOnly(2027, 5, 9), "Enterprise", "[\"+92 300 1234502\"]", new DateOnly(2022, 5, 10), new Guid("00000000-0000-0000-0000-000000000007"), "vs7-002" },
                    { new Guid("9137a744-e16e-b762-38dd-4b1a094548c3"), true, "fleet@starttech.io", null, new DateOnly(2027, 1, 19), "Enterprise", "[\"+92 300 1234505\"]", new DateOnly(2024, 1, 20), new Guid("00000000-0000-0000-0000-000000000007"), "vs7-005" },
                    { new Guid("e9003c33-ee7d-4d6d-a07b-ffbf6cdee6ab"), true, "fleet@starttech.io", null, new DateOnly(2027, 2, 28), "Professional", "[\"+92 300 1234503\"]", new DateOnly(2023, 3, 1), new Guid("00000000-0000-0000-0000-000000000007"), "vs7-003" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "VehicleSubscriptions",
                keyColumn: "Id",
                keyValue: new Guid("1d8da807-e16f-293d-224b-9f25c92e18f8"));

            migrationBuilder.DeleteData(
                table: "VehicleSubscriptions",
                keyColumn: "Id",
                keyValue: new Guid("397785a8-eca9-e35c-7bf3-44ad65450566"));

            migrationBuilder.DeleteData(
                table: "VehicleSubscriptions",
                keyColumn: "Id",
                keyValue: new Guid("5f39d5ec-a6d9-1265-74f1-03cf78073df0"));

            migrationBuilder.DeleteData(
                table: "VehicleSubscriptions",
                keyColumn: "Id",
                keyValue: new Guid("9137a744-e16e-b762-38dd-4b1a094548c3"));

            migrationBuilder.DeleteData(
                table: "VehicleSubscriptions",
                keyColumn: "Id",
                keyValue: new Guid("e9003c33-ee7d-4d6d-a07b-ffbf6cdee6ab"));
        }
    }
}
