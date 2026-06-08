using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FleetOS.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateLookupItemsGlobalFocus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "United States", "US", "United States" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "United Kingdom", "GB", "United Kingdom" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Canada", "CA", "Canada" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Australia", "AU", "Australia" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Germany", "DE", "Germany" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "France", "FR", "France" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Netherlands", "NL", "Netherlands" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Ireland", "IE", "Ireland" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "New Zealand", "NZ", "New Zealand" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "UAE", "AE", "UAE" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 11,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Singapore", "SG", "Singapore" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "India", "IN", "India" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 52,
                columns: new[] { "Label", "Value" },
                values: new object[] { "Cargo & Freight", "Cargo & Freight" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 53,
                columns: new[] { "Label", "Value" },
                values: new object[] { "Courier & Delivery", "Courier & Delivery" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 64,
                columns: new[] { "Label", "Value" },
                values: new object[] { "Government", "Government" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 100,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "New York", "United States", "US", "New York" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 101,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Los Angeles", "United States", "US", "Los Angeles" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 102,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Chicago", "United States", "US", "Chicago" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 103,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Houston", "United States", "US", "Houston" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 104,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Phoenix", "United States", "US", "Phoenix" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 105,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Philadelphia", "United States", "US", "Philadelphia" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 106,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "San Antonio", "United States", "US", "San Antonio" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 107,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "San Diego", "United States", "US", "San Diego" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 108,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Dallas", "United States", "US", "Dallas" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 109,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "San Jose", "United States", "US", "San Jose" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 110,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Austin", "United States", "US", "Austin" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 111,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Denver", "United States", "US", "Denver" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 120,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "London", "United Kingdom", "GB", "London" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 121,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Manchester", "United Kingdom", "GB", "Manchester" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 122,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Birmingham", "United Kingdom", "GB", "Birmingham" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 123,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Leeds", "United Kingdom", "GB", "Leeds" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 124,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Glasgow", "United Kingdom", "GB", "Glasgow" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 125,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Sheffield", "United Kingdom", "GB", "Sheffield" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 130,
                columns: new[] { "Label", "Parent", "Region", "SortOrder", "Value" },
                values: new object[] { "Belfast", "United Kingdom", "GB", 11, "Belfast" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 131,
                columns: new[] { "Label", "Parent", "Region", "SortOrder", "Value" },
                values: new object[] { "Leicester", "United Kingdom", "GB", 12, "Leicester" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 132,
                columns: new[] { "Label", "Parent", "Region", "SortOrder", "Value" },
                values: new object[] { "Toronto", "Canada", "CA", 1, "Toronto" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 133,
                columns: new[] { "Label", "Parent", "Region", "SortOrder", "Value" },
                values: new object[] { "Vancouver", "Canada", "CA", 2, "Vancouver" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 134,
                columns: new[] { "Label", "Parent", "Region", "SortOrder", "Value" },
                values: new object[] { "Montreal", "Canada", "CA", 3, "Montreal" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 135,
                columns: new[] { "Label", "Parent", "Region", "SortOrder", "Value" },
                values: new object[] { "Calgary", "Canada", "CA", 4, "Calgary" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 266,
                columns: new[] { "Label", "Value" },
                values: new object[] { "Samsara VG34", "Samsara VG34" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 267,
                columns: new[] { "Label", "Value" },
                values: new object[] { "Verizon Connect HUM", "Verizon Connect HUM" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 268,
                columns: new[] { "Label", "Value" },
                values: new object[] { "CalAmp TTU-2830", "CalAmp TTU-2830" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 271,
                columns: new[] { "Label", "Value" },
                values: new object[] { "Samsara OBD Gateway", "Samsara OBD Gateway" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 272,
                columns: new[] { "Label", "Value" },
                values: new object[] { "Verizon Networkfleet", "Verizon Networkfleet" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 273,
                columns: new[] { "Label", "Value" },
                values: new object[] { "Geotab GO9", "Geotab GO9" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 310,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "AT&T", "US", "AT&T" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 311,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Verizon", "US", "Verizon" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 312,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "T-Mobile US", "US", "T-Mobile US" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 313,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "US Cellular", "US", "US Cellular" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 314,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Vodafone UK", "GB", "Vodafone UK" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 315,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "EE", "GB", "EE" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 316,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "O2 UK", "GB", "O2 UK" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 317,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Three UK", "GB", "Three UK" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 318,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Bell Canada", "CA", "Bell Canada" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 319,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Telstra", "AU", "Telstra" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 320,
                columns: new[] { "Label", "SortOrder", "Value" },
                values: new object[] { "Airtel", 11, "Airtel" });

            migrationBuilder.InsertData(
                table: "LookupItems",
                columns: new[] { "Id", "Category", "Label", "Parent", "Region", "SortOrder", "Value" },
                values: new object[,]
                {
                    { 13, "country", "Pakistan", null, "PK", 13, "Pakistan" },
                    { 14, "country", "South Africa", null, "ZA", 14, "South Africa" },
                    { 15, "country", "Nigeria", null, "NG", 15, "Nigeria" },
                    { 16, "country", "Kenya", null, "KE", 16, "Kenya" },
                    { 65, "industry", "Utilities", null, null, 16, "Utilities" },
                    { 66, "industry", "Other", null, null, 17, "Other" },
                    { 112, "city", "Seattle", "United States", "US", 13, "Seattle" },
                    { 113, "city", "Boston", "United States", "US", 14, "Boston" },
                    { 114, "city", "Washington DC", "United States", "US", 15, "Washington DC" },
                    { 115, "city", "Atlanta", "United States", "US", 16, "Atlanta" },
                    { 116, "city", "Miami", "United States", "US", 17, "Miami" },
                    { 117, "city", "Minneapolis", "United States", "US", 18, "Minneapolis" },
                    { 126, "city", "Edinburgh", "United Kingdom", "GB", 7, "Edinburgh" },
                    { 127, "city", "Liverpool", "United Kingdom", "GB", 8, "Liverpool" },
                    { 128, "city", "Bristol", "United Kingdom", "GB", 9, "Bristol" },
                    { 129, "city", "Cardiff", "United Kingdom", "GB", 10, "Cardiff" },
                    { 136, "city", "Ottawa", "Canada", "CA", 5, "Ottawa" },
                    { 137, "city", "Sydney", "Australia", "AU", 1, "Sydney" },
                    { 138, "city", "Melbourne", "Australia", "AU", 2, "Melbourne" },
                    { 139, "city", "Brisbane", "Australia", "AU", 3, "Brisbane" },
                    { 148, "city", "Perth", "Australia", "AU", 4, "Perth" },
                    { 149, "city", "Adelaide", "Australia", "AU", 5, "Adelaide" },
                    { 226, "fuel_type", "Hydrogen", null, null, 7, "Hydrogen" },
                    { 321, "telecom_operator", "Other", null, null, 99, "Other" },
                    { 347, "geofence_type", "Port / Dock", null, null, 8, "Port / Dock" },
                    { 348, "geofence_type", "Warehouse", null, null, 9, "Warehouse" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 65);

            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 66);

            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 112);

            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 113);

            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 114);

            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 115);

            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 116);

            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 117);

            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 126);

            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 127);

            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 128);

            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 129);

            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 136);

            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 137);

            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 138);

            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 139);

            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 148);

            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 149);

            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 226);

            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 321);

            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 347);

            migrationBuilder.DeleteData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 348);

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Kenya", "KE", "Kenya" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Uganda", "UG", "Uganda" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Tanzania", "TZ", "Tanzania" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Rwanda", "RW", "Rwanda" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Ethiopia", "ET", "Ethiopia" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Ghana", "GH", "Ghana" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Nigeria", "NG", "Nigeria" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "South Africa", "ZA", "South Africa" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Pakistan", "PK", "Pakistan" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "India", "IN", "India" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 11,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Egypt", "EG", "Egypt" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Morocco", "MA", "Morocco" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 52,
                columns: new[] { "Label", "Value" },
                values: new object[] { "Cargo", "Cargo" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 53,
                columns: new[] { "Label", "Value" },
                values: new object[] { "Courier", "Courier" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 64,
                columns: new[] { "Label", "Value" },
                values: new object[] { "Other", "Other" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 100,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Nairobi", "Kenya", "KE", "Nairobi" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 101,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Mombasa", "Kenya", "KE", "Mombasa" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 102,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Kisumu", "Kenya", "KE", "Kisumu" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 103,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Nakuru", "Kenya", "KE", "Nakuru" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 104,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Eldoret", "Kenya", "KE", "Eldoret" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 105,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Thika", "Kenya", "KE", "Thika" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 106,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Machakos", "Kenya", "KE", "Machakos" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 107,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Nyeri", "Kenya", "KE", "Nyeri" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 108,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Meru", "Kenya", "KE", "Meru" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 109,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Garissa", "Kenya", "KE", "Garissa" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 110,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Malindi", "Kenya", "KE", "Malindi" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 111,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Kisii", "Kenya", "KE", "Kisii" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 120,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Dar es Salaam", "Tanzania", "TZ", "Dar es Salaam" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 121,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Arusha", "Tanzania", "TZ", "Arusha" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 122,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Dodoma", "Tanzania", "TZ", "Dodoma" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 123,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Mwanza", "Tanzania", "TZ", "Mwanza" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 124,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Zanzibar", "Tanzania", "TZ", "Zanzibar" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 125,
                columns: new[] { "Label", "Parent", "Region", "Value" },
                values: new object[] { "Tanga", "Tanzania", "TZ", "Tanga" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 130,
                columns: new[] { "Label", "Parent", "Region", "SortOrder", "Value" },
                values: new object[] { "Kampala", "Uganda", "UG", 1, "Kampala" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 131,
                columns: new[] { "Label", "Parent", "Region", "SortOrder", "Value" },
                values: new object[] { "Entebbe", "Uganda", "UG", 2, "Entebbe" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 132,
                columns: new[] { "Label", "Parent", "Region", "SortOrder", "Value" },
                values: new object[] { "Jinja", "Uganda", "UG", 3, "Jinja" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 133,
                columns: new[] { "Label", "Parent", "Region", "SortOrder", "Value" },
                values: new object[] { "Gulu", "Uganda", "UG", 4, "Gulu" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 134,
                columns: new[] { "Label", "Parent", "Region", "SortOrder", "Value" },
                values: new object[] { "Mbale", "Uganda", "UG", 5, "Mbale" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 135,
                columns: new[] { "Label", "Parent", "Region", "SortOrder", "Value" },
                values: new object[] { "Mbarara", "Uganda", "UG", 6, "Mbarara" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 266,
                columns: new[] { "Label", "Value" },
                values: new object[] { "Concox GT06N", "Concox GT06N" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 267,
                columns: new[] { "Label", "Value" },
                values: new object[] { "Coban GPS303-G", "Coban GPS303-G" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 268,
                columns: new[] { "Label", "Value" },
                values: new object[] { "Meitrack MT90", "Meitrack MT90" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 271,
                columns: new[] { "Label", "Value" },
                values: new object[] { "Ruptela OBD Tracker", "Ruptela OBD Tracker" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 272,
                columns: new[] { "Label", "Value" },
                values: new object[] { "Mobilogix M2M", "Mobilogix M2M" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 273,
                columns: new[] { "Label", "Value" },
                values: new object[] { "Samsara OBD Gateway", "Samsara OBD Gateway" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 310,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Safaricom", "KE", "Safaricom" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 311,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Airtel Kenya", "KE", "Airtel Kenya" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 312,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Telkom Kenya", "KE", "Telkom Kenya" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 313,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "MTN Uganda", "UG", "MTN Uganda" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 314,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Airtel Uganda", "UG", "Airtel Uganda" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 315,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Vodacom Tanzania", "TZ", "Vodacom Tanzania" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 316,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Tigo Tanzania", "TZ", "Tigo Tanzania" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 317,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Jazz Pakistan", "PK", "Jazz Pakistan" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 318,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Telenor Pakistan", "PK", "Telenor Pakistan" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 319,
                columns: new[] { "Label", "Region", "Value" },
                values: new object[] { "Zong Pakistan", "PK", "Zong Pakistan" });

            migrationBuilder.UpdateData(
                table: "LookupItems",
                keyColumn: "Id",
                keyValue: 320,
                columns: new[] { "Label", "SortOrder", "Value" },
                values: new object[] { "Other", 99, "Other" });
        }
    }
}
