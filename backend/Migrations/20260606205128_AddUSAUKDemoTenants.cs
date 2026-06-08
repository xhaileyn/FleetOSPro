using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FleetOS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUSAUKDemoTenants : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Tenants",
                columns: new[] { "Id", "CreatedAt", "LogoInitials", "Mrr", "Name", "Plan", "PrimaryColor", "Region", "Slug", "Status" },
                values: new object[,]
                {
                    { new Guid("00000000-0000-0000-0000-000000000008"), new DateTime(2023, 3, 1, 0, 0, 0, 0, DateTimeKind.Utc), "AF", 4200m, "Atlantic Freight Inc", "Enterprise", "#1e40af", "United States", "atlantic", "active" },
                    { new Guid("00000000-0000-0000-0000-000000000009"), new DateTime(2024, 1, 15, 0, 0, 0, 0, DateTimeKind.Utc), "ML", 2100m, "Meridian Logistics", "Professional", "#047857", "United States", "meridian", "active" },
                    { new Guid("00000000-0000-0000-0000-000000000010"), new DateTime(2023, 9, 1, 0, 0, 0, 0, DateTimeKind.Utc), "BF", 3600m, "BritFleet Solutions", "Enterprise", "#7c3aed", "United Kingdom", "britfleet", "active" }
                });

            migrationBuilder.InsertData(
                table: "Customers",
                columns: new[] { "Id", "AccountManager", "ActiveContracts", "Address", "City", "ComplianceNotes", "ComplianceStatus", "Country", "CreatedAt", "CreditLimit", "Email", "Industry", "Name", "Notes", "ParentId", "Phone", "ShortId", "Status", "TaxId", "TenantId", "Type", "VehiclesAssigned", "Website" },
                values: new object[,]
                {
                    { new Guid("2ceadc8f-fa28-afad-63f1-c601a2985bc0"), "Charlotte Williams", 1, "1 Piccadilly Gardens, Manchester M1 1RG", "Manchester", "", "Compliant", "United Kingdom", new DateTime(2023, 10, 15, 0, 0, 0, 0, DateTimeKind.Utc), 1800000m, "ops@northernfreight.co.uk", "Freight", "Northern Freight Partners", "Northern England freight carrier.", null, "", "c-b10-002", "Active", "GB-VAT-234567890", new Guid("00000000-0000-0000-0000-000000000010"), "Company", 2, "northernfreight.co.uk" },
                    { new Guid("2d3d3c7a-7377-1747-f0ce-c2c2bfca7bdb"), "Robert Mitchell", 1, "1 Gateway Center, Newark, NJ 07102", "Newark", "", "Compliant", "United States", new DateTime(2023, 4, 15, 0, 0, 0, 0, DateTimeKind.Utc), 1500000m, "logistics@metroretail.com", "Retail", "Metro Retail Group", "Regional retail chain delivery.", null, "+1 973 555 0300", "c-a8-002", "Active", "US-EIN-22-0002002", new Guid("00000000-0000-0000-0000-000000000008"), "Company", 1, "metroretail.com" },
                    { new Guid("3aee5c3a-d1cb-0105-0559-2548f708ff8c"), "Amy Rodriguez", 1, "2200 Port of Houston Road, Houston, TX 77020", "Houston", "", "Compliant", "United States", new DateTime(2024, 3, 1, 0, 0, 0, 0, DateTimeKind.Utc), 1200000m, "ops@gulfcoastdist.com", "Distribution", "Gulf Coast Distributors", "Port distribution client.", null, "", "c-m9-002", "Active", "US-EIN-74-0009002", new Guid("00000000-0000-0000-0000-000000000009"), "Company", 1, "gulfcoastdist.com" },
                    { new Guid("511fb655-0e9f-9c73-8014-25e839d01f8f"), "Jennifer Walsh", 0, "111 Town Square Place, Jersey City, NJ 07310", "Jersey City", "", "Compliant", "United States", new DateTime(2023, 6, 1, 0, 0, 0, 0, DateTimeKind.Utc), 800000m, "ops@harborviewimports.com", "Import/Export", "Harborview Imports LLC", "New client — onboarding.", null, "", "c-a8-003", "Active", "US-EIN-22-0003003", new Guid("00000000-0000-0000-0000-000000000008"), "Company", 0, "harborviewimports.com" },
                    { new Guid("664f79b6-4eb1-112a-d15b-ce6ff884a7b8"), "Oliver Thompson", 2, "30 St Mary Axe, London EC3A 8BF", "London", "", "Compliant", "United Kingdom", new DateTime(2023, 9, 10, 0, 0, 0, 0, DateTimeKind.Utc), 5000000m, "fleet@britfleetgroup.co.uk", "Logistics", "BritFleet Group Holdings", "Parent group holding company.", null, "+44 20 7946 0200", "c-b10-001", "Active", "GB-VAT-123456789", new Guid("00000000-0000-0000-0000-000000000010"), "Company", 3, "britfleetgroup.co.uk" },
                    { new Guid("b405b0d5-cb7c-c667-a84e-8631c36fd247"), "George Brown", 1, "Colmore Row, Birmingham B3 2QD", "Birmingham", "", "Compliant", "United Kingdom", new DateTime(2023, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), 1000000m, "logistics@midlandsdist.co.uk", "Distribution", "Midlands Distribution Ltd", "Midlands regional distribution.", null, "", "c-b10-003", "Active", "GB-VAT-345678901", new Guid("00000000-0000-0000-0000-000000000010"), "Company", 1, "midlandsdist.co.uk" },
                    { new Guid("ec170946-d398-a5cb-fd63-af8f72ba2f55"), "Jennifer Walsh", 2, "350 Fifth Avenue, New York, NY 10118", "New York", "", "Compliant", "United States", new DateTime(2023, 3, 10, 0, 0, 0, 0, DateTimeKind.Utc), 3000000m, "fleet@atlanticmfg.com", "Manufacturing", "Atlantic Manufacturing Corp", "Key enterprise manufacturing client.", null, "+1 212 555 0200", "c-a8-001", "Active", "US-EIN-13-0001001", new Guid("00000000-0000-0000-0000-000000000008"), "Company", 3, "atlanticmfg.com" },
                    { new Guid("f398af89-ee69-48fa-21d5-266b84c35d7d"), "James Harrison", 2, "1000 Main Street, Houston, TX 77002", "Houston", "", "Compliant", "United States", new DateTime(2024, 1, 25, 0, 0, 0, 0, DateTimeKind.Utc), 4000000m, "fleet@lonestarenergy.com", "Energy", "Lone Star Energy LLC", "Energy sector client — Houston operations.", null, "+1 713 555 0100", "c-m9-001", "Active", "US-EIN-74-0009001", new Guid("00000000-0000-0000-0000-000000000009"), "Company", 2, "lonestarenergy.com" }
                });

            migrationBuilder.InsertData(
                table: "Devices",
                columns: new[] { "Id", "Battery", "Firmware", "Imei", "InstalledAt", "LastSeen", "Model", "Notes", "SerialNo", "ShortId", "Signal", "SimShortId", "Status", "TenantId", "Type", "VehiclePlate", "VehicleShortId" },
                values: new object[,]
                {
                    { new Guid("089342d0-c0d8-a8d9-79d6-7e8300681493"), null, "v5.2.0", "356308080800053", new DateOnly(2020, 10, 5), "2 days ago", "Geotab GO9", "Geotab GO9. Offline — maintenance mode.", "GEO-GO9-A8-004", "dev-va8-004-obd", "None", null, "Maintenance", new Guid("00000000-0000-0000-0000-000000000008"), "OBD Dongle", "NJ-7844D", "va8-004" },
                    { new Guid("1482202a-ce50-3d81-7f4e-53515f1a4bf5"), null, "v5.2.0", "356309090900001", new DateOnly(2022, 3, 15), "Just now", "Verizon Connect HUM", "Verizon Connect HUM. Kenworth T880 Houston.", "VCH-HUM-M9-001", "dev-vm9-001-gps", "Strong", "sim-vm9-001-p", "Online", new Guid("00000000-0000-0000-0000-000000000009"), "GPS Tracker", "TX-MLG-001", "vm9-001" },
                    { new Guid("14dd2e07-d896-c51a-d924-5f67aec58dd7"), null, "2.1.0", "356310101000052", new DateOnly(2021, 11, 15), "2 min ago", "Ruptela OBD Tracker", "Ruptela OBD Volvo engine data.", "RUP-OBD-B10-002", "dev-vb10-002-obd", "Strong", null, "Online", new Guid("00000000-0000-0000-0000-000000000010"), "OBD Dongle", "LK71 ABF", "vb10-002" },
                    { new Guid("17b0488c-0cc2-9d11-dfec-c39c9a804a16"), null, "03.28.07", "356310101000005", new DateOnly(2022, 7, 15), "Just now", "Teltonika FMB920", "Teltonika FMB920. Renault Master Birmingham.", "TLT-FMB-B10-005", "dev-vb10-005-gps", "Strong", "sim-vb10-005-p", "Online", new Guid("00000000-0000-0000-0000-000000000010"), "GPS Tracker", "LK72 CBF", "vb10-005" },
                    { new Guid("237ba82f-2a66-0162-3f0d-a210c62b2afd"), null, "v5.2.0", "356308080800052", new DateOnly(2021, 6, 25), "2 min ago", "Geotab GO9", "Geotab GO9 engine monitoring.", "GEO-GO9-A8-002", "dev-va8-002-obd", "Strong", null, "Online", new Guid("00000000-0000-0000-0000-000000000008"), "OBD Dongle", "NJ-7842B", "va8-002" },
                    { new Guid("2dc06eb0-11b4-9c8b-468f-2de43b8cc1ba"), null, "v5.2.0", "356308080800002", new DateOnly(2021, 6, 25), "2 min ago", "Samsara VG34", "Samsara VG34. Cascadia long-haul.", "SAM-VG34-A8-002", "dev-va8-002-gps", "Strong", "sim-va8-002-p", "Online", new Guid("00000000-0000-0000-0000-000000000008"), "GPS Tracker", "NJ-7842B", "va8-002" },
                    { new Guid("4402296c-62d9-3588-4043-ab768ee7564a"), null, "2.1.0", "356310101000055", new DateOnly(2022, 12, 5), "Just now", "Ruptela OBD Tracker", "Ruptela OBD MAN engine monitoring.", "RUP-OBD-B10-008", "dev-vb10-008-obd", "Strong", null, "Online", new Guid("00000000-0000-0000-0000-000000000010"), "OBD Dongle", "LK72 DBF", "vb10-008" },
                    { new Guid("51843c3c-1aa9-f935-8f90-b2fcbba959c2"), null, "03.28.07", "356310101000001", new DateOnly(2022, 9, 20), "Just now", "Teltonika FMB920", "Teltonika FMB920. Actros 2645 London ops.", "TLT-FMB-B10-001", "dev-vb10-001-gps", "Strong", "sim-vb10-001-p", "Online", new Guid("00000000-0000-0000-0000-000000000010"), "GPS Tracker", "LK72 ABF", "vb10-001" },
                    { new Guid("5797de68-3ee2-277b-9833-1ce097ade83f"), null, "v5.2.0", "356309090900004", new DateOnly(2020, 11, 10), "2 days ago", "Verizon Connect HUM", "Verizon Connect HUM. Peterbilt 389 in maintenance.", "VCH-HUM-M9-004", "dev-vm9-004-gps", "None", "sim-vm9-004-p", "Maintenance", new Guid("00000000-0000-0000-0000-000000000009"), "GPS Tracker", "TX-MLG-004", "vm9-004" },
                    { new Guid("595fae4f-ea8d-1f93-f974-b163c18bf8dc"), null, "7.3.2", "356309090900053", new DateOnly(2020, 11, 10), "2 days ago", "CalAmp TTU-2830", "CalAmp TTU-2830. Offline — maintenance.", "CAL-TTU-M9-004", "dev-vm9-004-obd", "None", null, "Maintenance", new Guid("00000000-0000-0000-0000-000000000009"), "OBD Dongle", "TX-MLG-004", "vm9-004" },
                    { new Guid("5b41049b-f180-82bd-ec1b-f8e69d37381c"), null, "v5.2.0", "356308080800055", new DateOnly(2022, 6, 10), "Just now", "Geotab GO9", "Geotab GO9 engine diagnostics.", "GEO-GO9-A8-008", "dev-va8-008-obd", "Strong", null, "Online", new Guid("00000000-0000-0000-0000-000000000008"), "OBD Dongle", "NJ-7848H", "va8-008" },
                    { new Guid("5fad02f0-309e-6288-4156-53119bb1eb76"), null, "v5.2.0", "356309090900005", new DateOnly(2022, 9, 15), "Just now", "Verizon Connect HUM", "Verizon Connect HUM. ProMaster 2500 South Houston.", "VCH-HUM-M9-005", "dev-vm9-005-gps", "Strong", "sim-vm9-005-p", "Online", new Guid("00000000-0000-0000-0000-000000000009"), "GPS Tracker", "TX-MLG-005", "vm9-005" },
                    { new Guid("61d51702-1196-4814-ee36-69d13cfeda51"), null, "v5.2.0", "356309090900006", new DateOnly(2021, 5, 25), "4 hr ago", "Verizon Connect HUM", "Verizon Connect HUM. Mack Anthem offline.", "VCH-HUM-M9-006", "dev-vm9-006-gps", "None", "sim-vm9-006-p", "Offline", new Guid("00000000-0000-0000-0000-000000000009"), "GPS Tracker", "TX-MLG-006", "vm9-006" },
                    { new Guid("64dbb363-72ae-0c42-08c0-1e21fec9c2d7"), null, "v5.2.0", "356308080800007", new DateOnly(2023, 5, 15), "3 hr ago", "Samsara VG34", "Samsara VG34. Sprinter offline.", "SAM-VG34-A8-007", "dev-va8-007-gps", "None", "sim-va8-007-p", "Offline", new Guid("00000000-0000-0000-0000-000000000008"), "GPS Tracker", "NJ-7847G", "va8-007" },
                    { new Guid("685a2bbb-9625-65c8-dfed-ffe103d1a1c2"), null, "7.3.2", "356309090900051", new DateOnly(2022, 3, 15), "Just now", "CalAmp TTU-2830", "CalAmp TTU-2830 engine diagnostics.", "CAL-TTU-M9-001", "dev-vm9-001-obd", "Strong", null, "Online", new Guid("00000000-0000-0000-0000-000000000009"), "OBD Dongle", "TX-MLG-001", "vm9-001" },
                    { new Guid("6e8f72aa-f3f4-c78b-dc14-b9f58c4d945b"), null, "03.28.07", "356310101000004", new DateOnly(2020, 10, 10), "2 days ago", "Teltonika FMB920", "Teltonika FMB920. DAF XF in workshop.", "TLT-FMB-B10-004", "dev-vb10-004-gps", "None", "sim-vb10-004-p", "Maintenance", new Guid("00000000-0000-0000-0000-000000000010"), "GPS Tracker", "LK70 ABF", "vb10-004" },
                    { new Guid("8b6a5d72-ad78-9ea0-4b85-f5e76ca92398"), null, "03.28.07", "356310101000006", new DateOnly(2021, 5, 20), "Just now", "Teltonika FMB920", "Teltonika FMB920. Scania R500 Leeds.", "TLT-FMB-B10-006", "dev-vb10-006-gps", "Strong", "sim-vb10-006-p", "Online", new Guid("00000000-0000-0000-0000-000000000010"), "GPS Tracker", "LK71 CBF", "vb10-006" },
                    { new Guid("8d6417ba-7377-de78-17a3-9365cb422b33"), null, "v5.2.0", "356308080800051", new DateOnly(2022, 4, 15), "Just now", "Geotab GO9", "Geotab GO9 engine diagnostics.", "GEO-GO9-A8-001", "dev-va8-001-obd", "Strong", null, "Online", new Guid("00000000-0000-0000-0000-000000000008"), "OBD Dongle", "NJ-7841A", "va8-001" },
                    { new Guid("91af181c-c6c8-81b8-8c1e-6746a07b24c0"), null, "3.4.0", "356309090900101", new DateOnly(2022, 3, 15), "Just now", "Viofo A129 Pro", "Viofo A129 Pro front dashcam.", "VIO-A129-M9-001", "dev-vm9-001-cam", "Strong", null, "Online", new Guid("00000000-0000-0000-0000-000000000009"), "Dashcam", "TX-MLG-001", "vm9-001" },
                    { new Guid("92846ece-a737-e651-8f72-a218a0cb4143"), null, "v5.2.0", "356308080800004", new DateOnly(2020, 10, 5), "2 days ago", "Samsara VG34", "Samsara VG34. Peterbilt in workshop.", "SAM-VG34-A8-004", "dev-va8-004-gps", "None", "sim-va8-004-p", "Maintenance", new Guid("00000000-0000-0000-0000-000000000008"), "GPS Tracker", "NJ-7844D", "va8-004" },
                    { new Guid("967964cf-07b6-02b8-bda6-e2f2ae2f6b50"), null, "1.005_23", "356308080800101", new DateOnly(2022, 4, 15), "Just now", "BlackVue DR900X-2CH", "Front + rear 4K dashcam.", "BVX-A8-001-CAM", "dev-va8-001-cam", "Strong", null, "Online", new Guid("00000000-0000-0000-0000-000000000008"), "Dashcam", "NJ-7841A", "va8-001" },
                    { new Guid("97476591-cfe7-486d-0983-161373aafae1"), null, "v5.2.0", "356308080800001", new DateOnly(2022, 4, 15), "Just now", "Samsara VG34", "Samsara VG34 primary GPS. NJ truck hub.", "SAM-VG34-A8-001", "dev-va8-001-gps", "Strong", "sim-va8-001-p", "Online", new Guid("00000000-0000-0000-0000-000000000008"), "GPS Tracker", "NJ-7841A", "va8-001" },
                    { new Guid("9d6a8838-3d62-d3bd-ce65-b60c26d25ed2"), null, "2.1.0", "356310101000051", new DateOnly(2022, 9, 20), "Just now", "Ruptela OBD Tracker", "Ruptela OBD engine monitoring.", "RUP-OBD-B10-001", "dev-vb10-001-obd", "Strong", null, "Online", new Guid("00000000-0000-0000-0000-000000000010"), "OBD Dongle", "LK72 ABF", "vb10-001" },
                    { new Guid("a755be35-5268-417b-94e3-19ba6f463516"), null, "v5.2.0", "356308080800003", new DateOnly(2023, 2, 20), "1 min ago", "Samsara VG34", "Samsara VG34. Transit van city delivery.", "SAM-VG34-A8-003", "dev-va8-003-gps", "Strong", "sim-va8-003-p", "Online", new Guid("00000000-0000-0000-0000-000000000008"), "GPS Tracker", "NJ-7843C", "va8-003" },
                    { new Guid("c0c94d75-0ab3-0bcd-750f-ea55e1506c9d"), null, "03.28.07", "356310101000008", new DateOnly(2022, 12, 5), "Just now", "Teltonika FMB920", "Teltonika FMB920. MAN TGX Bristol.", "TLT-FMB-B10-008", "dev-vb10-008-gps", "Strong", "sim-vb10-008-p", "Online", new Guid("00000000-0000-0000-0000-000000000010"), "GPS Tracker", "LK72 DBF", "vb10-008" },
                    { new Guid("c2f3f5f3-0b24-c56b-ffed-4c659254741b"), null, "v5.2.0", "356309090900002", new DateOnly(2021, 8, 25), "3 min ago", "Verizon Connect HUM", "Verizon Connect HUM. Freightliner M2.", "VCH-HUM-M9-002", "dev-vm9-002-gps", "Strong", "sim-vm9-002-p", "Online", new Guid("00000000-0000-0000-0000-000000000009"), "GPS Tracker", "TX-MLG-002", "vm9-002" },
                    { new Guid("c5784b1d-d787-9dcf-ce40-0870b0cce521"), null, "1.012_23", "356310101000101", new DateOnly(2022, 9, 20), "Just now", "BlackVue DR750X-2CH", "BlackVue DR750X front + rear dashcam.", "BVX-B10-001-CAM", "dev-vb10-001-cam", "Strong", null, "Online", new Guid("00000000-0000-0000-0000-000000000010"), "Dashcam", "LK72 ABF", "vb10-001" },
                    { new Guid("cb5e437a-368f-06eb-1a90-e3e19777ba7d"), null, "03.28.07", "356310101000007", new DateOnly(2023, 6, 5), "3 hr ago", "Teltonika FMB920", "Teltonika FMB920. Vauxhall Vivaro offline Glasgow.", "TLT-FMB-B10-007", "dev-vb10-007-gps", "None", "sim-vb10-007-p", "Offline", new Guid("00000000-0000-0000-0000-000000000010"), "GPS Tracker", "LK73 CBF", "vb10-007" },
                    { new Guid("d160ecb5-2de2-960c-45f1-0ec88dd6c9cd"), null, "03.28.07", "356310101000003", new DateOnly(2023, 3, 25), "1 min ago", "Teltonika FMB920", "Teltonika FMB920. Transit Custom London delivery.", "TLT-FMB-B10-003", "dev-vb10-003-gps", "Strong", "sim-vb10-003-p", "Online", new Guid("00000000-0000-0000-0000-000000000010"), "GPS Tracker", "LK73 ABF", "vb10-003" },
                    { new Guid("d44d6950-9b91-0bed-de3a-40bce79bfe22"), null, "03.28.07", "356310101000002", new DateOnly(2021, 11, 15), "2 min ago", "Teltonika FMB920", "Teltonika FMB920. Volvo FH16 Manchester.", "TLT-FMB-B10-002", "dev-vb10-002-gps", "Strong", "sim-vb10-002-p", "Online", new Guid("00000000-0000-0000-0000-000000000010"), "GPS Tracker", "LK71 ABF", "vb10-002" },
                    { new Guid("d7472fc5-366a-58d9-84bc-6d8cef863870"), null, "v5.2.0", "356308080800006", new DateOnly(2021, 9, 20), "Just now", "Samsara VG34", "Samsara VG34. Kenworth T680 Staten Island.", "SAM-VG34-A8-006", "dev-va8-006-gps", "Strong", "sim-va8-006-p", "Online", new Guid("00000000-0000-0000-0000-000000000008"), "GPS Tracker", "NJ-7846F", "va8-006" },
                    { new Guid("d7c010d5-e6cb-71ae-ff16-a3a7b4cf2d92"), null, "v5.2.0", "356308080800008", new DateOnly(2022, 6, 10), "Just now", "Samsara VG34", "Samsara VG34. International LT Jersey City.", "SAM-VG34-A8-008", "dev-va8-008-gps", "Strong", "sim-va8-008-p", "Online", new Guid("00000000-0000-0000-0000-000000000008"), "GPS Tracker", "NJ-7848H", "va8-008" },
                    { new Guid("d97d14f6-dfdc-f792-af5c-9f051e6beee2"), null, "v5.2.0", "356308080800054", new DateOnly(2021, 9, 20), "Just now", "Geotab GO9", "Geotab GO9 engine diagnostics.", "GEO-GO9-A8-006", "dev-va8-006-obd", "Strong", null, "Online", new Guid("00000000-0000-0000-0000-000000000008"), "OBD Dongle", "NJ-7846F", "va8-006" },
                    { new Guid("df2c7ab2-73c1-cfad-269c-3b6e736b1cbc"), null, "7.3.2", "356309090900052", new DateOnly(2021, 8, 25), "3 min ago", "CalAmp TTU-2830", "CalAmp TTU-2830 OBD monitoring.", "CAL-TTU-M9-002", "dev-vm9-002-obd", "Strong", null, "Online", new Guid("00000000-0000-0000-0000-000000000009"), "OBD Dongle", "TX-MLG-002", "vm9-002" },
                    { new Guid("e0030113-25a5-d161-692a-fe7414731b75"), null, "2.1.0", "356310101000053", new DateOnly(2020, 10, 10), "2 days ago", "Ruptela OBD Tracker", "Ruptela OBD. Offline maintenance.", "RUP-OBD-B10-004", "dev-vb10-004-obd", "None", null, "Maintenance", new Guid("00000000-0000-0000-0000-000000000010"), "OBD Dongle", "LK70 ABF", "vb10-004" },
                    { new Guid("e0ae12c6-6a19-1cd4-7de3-8382912449bd"), null, "7.3.2", "356309090900054", new DateOnly(2021, 5, 25), "4 hr ago", "CalAmp TTU-2830", "CalAmp TTU-2830. Offline.", "CAL-TTU-M9-006", "dev-vm9-006-obd", "None", null, "Offline", new Guid("00000000-0000-0000-0000-000000000009"), "OBD Dongle", "TX-MLG-006", "vm9-006" },
                    { new Guid("e773d9d0-1f58-9ba9-8a07-753e9bdee923"), null, "v5.2.0", "356309090900003", new DateOnly(2023, 3, 20), "1 min ago", "Verizon Connect HUM", "Verizon Connect HUM. Transit 350 city delivery.", "VCH-HUM-M9-003", "dev-vm9-003-gps", "Strong", "sim-vm9-003-p", "Online", new Guid("00000000-0000-0000-0000-000000000009"), "GPS Tracker", "TX-MLG-003", "vm9-003" },
                    { new Guid("f538cfb0-3bb6-c33a-9dde-5e25e6f2dbd6"), null, "2.1.0", "356310101000054", new DateOnly(2021, 5, 20), "Just now", "Ruptela OBD Tracker", "Ruptela OBD Scania diagnostics.", "RUP-OBD-B10-006", "dev-vb10-006-obd", "Strong", null, "Online", new Guid("00000000-0000-0000-0000-000000000010"), "OBD Dongle", "LK71 CBF", "vb10-006" },
                    { new Guid("fdb26b92-85a3-7114-616f-0a7a62cbe727"), null, "v5.2.0", "356308080800005", new DateOnly(2022, 7, 25), "Just now", "Samsara VG34", "Samsara VG34. ProMaster van Bronx ops.", "SAM-VG34-A8-005", "dev-va8-005-gps", "Strong", "sim-va8-005-p", "Online", new Guid("00000000-0000-0000-0000-000000000008"), "GPS Tracker", "NJ-7845E", "va8-005" }
                });

            migrationBuilder.InsertData(
                table: "SimCards",
                columns: new[] { "Id", "ActivatedAt", "Apn", "Country", "DataPlanMb", "DataUsedMb", "ExpiresAt", "Iccid", "Msisdn", "Notes", "Operator", "ShortId", "Status", "TenantId", "Type", "VehiclePlate", "VehicleShortId" },
                values: new object[,]
                {
                    { new Guid("022a1919-493d-2600-dfe4-b27f062da990"), new DateOnly(2021, 6, 25), "broadband.att.com", "United States", 10240, 6800, new DateOnly(2026, 6, 25), "89014103080800002", "+1 973 800 0002", "AT&T primary SIM — Cascadia truck.", "AT&T", "sim-va8-002-p", "Active", new Guid("00000000-0000-0000-0000-000000000008"), "Primary", "NJ-7842B", "va8-002" },
                    { new Guid("0db6d595-f625-9b0d-e95e-7a22c1fb2b12"), new DateOnly(2022, 7, 15), "internet", "United Kingdom", 5120, 2900, new DateOnly(2027, 7, 15), "89440404101000005", "+44 7700 100005", "Vodafone UK primary SIM — Renault Master van.", "Vodafone UK", "sim-vb10-005-p", "Active", new Guid("00000000-0000-0000-0000-000000000010"), "Primary", "LK72 CBF", "vb10-005" },
                    { new Guid("1627f25d-4695-716a-7244-93fe4fb7bf44"), new DateOnly(2022, 6, 10), "broadband.att.com", "United States", 10240, 4700, new DateOnly(2027, 6, 10), "89014103080800008", "+1 973 800 0008", "AT&T primary SIM — International LT truck.", "AT&T", "sim-va8-008-p", "Active", new Guid("00000000-0000-0000-0000-000000000008"), "Primary", "NJ-7848H", "va8-008" },
                    { new Guid("1b801687-9b43-f18e-5216-f62a6f92638f"), new DateOnly(2023, 3, 20), "fast.t-mobile.com", "United States", 10240, 2400, new DateOnly(2027, 3, 20), "89014103090900003", "+1 713 900 0003", "T-Mobile US primary SIM — Transit 350 van.", "T-Mobile US", "sim-vm9-003-p", "Active", new Guid("00000000-0000-0000-0000-000000000009"), "Primary", "TX-MLG-003", "vm9-003" },
                    { new Guid("1d37465a-b362-6940-428e-0de144fbcc1a"), new DateOnly(2022, 4, 15), "vzwinternet", "United States", 2048, 120, new DateOnly(2027, 4, 15), "89014103080800101", "+1 973 800 0101", "Verizon backup SIM — truck failover.", "Verizon", "sim-va8-001-b", "Active", new Guid("00000000-0000-0000-0000-000000000008"), "Backup", "NJ-7841A", "va8-001" },
                    { new Guid("208e0923-0f68-9d6e-e277-e23c65ea8293"), new DateOnly(2020, 11, 10), "fast.t-mobile.com", "United States", 10240, 3100, new DateOnly(2025, 11, 10), "89014103090900004", "+1 713 900 0004", "T-Mobile US primary SIM — Peterbilt maintenance.", "T-Mobile US", "sim-vm9-004-p", "Active", new Guid("00000000-0000-0000-0000-000000000009"), "Primary", "TX-MLG-004", "vm9-004" },
                    { new Guid("31591125-37e4-9f17-d629-abbb3ac01594"), new DateOnly(2022, 12, 5), "everywhere", "United Kingdom", 2048, 66, new DateOnly(2027, 12, 5), "89440404101000108", "+44 7700 100108", "EE backup SIM — MAN truck.", "EE", "sim-vb10-008-b", "Active", new Guid("00000000-0000-0000-0000-000000000010"), "Backup", "LK72 DBF", "vb10-008" },
                    { new Guid("35f50096-bec4-c0a7-0c00-d8f9b48e0646"), new DateOnly(2020, 10, 10), "internet", "United Kingdom", 10240, 4800, new DateOnly(2025, 10, 10), "89440404101000004", "+44 7700 100004", "Vodafone UK primary SIM — DAF XF maintenance.", "Vodafone UK", "sim-vb10-004-p", "Active", new Guid("00000000-0000-0000-0000-000000000010"), "Primary", "LK70 ABF", "vb10-004" },
                    { new Guid("395100e5-ae0c-9790-3c93-bca997e4a1c0"), new DateOnly(2023, 5, 15), "broadband.att.com", "United States", 5120, 3400, new DateOnly(2027, 5, 15), "89014103080800007", "+1 973 800 0007", "AT&T primary SIM — Sprinter van offline.", "AT&T", "sim-va8-007-p", "Active", new Guid("00000000-0000-0000-0000-000000000008"), "Primary", "NJ-7847G", "va8-007" },
                    { new Guid("5315c660-e282-b6ce-131f-b06b4f9c4c47"), new DateOnly(2021, 11, 15), "everywhere", "United Kingdom", 2048, 78, new DateOnly(2026, 11, 15), "89440404101000102", "+44 7700 100102", "EE backup SIM.", "EE", "sim-vb10-002-b", "Active", new Guid("00000000-0000-0000-0000-000000000010"), "Backup", "LK71 ABF", "vb10-002" },
                    { new Guid("54a58529-e2a2-44ab-5102-94792863441b"), new DateOnly(2021, 5, 20), "everywhere", "United Kingdom", 2048, 88, new DateOnly(2026, 5, 20), "89440404101000106", "+44 7700 100106", "EE backup SIM — Scania truck.", "EE", "sim-vb10-006-b", "Active", new Guid("00000000-0000-0000-0000-000000000010"), "Backup", "LK71 CBF", "vb10-006" },
                    { new Guid("65990a89-7d45-91dd-43e7-f1111b351ba3"), new DateOnly(2021, 11, 15), "internet", "United Kingdom", 10240, 6200, new DateOnly(2026, 11, 15), "89440404101000002", "+44 7700 100002", "Vodafone UK primary SIM — Volvo FH16 truck.", "Vodafone UK", "sim-vb10-002-p", "Active", new Guid("00000000-0000-0000-0000-000000000010"), "Primary", "LK71 ABF", "vb10-002" },
                    { new Guid("6806a1dc-93ae-48af-2d00-fe2e074eaaf9"), new DateOnly(2021, 9, 20), "vzwinternet", "United States", 2048, 95, new DateOnly(2026, 9, 20), "89014103080800106", "+1 973 800 0106", "Verizon backup SIM.", "Verizon", "sim-va8-006-b", "Active", new Guid("00000000-0000-0000-0000-000000000008"), "Backup", "NJ-7846F", "va8-006" },
                    { new Guid("6ad21037-2800-0de6-ee91-b514cd54bebc"), new DateOnly(2022, 4, 15), "broadband.att.com", "United States", 10240, 5200, new DateOnly(2027, 4, 15), "89014103080800001", "+1 973 800 0001", "AT&T primary SIM — Samsara VG34 truck.", "AT&T", "sim-va8-001-p", "Active", new Guid("00000000-0000-0000-0000-000000000008"), "Primary", "NJ-7841A", "va8-001" },
                    { new Guid("6f592ce4-97f4-a5b4-816e-2a87a65df44d"), new DateOnly(2022, 7, 25), "broadband.att.com", "United States", 5120, 1800, new DateOnly(2027, 7, 25), "89014103080800005", "+1 973 800 0005", "AT&T primary SIM — ProMaster van.", "AT&T", "sim-va8-005-p", "Active", new Guid("00000000-0000-0000-0000-000000000008"), "Primary", "NJ-7845E", "va8-005" },
                    { new Guid("81e0ee96-50b9-c4b2-9a97-395a57c4bf38"), new DateOnly(2022, 3, 15), "fast.t-mobile.com", "United States", 10240, 5800, new DateOnly(2027, 3, 15), "89014103090900001", "+1 713 900 0001", "T-Mobile US primary SIM — Kenworth T880.", "T-Mobile US", "sim-vm9-001-p", "Active", new Guid("00000000-0000-0000-0000-000000000009"), "Primary", "TX-MLG-001", "vm9-001" },
                    { new Guid("85b82c4f-0e38-0107-4287-2473feb8a3ca"), new DateOnly(2021, 5, 20), "internet", "United Kingdom", 10240, 5500, new DateOnly(2026, 5, 20), "89440404101000006", "+44 7700 100006", "Vodafone UK primary SIM — Scania R500 truck.", "Vodafone UK", "sim-vb10-006-p", "Active", new Guid("00000000-0000-0000-0000-000000000010"), "Primary", "LK71 CBF", "vb10-006" },
                    { new Guid("88056bc2-f8f9-618c-b354-08bbf74c9855"), new DateOnly(2020, 10, 5), "vzwinternet", "United States", 2048, 55, new DateOnly(2025, 10, 5), "89014103080800104", "+1 973 800 0104", "Verizon backup SIM — truck.", "Verizon", "sim-va8-004-b", "Active", new Guid("00000000-0000-0000-0000-000000000008"), "Backup", "NJ-7844D", "va8-004" },
                    { new Guid("939542ba-80d4-427d-832f-8da86246f6f5"), new DateOnly(2021, 5, 25), "fast.t-mobile.com", "United States", 10240, 5500, new DateOnly(2026, 5, 25), "89014103090900006", "+1 713 900 0006", "T-Mobile US primary SIM — Mack Anthem offline.", "T-Mobile US", "sim-vm9-006-p", "Active", new Guid("00000000-0000-0000-0000-000000000009"), "Primary", "TX-MLG-006", "vm9-006" },
                    { new Guid("9b6c2400-d2b8-8165-62e9-d5eafaae73ca"), new DateOnly(2023, 2, 20), "broadband.att.com", "United States", 5120, 2100, new DateOnly(2027, 2, 20), "89014103080800003", "+1 973 800 0003", "AT&T primary SIM — Transit van.", "AT&T", "sim-va8-003-p", "Active", new Guid("00000000-0000-0000-0000-000000000008"), "Primary", "NJ-7843C", "va8-003" },
                    { new Guid("9da798e0-3ca1-d61e-ed0f-4461aced0f36"), new DateOnly(2022, 6, 10), "vzwinternet", "United States", 2048, 110, new DateOnly(2027, 6, 10), "89014103080800108", "+1 973 800 0108", "Verizon backup SIM.", "Verizon", "sim-va8-008-b", "Active", new Guid("00000000-0000-0000-0000-000000000008"), "Backup", "NJ-7848H", "va8-008" },
                    { new Guid("9ee7f6b0-db5b-69f7-290a-08830f713edc"), new DateOnly(2022, 12, 5), "internet", "United Kingdom", 10240, 4400, new DateOnly(2027, 12, 5), "89440404101000008", "+44 7700 100008", "Vodafone UK primary SIM — MAN TGX truck.", "Vodafone UK", "sim-vb10-008-p", "Active", new Guid("00000000-0000-0000-0000-000000000010"), "Primary", "LK72 DBF", "vb10-008" },
                    { new Guid("b075f07b-246d-eba0-ee81-4ba303dafd04"), new DateOnly(2021, 9, 20), "broadband.att.com", "United States", 10240, 5900, new DateOnly(2026, 9, 20), "89014103080800006", "+1 973 800 0006", "AT&T primary SIM — Kenworth T680.", "AT&T", "sim-va8-006-p", "Active", new Guid("00000000-0000-0000-0000-000000000008"), "Primary", "NJ-7846F", "va8-006" },
                    { new Guid("bac4e433-a574-ff3d-564c-4def76c97f4b"), new DateOnly(2021, 6, 25), "vzwinternet", "United States", 2048, 88, new DateOnly(2026, 6, 25), "89014103080800102", "+1 973 800 0102", "Verizon backup SIM.", "Verizon", "sim-va8-002-b", "Active", new Guid("00000000-0000-0000-0000-000000000008"), "Backup", "NJ-7842B", "va8-002" },
                    { new Guid("c2570a21-d5c2-c53d-d14f-df86e7865825"), new DateOnly(2022, 9, 20), "everywhere", "United Kingdom", 2048, 95, new DateOnly(2027, 9, 20), "89440404101000101", "+44 7700 100101", "EE backup SIM — truck failover.", "EE", "sim-vb10-001-b", "Active", new Guid("00000000-0000-0000-0000-000000000010"), "Backup", "LK72 ABF", "vb10-001" },
                    { new Guid("c54515e7-4ea5-76a7-509d-6985b11fcb21"), new DateOnly(2021, 8, 25), "fast.t-mobile.com", "United States", 10240, 4200, new DateOnly(2026, 8, 25), "89014103090900002", "+1 713 900 0002", "T-Mobile US primary SIM — Freightliner M2.", "T-Mobile US", "sim-vm9-002-p", "Active", new Guid("00000000-0000-0000-0000-000000000009"), "Primary", "TX-MLG-002", "vm9-002" },
                    { new Guid("d0e4ec96-c77e-c751-9ab6-34abac49b41b"), new DateOnly(2023, 6, 5), "internet", "United Kingdom", 5120, 1800, new DateOnly(2027, 6, 5), "89440404101000007", "+44 7700 100007", "Vodafone UK primary SIM — Vauxhall Vivaro van offline.", "Vodafone UK", "sim-vb10-007-p", "Active", new Guid("00000000-0000-0000-0000-000000000010"), "Primary", "LK73 CBF", "vb10-007" },
                    { new Guid("d3ebb6e1-b314-bb7a-4161-e35e1043a6be"), new DateOnly(2022, 9, 20), "internet", "United Kingdom", 10240, 5100, new DateOnly(2027, 9, 20), "89440404101000001", "+44 7700 100001", "Vodafone UK primary SIM — Actros 2645 truck.", "Vodafone UK", "sim-vb10-001-p", "Active", new Guid("00000000-0000-0000-0000-000000000010"), "Primary", "LK72 ABF", "vb10-001" },
                    { new Guid("e803cd87-cf05-94da-3021-2e96f18191cd"), new DateOnly(2020, 10, 10), "everywhere", "United Kingdom", 2048, 42, new DateOnly(2025, 10, 10), "89440404101000104", "+44 7700 100104", "EE backup SIM — truck.", "EE", "sim-vb10-004-b", "Active", new Guid("00000000-0000-0000-0000-000000000010"), "Backup", "LK70 ABF", "vb10-004" },
                    { new Guid("f8479c16-0381-5d94-ff17-6e2c73fde76e"), new DateOnly(2023, 3, 25), "internet", "United Kingdom", 5120, 3200, new DateOnly(2027, 3, 25), "89440404101000003", "+44 7700 100003", "Vodafone UK primary SIM — Transit Custom van.", "Vodafone UK", "sim-vb10-003-p", "Active", new Guid("00000000-0000-0000-0000-000000000010"), "Primary", "LK73 ABF", "vb10-003" },
                    { new Guid("fbca74e6-2aa4-297a-4d31-09c0281377d9"), new DateOnly(2020, 10, 5), "broadband.att.com", "United States", 10240, 4100, new DateOnly(2025, 10, 5), "89014103080800004", "+1 973 800 0004", "AT&T primary SIM — Peterbilt maintenance.", "AT&T", "sim-va8-004-p", "Active", new Guid("00000000-0000-0000-0000-000000000008"), "Primary", "NJ-7844D", "va8-004" },
                    { new Guid("ff207151-0885-8119-4734-ded35bca6aea"), new DateOnly(2022, 9, 15), "fast.t-mobile.com", "United States", 10240, 2000, new DateOnly(2027, 9, 15), "89014103090900005", "+1 713 900 0005", "T-Mobile US primary SIM — ProMaster 2500.", "T-Mobile US", "sim-vm9-005-p", "Active", new Guid("00000000-0000-0000-0000-000000000009"), "Primary", "TX-MLG-005", "vm9-005" }
                });

            migrationBuilder.InsertData(
                table: "Trips",
                columns: new[] { "Id", "AvgSpeed", "Date", "DateIso", "DistanceKm", "DurationMin", "From", "FuelUsedL", "MaxSpeed", "RouteJson", "ShortId", "Status", "TenantId", "To", "VehicleShortId" },
                values: new object[,]
                {
                    { new Guid("1c618637-095f-f994-7715-d2040dee25f8"), 91.0, "2026-06-04 04:00", "2026-06-04", 390.0, 255, "Houston, TX", 82.0, 96.0, "[{\"lat\":29.9511,\"lng\":-95.3677,\"time\":\"04:00\",\"speed\":0,\"event\":\"Departed North Houston\"},{\"lat\":30.2500,\"lng\":-95.4500,\"time\":\"04:30\",\"speed\":72,\"event\":\"I-45 North\"},{\"lat\":31.0000,\"lng\":-96.4500,\"time\":\"05:40\",\"speed\":85,\"event\":\"Corsicana\"},{\"lat\":31.5000,\"lng\":-96.9000,\"time\":\"06:25\",\"speed\":88,\"event\":\"Waxahachie\"},{\"lat\":32.0000,\"lng\":-96.9000,\"time\":\"07:00\",\"speed\":90,\"event\":\"Grand Prairie — ⚠ Near speed limit\"},{\"lat\":32.7767,\"lng\":-96.7970,\"time\":\"08:15\",\"speed\":0,\"event\":\"Arrived Dallas Distribution Center\"}]", "t-m9-003", "Completed", new Guid("00000000-0000-0000-0000-000000000009"), "Dallas, TX", "vm9-006" },
                    { new Guid("29c30473-9b31-3ebe-136b-c4be9be760d4"), 17.0, "2026-06-06 09:00", "2026-06-06", 8.0, 28, "London City", 2.1000000000000001, 40.0, "[{\"lat\":51.5033,\"lng\":-0.0875,\"time\":\"09:00\",\"speed\":0,\"event\":\"Departed London City depot\"},{\"lat\":51.5050,\"lng\":-0.0600,\"time\":\"09:08\",\"speed\":28,\"event\":\"A1203 East\"},{\"lat\":51.5080,\"lng\":-0.0300,\"time\":\"09:16\",\"speed\":35,\"event\":\"Limehouse\"},{\"lat\":51.5050,\"lng\":-0.0100,\"time\":\"09:22\",\"speed\":30,\"event\":\"Approach Canary Wharf\"},{\"lat\":51.5054,\"lng\":-0.0235,\"time\":\"09:28\",\"speed\":0,\"event\":\"Arrived Canary Wharf delivery\"}]", "t-b10-003", "Completed", new Guid("00000000-0000-0000-0000-000000000010"), "Canary Wharf", "vb10-003" },
                    { new Guid("449bcc97-6479-aa8b-56fd-11562b7d1cdc"), 74.0, "2026-06-06 05:00", "2026-06-06", 360.0, 290, "Jersey City, NJ", 68.0, 90.0, "[{\"lat\":40.6892,\"lng\":-74.0445,\"time\":\"05:00\",\"speed\":0,\"event\":\"Departed Jersey City Depot\"},{\"lat\":40.7500,\"lng\":-73.9800,\"time\":\"05:22\",\"speed\":65,\"event\":\"George Washington Bridge\"},{\"lat\":40.9000,\"lng\":-73.8500,\"time\":\"05:38\",\"speed\":72,\"event\":\"I-95 North\"},{\"lat\":41.3500,\"lng\":-72.9500,\"time\":\"06:40\",\"speed\":78,\"event\":\"New Haven, CT\"},{\"lat\":41.7800,\"lng\":-72.5200,\"time\":\"07:25\",\"speed\":82,\"event\":\"Hartford, CT — ⚠ Speed alert\"},{\"lat\":42.0000,\"lng\":-72.0000,\"time\":\"08:10\",\"speed\":75,\"event\":\"Springfield, MA\"},{\"lat\":42.3601,\"lng\":-71.0589,\"time\":\"09:50\",\"speed\":0,\"event\":\"Approaching Boston — ETA 10:10\"}]", "t-a8-003", "In Progress", new Guid("00000000-0000-0000-0000-000000000008"), "Boston, MA", "va8-008" },
                    { new Guid("545a3edd-5e8c-f806-1721-3271101508b3"), 52.0, "2026-06-06 09:00", "2026-06-06", 48.0, 55, "Houston, TX", 11.800000000000001, 75.0, "[{\"lat\":29.7355,\"lng\":-95.4140,\"time\":\"09:00\",\"speed\":0,\"event\":\"Departed SW Houston depot\"},{\"lat\":29.7200,\"lng\":-95.4800,\"time\":\"09:12\",\"speed\":45,\"event\":\"US-59 South\"},{\"lat\":29.6800,\"lng\":-95.5000,\"time\":\"09:22\",\"speed\":60,\"event\":\"Fort Bend area\"},{\"lat\":29.6200,\"lng\":-95.6200,\"time\":\"09:35\",\"speed\":72,\"event\":\"Sugar Land approach\"},{\"lat\":29.6197,\"lng\":-95.6349,\"time\":\"09:55\",\"speed\":0,\"event\":\"Arrived Sugar Land Warehouse\"}]", "t-m9-002", "Completed", new Guid("00000000-0000-0000-0000-000000000009"), "Sugar Land, TX", "vm9-003" },
                    { new Guid("6c5dee71-f262-97e2-8514-ca799426ca2c"), 25.0, "2026-06-05 10:00", "2026-06-05", 22.0, 52, "Midtown, NY", 6.0999999999999996, 60.0, "[{\"lat\":40.7614,\"lng\":-73.9776,\"time\":\"10:00\",\"speed\":0,\"event\":\"Departed Midtown pickup\"},{\"lat\":40.7480,\"lng\":-73.9870,\"time\":\"10:08\",\"speed\":28,\"event\":\"7th Avenue\"},{\"lat\":40.7300,\"lng\":-74.0050,\"time\":\"10:18\",\"speed\":35,\"event\":\"Hudson River crossing\"},{\"lat\":40.7200,\"lng\":-74.0300,\"time\":\"10:28\",\"speed\":42,\"event\":\"NJ Turnpike on-ramp\"},{\"lat\":40.7282,\"lng\":-74.0500,\"time\":\"10:38\",\"speed\":55,\"event\":\"NJ-95 South\"},{\"lat\":40.7282,\"lng\":-74.0776,\"time\":\"10:52\",\"speed\":0,\"event\":\"Arrived Newark Hub\"}]", "t-a8-004", "Completed", new Guid("00000000-0000-0000-0000-000000000008"), "Newark, NJ", "va8-003" },
                    { new Guid("76e5a3a0-107b-a891-d86a-e4df9d5e58d3"), 22.0, "2026-06-05 07:30", "2026-06-05", 18.0, 48, "Newark, NJ", 5.7999999999999998, 55.0, "[{\"lat\":40.7282,\"lng\":-74.0776,\"time\":\"07:30\",\"speed\":0,\"event\":\"Departed Newark Hub\"},{\"lat\":40.7200,\"lng\":-74.0500,\"time\":\"07:42\",\"speed\":38,\"event\":\"NJ Turnpike\"},{\"lat\":40.7350,\"lng\":-74.0200,\"time\":\"07:53\",\"speed\":45,\"event\":\"Holland Tunnel approach\"},{\"lat\":40.7270,\"lng\":-74.0080,\"time\":\"08:02\",\"speed\":28,\"event\":\"Holland Tunnel\"},{\"lat\":40.7282,\"lng\":-73.9942,\"time\":\"08:11\",\"speed\":22,\"event\":\"Manhattan — TriBeCa\"},{\"lat\":40.7480,\"lng\":-73.9870,\"time\":\"08:18\",\"speed\":0,\"event\":\"Arrived Midtown delivery point\"}]", "t-a8-002", "Completed", new Guid("00000000-0000-0000-0000-000000000008"), "Manhattan, NY", "va8-002" },
                    { new Guid("846eeecd-3eae-f612-ccea-3f5f0beb0195"), 52.0, "2026-06-06 06:30", "2026-06-06", 42.0, 48, "Houston, TX", 14.0, 80.0, "[{\"lat\":29.7604,\"lng\":-95.3698,\"time\":\"06:30\",\"speed\":0,\"event\":\"Departed Houston Hub\"},{\"lat\":29.7500,\"lng\":-95.2500,\"time\":\"06:42\",\"speed\":60,\"event\":\"I-10 East\"},{\"lat\":29.7400,\"lng\":-95.1500,\"time\":\"06:52\",\"speed\":72,\"event\":\"Channelview\"},{\"lat\":29.7400,\"lng\":-95.0500,\"time\":\"07:02\",\"speed\":80,\"event\":\"⚠ Speed alert\"},{\"lat\":29.7350,\"lng\":-94.9700,\"time\":\"07:10\",\"speed\":68,\"event\":\"La Porte junction\"},{\"lat\":29.7355,\"lng\":-94.9770,\"time\":\"07:18\",\"speed\":0,\"event\":\"Arrived Baytown Industrial Park\"}]", "t-m9-001", "Completed", new Guid("00000000-0000-0000-0000-000000000009"), "Baytown, TX", "vm9-001" },
                    { new Guid("957bfc27-ccbd-718a-d350-323797d7891a"), 84.0, "2026-06-05 07:30", "2026-06-05", 155.0, 110, "Birmingham", 22.5, 90.0, "[{\"lat\":52.4862,\"lng\":-1.8904,\"time\":\"07:30\",\"speed\":0,\"event\":\"Departed Birmingham Freight Terminal\"},{\"lat\":52.4000,\"lng\":-2.0500,\"time\":\"07:45\",\"speed\":62,\"event\":\"M5 South\"},{\"lat\":52.1000,\"lng\":-2.1500,\"time\":\"08:15\",\"speed\":82,\"event\":\"Worcester\"},{\"lat\":51.8500,\"lng\":-2.2500,\"time\":\"08:45\",\"speed\":88,\"event\":\"Cheltenham\"},{\"lat\":51.6500,\"lng\":-2.4000,\"time\":\"09:05\",\"speed\":85,\"event\":\"M5 approaching Bristol\"},{\"lat\":51.4545,\"lng\":-2.5879,\"time\":\"09:20\",\"speed\":0,\"event\":\"Arrived Bristol Logistics Park\"}]", "t-b10-004", "Completed", new Guid("00000000-0000-0000-0000-000000000010"), "Bristol", "vb10-005" },
                    { new Guid("a283ddc0-4b77-a3a3-8957-c38e7458c917"), 35.0, "2026-06-06 08:00", "2026-06-06", 34.0, 58, "Newark, NJ", 9.1999999999999993, 68.0, "[{\"lat\":40.7282,\"lng\":-74.0776,\"time\":\"08:00\",\"speed\":0,\"event\":\"Departed Newark Hub\"},{\"lat\":40.7145,\"lng\":-74.0134,\"time\":\"08:12\",\"speed\":42,\"event\":null},{\"lat\":40.6950,\"lng\":-73.9840,\"time\":\"08:22\",\"speed\":55,\"event\":\"Brooklyn Battery Tunnel\"},{\"lat\":40.6780,\"lng\":-73.9500,\"time\":\"08:35\",\"speed\":62,\"event\":null},{\"lat\":40.6501,\"lng\":-73.9496,\"time\":\"08:44\",\"speed\":58,\"event\":\"Brooklyn\"},{\"lat\":40.6400,\"lng\":-73.9300,\"time\":\"08:52\",\"speed\":48,\"event\":null},{\"lat\":40.6413,\"lng\":-73.7781,\"time\":\"09:01\",\"speed\":0,\"event\":\"Arrived JFK Terminal 4\"}]", "t-a8-001", "Completed", new Guid("00000000-0000-0000-0000-000000000008"), "JFK Airport, NY", "va8-001" },
                    { new Guid("b44ebb2c-ceca-31c4-5058-88ecfca76500"), 79.0, "2026-06-06 06:00", "2026-06-06", 190.0, 145, "London", 32.0, 90.0, "[{\"lat\":51.5074,\"lng\":-0.1278,\"time\":\"06:00\",\"speed\":0,\"event\":\"Departed London Depot\"},{\"lat\":51.5500,\"lng\":-0.2500,\"time\":\"06:18\",\"speed\":55,\"event\":\"A40 West\"},{\"lat\":51.5800,\"lng\":-0.4800,\"time\":\"06:35\",\"speed\":72,\"event\":\"M40 Junction 1\"},{\"lat\":51.7500,\"lng\":-1.2500,\"time\":\"07:20\",\"speed\":85,\"event\":\"Oxford services\"},{\"lat\":52.0000,\"lng\":-1.5000,\"time\":\"08:00\",\"speed\":88,\"event\":\"Banbury\"},{\"lat\":52.2800,\"lng\":-1.7500,\"time\":\"08:38\",\"speed\":82,\"event\":\"M40 approach Birmingham\"},{\"lat\":52.4862,\"lng\":-1.8904,\"time\":\"09:05\",\"speed\":0,\"event\":\"Arrived Birmingham Freight Terminal\"}]", "t-b10-001", "Completed", new Guid("00000000-0000-0000-0000-000000000010"), "Birmingham", "vb10-001" },
                    { new Guid("ff91ff97-6708-e137-6446-f3b99f00d241"), 57.0, "2026-06-06 07:00", "2026-06-06", 68.0, 72, "Manchester", 14.199999999999999, 80.0, "[{\"lat\":53.4808,\"lng\":-2.2426,\"time\":\"07:00\",\"speed\":0,\"event\":\"Departed Manchester Depot\"},{\"lat\":53.5000,\"lng\":-2.1000,\"time\":\"07:12\",\"speed\":52,\"event\":\"M62 East\"},{\"lat\":53.7000,\"lng\":-1.8000,\"time\":\"07:38\",\"speed\":72,\"event\":\"Rochdale\"},{\"lat\":53.7500,\"lng\":-1.6000,\"time\":\"07:52\",\"speed\":78,\"event\":\"Brighouse\"},{\"lat\":53.8008,\"lng\":-1.5491,\"time\":\"08:12\",\"speed\":0,\"event\":\"Arrived Leeds Distribution Park\"}]", "t-b10-002", "Completed", new Guid("00000000-0000-0000-0000-000000000010"), "Leeds", "vb10-006" }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "FirstName", "LastLoginAt", "LastName", "MfaEnabled", "PasswordHash", "Role", "Status", "TenantId" },
                values: new object[,]
                {
                    { new Guid("18bd637a-8af4-7c7c-052a-97e0eb4a79a8"), new DateTime(2023, 3, 5, 0, 0, 0, 0, DateTimeKind.Utc), "admin@atlanticfreight.com", "Jennifer", null, "Walsh", true, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "tenant_admin", "Active", new Guid("00000000-0000-0000-0000-000000000008") },
                    { new Guid("271c221d-dc15-24aa-4e1c-34ec81b53e6a"), new DateTime(2024, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), "manager@meridianlogistics.com", "Amy", null, "Rodriguez", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "fleet_manager", "Active", new Guid("00000000-0000-0000-0000-000000000009") },
                    { new Guid("2c8c702e-7186-a6f4-5047-c9ff37cb788f"), new DateTime(2023, 3, 5, 0, 0, 0, 0, DateTimeKind.Utc), "fleet@atlanticfreight.com", "Robert", null, "Mitchell", true, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "fleet_admin", "Active", new Guid("00000000-0000-0000-0000-000000000008") },
                    { new Guid("47ac6e8b-b421-f580-7919-4cb801296e24"), new DateTime(2023, 5, 1, 0, 0, 0, 0, DateTimeKind.Utc), "viewer@atlanticfreight.com", "Mark", null, "Davis", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "viewer", "Active", new Guid("00000000-0000-0000-0000-000000000008") },
                    { new Guid("4a0572dd-ce24-e4d4-822e-d08db6994b98"), new DateTime(2023, 9, 10, 0, 0, 0, 0, DateTimeKind.Utc), "manager@britfleet.co.uk", "George", null, "Brown", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "fleet_manager", "Active", new Guid("00000000-0000-0000-0000-000000000010") },
                    { new Guid("7fe788e7-d838-e74b-e95f-5dec3a34ed0b"), new DateTime(2023, 4, 1, 0, 0, 0, 0, DateTimeKind.Utc), "dispatch@atlanticfreight.com", "Kevin", null, "Torres", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "dispatcher", "Active", new Guid("00000000-0000-0000-0000-000000000008") },
                    { new Guid("a1d80f76-a059-49e4-46ab-09b0c3a18a1d"), new DateTime(2023, 3, 10, 0, 0, 0, 0, DateTimeKind.Utc), "manager@atlanticfreight.com", "Sarah", null, "O'Brien", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "fleet_manager", "Active", new Guid("00000000-0000-0000-0000-000000000008") },
                    { new Guid("b18e73ff-beda-206d-837b-21c7f67547ad"), new DateTime(2023, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), "dispatch@britfleet.co.uk", "Emma", null, "Johnson", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "dispatcher", "Active", new Guid("00000000-0000-0000-0000-000000000010") },
                    { new Guid("b407369d-8d8e-2828-4643-14ff9626a67d"), new DateTime(2024, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), "admin@meridianlogistics.com", "James", null, "Harrison", true, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "fleet_admin", "Active", new Guid("00000000-0000-0000-0000-000000000009") },
                    { new Guid("b714362e-17d5-0a99-1ce1-f6daee999e12"), new DateTime(2024, 2, 1, 0, 0, 0, 0, DateTimeKind.Utc), "dispatch@meridianlogistics.com", "Chris", null, "Evans", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "dispatcher", "Active", new Guid("00000000-0000-0000-0000-000000000009") },
                    { new Guid("bb8b03cf-3d8f-1161-730f-0f4ebc3ed551"), new DateTime(2023, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), "viewer@britfleet.co.uk", "Harry", null, "Wilson", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "viewer", "Active", new Guid("00000000-0000-0000-0000-000000000010") },
                    { new Guid("c04301bc-71ee-4a70-5b23-6064041b17cd"), new DateTime(2023, 4, 1, 0, 0, 0, 0, DateTimeKind.Utc), "billing@atlanticfreight.com", "Linda", null, "Chen", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "billing_admin", "Active", new Guid("00000000-0000-0000-0000-000000000008") },
                    { new Guid("c89962a7-fece-36aa-92b4-4a96362208bd"), new DateTime(2024, 2, 1, 0, 0, 0, 0, DateTimeKind.Utc), "billing@meridianlogistics.com", "Patricia", null, "Lee", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "billing_admin", "Active", new Guid("00000000-0000-0000-0000-000000000009") },
                    { new Guid("c8fa9ae7-85f4-cbb5-b0fd-cd4c05bc6226"), new DateTime(2023, 9, 5, 0, 0, 0, 0, DateTimeKind.Utc), "admin@britfleet.co.uk", "Oliver", null, "Thompson", true, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "tenant_admin", "Active", new Guid("00000000-0000-0000-0000-000000000010") },
                    { new Guid("fdafaaa8-9d47-f009-f817-44610fafbb39"), new DateTime(2023, 9, 5, 0, 0, 0, 0, DateTimeKind.Utc), "fleet@britfleet.co.uk", "Charlotte", null, "Williams", true, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "fleet_admin", "Active", new Guid("00000000-0000-0000-0000-000000000010") }
                });

            migrationBuilder.InsertData(
                table: "Vehicles",
                columns: new[] { "Id", "AssignedDriverId", "AssignedDriverName", "Axles", "BodyType", "Category", "Color", "CreatedAt", "CustomerId", "CustomerName", "Department", "EngineCapacity", "EngineNo", "FuelLevel", "FuelType", "GrossWeightKg", "LastSeenAt", "Latitude", "Longitude", "Make", "Model", "Odometer", "OwnerContact", "OwnerIdNo", "OwnerName", "OwnerType", "PayloadKg", "Plate", "PurchaseDate", "PurchasePrice", "RegistrationCountry", "RegistrationDate", "SeatingCapacity", "ShortId", "SpeedKmh", "Status", "Supplier", "TenantId", "Transmission", "Vin", "Year" },
                values: new object[,]
                {
                    { new Guid("08dddec7-1520-cf48-adbc-e20ef0629bb9"), null, null, 2, "Cargo Van", "Van", "Silver", new DateTime(2022, 7, 20, 0, 0, 0, 0, DateTimeKind.Utc), "c-a8-001", "Atlantic Manufacturing Corp", "NJ Operations", "3.6L", "RPMC-3500-NJ005", 66.0, "Diesel", 4500, new DateTime(2026, 6, 6, 0, 0, 0, 0, DateTimeKind.Utc), 40.844799999999999, -73.864800000000002, "Ram", "ProMaster 3500", 22100, "+1 973 555 0100", "NJ-CRP-2018-001234", "Atlantic Freight Inc", "Company", 1800, "NJ-7845E", new DateTime(2022, 6, 25, 0, 0, 0, 0, DateTimeKind.Utc), 44000m, "United States", new DateTime(2022, 7, 20, 0, 0, 0, 0, DateTimeKind.Utc), 2, "va8-005", 28.0, "active", "Ford Motor Company", new Guid("00000000-0000-0000-0000-000000000008"), "Automatic", "3C6TRVDG4ME45005", 2022 },
                    { new Guid("127b0474-4195-1a90-1595-22605f5f4079"), null, null, 3, "Curtainsider", "Truck", "Red", new DateTime(2020, 10, 5, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Long-Haul", "10.8L", "MX11-480-UK004", 18.0, "Diesel", 26000, new DateTime(2026, 6, 4, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "DAF", "XF 480", 96400, "+44 20 7946 0100", "GB-REG-2021-00001", "BritFleet Solutions Ltd", "Company", 18000, "LK70 ABF", new DateTime(2020, 9, 10, 0, 0, 0, 0, DateTimeKind.Utc), 85000m, "United Kingdom", new DateTime(2020, 10, 5, 0, 0, 0, 0, DateTimeKind.Utc), 2, "vb10-004", null, "maintenance", "Truck & Van UK", new Guid("00000000-0000-0000-0000-000000000010"), "Automatic", "XLR0988CS0E004004", 2020 },
                    { new Guid("1a6830fe-410d-9d21-c17c-4af861e5e4fb"), null, null, 3, "Dry Van", "Truck", "Black", new DateTime(2021, 6, 20, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Long-Haul", "14.8L", "DD15-CAS-NJ002", 45.0, "Diesel", 36000, new DateTime(2026, 6, 6, 0, 0, 0, 0, DateTimeKind.Utc), 40.650100000000002, -73.949600000000004, "Freightliner", "Cascadia", 64100, "+1 973 555 0100", "NJ-CRP-2018-001234", "Atlantic Freight Inc", "Company", 22000, "NJ-7842B", new DateTime(2021, 5, 25, 0, 0, 0, 0, DateTimeKind.Utc), 145000m, "United States", new DateTime(2021, 6, 20, 0, 0, 0, 0, DateTimeKind.Utc), 2, "va8-002", 0.0, "idle", "Rush Truck Centers", new Guid("00000000-0000-0000-0000-000000000008"), "Automatic", "1FUJGLDR0MLFA42002", 2021 },
                    { new Guid("21cfb48c-e4e4-a2f9-70d7-a411e48137bc"), new Guid("b2d98ff8-8e5b-fda2-6dc4-cfcaf1733856"), "Oliver Thompson", 3, "Curtainsider", "Truck", "White", new DateTime(2022, 9, 15, 0, 0, 0, 0, DateTimeKind.Utc), "c-b10-001", "BritFleet Group Holdings", "London Ops", "12.8L", "OM471-ACT-UK001", 71.0, "Diesel", 26000, new DateTime(2026, 6, 6, 0, 0, 0, 0, DateTimeKind.Utc), 51.507399999999997, -0.1278, "Mercedes-Benz", "Actros 2645", 34200, "+44 20 7946 0100", "GB-REG-2021-00001", "BritFleet Solutions Ltd", "Company", 18000, "LK72 ABF", new DateTime(2022, 8, 20, 0, 0, 0, 0, DateTimeKind.Utc), 92000m, "United Kingdom", new DateTime(2022, 9, 15, 0, 0, 0, 0, DateTimeKind.Utc), 2, "vb10-001", 45.0, "active", "Truck & Van UK", new Guid("00000000-0000-0000-0000-000000000010"), "Automatic", "WDB96340Z1L001001", 2022 },
                    { new Guid("273ee65c-f1e6-ba5c-4ec9-a02660c07f21"), new Guid("274486de-5b31-0ec4-2244-5374b923cba4"), "Harry Wilson", 3, "Dry Van", "Truck", "Gray", new DateTime(2022, 12, 1, 0, 0, 0, 0, DateTimeKind.Utc), "c-b10-001", "BritFleet Group Holdings", "South England", "12.4L", "MAN-D2676-UK008", 62.0, "Diesel", 26000, new DateTime(2026, 6, 6, 0, 0, 0, 0, DateTimeKind.Utc), 51.454500000000003, -2.5878999999999999, "MAN", "TGX 26.460", 39800, "+44 20 7946 0100", "GB-REG-2021-00001", "BritFleet Solutions Ltd", "Company", 18500, "LK72 DBF", new DateTime(2022, 11, 5, 0, 0, 0, 0, DateTimeKind.Utc), 94000m, "United Kingdom", new DateTime(2022, 12, 1, 0, 0, 0, 0, DateTimeKind.Utc), 2, "vb10-008", 58.0, "active", "Truck & Van UK", new Guid("00000000-0000-0000-0000-000000000010"), "Automatic", "WMA26TZZ4NM008008", 2022 },
                    { new Guid("2848b7fb-24c6-b40d-656e-cb959456481a"), null, null, 3, "Sleeper Cab", "Truck", "Blue", new DateTime(2020, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Long-Haul", "12.9L", "PACCAR-MX13-NJ004", 25.0, "Diesel", 36000, new DateTime(2026, 6, 5, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Peterbilt", "579", 92300, "+1 973 555 0100", "NJ-CRP-2018-001234", "Atlantic Freight Inc", "Company", 22500, "NJ-7844D", new DateTime(2020, 9, 10, 0, 0, 0, 0, DateTimeKind.Utc), 138000m, "United States", new DateTime(2020, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), 2, "va8-004", null, "maintenance", "Rush Truck Centers", new Guid("00000000-0000-0000-0000-000000000008"), "Automatic", "1XP5DB9X7LD579044", 2020 },
                    { new Guid("29610d41-f9ee-9553-2391-4ee802ac5292"), new Guid("a0d00311-1837-3c71-099d-08cd09725ca3"), "Amy Rodriguez", 2, "Panel Van", "Van", "White", new DateTime(2023, 3, 15, 0, 0, 0, 0, DateTimeKind.Utc), "c-m9-002", "Gulf Coast Distributors", "Houston Metro", "3.5L", "FT350-TX003", 88.0, "Diesel", 4200, new DateTime(2026, 6, 6, 0, 0, 0, 0, DateTimeKind.Utc), 29.735499999999998, -95.414000000000001, "Ford", "Transit 350", 15200, "+1 713 555 0200", "TX-CRP-2020-009001", "Meridian Logistics LLC", "Company", 1600, "TX-MLG-003", new DateTime(2023, 2, 20, 0, 0, 0, 0, DateTimeKind.Utc), 49000m, "United States", new DateTime(2023, 3, 15, 0, 0, 0, 0, DateTimeKind.Utc), 2, "vm9-003", 42.0, "active", "Lone Star Truck Group", new Guid("00000000-0000-0000-0000-000000000009"), "Automatic", "1FTBR2CM4MKA43903", 2023 },
                    { new Guid("320ce2f2-d5f0-9bd6-d5ec-5f5513c0faec"), null, null, 3, "Dry Van", "Truck", "Gray", new DateTime(2021, 5, 20, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Long-Haul", "12.8L", "MACK-MP8-TX006", 38.0, "Diesel", 36000, new DateTime(2026, 6, 5, 0, 0, 0, 0, DateTimeKind.Utc), 29.9511, -95.367699999999999, "Mack", "Anthem", 62100, "+1 713 555 0200", "TX-CRP-2020-009001", "Meridian Logistics LLC", "Company", 22000, "TX-MLG-006", new DateTime(2021, 4, 25, 0, 0, 0, 0, DateTimeKind.Utc), 136000m, "United States", new DateTime(2021, 5, 20, 0, 0, 0, 0, DateTimeKind.Utc), 2, "vm9-006", 0.0, "offline", "Lone Star Truck Group", new Guid("00000000-0000-0000-0000-000000000009"), "Automatic", "1M1AN24Y1NM906006", 2021 },
                    { new Guid("37b9683e-4ab6-0751-f667-00679b947e11"), new Guid("14dd5053-2a69-71be-1d60-8e07427b257c"), "Charlotte Williams", 3, "Flatbed", "Truck", "Yellow", new DateTime(2021, 5, 15, 0, 0, 0, 0, DateTimeKind.Utc), "c-b10-002", "Northern Freight Partners", "Leeds/Manchester", "12.7L", "DC13-500-UK006", 55.0, "Diesel", 27000, new DateTime(2026, 6, 6, 0, 0, 0, 0, DateTimeKind.Utc), 53.800800000000002, -1.5490999999999999, "Scania", "R500", 47900, "+44 20 7946 0100", "GB-REG-2021-00001", "BritFleet Solutions Ltd", "Company", 19000, "LK71 CBF", new DateTime(2021, 4, 20, 0, 0, 0, 0, DateTimeKind.Utc), 98000m, "United Kingdom", new DateTime(2021, 5, 15, 0, 0, 0, 0, DateTimeKind.Utc), 2, "vb10-006", 72.0, "active", "Truck & Van UK", new Guid("00000000-0000-0000-0000-000000000010"), "Automatic", "YS2P4X20005006006", 2021 },
                    { new Guid("5e7fb021-8858-b89e-85de-b8f540c2ac45"), new Guid("a0d00311-1837-3c71-099d-08cd09725ca3"), "Chris Evans", 2, "Cargo Van", "Van", "Silver", new DateTime(2022, 9, 10, 0, 0, 0, 0, DateTimeKind.Utc), "c-m9-001", "Lone Star Energy LLC", "South Houston", "3.6L", "RPMC-2500-TX005", 72.0, "Diesel", 3900, new DateTime(2026, 6, 6, 0, 0, 0, 0, DateTimeKind.Utc), 29.6557, -95.2791, "Ram", "ProMaster 2500", 19400, "+1 713 555 0200", "TX-CRP-2020-009001", "Meridian Logistics LLC", "Company", 1500, "TX-MLG-005", new DateTime(2022, 8, 15, 0, 0, 0, 0, DateTimeKind.Utc), 42000m, "United States", new DateTime(2022, 9, 10, 0, 0, 0, 0, DateTimeKind.Utc), 2, "vm9-005", 31.0, "active", "Lone Star Truck Group", new Guid("00000000-0000-0000-0000-000000000009"), "Automatic", "3C6TRVDG8ME45905", 2022 },
                    { new Guid("6e90d0b3-a6c6-554e-d94b-a189c7839b06"), null, null, 2, "Panel Van", "Van", "White", new DateTime(2023, 5, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Local Delivery", "2.0L", "MBZ-S2500-NJ007", 90.0, "Diesel", 3500, new DateTime(2026, 6, 5, 0, 0, 0, 0, DateTimeKind.Utc), 40.728200000000001, -74.077600000000004, "Mercedes-Benz", "Sprinter 2500", 8900, "+1 973 555 0100", "NJ-CRP-2018-001234", "Atlantic Freight Inc", "Company", 1200, "NJ-7847G", new DateTime(2023, 4, 15, 0, 0, 0, 0, DateTimeKind.Utc), 52000m, "United States", new DateTime(2023, 5, 10, 0, 0, 0, 0, DateTimeKind.Utc), 2, "va8-007", 0.0, "offline", "Ford Motor Company", new Guid("00000000-0000-0000-0000-000000000008"), "Automatic", "WD3PE8CC4FP947007", 2023 },
                    { new Guid("754b64c8-188f-3ea0-84e3-58c1788d459a"), new Guid("841ad119-455a-05de-bf3e-639698391a6e"), "George Brown", 2, "Panel Van", "Van", "White", new DateTime(2023, 3, 20, 0, 0, 0, 0, DateTimeKind.Utc), "c-b10-001", "BritFleet Group Holdings", "London Delivery", "2.0L", "FTC-TDCI-UK003", 83.0, "Diesel", 3100, new DateTime(2026, 6, 6, 0, 0, 0, 0, DateTimeKind.Utc), 51.503300000000003, -0.087499999999999994, "Ford", "Transit Custom", 18700, "+44 20 7946 0100", "GB-REG-2021-00001", "BritFleet Solutions Ltd", "Company", 1100, "LK73 ABF", new DateTime(2023, 2, 25, 0, 0, 0, 0, DateTimeKind.Utc), 36000m, "United Kingdom", new DateTime(2023, 3, 20, 0, 0, 0, 0, DateTimeKind.Utc), 2, "vb10-003", 38.0, "active", "Truck & Van UK", new Guid("00000000-0000-0000-0000-000000000010"), "Manual", "WF0XXXTTGXNB03003", 2023 },
                    { new Guid("84d38ab3-eaf2-fd27-9870-ff89416ddbea"), new Guid("c831dc5a-28d5-2769-1bc7-973ccc28dd24"), "Robert Mitchell", 2, "Box Body", "Truck", "White", new DateTime(2022, 4, 10, 0, 0, 0, 0, DateTimeKind.Utc), "c-a8-001", "Atlantic Manufacturing Corp", "NJ Operations", "6.7L", "FF650-PL-NJ001", 72.0, "Diesel", 11800, new DateTime(2026, 6, 6, 0, 0, 0, 0, DateTimeKind.Utc), 40.728200000000001, -74.077600000000004, "Ford", "F-650 Pro Loader", 38200, "+1 973 555 0100", "NJ-CRP-2018-001234", "Atlantic Freight Inc", "Company", 7200, "NJ-7841A", new DateTime(2022, 3, 15, 0, 0, 0, 0, DateTimeKind.Utc), 82000m, "United States", new DateTime(2022, 4, 10, 0, 0, 0, 0, DateTimeKind.Utc), 2, "va8-001", 62.0, "active", "Rush Truck Centers", new Guid("00000000-0000-0000-0000-000000000008"), "Automatic", "1FDUF5GT0NDA41001", 2022 },
                    { new Guid("84f99043-4e9f-039e-a63b-7a2286a446d8"), null, null, 2, "Box Body", "Truck", "Blue", new DateTime(2021, 8, 20, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Local Distribution", "6.7L", "DD8-M2106-TX002", 52.0, "Diesel", 12000, new DateTime(2026, 6, 6, 0, 0, 0, 0, DateTimeKind.Utc), 29.817399999999999, -95.394300000000001, "Freightliner", "M2 106", 37800, "+1 713 555 0200", "TX-CRP-2020-009001", "Meridian Logistics LLC", "Company", 7500, "TX-MLG-002", new DateTime(2021, 7, 25, 0, 0, 0, 0, DateTimeKind.Utc), 78000m, "United States", new DateTime(2021, 8, 20, 0, 0, 0, 0, DateTimeKind.Utc), 2, "vm9-002", 0.0, "idle", "Lone Star Truck Group", new Guid("00000000-0000-0000-0000-000000000009"), "Automatic", "1FUJGLDR5MLFA42902", 2021 },
                    { new Guid("bf34fbf6-65e1-1b23-22e6-cde11189356c"), new Guid("c831dc5a-28d5-2769-1bc7-973ccc28dd24"), "Robert Mitchell", 3, "Dry Van", "Truck", "Gray", new DateTime(2022, 6, 5, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Long-Haul", "12.4L", "INT-LT-A26-NJ008", 48.0, "Diesel", 36000, new DateTime(2026, 6, 6, 0, 0, 0, 0, DateTimeKind.Utc), 40.6892, -74.044499999999999, "International", "LT Series", 41500, "+1 973 555 0100", "NJ-CRP-2018-001234", "Atlantic Freight Inc", "Company", 22500, "NJ-7848H", new DateTime(2022, 5, 10, 0, 0, 0, 0, DateTimeKind.Utc), 142000m, "United States", new DateTime(2022, 6, 5, 0, 0, 0, 0, DateTimeKind.Utc), 2, "va8-008", 72.0, "active", "Rush Truck Centers", new Guid("00000000-0000-0000-0000-000000000008"), "Automatic", "3HSDJAPR1CN648008", 2022 },
                    { new Guid("c0a0e518-e21d-bf68-9462-015809cd5df8"), new Guid("b1ecdd04-1253-75f7-7f86-4085a9b2ec1c"), "James Harrison", 3, "Dry Van", "Truck", "White", new DateTime(2022, 3, 10, 0, 0, 0, 0, DateTimeKind.Utc), "c-m9-001", "Lone Star Energy LLC", "Houston Ops", "12.9L", "PACCAR-MX13-TX001", 76.0, "Diesel", 36000, new DateTime(2026, 6, 6, 0, 0, 0, 0, DateTimeKind.Utc), 29.760400000000001, -95.369799999999998, "Kenworth", "T880", 44200, "+1 713 555 0200", "TX-CRP-2020-009001", "Meridian Logistics LLC", "Company", 23000, "TX-MLG-001", new DateTime(2022, 2, 15, 0, 0, 0, 0, DateTimeKind.Utc), 148000m, "United States", new DateTime(2022, 3, 10, 0, 0, 0, 0, DateTimeKind.Utc), 2, "vm9-001", 68.0, "active", "Lone Star Truck Group", new Guid("00000000-0000-0000-0000-000000000009"), "Automatic", "1XKYD49X9NJ901001", 2022 },
                    { new Guid("cc0d3924-1193-0b38-3989-3da2ac29c21c"), null, null, 3, "Flatbed", "Truck", "Black", new DateTime(2020, 11, 5, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Long-Haul", "12.9L", "PACCAR-MX13-TX004", 20.0, "Diesel", 36000, new DateTime(2026, 6, 4, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Peterbilt", "389", 88900, "+1 713 555 0200", "TX-CRP-2020-009001", "Meridian Logistics LLC", "Company", 22500, "TX-MLG-004", new DateTime(2020, 10, 10, 0, 0, 0, 0, DateTimeKind.Utc), 135000m, "United States", new DateTime(2020, 11, 5, 0, 0, 0, 0, DateTimeKind.Utc), 2, "vm9-004", null, "maintenance", "Lone Star Truck Group", new Guid("00000000-0000-0000-0000-000000000009"), "Manual", "1XP5DB9X2MD389044", 2020 },
                    { new Guid("d356c391-1147-cff7-3bcc-51a7f92dd4d0"), new Guid("1cd1da31-4f9b-8889-ffb6-39e0e896cdef"), "Kevin Torres", 2, "Panel Van", "Van", "White", new DateTime(2023, 2, 15, 0, 0, 0, 0, DateTimeKind.Utc), "c-a8-002", "Metro Retail Group", "Metro Delivery", "3.5L", "FT250-EV-NJ003", 81.0, "Diesel", 3900, new DateTime(2026, 6, 6, 0, 0, 0, 0, DateTimeKind.Utc), 40.761400000000002, -73.977599999999995, "Ford", "Transit 250", 12800, "+1 973 555 0100", "NJ-CRP-2018-001234", "Atlantic Freight Inc", "Company", 1400, "NJ-7843C", new DateTime(2023, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), 48000m, "United States", new DateTime(2023, 2, 15, 0, 0, 0, 0, DateTimeKind.Utc), 2, "va8-003", 35.0, "active", "Ford Motor Company", new Guid("00000000-0000-0000-0000-000000000008"), "Automatic", "1FTBR1C84MKA43003", 2023 },
                    { new Guid("ddcac0cd-92a7-2d50-65c4-d322524f8df6"), null, null, 2, "Panel Van", "Van", "White", new DateTime(2023, 6, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Scotland Ops", "2.0L", "VAUX-VIV-UK007", 92.0, "Diesel", 3000, new DateTime(2026, 6, 5, 0, 0, 0, 0, DateTimeKind.Utc), 55.864199999999997, -4.2518000000000002, "Vauxhall", "Vivaro", 9200, "+44 20 7946 0100", "GB-REG-2021-00001", "BritFleet Solutions Ltd", "Company", 1000, "LK73 CBF", new DateTime(2023, 5, 5, 0, 0, 0, 0, DateTimeKind.Utc), 32000m, "United Kingdom", new DateTime(2023, 6, 1, 0, 0, 0, 0, DateTimeKind.Utc), 2, "vb10-007", 0.0, "offline", "Truck & Van UK", new Guid("00000000-0000-0000-0000-000000000010"), "Manual", "W0V9MHH1XM4007007", 2023 },
                    { new Guid("e5c7f43a-179c-bfc0-d9af-0f477f0c47c5"), null, null, 3, "Dry Van", "Truck", "Red", new DateTime(2021, 9, 15, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Long-Haul", "10.9L", "PACCAR-MX11-NJ006", 58.0, "Diesel", 36000, new DateTime(2026, 6, 6, 0, 0, 0, 0, DateTimeKind.Utc), 40.579500000000003, -74.150199999999998, "Kenworth", "T680", 51700, "+1 973 555 0100", "NJ-CRP-2018-001234", "Atlantic Freight Inc", "Company", 22000, "NJ-7846F", new DateTime(2021, 8, 20, 0, 0, 0, 0, DateTimeKind.Utc), 140000m, "United States", new DateTime(2021, 9, 15, 0, 0, 0, 0, DateTimeKind.Utc), 2, "va8-006", 55.0, "active", "Rush Truck Centers", new Guid("00000000-0000-0000-0000-000000000008"), "Automatic", "1XKAD49X6LJ680046", 2021 },
                    { new Guid("e85fb256-46ab-fe1b-d93a-3e3d1b1117a1"), new Guid("a5915df9-6153-83d7-cc16-09fba8a7338c"), "Emma Johnson", 2, "High-roof Van", "Van", "Silver", new DateTime(2022, 7, 10, 0, 0, 0, 0, DateTimeKind.Utc), "c-b10-003", "Midlands Distribution Ltd", "Birmingham Ops", "2.3L", "RNL-M3H2-UK005", 67.0, "Diesel", 3500, new DateTime(2026, 6, 6, 0, 0, 0, 0, DateTimeKind.Utc), 52.486199999999997, -1.8904000000000001, "Renault", "Master L3H2", 28100, "+44 20 7946 0100", "GB-REG-2021-00001", "BritFleet Solutions Ltd", "Company", 1300, "LK72 CBF", new DateTime(2022, 6, 15, 0, 0, 0, 0, DateTimeKind.Utc), 38000m, "United Kingdom", new DateTime(2022, 7, 10, 0, 0, 0, 0, DateTimeKind.Utc), 3, "vb10-005", 52.0, "active", "Truck & Van UK", new Guid("00000000-0000-0000-0000-000000000010"), "Manual", "VF1JMAAA5HG005005", 2022 },
                    { new Guid("f872e3a3-7515-eb79-511d-3c1a157aad44"), null, null, 3, "Box Body", "Truck", "Blue", new DateTime(2021, 11, 10, 0, 0, 0, 0, DateTimeKind.Utc), "c-b10-002", "Northern Freight Partners", "Manchester Ops", "16.1L", "D16G-750-UK002", 44.0, "Diesel", 28000, new DateTime(2026, 6, 6, 0, 0, 0, 0, DateTimeKind.Utc), 53.480800000000002, -2.2425999999999999, "Volvo", "FH16 750", 58600, "+44 20 7946 0100", "GB-REG-2021-00001", "BritFleet Solutions Ltd", "Company", 20000, "LK71 ABF", new DateTime(2021, 10, 15, 0, 0, 0, 0, DateTimeKind.Utc), 115000m, "United Kingdom", new DateTime(2021, 11, 10, 0, 0, 0, 0, DateTimeKind.Utc), 2, "vb10-002", 0.0, "idle", "Truck & Van UK", new Guid("00000000-0000-0000-0000-000000000010"), "Automatic", "YV2A4C3A8NA500002", 2021 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("2ceadc8f-fa28-afad-63f1-c601a2985bc0"));

            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("2d3d3c7a-7377-1747-f0ce-c2c2bfca7bdb"));

            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("3aee5c3a-d1cb-0105-0559-2548f708ff8c"));

            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("511fb655-0e9f-9c73-8014-25e839d01f8f"));

            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("664f79b6-4eb1-112a-d15b-ce6ff884a7b8"));

            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("b405b0d5-cb7c-c667-a84e-8631c36fd247"));

            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("ec170946-d398-a5cb-fd63-af8f72ba2f55"));

            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("f398af89-ee69-48fa-21d5-266b84c35d7d"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("089342d0-c0d8-a8d9-79d6-7e8300681493"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("1482202a-ce50-3d81-7f4e-53515f1a4bf5"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("14dd2e07-d896-c51a-d924-5f67aec58dd7"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("17b0488c-0cc2-9d11-dfec-c39c9a804a16"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("237ba82f-2a66-0162-3f0d-a210c62b2afd"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("2dc06eb0-11b4-9c8b-468f-2de43b8cc1ba"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("4402296c-62d9-3588-4043-ab768ee7564a"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("51843c3c-1aa9-f935-8f90-b2fcbba959c2"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("5797de68-3ee2-277b-9833-1ce097ade83f"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("595fae4f-ea8d-1f93-f974-b163c18bf8dc"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("5b41049b-f180-82bd-ec1b-f8e69d37381c"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("5fad02f0-309e-6288-4156-53119bb1eb76"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("61d51702-1196-4814-ee36-69d13cfeda51"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("64dbb363-72ae-0c42-08c0-1e21fec9c2d7"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("685a2bbb-9625-65c8-dfed-ffe103d1a1c2"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("6e8f72aa-f3f4-c78b-dc14-b9f58c4d945b"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("8b6a5d72-ad78-9ea0-4b85-f5e76ca92398"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("8d6417ba-7377-de78-17a3-9365cb422b33"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("91af181c-c6c8-81b8-8c1e-6746a07b24c0"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("92846ece-a737-e651-8f72-a218a0cb4143"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("967964cf-07b6-02b8-bda6-e2f2ae2f6b50"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("97476591-cfe7-486d-0983-161373aafae1"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("9d6a8838-3d62-d3bd-ce65-b60c26d25ed2"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("a755be35-5268-417b-94e3-19ba6f463516"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("c0c94d75-0ab3-0bcd-750f-ea55e1506c9d"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("c2f3f5f3-0b24-c56b-ffed-4c659254741b"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("c5784b1d-d787-9dcf-ce40-0870b0cce521"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("cb5e437a-368f-06eb-1a90-e3e19777ba7d"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("d160ecb5-2de2-960c-45f1-0ec88dd6c9cd"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("d44d6950-9b91-0bed-de3a-40bce79bfe22"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("d7472fc5-366a-58d9-84bc-6d8cef863870"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("d7c010d5-e6cb-71ae-ff16-a3a7b4cf2d92"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("d97d14f6-dfdc-f792-af5c-9f051e6beee2"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("df2c7ab2-73c1-cfad-269c-3b6e736b1cbc"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("e0030113-25a5-d161-692a-fe7414731b75"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("e0ae12c6-6a19-1cd4-7de3-8382912449bd"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("e773d9d0-1f58-9ba9-8a07-753e9bdee923"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("f538cfb0-3bb6-c33a-9dde-5e25e6f2dbd6"));

            migrationBuilder.DeleteData(
                table: "Devices",
                keyColumn: "Id",
                keyValue: new Guid("fdb26b92-85a3-7114-616f-0a7a62cbe727"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("022a1919-493d-2600-dfe4-b27f062da990"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("0db6d595-f625-9b0d-e95e-7a22c1fb2b12"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("1627f25d-4695-716a-7244-93fe4fb7bf44"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("1b801687-9b43-f18e-5216-f62a6f92638f"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("1d37465a-b362-6940-428e-0de144fbcc1a"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("208e0923-0f68-9d6e-e277-e23c65ea8293"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("31591125-37e4-9f17-d629-abbb3ac01594"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("35f50096-bec4-c0a7-0c00-d8f9b48e0646"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("395100e5-ae0c-9790-3c93-bca997e4a1c0"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("5315c660-e282-b6ce-131f-b06b4f9c4c47"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("54a58529-e2a2-44ab-5102-94792863441b"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("65990a89-7d45-91dd-43e7-f1111b351ba3"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("6806a1dc-93ae-48af-2d00-fe2e074eaaf9"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("6ad21037-2800-0de6-ee91-b514cd54bebc"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("6f592ce4-97f4-a5b4-816e-2a87a65df44d"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("81e0ee96-50b9-c4b2-9a97-395a57c4bf38"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("85b82c4f-0e38-0107-4287-2473feb8a3ca"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("88056bc2-f8f9-618c-b354-08bbf74c9855"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("939542ba-80d4-427d-832f-8da86246f6f5"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("9b6c2400-d2b8-8165-62e9-d5eafaae73ca"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("9da798e0-3ca1-d61e-ed0f-4461aced0f36"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("9ee7f6b0-db5b-69f7-290a-08830f713edc"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("b075f07b-246d-eba0-ee81-4ba303dafd04"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("bac4e433-a574-ff3d-564c-4def76c97f4b"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("c2570a21-d5c2-c53d-d14f-df86e7865825"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("c54515e7-4ea5-76a7-509d-6985b11fcb21"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("d0e4ec96-c77e-c751-9ab6-34abac49b41b"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("d3ebb6e1-b314-bb7a-4161-e35e1043a6be"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("e803cd87-cf05-94da-3021-2e96f18191cd"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("f8479c16-0381-5d94-ff17-6e2c73fde76e"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("fbca74e6-2aa4-297a-4d31-09c0281377d9"));

            migrationBuilder.DeleteData(
                table: "SimCards",
                keyColumn: "Id",
                keyValue: new Guid("ff207151-0885-8119-4734-ded35bca6aea"));

            migrationBuilder.DeleteData(
                table: "Trips",
                keyColumn: "Id",
                keyValue: new Guid("1c618637-095f-f994-7715-d2040dee25f8"));

            migrationBuilder.DeleteData(
                table: "Trips",
                keyColumn: "Id",
                keyValue: new Guid("29c30473-9b31-3ebe-136b-c4be9be760d4"));

            migrationBuilder.DeleteData(
                table: "Trips",
                keyColumn: "Id",
                keyValue: new Guid("449bcc97-6479-aa8b-56fd-11562b7d1cdc"));

            migrationBuilder.DeleteData(
                table: "Trips",
                keyColumn: "Id",
                keyValue: new Guid("545a3edd-5e8c-f806-1721-3271101508b3"));

            migrationBuilder.DeleteData(
                table: "Trips",
                keyColumn: "Id",
                keyValue: new Guid("6c5dee71-f262-97e2-8514-ca799426ca2c"));

            migrationBuilder.DeleteData(
                table: "Trips",
                keyColumn: "Id",
                keyValue: new Guid("76e5a3a0-107b-a891-d86a-e4df9d5e58d3"));

            migrationBuilder.DeleteData(
                table: "Trips",
                keyColumn: "Id",
                keyValue: new Guid("846eeecd-3eae-f612-ccea-3f5f0beb0195"));

            migrationBuilder.DeleteData(
                table: "Trips",
                keyColumn: "Id",
                keyValue: new Guid("957bfc27-ccbd-718a-d350-323797d7891a"));

            migrationBuilder.DeleteData(
                table: "Trips",
                keyColumn: "Id",
                keyValue: new Guid("a283ddc0-4b77-a3a3-8957-c38e7458c917"));

            migrationBuilder.DeleteData(
                table: "Trips",
                keyColumn: "Id",
                keyValue: new Guid("b44ebb2c-ceca-31c4-5058-88ecfca76500"));

            migrationBuilder.DeleteData(
                table: "Trips",
                keyColumn: "Id",
                keyValue: new Guid("ff91ff97-6708-e137-6446-f3b99f00d241"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("18bd637a-8af4-7c7c-052a-97e0eb4a79a8"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("271c221d-dc15-24aa-4e1c-34ec81b53e6a"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("2c8c702e-7186-a6f4-5047-c9ff37cb788f"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("47ac6e8b-b421-f580-7919-4cb801296e24"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("4a0572dd-ce24-e4d4-822e-d08db6994b98"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("7fe788e7-d838-e74b-e95f-5dec3a34ed0b"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a1d80f76-a059-49e4-46ab-09b0c3a18a1d"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("b18e73ff-beda-206d-837b-21c7f67547ad"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("b407369d-8d8e-2828-4643-14ff9626a67d"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("b714362e-17d5-0a99-1ce1-f6daee999e12"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("bb8b03cf-3d8f-1161-730f-0f4ebc3ed551"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("c04301bc-71ee-4a70-5b23-6064041b17cd"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("c89962a7-fece-36aa-92b4-4a96362208bd"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("c8fa9ae7-85f4-cbb5-b0fd-cd4c05bc6226"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("fdafaaa8-9d47-f009-f817-44610fafbb39"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("08dddec7-1520-cf48-adbc-e20ef0629bb9"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("127b0474-4195-1a90-1595-22605f5f4079"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("1a6830fe-410d-9d21-c17c-4af861e5e4fb"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("21cfb48c-e4e4-a2f9-70d7-a411e48137bc"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("273ee65c-f1e6-ba5c-4ec9-a02660c07f21"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("2848b7fb-24c6-b40d-656e-cb959456481a"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("29610d41-f9ee-9553-2391-4ee802ac5292"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("320ce2f2-d5f0-9bd6-d5ec-5f5513c0faec"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("37b9683e-4ab6-0751-f667-00679b947e11"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("5e7fb021-8858-b89e-85de-b8f540c2ac45"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("6e90d0b3-a6c6-554e-d94b-a189c7839b06"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("754b64c8-188f-3ea0-84e3-58c1788d459a"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("84d38ab3-eaf2-fd27-9870-ff89416ddbea"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("84f99043-4e9f-039e-a63b-7a2286a446d8"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("bf34fbf6-65e1-1b23-22e6-cde11189356c"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("c0a0e518-e21d-bf68-9462-015809cd5df8"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("cc0d3924-1193-0b38-3989-3da2ac29c21c"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("d356c391-1147-cff7-3bcc-51a7f92dd4d0"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("ddcac0cd-92a7-2d50-65c4-d322524f8df6"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("e5c7f43a-179c-bfc0-d9af-0f477f0c47c5"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("e85fb256-46ab-fe1b-d93a-3e3d1b1117a1"));

            migrationBuilder.DeleteData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("f872e3a3-7515-eb79-511d-3c1a157aad44"));

            migrationBuilder.DeleteData(
                table: "Tenants",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000008"));

            migrationBuilder.DeleteData(
                table: "Tenants",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000009"));

            migrationBuilder.DeleteData(
                table: "Tenants",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000010"));
        }
    }
}
