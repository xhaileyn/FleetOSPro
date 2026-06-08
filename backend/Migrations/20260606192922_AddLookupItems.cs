using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FleetOS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddLookupItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LookupItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Category = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: false),
                    Label = table.Column<string>(type: "text", nullable: false),
                    Parent = table.Column<string>(type: "text", nullable: true),
                    Region = table.Column<string>(type: "text", nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LookupItems", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "LookupItems",
                columns: new[] { "Id", "Category", "Label", "Parent", "Region", "SortOrder", "Value" },
                values: new object[,]
                {
                    { 1, "country", "Kenya", null, "KE", 1, "Kenya" },
                    { 2, "country", "Uganda", null, "UG", 2, "Uganda" },
                    { 3, "country", "Tanzania", null, "TZ", 3, "Tanzania" },
                    { 4, "country", "Rwanda", null, "RW", 4, "Rwanda" },
                    { 5, "country", "Ethiopia", null, "ET", 5, "Ethiopia" },
                    { 6, "country", "Ghana", null, "GH", 6, "Ghana" },
                    { 7, "country", "Nigeria", null, "NG", 7, "Nigeria" },
                    { 8, "country", "South Africa", null, "ZA", 8, "South Africa" },
                    { 9, "country", "Pakistan", null, "PK", 9, "Pakistan" },
                    { 10, "country", "India", null, "IN", 10, "India" },
                    { 11, "country", "Egypt", null, "EG", 11, "Egypt" },
                    { 12, "country", "Morocco", null, "MA", 12, "Morocco" },
                    { 50, "industry", "Logistics", null, null, 1, "Logistics" },
                    { 51, "industry", "Transport", null, null, 2, "Transport" },
                    { 52, "industry", "Cargo", null, null, 3, "Cargo" },
                    { 53, "industry", "Courier", null, null, 4, "Courier" },
                    { 54, "industry", "Fleet Management", null, null, 5, "Fleet Management" },
                    { 55, "industry", "Technology", null, null, 6, "Technology" },
                    { 56, "industry", "Renewable Energy", null, null, 7, "Renewable Energy" },
                    { 57, "industry", "E-commerce", null, null, 8, "E-commerce" },
                    { 58, "industry", "Construction", null, null, 9, "Construction" },
                    { 59, "industry", "Agriculture", null, null, 10, "Agriculture" },
                    { 60, "industry", "Healthcare", null, null, 11, "Healthcare" },
                    { 61, "industry", "Mining", null, null, 12, "Mining" },
                    { 62, "industry", "Finance", null, null, 13, "Finance" },
                    { 63, "industry", "Retail", null, null, 14, "Retail" },
                    { 64, "industry", "Other", null, null, 15, "Other" },
                    { 100, "city", "Nairobi", "Kenya", "KE", 1, "Nairobi" },
                    { 101, "city", "Mombasa", "Kenya", "KE", 2, "Mombasa" },
                    { 102, "city", "Kisumu", "Kenya", "KE", 3, "Kisumu" },
                    { 103, "city", "Nakuru", "Kenya", "KE", 4, "Nakuru" },
                    { 104, "city", "Eldoret", "Kenya", "KE", 5, "Eldoret" },
                    { 105, "city", "Thika", "Kenya", "KE", 6, "Thika" },
                    { 106, "city", "Machakos", "Kenya", "KE", 7, "Machakos" },
                    { 107, "city", "Nyeri", "Kenya", "KE", 8, "Nyeri" },
                    { 108, "city", "Meru", "Kenya", "KE", 9, "Meru" },
                    { 109, "city", "Garissa", "Kenya", "KE", 10, "Garissa" },
                    { 110, "city", "Malindi", "Kenya", "KE", 11, "Malindi" },
                    { 111, "city", "Kisii", "Kenya", "KE", 12, "Kisii" },
                    { 120, "city", "Dar es Salaam", "Tanzania", "TZ", 1, "Dar es Salaam" },
                    { 121, "city", "Arusha", "Tanzania", "TZ", 2, "Arusha" },
                    { 122, "city", "Dodoma", "Tanzania", "TZ", 3, "Dodoma" },
                    { 123, "city", "Mwanza", "Tanzania", "TZ", 4, "Mwanza" },
                    { 124, "city", "Zanzibar", "Tanzania", "TZ", 5, "Zanzibar" },
                    { 125, "city", "Tanga", "Tanzania", "TZ", 6, "Tanga" },
                    { 130, "city", "Kampala", "Uganda", "UG", 1, "Kampala" },
                    { 131, "city", "Entebbe", "Uganda", "UG", 2, "Entebbe" },
                    { 132, "city", "Jinja", "Uganda", "UG", 3, "Jinja" },
                    { 133, "city", "Gulu", "Uganda", "UG", 4, "Gulu" },
                    { 134, "city", "Mbale", "Uganda", "UG", 5, "Mbale" },
                    { 135, "city", "Mbarara", "Uganda", "UG", 6, "Mbarara" },
                    { 140, "city", "Karachi", "Pakistan", "PK", 1, "Karachi" },
                    { 141, "city", "Lahore", "Pakistan", "PK", 2, "Lahore" },
                    { 142, "city", "Islamabad", "Pakistan", "PK", 3, "Islamabad" },
                    { 143, "city", "Rawalpindi", "Pakistan", "PK", 4, "Rawalpindi" },
                    { 144, "city", "Faisalabad", "Pakistan", "PK", 5, "Faisalabad" },
                    { 145, "city", "Multan", "Pakistan", "PK", 6, "Multan" },
                    { 146, "city", "Peshawar", "Pakistan", "PK", 7, "Peshawar" },
                    { 147, "city", "Quetta", "Pakistan", "PK", 8, "Quetta" },
                    { 200, "vehicle_category", "Truck", null, null, 1, "Truck" },
                    { 201, "vehicle_category", "Van", null, null, 2, "Van" },
                    { 202, "vehicle_category", "Pickup", null, null, 3, "Pickup" },
                    { 203, "vehicle_category", "Car", null, null, 4, "Car" },
                    { 204, "vehicle_category", "Bus", null, null, 5, "Bus" },
                    { 205, "vehicle_category", "Motorcycle", null, null, 6, "Motorcycle" },
                    { 206, "vehicle_category", "Trailer", null, null, 7, "Trailer" },
                    { 207, "vehicle_category", "Tractor", null, null, 8, "Tractor" },
                    { 208, "vehicle_category", "Other", null, null, 9, "Other" },
                    { 220, "fuel_type", "Diesel", null, null, 1, "Diesel" },
                    { 221, "fuel_type", "Petrol", null, null, 2, "Petrol" },
                    { 222, "fuel_type", "Electric", null, null, 3, "Electric" },
                    { 223, "fuel_type", "Hybrid", null, null, 4, "Hybrid" },
                    { 224, "fuel_type", "CNG", null, null, 5, "CNG" },
                    { 225, "fuel_type", "LPG", null, null, 6, "LPG" },
                    { 240, "device_type", "GPS Tracker", null, null, 1, "GPS Tracker" },
                    { 241, "device_type", "OBD Dongle", null, null, 2, "OBD Dongle" },
                    { 242, "device_type", "Dashcam", null, null, 3, "Dashcam" },
                    { 243, "device_type", "Temp Sensor", null, null, 4, "Temp Sensor" },
                    { 244, "device_type", "Fuel Sensor", null, null, 5, "Fuel Sensor" },
                    { 260, "device_model", "Teltonika FMB920", "GPS Tracker", null, 1, "Teltonika FMB920" },
                    { 261, "device_model", "Teltonika FMB140", "GPS Tracker", null, 2, "Teltonika FMB140" },
                    { 262, "device_model", "Teltonika FMC003", "GPS Tracker", null, 3, "Teltonika FMC003" },
                    { 263, "device_model", "Queclink GV55", "GPS Tracker", null, 4, "Queclink GV55" },
                    { 264, "device_model", "Queclink GV350MG", "GPS Tracker", null, 5, "Queclink GV350MG" },
                    { 265, "device_model", "Ruptela FM-Eco4+", "GPS Tracker", null, 6, "Ruptela FM-Eco4+" },
                    { 266, "device_model", "Concox GT06N", "GPS Tracker", null, 7, "Concox GT06N" },
                    { 267, "device_model", "Coban GPS303-G", "GPS Tracker", null, 8, "Coban GPS303-G" },
                    { 268, "device_model", "Meitrack MT90", "GPS Tracker", null, 9, "Meitrack MT90" },
                    { 270, "device_model", "CalAmp LMU-3030", "OBD Dongle", null, 1, "CalAmp LMU-3030" },
                    { 271, "device_model", "Ruptela OBD Tracker", "OBD Dongle", null, 2, "Ruptela OBD Tracker" },
                    { 272, "device_model", "Mobilogix M2M", "OBD Dongle", null, 3, "Mobilogix M2M" },
                    { 273, "device_model", "Samsara OBD Gateway", "OBD Dongle", null, 4, "Samsara OBD Gateway" },
                    { 280, "device_model", "BlackVue DR900X-2CH", "Dashcam", null, 1, "BlackVue DR900X-2CH" },
                    { 281, "device_model", "BlackVue DR750X-2CH", "Dashcam", null, 2, "BlackVue DR750X-2CH" },
                    { 282, "device_model", "Viofo A129 Pro", "Dashcam", null, 3, "Viofo A129 Pro" },
                    { 283, "device_model", "Thinkware U1000", "Dashcam", null, 4, "Thinkware U1000" },
                    { 284, "device_model", "Garmin Dash Cam 67W", "Dashcam", null, 5, "Garmin Dash Cam 67W" },
                    { 290, "device_model", "Reefer-Track RT200", "Temp Sensor", null, 1, "Reefer-Track RT200" },
                    { 291, "device_model", "Cold Chain Monitor CC-1", "Temp Sensor", null, 2, "Cold Chain Monitor CC-1" },
                    { 292, "device_model", "Sensitech TempTale 4", "Temp Sensor", null, 3, "Sensitech TempTale 4" },
                    { 295, "device_model", "Tecnoton FLS-100", "Fuel Sensor", null, 1, "Tecnoton FLS-100" },
                    { 296, "device_model", "DFM Flow Meter", "Fuel Sensor", null, 2, "DFM Flow Meter" },
                    { 297, "device_model", "LLS-AF 20160", "Fuel Sensor", null, 3, "LLS-AF 20160" },
                    { 310, "telecom_operator", "Safaricom", null, "KE", 1, "Safaricom" },
                    { 311, "telecom_operator", "Airtel Kenya", null, "KE", 2, "Airtel Kenya" },
                    { 312, "telecom_operator", "Telkom Kenya", null, "KE", 3, "Telkom Kenya" },
                    { 313, "telecom_operator", "MTN Uganda", null, "UG", 4, "MTN Uganda" },
                    { 314, "telecom_operator", "Airtel Uganda", null, "UG", 5, "Airtel Uganda" },
                    { 315, "telecom_operator", "Vodacom Tanzania", null, "TZ", 6, "Vodacom Tanzania" },
                    { 316, "telecom_operator", "Tigo Tanzania", null, "TZ", 7, "Tigo Tanzania" },
                    { 317, "telecom_operator", "Jazz Pakistan", null, "PK", 8, "Jazz Pakistan" },
                    { 318, "telecom_operator", "Telenor Pakistan", null, "PK", 9, "Telenor Pakistan" },
                    { 319, "telecom_operator", "Zong Pakistan", null, "PK", 10, "Zong Pakistan" },
                    { 320, "telecom_operator", "Other", null, null, 99, "Other" },
                    { 340, "geofence_type", "Home base", null, null, 1, "Home base" },
                    { 341, "geofence_type", "Depot", null, null, 2, "Depot" },
                    { 342, "geofence_type", "Restricted", null, null, 3, "Restricted" },
                    { 343, "geofence_type", "Airport", null, null, 4, "Airport" },
                    { 344, "geofence_type", "Customer", null, null, 5, "Customer" },
                    { 345, "geofence_type", "Fuel Station", null, null, 6, "Fuel Station" },
                    { 346, "geofence_type", "Workshop", null, null, 7, "Workshop" }
                });

            migrationBuilder.UpdateData(
                table: "Tenants",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000007"),
                column: "PrimaryColor",
                value: "#0d6e5e");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LookupItems");

            migrationBuilder.UpdateData(
                table: "Tenants",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000007"),
                column: "PrimaryColor",
                value: "#7c3aed");
        }
    }
}
