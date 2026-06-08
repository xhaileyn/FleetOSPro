using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FleetOS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStarTechCustomers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Tenants",
                columns: new[] { "Id", "CreatedAt", "LogoInitials", "Mrr", "Name", "Plan", "PrimaryColor", "Region", "Slug", "Status" },
                values: new object[] { new Guid("00000000-0000-0000-0000-000000000007"), new DateTime(2025, 6, 1, 0, 0, 0, 0, DateTimeKind.Utc), "ST", 3200m, "Star Technologies", "Enterprise", "#0d6e5e", "Pakistan", "star", "active" });

            migrationBuilder.InsertData(
                table: "Customers",
                columns: new[] { "Id", "AccountManager", "ActiveContracts", "Address", "City", "ComplianceNotes", "ComplianceStatus", "Country", "CreatedAt", "CreditLimit", "Email", "Industry", "Name", "Notes", "ParentId", "Phone", "ShortId", "Status", "TaxId", "TenantId", "Type", "VehiclesAssigned", "Website" },
                values: new object[,]
                {
                    { new Guid("1c7f17e9-380b-9318-ff4a-c3699061d54a"), "Zain ul Abidin", 2, "CPEC Industrial Zone, Gwadar Free Zone, Gwadar", "Gwadar", "", "Pending Review", "Pakistan", new DateTime(2025, 10, 20, 0, 0, 0, 0, DateTimeKind.Utc), 6000000m, "ops@cpeclogistics.pk", "Infrastructure & CPEC", "CPEC Logistics Gwadar", "CPEC corridor operations — Gwadar to Lahore trunk route.", null, "+92 86 4200 0051", "c-t7-005", "Active", "NTN-5678901-5", new Guid("00000000-0000-0000-0000-000000000007"), "Company", 4, "cpeclogistics.pk" },
                    { new Guid("257c21a4-7c2d-0853-e109-4f6fe64dbcd2"), "Zain ul Abidin", 1, "Cotton Exchange, Kutchery Road, Multan", "Multan", "", "Compliant", "Pakistan", new DateTime(2025, 9, 5, 0, 0, 0, 0, DateTimeKind.Utc), 3500000m, "logistics@cottondboard.pk", "Agriculture & Textile", "Multan Cotton Board", "Seasonal cotton bale transport — peak Oct-Dec.", null, "+92 61 4510 0041", "c-t7-004", "Active", "NTN-4567890-4", new Guid("00000000-0000-0000-0000-000000000007"), "Company", 5, "cottonboard.pk" },
                    { new Guid("5d6af339-9567-9906-1034-3f35c0bfa246"), "Zain ul Abidin", 3, "Port Trust Offices, West Wharf Road, Karachi", "Karachi", "", "Compliant", "Pakistan", new DateTime(2025, 7, 1, 0, 0, 0, 0, DateTimeKind.Utc), 8000000m, "logistics@kpt.gov.pk", "Port & Shipping", "Karachi Port Authority", "Port cargo movement — critical account, SLA 4 hrs.", null, "+92 21 9921 4001", "c-t7-002", "Active", "NTN-2345678-2", new Guid("00000000-0000-0000-0000-000000000007"), "Company", 12, "kpt.gov.pk" },
                    { new Guid("6ccdc5cc-8600-d8b2-2dfa-77ac2bde070e"), "Zain ul Abidin", 2, "25-B Industrial Estate, Kot Lakhpat, Lahore", "Lahore", "", "Compliant", "Pakistan", new DateTime(2025, 6, 15, 0, 0, 0, 0, DateTimeKind.Utc), 5000000m, "fleet@punjabtransport.pk", "Transport & Logistics", "Punjab Transport Group", "Largest fleet client in Lahore — long-haul Punjab corridor.", null, "+92 42 3576 0001", "c-t7-001", "Active", "NTN-1234567-1", new Guid("00000000-0000-0000-0000-000000000007"), "Company", 8, "punjabtransport.pk" },
                    { new Guid("fed4c916-44a1-67b2-429c-3c38b51f82ae"), "Zain ul Abidin", 1, "Block D, Pakistan Secretariat, Constitution Ave", "Islamabad", "", "Compliant", "Pakistan", new DateTime(2025, 8, 10, 0, 0, 0, 0, DateTimeKind.Utc), 10000000m, "fleet@cabinet.gov.pk", "Government Logistics", "Federal Government Supplies", "Government supply chain — Islamabad & twin cities.", null, "+92 51 9201 5001", "c-t7-003", "Active", "NTN-3456789-3", new Guid("00000000-0000-0000-0000-000000000007"), "Government", 6, "cabinet.gov.pk" }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "FirstName", "LastLoginAt", "LastName", "MfaEnabled", "PasswordHash", "Role", "Status", "TenantId" },
                values: new object[,]
                {
                    { new Guid("5c72cca6-c127-3ec5-efcd-fed31aad1922"), new DateTime(2025, 7, 1, 0, 0, 0, 0, DateTimeKind.Utc), "dispatch@starttech.io", "Usman", null, "Qureshi", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "dispatcher", "Active", new Guid("00000000-0000-0000-0000-000000000007") },
                    { new Guid("7c0df038-e755-73fa-5f23-2f2ce4755566"), new DateTime(2025, 6, 5, 0, 0, 0, 0, DateTimeKind.Utc), "fleet@starttech.io", "Ahmed", null, "Khan", true, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "fleet_admin", "Active", new Guid("00000000-0000-0000-0000-000000000007") },
                    { new Guid("bb605705-4417-0fbf-48c3-69b5a9b8c2f5"), new DateTime(2025, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), "viewer@starttech.io", "Ayesha", null, "Butt", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "viewer", "Active", new Guid("00000000-0000-0000-0000-000000000007") },
                    { new Guid("c2a1c45e-8cc3-c6c8-4168-2c6b38f2e1cc"), new DateTime(2025, 6, 10, 0, 0, 0, 0, DateTimeKind.Utc), "manager@starttech.io", "Fatima", null, "Malik", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "fleet_manager", "Active", new Guid("00000000-0000-0000-0000-000000000007") },
                    { new Guid("d4dec04e-1f4a-6a9e-5f7d-58dd9bd60eba"), new DateTime(2025, 6, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin@starttech.io", "Sara", null, "Kimani", true, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "tenant_admin", "Active", new Guid("00000000-0000-0000-0000-000000000007") },
                    { new Guid("dc5f484c-1411-2d09-c5c4-7c8a84b24dd5"), new DateTime(2025, 8, 1, 0, 0, 0, 0, DateTimeKind.Utc), "billing@starttech.io", "Bilal", null, "Raza", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "billing_admin", "Active", new Guid("00000000-0000-0000-0000-000000000007") }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("1c7f17e9-380b-9318-ff4a-c3699061d54a"));

            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("257c21a4-7c2d-0853-e109-4f6fe64dbcd2"));

            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("5d6af339-9567-9906-1034-3f35c0bfa246"));

            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("6ccdc5cc-8600-d8b2-2dfa-77ac2bde070e"));

            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("fed4c916-44a1-67b2-429c-3c38b51f82ae"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("5c72cca6-c127-3ec5-efcd-fed31aad1922"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("7c0df038-e755-73fa-5f23-2f2ce4755566"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("bb605705-4417-0fbf-48c3-69b5a9b8c2f5"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("c2a1c45e-8cc3-c6c8-4168-2c6b38f2e1cc"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("d4dec04e-1f4a-6a9e-5f7d-58dd9bd60eba"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("dc5f484c-1411-2d09-c5c4-7c8a84b24dd5"));

            migrationBuilder.DeleteData(
                table: "Tenants",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000007"));
        }
    }
}
