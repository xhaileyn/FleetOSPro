using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FleetOS.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RolePermissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RoleId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ModuleId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RolePermissions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Tenants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Slug = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Plan = table.Column<string>(type: "text", nullable: false),
                    Region = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    PrimaryColor = table.Column<string>(type: "text", nullable: false),
                    LogoInitials = table.Column<string>(type: "text", nullable: false),
                    Mrr = table.Column<decimal>(type: "numeric", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tenants", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Branches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Region = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    VehicleCount = table.Column<int>(type: "integer", nullable: false),
                    DriverCount = table.Column<int>(type: "integer", nullable: false),
                    UserCount = table.Column<int>(type: "integer", nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false),
                    ManagerId = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Branches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Branches_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Customers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParentId = table.Column<Guid>(type: "uuid", nullable: true),
                    Name = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Industry = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Address = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: false),
                    Phone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Website = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TaxId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreditLimit = table.Column<decimal>(type: "numeric", nullable: false),
                    ComplianceStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ComplianceNotes = table.Column<string>(type: "text", nullable: false),
                    VehiclesAssigned = table.Column<int>(type: "integer", nullable: false),
                    ActiveContracts = table.Column<int>(type: "integer", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: false),
                    AccountManager = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Customers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Customers_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Drivers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    LicenseNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    LicenseClass = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    SafetyScore = table.Column<int>(type: "integer", nullable: false),
                    HosDriven = table.Column<double>(type: "double precision", nullable: false),
                    HosRemaining = table.Column<double>(type: "double precision", nullable: false),
                    AssignedVehiclePlate = table.Column<string>(type: "text", nullable: true),
                    AssignedVehicleId = table.Column<Guid>(type: "uuid", nullable: true),
                    PhoneNumber = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Drivers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Drivers_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    MfaEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Vehicles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Plate = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Vin = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Make = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Model = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    BodyType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Color = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    EngineNo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    EngineCapacity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    FuelType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Transmission = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Axles = table.Column<int>(type: "integer", nullable: false),
                    GrossWeightKg = table.Column<int>(type: "integer", nullable: false),
                    PayloadKg = table.Column<int>(type: "integer", nullable: false),
                    SeatingCapacity = table.Column<int>(type: "integer", nullable: false),
                    RegistrationCountry = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RegistrationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PurchaseDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PurchasePrice = table.Column<decimal>(type: "numeric", nullable: false),
                    Supplier = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    OwnerType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    OwnerName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    OwnerIdNo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    OwnerContact = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Odometer = table.Column<int>(type: "integer", nullable: false),
                    FuelLevel = table.Column<double>(type: "double precision", nullable: false),
                    CustomerId = table.Column<string>(type: "text", nullable: true),
                    CustomerName = table.Column<string>(type: "text", nullable: true),
                    Department = table.Column<string>(type: "text", nullable: true),
                    AssignedDriverName = table.Column<string>(type: "text", nullable: true),
                    AssignedDriverId = table.Column<Guid>(type: "uuid", nullable: true),
                    Latitude = table.Column<double>(type: "double precision", nullable: true),
                    Longitude = table.Column<double>(type: "double precision", nullable: true),
                    SpeedKmh = table.Column<double>(type: "double precision", nullable: true),
                    LastSeenAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vehicles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Vehicles_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Alerts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    VehicleId = table.Column<Guid>(type: "uuid", nullable: true),
                    Severity = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Acknowledged = table.Column<bool>(type: "boolean", nullable: false),
                    OccurredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Alerts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Alerts_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Alerts_Vehicles_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "Vehicles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.InsertData(
                table: "RolePermissions",
                columns: new[] { "Id", "ModuleId", "RoleId" },
                values: new object[,]
                {
                    { new Guid("00ea76d1-d672-463a-5611-0e9778045427"), "geofences", "super_admin" },
                    { new Guid("041b1e44-4c97-490d-c0a7-f26377824a25"), "branding", "partner" },
                    { new Guid("043a2ac2-b443-fe69-a606-ba1a3c6089bd"), "vehicles", "super_admin" },
                    { new Guid("04e5c54a-44fa-7477-cae4-500c693aa650"), "real-time", "tenant_admin" },
                    { new Guid("054cc578-9641-d5c5-e7a8-f409d88fbab3"), "auth-devices", "super_admin" },
                    { new Guid("05e5279b-bb87-d4fb-bf8a-1357763b048a"), "cost-savings", "super_admin" },
                    { new Guid("0996bcc1-4c10-978a-76ed-c08d82054373"), "cost-savings", "fleet_manager" },
                    { new Guid("0ac31817-bb5d-a499-30f1-57993d8eca04"), "geofences", "viewer" },
                    { new Guid("0b5f1062-ea1f-3863-1e5f-b5c710f16ae0"), "global-monitor", "super_admin" },
                    { new Guid("0be02dfa-2a7d-59dd-2c62-04d3a17848ef"), "analytics", "tenant_admin" },
                    { new Guid("0e69283b-597b-ae6c-44c1-40d7bb094c03"), "playback", "partner" },
                    { new Guid("0e764401-f153-938a-e541-078b93102157"), "maintenance", "fleet_manager" },
                    { new Guid("0f68e1bd-a0ff-806a-78d0-7f6f5f5997ce"), "routes", "vehicle_owner" },
                    { new Guid("0f698afc-2ceb-8856-a7d6-e1089ec2c75b"), "health", "super_admin" },
                    { new Guid("10023b8d-3d94-60a4-fe05-2e7b272c68e4"), "geofences", "fleet_manager" },
                    { new Guid("100ff05a-9355-9c32-3101-835db110adf5"), "maintenance", "fleet_admin" },
                    { new Guid("118ecab1-47dd-d5af-9091-0d0d411513b5"), "real-time", "billing_admin" },
                    { new Guid("13c16f6f-c4c3-5647-3b89-b0a265660eab"), "auth-mfa", "tenant_admin" },
                    { new Guid("148ffc66-e103-9f06-f9e5-e150a3e062a5"), "subscription", "vehicle_owner" },
                    { new Guid("16fe607b-e146-0d99-08bd-48892c7bc546"), "tenant-nav", "fleet_admin" },
                    { new Guid("181ca08f-3aed-9c6e-0738-2ebd5735d83c"), "alerts", "partner" },
                    { new Guid("1b3dc008-4815-a8db-c865-7cb47e689d8d"), "drivers", "fleet_manager" },
                    { new Guid("1bb446bc-a5b0-9c61-02cd-a6934d7b5cf5"), "analytics", "super_admin" },
                    { new Guid("1bd3ed9b-407f-ead6-c623-b2e43be808de"), "alerts", "platform_admin" },
                    { new Guid("1cb69726-35fe-2079-9023-f7f5bd706a20"), "tenant-mgmt", "super_admin" },
                    { new Guid("1db06d15-3941-1cc0-49cc-e59f5f659fba"), "alerts", "super_admin" },
                    { new Guid("1f34a21f-4597-3ca2-b6c7-d843073d1214"), "tenant-nav", "super_admin" },
                    { new Guid("20bda883-6be8-3462-f16d-d4fa71475c1f"), "branches", "super_admin" },
                    { new Guid("21f438e3-467f-ae72-e4f3-30f8937a186d"), "customers", "tenant_admin" },
                    { new Guid("22069f35-f926-f735-f6af-0022465c7204"), "customers", "fleet_admin" },
                    { new Guid("230e129f-99cd-bc76-50c7-06f848e0ceea"), "auth-mfa", "super_admin" },
                    { new Guid("2ad3b1c2-74cb-74fe-212b-3131c660dff5"), "module-config", "viewer" },
                    { new Guid("2c247a70-360a-e949-5974-178bf0665249"), "subscription", "fleet_admin" },
                    { new Guid("2f273f7d-6589-9551-ea01-0a9a19f9f276"), "branding", "platform_admin" },
                    { new Guid("2f6d43d6-5607-cb09-f543-45c46a92e363"), "cost-savings", "platform_admin" },
                    { new Guid("326db23e-ce92-2a5e-6bd5-4099a37ba4c2"), "geofences", "platform_admin" },
                    { new Guid("38be14a0-ac7a-5c5f-16bd-b0521952db23"), "module-config", "super_admin" },
                    { new Guid("391586bf-c0a6-06b9-dcb9-1f819140f806"), "playback", "platform_admin" },
                    { new Guid("398ca507-de62-d649-7dbd-c5dbcdc796a3"), "reports", "fleet_admin" },
                    { new Guid("3b3d36ea-870a-9ebf-a276-fed8518521bd"), "isolation", "fleet_manager" },
                    { new Guid("3b60ae64-2c57-0235-f241-e958e9b35e43"), "real-time", "dispatcher" },
                    { new Guid("3c864671-8f79-26b8-091d-003946ced867"), "geofences", "dispatcher" },
                    { new Guid("3d2328a0-a624-fd39-a884-1a26e9b5a428"), "alerts", "dispatcher" },
                    { new Guid("3df3f01a-568d-9999-8c4e-36aacab78216"), "auth-rbac", "super_admin" },
                    { new Guid("468a1ac0-0afd-a9cd-ae23-ee0d45ce400c"), "real-time", "super_admin" },
                    { new Guid("468c628d-37b1-8f26-7b90-cf0fea7bde49"), "drivers", "platform_admin" },
                    { new Guid("47605668-b976-b1b7-a4b2-00e274e2deef"), "subscription", "partner" },
                    { new Guid("4af261cc-15ae-4d1b-66a2-f98c31d7c654"), "branding", "fleet_admin" },
                    { new Guid("4c7ee4ba-b1ec-44e6-ff45-c2b8d58ac0cd"), "branches", "fleet_admin" },
                    { new Guid("4d058598-a42c-0935-db13-97e90a4f31e3"), "resellers", "fleet_admin" },
                    { new Guid("4d2484b5-82ae-47a0-9450-ac894d23ee5d"), "routes", "dispatcher" },
                    { new Guid("4d4f0303-56fd-bf48-9fb1-91257a490f63"), "subscription", "billing_admin" },
                    { new Guid("51b5f03d-7b74-fd66-7892-edbd9a570f1c"), "reports", "vehicle_owner" },
                    { new Guid("5484c150-6992-155f-b061-cce6ce4c6810"), "cost-savings", "fleet_admin" },
                    { new Guid("560c7e93-7ebc-6558-a019-9ba4506f9a10"), "playback", "fleet_manager" },
                    { new Guid("566d7f02-13b1-c713-da7b-222d2bc9ed1d"), "resellers", "tenant_admin" },
                    { new Guid("5affa939-c072-75f8-f7c0-4491fabd0bd6"), "map", "fleet_manager" },
                    { new Guid("5c9c8912-b4c1-1ef8-e2e0-fe98a727fd52"), "devices", "fleet_admin" },
                    { new Guid("5dfdbe6a-4905-4f6a-cc4d-fa09ffdd4cd2"), "tenant-users", "tenant_admin" },
                    { new Guid("5f2f1e43-9913-c77c-0b01-3a0951fbca58"), "integrations", "platform_admin" },
                    { new Guid("605369e4-131f-5c35-236b-0dc27631d430"), "module-config", "billing_admin" },
                    { new Guid("60ded594-e011-b5ce-d2ea-0afbdb667eb6"), "tenant-roles", "super_admin" },
                    { new Guid("63c73cc4-2239-46d1-3ede-c257ce7bdde0"), "tenant-roles", "fleet_admin" },
                    { new Guid("6512882e-62a3-381b-897f-7d2f89cb6af4"), "branding", "tenant_admin" },
                    { new Guid("67a95fe2-c8d7-61f0-3ffa-7ee3480ad87e"), "routes", "super_admin" },
                    { new Guid("6934d001-7625-9c4a-afa9-a58f501e70e1"), "map", "platform_admin" },
                    { new Guid("6b24bc32-2e11-da93-cb1a-23bbc67348e7"), "vehicles", "tenant_admin" },
                    { new Guid("6dbc1342-94ea-a30d-65cd-603649000acf"), "module-config", "fleet_manager" },
                    { new Guid("6f47dbd8-7d8d-1d2f-aa68-d85f2aa98258"), "cost-savings", "tenant_admin" },
                    { new Guid("740fd894-2e52-09ba-8de6-920ae46d5389"), "real-time", "platform_admin" },
                    { new Guid("75d95d8c-17f5-365e-72b7-c014de50111d"), "customers", "billing_admin" },
                    { new Guid("765adfbe-7b07-1d5c-bc28-7b517b6cb169"), "playback", "tenant_admin" },
                    { new Guid("76b3c9a7-614d-3d67-c556-e9940c9e8a6a"), "drivers", "vehicle_owner" },
                    { new Guid("76d12d07-cc44-9f36-ef36-718bba995f59"), "real-time", "viewer" },
                    { new Guid("783d263c-73d2-fc20-f185-f819ba490ab7"), "routes", "fleet_manager" },
                    { new Guid("7a5a662a-16ee-9047-70d8-ff3b155f1df8"), "branches", "tenant_admin" },
                    { new Guid("7c09d1cf-ff4d-f307-7634-df35096f42b9"), "customers", "partner" },
                    { new Guid("7c40e25a-4223-2c95-1152-34de6399152b"), "alerts", "vehicle_owner" },
                    { new Guid("7d3f0ef8-1946-47da-d510-65c7411c1c43"), "unauthorized", "platform_admin" },
                    { new Guid("7d424130-97b6-7fc2-80ca-ee312b8acea1"), "integrations", "partner" },
                    { new Guid("7dd9a8c1-aa66-3d41-222f-83000158dc37"), "drivers", "tenant_admin" },
                    { new Guid("82bab9b9-1bdd-4ef3-2ef1-76dba8ca8dd5"), "my-vehicle", "vehicle_owner" },
                    { new Guid("8881e315-b2a9-270d-dc02-137fb18428d0"), "drivers", "super_admin" },
                    { new Guid("8bc6d8eb-2bd8-015d-eacb-bdb93ed2a6d1"), "alerts", "tenant_admin" },
                    { new Guid("8c468e7a-9d83-8244-8484-ed68213787d6"), "maintenance", "platform_admin" },
                    { new Guid("8d032f6a-214b-4943-4d62-217ed8ded3fa"), "resellers", "partner" },
                    { new Guid("8e7aae4c-f017-3391-4729-f6bb8b40e329"), "tenant-users", "super_admin" },
                    { new Guid("8f8be790-48c4-47ab-55c6-9ebc2a7e645b"), "unauthorized", "fleet_manager" },
                    { new Guid("963f0a14-8d31-9f03-81da-0abf1c141ca1"), "drivers", "viewer" },
                    { new Guid("976898f6-c6d3-ea40-b818-20dc1c49c1b9"), "vehicles", "platform_admin" },
                    { new Guid("9ab3c992-abb7-461e-a1ce-a7ae5bda2897"), "map", "fleet_admin" },
                    { new Guid("9bf24dac-eb09-db03-8735-1512b5fb0f7b"), "customers", "platform_admin" },
                    { new Guid("9fd55ef1-be48-fb71-33c3-79454581c0b1"), "auth-sso", "super_admin" },
                    { new Guid("9fddf439-8a50-e24b-bdbe-f49a6a705764"), "customers", "dispatcher" },
                    { new Guid("a3025d6d-bcbb-f69f-e589-0b165550cbbd"), "vehicles", "fleet_manager" },
                    { new Guid("a3990c5c-d582-8729-a1c4-95bed9492087"), "reports", "tenant_admin" },
                    { new Guid("a3c69376-70e9-0e02-fdd6-5806cc1a1988"), "reports", "platform_admin" },
                    { new Guid("a3dbb1df-977a-f6f5-5090-cba447a8cd8d"), "unauthorized", "super_admin" },
                    { new Guid("a68b22d2-963e-afab-15b6-c782e855fe13"), "unauthorized", "tenant_admin" },
                    { new Guid("a6e8b1cf-2662-b65f-3852-0cc7ba3dbe92"), "maintenance", "vehicle_owner" },
                    { new Guid("a79b14ab-1e64-6e62-4d3a-2d8e11a4aec5"), "playback", "super_admin" },
                    { new Guid("a7eade81-5fa0-5628-5f88-ba1b7527d9a9"), "auth-sso", "tenant_admin" },
                    { new Guid("a99f9514-e77a-d7b7-95e3-121debf4c54c"), "real-time", "fleet_admin" },
                    { new Guid("a9dff270-c025-8e0c-f830-d2f807d4e39b"), "drivers", "dispatcher" },
                    { new Guid("aa26272b-c545-a2e1-b5b6-76a4a0cafb58"), "routes", "fleet_admin" },
                    { new Guid("aa9f49cb-2e66-c4ad-79ce-6cdb70060843"), "global-alerts", "super_admin" },
                    { new Guid("ab50b24e-7cf9-c26b-1f69-8f994625fa85"), "auth-rbac", "tenant_admin" },
                    { new Guid("ac2d63b8-65dc-dd5f-bf0d-2ae50bbd732b"), "auth-sessions", "tenant_admin" },
                    { new Guid("ac4e5351-7c57-f8c5-e8c0-5065321b0ae7"), "tenants", "tenant_admin" },
                    { new Guid("af728064-09b8-3a17-2075-78c1ad938d2e"), "tenants", "super_admin" },
                    { new Guid("afd84862-c845-d01a-610b-1c292844c754"), "maintenance", "tenant_admin" },
                    { new Guid("b142f7a6-1a86-e793-514d-deccce8bdabb"), "resellers", "super_admin" },
                    { new Guid("b1ba742b-4ed9-7936-cbcd-7d8beb9b6789"), "sys-config", "super_admin" },
                    { new Guid("b1da3b07-5473-1601-9bcd-e7e968cf522c"), "alerts", "fleet_admin" },
                    { new Guid("b325d12a-dcdb-9761-f150-5e43a235ed7b"), "reports", "fleet_manager" },
                    { new Guid("b6326f3b-e81c-ccf7-0a71-1682f83dcb8b"), "vehicles", "viewer" },
                    { new Guid("b6bbcba2-f1a2-1d6f-2f26-c7779815bf08"), "analytics", "platform_admin" },
                    { new Guid("b747d199-c3c5-0563-042e-1865bbd7cd64"), "playback", "dispatcher" },
                    { new Guid("b76735b3-1b4e-f0ec-f168-9d8815910879"), "module-config", "dispatcher" },
                    { new Guid("bbdb3ec5-dcbd-e40f-ee81-7829dc731f9e"), "integrations", "fleet_admin" },
                    { new Guid("be60dbac-89ee-b49c-458a-a7e8904e91f9"), "devices", "platform_admin" },
                    { new Guid("c110efa0-86e1-6c5a-5862-ee411e1ba5f9"), "auth-sessions", "super_admin" },
                    { new Guid("c11e6e9d-ad8e-c751-28c4-7554bcc52dcc"), "geofences", "fleet_admin" },
                    { new Guid("c2e773ac-df65-d960-0aaf-10a3c94c2ead"), "map", "dispatcher" },
                    { new Guid("c504563d-bf28-3bea-ab95-da61c86b0768"), "module-config", "tenant_admin" },
                    { new Guid("c609adc3-b867-cd30-5829-183657ccb131"), "map", "partner" },
                    { new Guid("c7cf1e6e-3891-9fcd-ad8e-83355e6af51f"), "integrations", "tenant_admin" },
                    { new Guid("c8e3ac49-32c1-d67d-6568-21cdbe7dd665"), "vehicles", "fleet_admin" },
                    { new Guid("cb845f0b-b679-d1f3-c71f-65926f106be2"), "playback", "fleet_admin" },
                    { new Guid("cba697ac-3169-3a10-d45c-f7179353c1d2"), "reports", "super_admin" },
                    { new Guid("cdc1cd4d-6cb5-971b-aa0d-6a0050df1066"), "maintenance", "super_admin" },
                    { new Guid("ce166ef4-07a1-985d-29f7-7106c0bd7d7d"), "map", "super_admin" },
                    { new Guid("cf8c0568-9e37-89c8-c14e-25d70b21ad57"), "map", "vehicle_owner" },
                    { new Guid("d3c526c2-3718-9f7d-72cb-5280ae5e05fb"), "routes", "tenant_admin" },
                    { new Guid("d656356e-355c-404f-0d71-cd8d15c9569c"), "module-config", "platform_admin" },
                    { new Guid("d701a2d5-1f70-4bc5-0f8d-c85a6f69060b"), "routes", "platform_admin" },
                    { new Guid("d83ac2b8-8fbf-31cd-c612-2ec3a75a0a37"), "geofences", "tenant_admin" },
                    { new Guid("d956fece-5bba-0b07-d8d1-ee18960a89ca"), "subscription", "tenant_admin" },
                    { new Guid("d96c2288-8494-ce00-adc2-cf5ea3dcaaf4"), "real-time", "partner" },
                    { new Guid("dba96154-4640-dc9c-088f-9a6c7b5b0159"), "vehicles", "dispatcher" },
                    { new Guid("dbfb7836-1836-2519-b506-e7fbf092f8f0"), "branding", "super_admin" },
                    { new Guid("dc638b88-ff07-f704-610e-ccb5b9a41155"), "unauthorized", "fleet_admin" },
                    { new Guid("df8170f2-7209-3365-c6e1-88cf881f5299"), "map", "tenant_admin" },
                    { new Guid("dfa32934-d8fe-8e39-128e-40e159e1ef0f"), "playback", "vehicle_owner" },
                    { new Guid("dfc91414-a2ab-fdd0-e580-53cd5b575dab"), "real-time", "fleet_manager" },
                    { new Guid("e03aa5f3-c0d0-073e-7b9e-24cae9b361fc"), "tenant-roles", "tenant_admin" },
                    { new Guid("e1571e2c-89e0-5330-f57d-2ea166140950"), "isolation", "super_admin" },
                    { new Guid("e1ef749c-b498-25e6-330c-90f94a6a8f22"), "branding", "fleet_manager" },
                    { new Guid("e20b0b61-cf0b-5c7f-d02b-f7af96387109"), "alerts", "fleet_manager" },
                    { new Guid("e3c79940-e1ce-9628-e4ca-3f794fd267c7"), "devices", "tenant_admin" },
                    { new Guid("e647eee4-a151-06bd-5216-4f8866c1cbf0"), "module-config", "fleet_admin" },
                    { new Guid("e74e8a1f-045a-2305-d5d3-05471722efbe"), "integrations", "super_admin" },
                    { new Guid("e77b51d8-986f-23e3-d5fe-d98d644e77de"), "analytics", "fleet_admin" },
                    { new Guid("e8bae947-ec7f-370a-187f-caf0b44e2294"), "tenant-users", "fleet_admin" },
                    { new Guid("e99c7b37-9866-d2aa-dd2c-b4c2a7485eb3"), "customers", "super_admin" },
                    { new Guid("ed0b4cca-933b-c441-9830-0957f94491c1"), "analytics", "vehicle_owner" },
                    { new Guid("ed5e79fa-6920-e367-a853-d89fd0372451"), "module-config", "vehicle_owner" },
                    { new Guid("efc024ee-e226-bc7b-62cb-31f06e777b1d"), "devices", "super_admin" },
                    { new Guid("f19d2d95-411d-9a3f-2420-f062ac281574"), "analytics", "fleet_manager" },
                    { new Guid("f3355059-7d66-a330-eb72-8476d76fe068"), "geofences", "vehicle_owner" },
                    { new Guid("f408aee4-9851-63d1-0f02-d5fbe818b253"), "customers", "fleet_manager" },
                    { new Guid("f48430c4-062e-00b8-01d8-ddb52c79c375"), "tenant-nav", "tenant_admin" },
                    { new Guid("f5506c4c-b399-16fb-96ef-b6c595a8d503"), "subscription", "super_admin" },
                    { new Guid("f733fbba-a806-0219-eb0b-18abc1139df2"), "module-config", "partner" },
                    { new Guid("f75fd1a5-946e-a5fb-db39-d6b0ebc77008"), "drivers", "fleet_admin" },
                    { new Guid("f858ae9c-3c50-0399-469c-eb7fd3505df0"), "my-vehicle", "super_admin" },
                    { new Guid("f8a14a8c-d08f-f697-4e07-b265c294a9f5"), "auth-devices", "tenant_admin" },
                    { new Guid("fb9f66af-8b6d-8dc4-2b07-78e1de60cbec"), "nav-config", "tenant_admin" },
                    { new Guid("fe64742d-5d61-fe07-cd7b-1cd6f38c07ad"), "nav-config", "super_admin" },
                    { new Guid("fe77e0e7-1e1f-71e6-73f5-49bbb8c7effa"), "unauthorized", "vehicle_owner" }
                });

            migrationBuilder.InsertData(
                table: "Tenants",
                columns: new[] { "Id", "CreatedAt", "LogoInitials", "Mrr", "Name", "Plan", "PrimaryColor", "Region", "Slug", "Status" },
                values: new object[,]
                {
                    { new Guid("00000000-0000-0000-0000-000000000001"), new DateTime(2019, 3, 1, 0, 0, 0, 0, DateTimeKind.Utc), "AL", 3840m, "ACME Logistics", "Enterprise", "#0d7377", "Kenya", "acme", "active" },
                    { new Guid("00000000-0000-0000-0000-000000000002"), new DateTime(2021, 6, 1, 0, 0, 0, 0, DateTimeKind.Utc), "SC", 1980m, "SwiftCargo Ltd", "Business", "#7c3aed", "Kenya", "swift", "active" },
                    { new Guid("00000000-0000-0000-0000-000000000003"), new DateTime(2022, 2, 1, 0, 0, 0, 0, DateTimeKind.Utc), "NE", 1540m, "NairobiExpress", "Business", "#d97706", "Kenya", "nex", "active" },
                    { new Guid("00000000-0000-0000-0000-000000000004"), new DateTime(2023, 1, 15, 0, 0, 0, 0, DateTimeKind.Utc), "KT", 420m, "KimTransport", "Starter", "#dc2626", "Uganda", "kim", "suspended" },
                    { new Guid("00000000-0000-0000-0000-000000000005"), new DateTime(2023, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), "PF", 2200m, "PeakFleet Co", "Business", "#0891b2", "Tanzania", "peak", "active" },
                    { new Guid("00000000-0000-0000-0000-000000000006"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "SD", 560m, "SwiftDeliver EA", "Starter", "#16a34a", "Kenya", "sde", "active" }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "FirstName", "LastLoginAt", "LastName", "MfaEnabled", "PasswordHash", "Role", "Status", "TenantId" },
                values: new object[,]
                {
                    { new Guid("42c99e24-56fc-e512-6614-2f8b20b2a6bf"), new DateTime(2023, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin@fleetosteam.io", "Platform", null, "Admin", true, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "platform_admin", "Active", null },
                    { new Guid("cf3d7061-ec9e-fc62-bfad-edcbc5bbe6cc"), new DateTime(2023, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "super@fleetosteam.io", "Super", null, "Admin", true, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "super_admin", "Active", null },
                    { new Guid("fbfffc4c-397c-6af7-1a23-bbf848e53285"), new DateTime(2023, 6, 1, 0, 0, 0, 0, DateTimeKind.Utc), "partner@transroute.af", "Partner", null, "User", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "partner", "Active", null }
                });

            migrationBuilder.InsertData(
                table: "Branches",
                columns: new[] { "Id", "Active", "City", "CreatedAt", "DriverCount", "ManagerId", "Name", "Region", "TenantId", "UserCount", "VehicleCount" },
                values: new object[,]
                {
                    { new Guid("2338707e-cc54-cf7e-d719-da49c99fa42e"), true, "Arusha", new DateTime(2024, 5, 22, 0, 0, 0, 0, DateTimeKind.Utc), 12, null, "Arusha Branch", "Northern", new Guid("00000000-0000-0000-0000-000000000005"), 4, 15 },
                    { new Guid("464966cd-559d-19fd-b8fa-5adf51e50d67"), true, "Mombasa", new DateTime(2024, 3, 15, 0, 0, 0, 0, DateTimeKind.Utc), 24, null, "Mombasa Branch", "Coast", new Guid("00000000-0000-0000-0000-000000000001"), 6, 31 },
                    { new Guid("51a56787-ae87-1186-6da6-0735a9f71359"), true, "Nairobi", new DateTime(2024, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), 38, null, "Nairobi HQ", "Central", new Guid("00000000-0000-0000-0000-000000000001"), 12, 52 },
                    { new Guid("8b76e4e3-3143-e99f-ec8c-75d100884a58"), true, "Nakuru", new DateTime(2024, 8, 10, 0, 0, 0, 0, DateTimeKind.Utc), 9, null, "Nakuru Office", "Rift Valley", new Guid("00000000-0000-0000-0000-000000000002"), 3, 12 },
                    { new Guid("a57f1ad8-fe59-e1b7-9319-171bba28d081"), false, "Eldoret", new DateTime(2025, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), 7, null, "Eldoret Depot", "Rift Valley", new Guid("00000000-0000-0000-0000-000000000001"), 2, 9 },
                    { new Guid("c7125620-e39c-cf70-ebb7-07aac553f8a3"), true, "Kisumu", new DateTime(2024, 6, 1, 0, 0, 0, 0, DateTimeKind.Utc), 14, null, "Kisumu Branch", "Nyanza", new Guid("00000000-0000-0000-0000-000000000001"), 4, 18 },
                    { new Guid("e93f3cd9-e00f-6e4d-f613-6b56398bf52e"), true, "Nairobi", new DateTime(2024, 2, 1, 0, 0, 0, 0, DateTimeKind.Utc), 20, null, "HQ Nairobi", "Central", new Guid("00000000-0000-0000-0000-000000000002"), 8, 28 },
                    { new Guid("ef991207-a2db-9c9f-4a2f-8cc27caf7c9e"), true, "Dar es Salaam", new DateTime(2023, 11, 5, 0, 0, 0, 0, DateTimeKind.Utc), 30, null, "Dar es Salaam", "Coastal", new Guid("00000000-0000-0000-0000-000000000005"), 10, 40 }
                });

            migrationBuilder.InsertData(
                table: "Customers",
                columns: new[] { "Id", "AccountManager", "ActiveContracts", "Address", "City", "ComplianceNotes", "ComplianceStatus", "Country", "CreatedAt", "CreditLimit", "Email", "Industry", "Name", "Notes", "ParentId", "Phone", "Status", "TaxId", "TenantId", "Type", "VehiclesAssigned", "Website" },
                values: new object[,]
                {
                    { new Guid("05b794d4-90de-0a9f-579a-474fea9aac87"), "Nadia Osman", 1, "Dodoma Central, Tanzania", "Dodoma", "", "Compliant", "Tanzania", new DateTime(2024, 1, 15, 0, 0, 0, 0, DateTimeKind.Utc), 500000m, "dodoma@darconstruction.co.tz", "Construction", "Dar Construction — Dodoma Site", "Sub-office of Dar Construction Group.", new Guid("fd4e0fea-8d11-e0ae-68ff-36efa2f536a6"), "+255 26 210 0011", "Active", "TZ-TIN-005011", new Guid("00000000-0000-0000-0000-000000000005"), "Company", 1, "" },
                    { new Guid("128b33db-8815-78a8-f9fc-b8e81af05716"), "Ali Hassan", 3, "Upper Hill, Nairobi, Kenya", "Nairobi", "", "Compliant", "Kenya", new DateTime(2019, 3, 12, 0, 0, 0, 0, DateTimeKind.Utc), 5000000m, "group@acmeholdings.co.ke", "Conglomerate", "ACME Group Holdings", "Long-standing enterprise client since 2019.", null, "+254 20 272 0000", "Active", "P051234567A", new Guid("00000000-0000-0000-0000-000000000001"), "Company", 80, "acmeholdings.co.ke" },
                    { new Guid("2e141688-10be-4a72-67e6-9162125ac264"), "Ali Hassan", 1, "Plot 45 Kampala Road, Kampala, Uganda", "Kampala", "", "Pending Review", "Uganda", new DateTime(2022, 1, 15, 0, 0, 0, 0, DateTimeKind.Utc), 1200000m, "fleet@niletech.co.ug", "Technology", "NileTech Solutions", "Tech company expanding delivery fleet.", null, "+256 41 432 0000", "Active", "UG-TIN-445566", new Guid("00000000-0000-0000-0000-000000000001"), "Company", 18, "niletech.co.ug" },
                    { new Guid("2ec8842d-6d58-cd81-cdf2-84f92e00da18"), "Kevin Ndungu", 1, "Ngong Road, Nairobi", "Nairobi", "", "Compliant", "Kenya", new DateTime(2022, 11, 10, 0, 0, 0, 0, DateTimeKind.Utc), 350000m, "ops@savannadigital.co.ke", "E-Commerce", "Savanna Digital Commerce", "", null, "+254 20 602 0002", "Active", "P056002345H", new Guid("00000000-0000-0000-0000-000000000006"), "Company", 1, "" },
                    { new Guid("3c315919-1d06-2b3d-eb2f-ce83010e10c4"), "Samuel Kamau", 1, "Westlands, Nairobi", "Nairobi", "", "Compliant", "Kenya", new DateTime(2022, 4, 20, 0, 0, 0, 0, DateTimeKind.Utc), 600000m, "ops@urbancourier.co.ke", "Courier Services", "Urban Courier Solutions", "", null, "+254 20 321 0001", "Active", "P053001234E", new Guid("00000000-0000-0000-0000-000000000003"), "Company", 1, "" },
                    { new Guid("4cef7f91-0aab-498c-32da-3b92cc4a317e"), "Arif Khan", 1, "Karen, Nairobi, Kenya", "Nairobi", "", "Compliant", "Kenya", new DateTime(2022, 3, 1, 0, 0, 0, 0, DateTimeKind.Utc), 0m, "jkariuki@gmail.com", "Individual", "James Kariuki Mwangi", "Individual owner — Personal Tracker plan.", null, "+254 722 456 789", "Active", "12345678", new Guid("00000000-0000-0000-0000-000000000001"), "Individual", 1, "" },
                    { new Guid("4ef579c5-cd1f-44f7-e9f0-af0d5e70b619"), "Hassan Mwangi", 1, "Industrial Area, Nakuru", "Nakuru", "", "Compliant", "Kenya", new DateTime(2021, 5, 20, 0, 0, 0, 0, DateTimeKind.Utc), 1500000m, "ops@nakurucoldchain.co.ke", "Cold Chain Logistics", "Nakuru Cold Chain Ltd", "", null, "+254 51 221 0001", "Active", "P052001234C", new Guid("00000000-0000-0000-0000-000000000002"), "Company", 2, "" },
                    { new Guid("944671a3-cd94-3312-2d1f-fd86c8dd2a8b"), "Grace Njeri", 2, "14 Samora Ave, Dar es Salaam, Tanzania", "Dar es Salaam", "", "Compliant", "Tanzania", new DateTime(2020, 7, 1, 0, 0, 0, 0, DateTimeKind.Utc), 3500000m, "info@transafrica.co.tz", "Transport & Logistics", "TransAfrica Holdings", "Regional carrier. Handles KE-TZ-UG corridor.", null, "+255 22 211 0000", "Active", "TZ-VAT-887654", new Guid("00000000-0000-0000-0000-000000000001"), "Company", 55, "transafrica.co.tz" },
                    { new Guid("9915600b-fc4c-a3d4-3738-fe10c6304731"), "Kevin Ndungu", 1, "Mombasa Road, Nairobi", "Nairobi", "", "Compliant", "Kenya", new DateTime(2024, 1, 12, 0, 0, 0, 0, DateTimeKind.Utc), 400000m, "dispatch@nairobieShop.co.ke", "E-Commerce", "Nairobi eShop Ltd", "", null, "+254 20 601 0001", "Active", "P056001234G", new Guid("00000000-0000-0000-0000-000000000006"), "Company", 1, "" },
                    { new Guid("a1d62cc2-c5f8-b0e0-0c1e-533c7d146659"), "Joseph Baraka", 1, "Sinza, Dar es Salaam", "Dar es Salaam", "", "Compliant", "Tanzania", new DateTime(2022, 7, 25, 0, 0, 0, 0, DateTimeKind.Utc), 900000m, "logistics@tanzafresh.co.tz", "Food & Beverage", "TanzaFresh Foods Ltd", "", null, "+255 22 312 0002", "Active", "TZ-TIN-005002", new Guid("00000000-0000-0000-0000-000000000005"), "Company", 1, "" },
                    { new Guid("d2fc714f-46bc-0291-0004-d5e576529ef6"), "Grace Njeri", 1, "Mega Plaza, Kisumu, Kenya", "Kisumu", "", "Compliant", "Kenya", new DateTime(2022, 8, 1, 0, 0, 0, 0, DateTimeKind.Utc), 800000m, "ops@solarroute.co.ke", "Renewable Energy", "SolarRoute Ltd", "Renewable energy company with field fleet.", null, "+254 57 202 0000", "Active", "P051987654B", new Guid("00000000-0000-0000-0000-000000000001"), "Company", 24, "solarroute.co.ke" },
                    { new Guid("d5c6c1ae-273b-fc48-56e7-81f65e5bc592"), "Fatuma Wanjiku", 1, "Wakulima Market, Nairobi", "Nairobi", "", "Compliant", "Kenya", new DateTime(2019, 11, 15, 0, 0, 0, 0, DateTimeKind.Utc), 800000m, "info@eafresh.co.ke", "Agriculture", "EastAfrica Fresh Produce", "", null, "+254 20 441 0002", "Active", "P052003456D", new Guid("00000000-0000-0000-0000-000000000002"), "Company", 1, "" },
                    { new Guid("db6ef748-aced-3b77-cb7b-1af1c89390d2"), "Kimani Mwenda", 1, "Nalufenya, Jinja, Uganda", "Jinja", "", "Compliant", "Uganda", new DateTime(2019, 5, 25, 0, 0, 0, 0, DateTimeKind.Utc), 700000m, "fleet@nileagro.co.ug", "Agriculture", "Nile Agro Processing", "", null, "+256 43 122 0002", "Active", "UG-TIN-004002", new Guid("00000000-0000-0000-0000-000000000004"), "Company", 1, "" },
                    { new Guid("df273454-6001-4844-2591-44d1642f7349"), "Kimani Mwenda", 1, "Jinja Road, Kampala", "Kampala", "", "Compliant", "Uganda", new DateTime(2020, 8, 20, 0, 0, 0, 0, DateTimeKind.Utc), 900000m, "orders@kampalatiles.co.ug", "Hardware", "Kampala Tiles & Hardware", "", null, "+256 41 321 0001", "Active", "UG-TIN-004001", new Guid("00000000-0000-0000-0000-000000000004"), "Company", 1, "" },
                    { new Guid("eb9bce9f-8adf-9f6b-629e-6eb8e02e9a3b"), "Aisha Omar", 1, "Thika Road, Nairobi", "Nairobi", "", "Compliant", "Kenya", new DateTime(2020, 6, 15, 0, 0, 0, 0, DateTimeKind.Utc), 2000000m, "logistics@quickmart.co.ke", "Retail", "QuickMart Kenya Ltd", "", null, "+254 20 552 0002", "Active", "P053002345F", new Guid("00000000-0000-0000-0000-000000000003"), "Company", 2, "" },
                    { new Guid("fd4e0fea-8d11-e0ae-68ff-36efa2f536a6"), "Nadia Osman", 2, "Kariakoo, Dar es Salaam", "Dar es Salaam", "", "Compliant", "Tanzania", new DateTime(2023, 3, 20, 0, 0, 0, 0, DateTimeKind.Utc), 3000000m, "fleet@darconstruction.co.tz", "Construction", "Dar Construction Group", "", null, "+255 22 210 0001", "Active", "TZ-TIN-005001", new Guid("00000000-0000-0000-0000-000000000005"), "Company", 2, "" }
                });

            migrationBuilder.InsertData(
                table: "Drivers",
                columns: new[] { "Id", "AssignedVehicleId", "AssignedVehiclePlate", "CreatedAt", "HosDriven", "HosRemaining", "LicenseClass", "LicenseNumber", "Name", "PhoneNumber", "SafetyScore", "Status", "TenantId" },
                values: new object[,]
                {
                    { new Guid("1d148bb5-cafa-84c6-b430-bf5fe108254f"), null, null, new DateTime(2022, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 9.5, 1.5, "A", "LIC-KE-005", "Omar Sheikh", "+254722100005", 63, "resting", new Guid("00000000-0000-0000-0000-000000000001") },
                    { new Guid("1dc03854-e633-7edf-0959-f50115dc5905"), new Guid("fad28352-9c16-ef00-306c-29b60bb6c655"), "UBF 300A", new DateTime(2020, 8, 20, 0, 0, 0, 0, DateTimeKind.Utc), 6.0, 5.0, "CE", "LIC-UG-013", "Kimani Mwenda", "+256772400001", 86, "driving", new Guid("00000000-0000-0000-0000-000000000004") },
                    { new Guid("2599d684-837a-dde7-608f-84ecd840f619"), new Guid("b37c6374-2154-bfa8-e380-301baa2af18a"), "KAB 002B", new DateTime(2021, 8, 1, 0, 0, 0, 0, DateTimeKind.Utc), 3.0, 8.0, "C", "LIC-KE-002", "Sara Malik", "+254722100002", 87, "driving", new Guid("00000000-0000-0000-0000-000000000001") },
                    { new Guid("271b7442-22da-d47b-76ce-12414158ef8b"), new Guid("21b53a09-1be0-a850-d0bf-e2578a2ebdba"), "KCC 101B", new DateTime(2023, 8, 5, 0, 0, 0, 0, DateTimeKind.Utc), 3.5, 7.5, "C", "LIC-KE-008", "Fatuma Wanjiku", "+254722200002", 91, "driving", new Guid("00000000-0000-0000-0000-000000000002") },
                    { new Guid("31d26652-9752-111c-00ee-6fcbc92fc010"), new Guid("5c8013f1-10c7-5d49-9b4c-2ba4f56990f6"), "T203DDD", new DateTime(2022, 8, 1, 0, 0, 0, 0, DateTimeKind.Utc), 5.0, 6.0, "C", "LIC-TZ-018", "Tom Lekuta", "+255754500004", 74, "on_duty", new Guid("00000000-0000-0000-0000-000000000005") },
                    { new Guid("50b666a8-1264-a3b6-48b6-249b67353e83"), null, null, new DateTime(2022, 2, 1, 0, 0, 0, 0, DateTimeKind.Utc), 0.0, 11.0, "B", "LIC-KE-006", "Grace Njeri", "+254722100006", 81, "off_duty", new Guid("00000000-0000-0000-0000-000000000001") },
                    { new Guid("64a7790b-4b92-80a9-3a2a-03fb9d98b05f"), new Guid("fc44b423-58a9-a559-d16f-07e2f2586854"), "KAB 005E", new DateTime(2022, 7, 1, 0, 0, 0, 0, DateTimeKind.Utc), 6.0, 5.0, "B", "LIC-KE-003", "James Mwangi", "+254722100003", 75, "on_duty", new Guid("00000000-0000-0000-0000-000000000001") },
                    { new Guid("735e85c2-9ba1-f60f-0dea-8e21f1c4dc9a"), new Guid("4a7bf352-ed88-78ce-3579-ed38e0ee2faf"), "T200AAA", new DateTime(2023, 3, 20, 0, 0, 0, 0, DateTimeKind.Utc), 1.5, 9.5, "C", "LIC-TZ-015", "Nadia Osman", "+255754500001", 93, "driving", new Guid("00000000-0000-0000-0000-000000000005") },
                    { new Guid("745050ab-268c-5754-2606-d663597b570f"), null, null, new DateTime(2023, 12, 10, 0, 0, 0, 0, DateTimeKind.Utc), 8.0, 3.0, "B", "LIC-TZ-017", "Salma Juma", "+255754500003", 68, "on_duty", new Guid("00000000-0000-0000-0000-000000000005") },
                    { new Guid("7b6577b2-0a6a-c5b3-aaca-b30c33f25d7c"), new Guid("6e0077f4-1f0b-c67b-2eb2-b764279207b8"), "KAB 006F", new DateTime(2021, 12, 1, 0, 0, 0, 0, DateTimeKind.Utc), 2.0, 9.0, "C", "LIC-KE-004", "Fatima Noor", "+254722100004", 95, "driving", new Guid("00000000-0000-0000-0000-000000000001") },
                    { new Guid("91e3394b-3bd9-f44b-3171-849b1c57732a"), null, null, new DateTime(2020, 9, 1, 0, 0, 0, 0, DateTimeKind.Utc), 0.0, 11.0, "C", "LIC-UG-014", "Amina Nakato", "+256772400002", 77, "off_duty", new Guid("00000000-0000-0000-0000-000000000004") },
                    { new Guid("9886fa28-c6f5-8ac6-0c21-c541a9f852c6"), null, null, new DateTime(2021, 6, 1, 0, 0, 0, 0, DateTimeKind.Utc), 0.0, 11.0, "C", "LIC-KE-009", "David Ochieng", "+254722200003", 79, "off_duty", new Guid("00000000-0000-0000-0000-000000000002") },
                    { new Guid("ab8d917d-ec64-eb66-3773-cf8582e96cba"), new Guid("0149216f-68a5-d03c-1e6e-7732583cfb28"), "T201BBB", new DateTime(2021, 9, 5, 0, 0, 0, 0, DateTimeKind.Utc), 4.0, 7.0, "CE", "LIC-TZ-016", "Joseph Baraka", "+255754500002", 80, "driving", new Guid("00000000-0000-0000-0000-000000000005") },
                    { new Guid("c244732e-477c-e11a-b1f5-348679b94a10"), new Guid("4fa3efcc-e035-45e0-7034-4f0a27742267"), "KDF 200A", new DateTime(2022, 4, 20, 0, 0, 0, 0, DateTimeKind.Utc), 7.0, 4.0, "CE", "LIC-KE-010", "Samuel Kamau", "+254722300001", 84, "driving", new Guid("00000000-0000-0000-0000-000000000003") },
                    { new Guid("cbb32719-50f5-65fc-163f-32d5f9aaf4c6"), new Guid("e4557749-9e52-3e01-8df5-cc79338d17fd"), "KDE 400A", new DateTime(2024, 1, 15, 0, 0, 0, 0, DateTimeKind.Utc), 3.0, 8.0, "B", "LIC-KE-020", "Kevin Ndungu", "+254722600001", 88, "driving", new Guid("00000000-0000-0000-0000-000000000006") },
                    { new Guid("cdd4c299-9631-55d1-16ef-8468b02b7f6a"), new Guid("21169e6b-40e5-3a40-c9d4-eef6c38112cf"), "KDF 201B", new DateTime(2020, 6, 15, 0, 0, 0, 0, DateTimeKind.Utc), 2.5, 8.5, "C", "LIC-KE-011", "Aisha Omar", "+254722300002", 90, "driving", new Guid("00000000-0000-0000-0000-000000000003") },
                    { new Guid("d508bc6b-ad33-2380-ebaf-352f3bba5371"), new Guid("c189cab9-76e4-5b04-1de8-90c7a02f7532"), "KAB 001A", new DateTime(2022, 3, 15, 0, 0, 0, 0, DateTimeKind.Utc), 4.5, 6.5, "C", "LIC-KE-001", "Ali Hassan", "+254722100001", 92, "driving", new Guid("00000000-0000-0000-0000-000000000001") },
                    { new Guid("dea9228a-a0d5-9748-d831-db804e477fc6"), null, null, new DateTime(2024, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), 0.0, 11.0, "C", "LIC-TZ-019", "Esther Makinde", "+255754500005", 85, "off_duty", new Guid("00000000-0000-0000-0000-000000000005") },
                    { new Guid("e514af89-84d6-002d-adc5-0eb3e9a24948"), null, null, new DateTime(2024, 2, 10, 0, 0, 0, 0, DateTimeKind.Utc), 0.0, 11.0, "B", "LIC-KE-021", "Patricia Waweru", "+254722600002", 76, "off_duty", new Guid("00000000-0000-0000-0000-000000000006") },
                    { new Guid("f0d37f82-ded8-8ff2-a952-9ab5be53ea8d"), new Guid("7de94cc6-2982-88e8-c2da-3559a894fea5"), "KCC 100A", new DateTime(2021, 5, 15, 0, 0, 0, 0, DateTimeKind.Utc), 5.5, 5.5, "CE", "LIC-KE-007", "Hassan Mwangi", "+254722200001", 88, "driving", new Guid("00000000-0000-0000-0000-000000000002") },
                    { new Guid("fbc7ca24-e841-a075-50f1-69ca092ef3e1"), null, null, new DateTime(2022, 5, 1, 0, 0, 0, 0, DateTimeKind.Utc), 0.0, 11.0, "B", "LIC-KE-012", "Peter Kimani", "+254722300003", 72, "off_duty", new Guid("00000000-0000-0000-0000-000000000003") }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "FirstName", "LastLoginAt", "LastName", "MfaEnabled", "PasswordHash", "Role", "Status", "TenantId" },
                values: new object[,]
                {
                    { new Guid("00b01e84-e2c8-1349-69fa-cf47bb7d19cd"), new DateTime(2021, 6, 10, 0, 0, 0, 0, DateTimeKind.Utc), "manager@swiftcargo.co.ke", "Fatuma", null, "Wanjiku", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "fleet_manager", "Active", new Guid("00000000-0000-0000-0000-000000000002") },
                    { new Guid("0c1c102d-a5b7-31b7-2248-4b024aba5015"), new DateTime(2021, 6, 10, 0, 0, 0, 0, DateTimeKind.Utc), "admin@swiftcargo.co.ke", "Hassan", null, "Mwangi", true, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "fleet_admin", "Active", new Guid("00000000-0000-0000-0000-000000000002") },
                    { new Guid("12f03303-e833-9a0d-514d-7cd523c11fad"), new DateTime(2023, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), "manager@kimtransport.co.ug", "Diana", null, "Achieng", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "fleet_manager", "Suspended", new Guid("00000000-0000-0000-0000-000000000004") },
                    { new Guid("1fffdc51-4d30-4585-9e7b-288e338ba32d"), new DateTime(2023, 12, 1, 0, 0, 0, 0, DateTimeKind.Utc), "dispatch@peakfleet.co.tz", "Tom", null, "Lekuta", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "dispatcher", "Active", new Guid("00000000-0000-0000-0000-000000000005") },
                    { new Guid("27ea418b-82d8-0d2f-a88b-5b587a214cdc"), new DateTime(2023, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin@acme.io", "A.", null, "Khan", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "fleet_admin", "Active", new Guid("00000000-0000-0000-0000-000000000001") },
                    { new Guid("291f14d8-98cd-8029-83f1-d7dbffafb454"), new DateTime(2023, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "viewer@acme.io", "M.", null, "Ali", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "viewer", "Active", new Guid("00000000-0000-0000-0000-000000000001") },
                    { new Guid("356ad6e4-978a-6d9d-1aa7-c430f288d582"), new DateTime(2024, 2, 1, 0, 0, 0, 0, DateTimeKind.Utc), "dispatch@swiftdeliver.co.ke", "Mercy", null, "Chebet", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "dispatcher", "Pending", new Guid("00000000-0000-0000-0000-000000000006") },
                    { new Guid("39f10cb7-237e-235d-2d47-9655369ecc99"), new DateTime(2022, 2, 10, 0, 0, 0, 0, DateTimeKind.Utc), "admin@nairobiexpress.co.ke", "Samuel", null, "Kamau", true, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "fleet_admin", "Active", new Guid("00000000-0000-0000-0000-000000000003") },
                    { new Guid("3adaac0b-269d-10ef-e350-bc7831538a7e"), new DateTime(2022, 3, 1, 0, 0, 0, 0, DateTimeKind.Utc), "dispatch@nairobiexpress.co.ke", "Aisha", null, "Omar", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "dispatcher", "Active", new Guid("00000000-0000-0000-0000-000000000003") },
                    { new Guid("4b0cbd77-5ad0-6495-f859-042f5753c93b"), new DateTime(2023, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), "tenant@acmelogistics.co.ke", "Sara", null, "Hassan", true, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "tenant_admin", "Active", new Guid("00000000-0000-0000-0000-000000000001") },
                    { new Guid("4b46f5e6-c7dc-4071-d0e8-5f8c2adefe73"), new DateTime(2023, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), "admin@kimtransport.co.ug", "Kimani", null, "Mwenda", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "fleet_admin", "Suspended", new Guid("00000000-0000-0000-0000-000000000004") },
                    { new Guid("562f99f2-dcad-06c1-d96f-a62301371e35"), new DateTime(2023, 11, 10, 0, 0, 0, 0, DateTimeKind.Utc), "manager@peakfleet.co.tz", "Joseph", null, "Baraka", true, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "fleet_manager", "Active", new Guid("00000000-0000-0000-0000-000000000005") },
                    { new Guid("5f0b39c5-fd6e-462f-be0d-5c36bb047862"), new DateTime(2023, 2, 1, 0, 0, 0, 0, DateTimeKind.Utc), "owner@acmelogistics.co.ke", "James", null, "Mwangi", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "vehicle_owner", "Active", new Guid("00000000-0000-0000-0000-000000000001") },
                    { new Guid("6196359b-ee17-671b-49f6-35f552397228"), new DateTime(2023, 12, 1, 0, 0, 0, 0, DateTimeKind.Utc), "billing@peakfleet.co.tz", "Rose", null, "Nakato", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "billing_admin", "Active", new Guid("00000000-0000-0000-0000-000000000005") },
                    { new Guid("6636bee5-b82d-1492-f57b-2f835f640c34"), new DateTime(2023, 3, 1, 0, 0, 0, 0, DateTimeKind.Utc), "dispatch@acmelogistics.co.ke", "Patrick", null, "Singh", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "dispatcher", "Active", new Guid("00000000-0000-0000-0000-000000000001") },
                    { new Guid("80bde171-3192-32e1-d754-010302a3fe3d"), new DateTime(2023, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), "admin@acmelogistics.co.ke", "Arif", null, "Khan", true, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "fleet_admin", "Active", new Guid("00000000-0000-0000-0000-000000000001") },
                    { new Guid("9430ade2-d2b7-8f2b-21b9-329317636dcb"), new DateTime(2023, 2, 1, 0, 0, 0, 0, DateTimeKind.Utc), "dispatch@kimtransport.co.ug", "Peter", null, "Otieno", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "dispatcher", "Suspended", new Guid("00000000-0000-0000-0000-000000000004") },
                    { new Guid("954dff5b-1324-b6cc-4ebf-7815ff336f91"), new DateTime(2023, 2, 1, 0, 0, 0, 0, DateTimeKind.Utc), "manager@acmelogistics.co.ke", "Grace", null, "Njeri", true, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "fleet_manager", "Active", new Guid("00000000-0000-0000-0000-000000000001") },
                    { new Guid("b80a3dbe-fb5d-4fe0-7e8c-a2e52e02c25b"), new DateTime(2023, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "dispatch@acme.io", "P.", null, "Singh", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "dispatcher", "Active", new Guid("00000000-0000-0000-0000-000000000001") },
                    { new Guid("c4ee5a4f-695a-2956-b777-7a37636dbb23"), new DateTime(2024, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), "admin@swiftdeliver.co.ke", "Kevin", null, "Ndungu", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "fleet_admin", "Active", new Guid("00000000-0000-0000-0000-000000000006") },
                    { new Guid("d902bc08-d3af-06d3-8234-f18d9e7fed9f"), new DateTime(2023, 3, 1, 0, 0, 0, 0, DateTimeKind.Utc), "viewer@acmelogistics.co.ke", "Mary", null, "Ali", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "viewer", "Active", new Guid("00000000-0000-0000-0000-000000000001") },
                    { new Guid("dc2b2436-7cd3-d129-ee93-5598dc6ae2f9"), new DateTime(2023, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "tenant@acme.io", "S.", null, "Hassan", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "tenant_admin", "Active", new Guid("00000000-0000-0000-0000-000000000001") },
                    { new Guid("e2ea832b-d57b-dd05-354d-6054a97524d5"), new DateTime(2023, 11, 10, 0, 0, 0, 0, DateTimeKind.Utc), "admin@peakfleet.co.tz", "Nadia", null, "Osman", true, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "fleet_admin", "Active", new Guid("00000000-0000-0000-0000-000000000005") },
                    { new Guid("e39e649f-8286-2f89-cf19-02881fa376d6"), new DateTime(2021, 7, 1, 0, 0, 0, 0, DateTimeKind.Utc), "billing@swiftcargo.co.ke", "James", null, "Ochieng", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "billing_admin", "Pending", new Guid("00000000-0000-0000-0000-000000000002") },
                    { new Guid("f8a1de5c-60d0-1400-9052-8231ac74c70e"), new DateTime(2022, 4, 1, 0, 0, 0, 0, DateTimeKind.Utc), "viewer@nairobiexpress.co.ke", "Brian", null, "Mutua", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "viewer", "Suspended", new Guid("00000000-0000-0000-0000-000000000003") },
                    { new Guid("fe2a696f-787b-1139-3cf0-516b4c736184"), new DateTime(2024, 1, 5, 0, 0, 0, 0, DateTimeKind.Utc), "viewer@peakfleet.co.tz", "Alice", null, "Mwangi", false, "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W", "viewer", "Active", new Guid("00000000-0000-0000-0000-000000000005") }
                });

            migrationBuilder.InsertData(
                table: "Vehicles",
                columns: new[] { "Id", "AssignedDriverId", "AssignedDriverName", "Axles", "BodyType", "Category", "Color", "CreatedAt", "CustomerId", "CustomerName", "Department", "EngineCapacity", "EngineNo", "FuelLevel", "FuelType", "GrossWeightKg", "LastSeenAt", "Latitude", "Longitude", "Make", "Model", "Odometer", "OwnerContact", "OwnerIdNo", "OwnerName", "OwnerType", "PayloadKg", "Plate", "PurchaseDate", "PurchasePrice", "RegistrationCountry", "RegistrationDate", "SeatingCapacity", "SpeedKmh", "Status", "Supplier", "TenantId", "Transmission", "Vin", "Year" },
                values: new object[,]
                {
                    { new Guid("0149216f-68a5-d03c-1e6e-7732583cfb28"), new Guid("ab8d917d-ec64-eb66-3773-cf8582e96cba"), "Joseph Baraka", 2, "Box Body", "Truck", "Blue", new DateTime(2021, 9, 1, 0, 0, 0, 0, DateTimeKind.Utc), "c-t5-001", "Dar Construction Group", "Tanga Corridor", "6.7L", "PACCAR-PX7-201B", 62.0, "Diesel", 12000, new DateTime(2026, 5, 29, 0, 0, 0, 0, DateTimeKind.Utc), -6.8159999999999998, 39.280000000000001, "DAF", "LF 290 FA", 41600, null, null, null, null, 7500, "T201BBB", new DateTime(2021, 8, 15, 0, 0, 0, 0, DateTimeKind.Utc), 9800000m, "Tanzania", new DateTime(2021, 9, 1, 0, 0, 0, 0, DateTimeKind.Utc), 2, 70.0, "active", "DAF Tanzania", new Guid("00000000-0000-0000-0000-000000000005"), "Automatic", "XLR0988CS0E201002", 2021 },
                    { new Guid("10067d0d-1efd-fc0c-f4a6-0b4a581c1bdd"), null, null, 3, "Curtainsider", "Truck", "Red", new DateTime(2020, 9, 5, 0, 0, 0, 0, DateTimeKind.Utc), "c-021", "TransAfrica — Kenya Division", "Long-haul", "10.8L", "MX11-375-KEN4D", 30.0, "Diesel", 24000, new DateTime(2026, 5, 28, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "DAF", "XF 480 FT", 88400, null, null, "TransAfrica — Kenya Division", "Leased", 16000, "KAB 004D", new DateTime(2020, 8, 15, 0, 0, 0, 0, DateTimeKind.Utc), 11000000m, "Kenya", new DateTime(2020, 9, 5, 0, 0, 0, 0, DateTimeKind.Utc), 2, null, "maintenance", "TransAfrica Auto", new Guid("00000000-0000-0000-0000-000000000001"), "Automatic", "XLR0988CS0E012345", 2020 },
                    { new Guid("17e89bf7-b127-d6a7-5797-9761c11594e8"), null, null, 3, "Flatbed", "Truck", "Red", new DateTime(2019, 12, 10, 0, 0, 0, 0, DateTimeKind.Utc), "c-t5-011", "Dar Construction — Dodoma Site", "Heavy Haulage", "7.8L", "6HK1-TCC-202C", 25.0, "Diesel", 26000, new DateTime(2026, 5, 26, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Isuzu", "FVZ 1400", 105800, null, null, null, null, 17000, "T202CCC", new DateTime(2019, 11, 25, 0, 0, 0, 0, DateTimeKind.Utc), 10500000m, "Tanzania", new DateTime(2019, 12, 10, 0, 0, 0, 0, DateTimeKind.Utc), 2, null, "maintenance", "Isuzu Tanzania", new Guid("00000000-0000-0000-0000-000000000005"), "Manual", "JALE6TE1800202003", 2019 },
                    { new Guid("21169e6b-40e5-3a40-c9d4-eef6c38112cf"), new Guid("cdd4c299-9631-55d1-16ef-8468b02b7f6a"), "Aisha Omar", 2, "Minibus", "Van", "White", new DateTime(2020, 6, 10, 0, 0, 0, 0, DateTimeKind.Utc), "c-t3-002", "QuickMart Kenya Ltd", "Staff Transport", "2.5L", "2KD-FTV-201B", 52.0, "Diesel", 3000, new DateTime(2026, 5, 29, 0, 0, 0, 0, DateTimeKind.Utc), -1.3100000000000001, 36.789999999999999, "Toyota", "HiAce Commuter", 78400, null, null, null, null, 800, "KDF 201B", new DateTime(2020, 5, 25, 0, 0, 0, 0, DateTimeKind.Utc), 3100000m, "Kenya", new DateTime(2020, 6, 10, 0, 0, 0, 0, DateTimeKind.Utc), 14, 35.0, "active", "Toyota Kenya", new Guid("00000000-0000-0000-0000-000000000003"), "Manual", "JTGJL9GP100201002", 2020 },
                    { new Guid("21b53a09-1be0-a850-d0bf-e2578a2ebdba"), new Guid("271b7442-22da-d47b-76ce-12414158ef8b"), "Fatuma Wanjiku", 2, "Double Cab", "Pickup", "Silver", new DateTime(2023, 8, 1, 0, 0, 0, 0, DateTimeKind.Utc), "c-t2-001", "Nakuru Cold Chain Ltd", "Management", "2.4L", "2GD-FTV-101B", 88.0, "Diesel", 3000, new DateTime(2026, 5, 29, 0, 0, 0, 0, DateTimeKind.Utc), -1.3, 36.810000000000002, "Toyota", "Hilux Revo D/C", 14300, null, null, null, null, 1000, "KCC 101B", new DateTime(2023, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc), 4500000m, "Kenya", new DateTime(2023, 8, 1, 0, 0, 0, 0, DateTimeKind.Utc), 5, 0.0, "idle", "Toyota Kenya", new Guid("00000000-0000-0000-0000-000000000002"), "Automatic", "JTFJL9BN800101002", 2023 },
                    { new Guid("4a7bf352-ed88-78ce-3579-ed38e0ee2faf"), new Guid("735e85c2-9ba1-f60f-0dea-8e21f1c4dc9a"), "Nadia Osman", 2, "Panel Van", "Van", "White", new DateTime(2023, 3, 15, 0, 0, 0, 0, DateTimeKind.Utc), "c-t5-001", "Dar Construction Group", "Dar es Salaam Metro", "2.1L", "OM651-DE-22LA-200A", 78.0, "Diesel", 5000, new DateTime(2026, 5, 29, 0, 0, 0, 0, DateTimeKind.Utc), -6.7923999999999998, 39.208300000000001, "Mercedes-Benz", "Sprinter 516 CDI", 22100, null, null, null, null, 2500, "T200AAA", new DateTime(2023, 3, 1, 0, 0, 0, 0, DateTimeKind.Utc), 7200000m, "Tanzania", new DateTime(2023, 3, 15, 0, 0, 0, 0, DateTimeKind.Utc), 3, 45.0, "active", "Mercedes-Benz Tanzania", new Guid("00000000-0000-0000-0000-000000000005"), "Automatic", "WDF9066231S200001", 2023 },
                    { new Guid("4fa3efcc-e035-45e0-7034-4f0a27742267"), new Guid("c244732e-477c-e11a-b1f5-348679b94a10"), "Samuel Kamau", 2, "Flatbed", "Truck", "White", new DateTime(2022, 4, 18, 0, 0, 0, 0, DateTimeKind.Utc), "c-t3-001", "Urban Courier Solutions", "Nairobi Metro", "5.9L", "CUMMINS-ISBe-200A", 60.0, "Diesel", 16000, new DateTime(2026, 5, 29, 0, 0, 0, 0, DateTimeKind.Utc), -1.2833000000000001, 36.816699999999997, "Tata", "LPT 1615 TC", 52100, null, null, null, null, 10000, "KDF 200A", new DateTime(2022, 4, 1, 0, 0, 0, 0, DateTimeKind.Utc), 5800000m, "Kenya", new DateTime(2022, 4, 18, 0, 0, 0, 0, DateTimeKind.Utc), 2, 48.0, "active", "Tata Africa Holdings", new Guid("00000000-0000-0000-0000-000000000003"), "Manual", "MAT43500051200001", 2022 },
                    { new Guid("5c8013f1-10c7-5d49-9b4c-2ba4f56990f6"), new Guid("31d26652-9752-111c-00ee-6fcbc92fc010"), "Tom Lekuta", 2, "Single Cab", "Pickup", "Black", new DateTime(2022, 7, 20, 0, 0, 0, 0, DateTimeKind.Utc), "c-t5-002", "TanzaFresh Foods Ltd", "Field Operations", "2.4L", "2GD-FTV-203D", 90.0, "Diesel", 2800, new DateTime(2026, 5, 29, 0, 0, 0, 0, DateTimeKind.Utc), -6.7923999999999998, 39.240000000000002, "Toyota", "HiLux Vigo 4x4", 18900, null, null, null, null, 1000, "T203DDD", new DateTime(2022, 7, 5, 0, 0, 0, 0, DateTimeKind.Utc), 5100000m, "Tanzania", new DateTime(2022, 7, 20, 0, 0, 0, 0, DateTimeKind.Utc), 3, 0.0, "idle", "Toyota Tanzania", new Guid("00000000-0000-0000-0000-000000000005"), "Manual", "AHTFK3CD200203004", 2022 },
                    { new Guid("6e0077f4-1f0b-c67b-2eb2-b764279207b8"), new Guid("7b6577b2-0a6a-c5b3-aaca-b30c33f25d7c"), "Fatima Noor", 3, "Tipper", "Truck", "Yellow", new DateTime(2021, 11, 20, 0, 0, 0, 0, DateTimeKind.Utc), "c-001", "ACME Group Holdings", "Quarry & Mining", "12.7L", "DC13-500-SC6F", 71.0, "Diesel", 27000, new DateTime(2026, 5, 29, 0, 0, 0, 0, DateTimeKind.Utc), -1.3086, 36.848300000000002, "Scania", "R500 XT", 51900, null, null, "ACME Group Holdings", "Company", 19000, "KAB 006F", new DateTime(2021, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), 17500000m, "Kenya", new DateTime(2021, 11, 20, 0, 0, 0, 0, DateTimeKind.Utc), 2, 88.0, "active", "Scania East Africa", new Guid("00000000-0000-0000-0000-000000000001"), "Automatic", "YS2P4X20005123456", 2021 },
                    { new Guid("783dc9b7-365c-8fe3-4c34-ae63ee83284b"), null, null, 2, "Curtainsider", "Truck", "Blue", new DateTime(2018, 9, 20, 0, 0, 0, 0, DateTimeKind.Utc), "c-t3-002", "QuickMart Kenya Ltd", "Inter-County", "4.6L", "4HG1-T-202C", 10.0, "Diesel", 7500, new DateTime(2026, 5, 28, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Isuzu", "NPR 75L", 129000, null, null, null, null, 4200, "KDF 202C", new DateTime(2018, 9, 5, 0, 0, 0, 0, DateTimeKind.Utc), 4100000m, "Kenya", new DateTime(2018, 9, 20, 0, 0, 0, 0, DateTimeKind.Utc), 2, null, "offline", "Isuzu East Africa", new Guid("00000000-0000-0000-0000-000000000003"), "Manual", "JALE6TE1500202003", 2018 },
                    { new Guid("7de94cc6-2982-88e8-c2da-3559a894fea5"), new Guid("f0d37f82-ded8-8ff2-a952-9ab5be53ea8d"), "Hassan Mwangi", 2, "Refrigerated", "Truck", "White", new DateTime(2021, 5, 10, 0, 0, 0, 0, DateTimeKind.Utc), "c-t2-001", "Nakuru Cold Chain Ltd", "Cold Chain", "5.2L", "4HK1-TC-7001", 74.0, "Diesel", 9000, new DateTime(2026, 5, 29, 0, 0, 0, 0, DateTimeKind.Utc), -1.2921, 36.821899999999999, "Isuzu", "FRR 90M", 38200, null, null, null, null, 5500, "KCC 100A", new DateTime(2021, 4, 20, 0, 0, 0, 0, DateTimeKind.Utc), 6800000m, "Kenya", new DateTime(2021, 5, 10, 0, 0, 0, 0, DateTimeKind.Utc), 2, 62.0, "active", "Isuzu East Africa", new Guid("00000000-0000-0000-0000-000000000002"), "Manual", "JALE6TE1200100001", 2021 },
                    { new Guid("9dd7185b-0853-96c5-d1e6-df175f4bbed1"), null, null, 2, "Panel Van", "Van", "White", new DateTime(2022, 11, 5, 0, 0, 0, 0, DateTimeKind.Utc), "c-t6-002", "Savanna Digital Commerce", "Nairobi CBD", "2.5L", "2KD-FTV-401B", 55.0, "Diesel", 3000, new DateTime(2026, 5, 29, 0, 0, 0, 0, DateTimeKind.Utc), -1.28, 36.82, "Toyota", "HiAce Panel Van", 31600, null, null, null, null, 1100, "KDE 401B", new DateTime(2022, 10, 20, 0, 0, 0, 0, DateTimeKind.Utc), 3400000m, "Kenya", new DateTime(2022, 11, 5, 0, 0, 0, 0, DateTimeKind.Utc), 2, 22.0, "active", "Toyota Kenya", new Guid("00000000-0000-0000-0000-000000000006"), "Manual", "JTGJL9BN100401002", 2022 },
                    { new Guid("b37c6374-2154-bfa8-e380-301baa2af18a"), new Guid("2599d684-837a-dde7-608f-84ecd840f619"), "Sara Malik", 3, "Box Body", "Truck", "Blue", new DateTime(2021, 7, 22, 0, 0, 0, 0, DateTimeKind.Utc), "c-012", "ACME Group — Mombasa Branch", "Port Operations", "16.1L", "D16G-750-78901", 45.0, "Diesel", 28000, new DateTime(2026, 5, 29, 0, 0, 0, 0, DateTimeKind.Utc), -1.24, 36.869999999999997, "Volvo", "FH16 750", 62100, "+254722110001", "CPR/2008/001234", "ACME Logistics Ltd", "Company", 20000, "KAB 002B", new DateTime(2021, 7, 1, 0, 0, 0, 0, DateTimeKind.Utc), 18200000m, "Kenya", new DateTime(2021, 7, 22, 0, 0, 0, 0, DateTimeKind.Utc), 2, 55.0, "active", "Volvo Trucks East Africa", new Guid("00000000-0000-0000-0000-000000000001"), "Automatic", "YV2A4C3A8NA500123", 2021 },
                    { new Guid("c189cab9-76e4-5b04-1de8-90c7a02f7532"), new Guid("d508bc6b-ad33-2380-ebaf-352f3bba5371"), "Ali Hassan", 3, "Flatbed", "Truck", "White", new DateTime(2022, 3, 10, 0, 0, 0, 0, DateTimeKind.Utc), "c-011", "ACME Group — Nairobi Branch", "Nairobi Operations", "12.8L", "OM471-A-4561", 68.0, "Diesel", 26000, new DateTime(2026, 5, 29, 0, 0, 0, 0, DateTimeKind.Utc), -1.3100000000000001, 36.829999999999998, "Mercedes-Benz", "Actros 2645", 45230, "+254722110001", "CPR/2008/001234", "ACME Logistics Ltd", "Company", 18000, "KAB 001A", new DateTime(2022, 2, 28, 0, 0, 0, 0, DateTimeKind.Utc), 14500000m, "Kenya", new DateTime(2022, 3, 10, 0, 0, 0, 0, DateTimeKind.Utc), 2, 72.0, "active", "CMC Motors Kenya", new Guid("00000000-0000-0000-0000-000000000001"), "Automatic", "WDB9634031L123456", 2022 },
                    { new Guid("c44c3bee-3748-3bef-49a8-aee25a5e2d26"), null, "James Kariuki Mwangi", 2, "SUV", "Car", "Pearl White", new DateTime(2022, 3, 10, 0, 0, 0, 0, DateTimeKind.Utc), "c-ind-001", "James Kariuki Mwangi", null, "2.8L", "1GD-FTV-5012345", 68.0, "Diesel", 2850, new DateTime(2026, 5, 29, 0, 0, 0, 0, DateTimeKind.Utc), -1.2644, 36.806199999999997, "Toyota", "Land Cruiser Prado", 24500, "+254 722 456 789", "12345678", "James Kariuki Mwangi", "Individual", 600, "KDE 501P", new DateTime(2022, 3, 1, 0, 0, 0, 0, DateTimeKind.Utc), 8500000m, "Kenya", new DateTime(2022, 3, 10, 0, 0, 0, 0, DateTimeKind.Utc), 7, 0.0, "active", "Toyota Kenya Ltd", new Guid("00000000-0000-0000-0000-000000000001"), "Automatic", "JTEBR3FJ200501234", 2022 },
                    { new Guid("c4731324-0015-4689-b173-2b5acf5fda80"), null, null, 2, "Station Wagon", "Car", "White", new DateTime(2019, 5, 22, 0, 0, 0, 0, DateTimeKind.Utc), "c-t4-002", "Nile Agro Processing", "Executive", "4.5L", "1VD-FTV-301B", 35.0, "Diesel", 3350, new DateTime(2026, 5, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Toyota", "Land Cruiser 79 Series", 88700, null, null, null, null, 900, "UBF 301B", new DateTime(2019, 5, 10, 0, 0, 0, 0, DateTimeKind.Utc), 9500000m, "Uganda", new DateTime(2019, 5, 22, 0, 0, 0, 0, DateTimeKind.Utc), 8, null, "offline", "Toyota Uganda", new Guid("00000000-0000-0000-0000-000000000004"), "Manual", "JTMHX3FH500301002", 2019 },
                    { new Guid("debe8e1b-0e14-e18a-7311-ddf05b47e365"), null, null, 2, "Box Body", "Truck", "Yellow", new DateTime(2019, 11, 12, 0, 0, 0, 0, DateTimeKind.Utc), "c-t2-002", "EastAfrica Fresh Produce", "Urban Delivery", "3.9L", "4D33-6AT-9003C", 20.0, "Diesel", 5000, new DateTime(2026, 5, 27, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Mitsubishi", "Fuso Canter 4D33", 94500, null, null, null, null, 3000, "KCC 102C", new DateTime(2019, 10, 30, 0, 0, 0, 0, DateTimeKind.Utc), 3200000m, "Kenya", new DateTime(2019, 11, 12, 0, 0, 0, 0, DateTimeKind.Utc), 2, null, "maintenance", "CMC Motors Kenya", new Guid("00000000-0000-0000-0000-000000000002"), "Manual", "JMFSNKK2WGJ102003", 2019 },
                    { new Guid("e4557749-9e52-3e01-8df5-cc79338d17fd"), new Guid("cbb32719-50f5-65fc-163f-32d5f9aaf4c6"), "Kevin Ndungu", 3, "Cargo Trike", "Motorcycle", "Yellow", new DateTime(2024, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), "c-t6-001", "Nairobi eShop Ltd", "Last-Mile Delivery", "0.2L", "DTSi-CARGO-400A", 65.0, "Petrol", 600, new DateTime(2026, 5, 29, 0, 0, 0, 0, DateTimeKind.Utc), -1.2921, 36.850000000000001, "Bajaj", "Maxima Z Cargo", 8400, null, null, null, null, 300, "KDE 400A", new DateTime(2023, 12, 20, 0, 0, 0, 0, DateTimeKind.Utc), 450000m, "Kenya", new DateTime(2024, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), 1, 28.0, "active", "Bajaj Kenya", new Guid("00000000-0000-0000-0000-000000000006"), "Automatic", "ME3RC1840PM400001", 2024 },
                    { new Guid("eeb3d93a-10c8-f3d9-90d1-bf6f82d9d4a3"), null, null, 2, "Panel Van", "Van", "Silver", new DateTime(2023, 2, 14, 0, 0, 0, 0, DateTimeKind.Utc), "c-004", "SolarRoute Ltd", "Field Services", "2.0L", "FT4-TDCI-23001", 82.0, "Diesel", 3500, new DateTime(2026, 5, 28, 0, 0, 0, 0, DateTimeKind.Utc), -1.2629999999999999, 36.805, "Ford", "Transit 350 LWB", 12050, "+254700300004", "CPR/2015/007890", "SolarRoute Ltd", "Company", 1400, "KAB 003C", new DateTime(2023, 1, 30, 0, 0, 0, 0, DateTimeKind.Utc), 3800000m, "Kenya", new DateTime(2023, 2, 14, 0, 0, 0, 0, DateTimeKind.Utc), 2, 0.0, "idle", "Ford Kenya Ltd", new Guid("00000000-0000-0000-0000-000000000001"), "Manual", "WF0XXXTTGXNB12345", 2023 },
                    { new Guid("fad28352-9c16-ef00-306c-29b60bb6c655"), new Guid("1dc03854-e633-7edf-0959-f50115dc5905"), "Kimani Mwenda", 2, "Box Body", "Truck", "White", new DateTime(2020, 8, 15, 0, 0, 0, 0, DateTimeKind.Utc), "c-t4-001", "Kampala Tiles & Hardware", "Kampala Distribution", "4.0L", "N04C-TJ-300A", 40.0, "Diesel", 6000, new DateTime(2026, 5, 29, 0, 0, 0, 0, DateTimeKind.Utc), 0.31630000000000003, 32.5822, "Hino", "300 Series 614", 64200, null, null, null, null, 3500, "UBF 300A", new DateTime(2020, 8, 1, 0, 0, 0, 0, DateTimeKind.Utc), 4800000m, "Uganda", new DateTime(2020, 8, 15, 0, 0, 0, 0, DateTimeKind.Utc), 2, 0.0, "idle", "Hino Uganda", new Guid("00000000-0000-0000-0000-000000000004"), "Manual", "JHLRD1870MC300001", 2020 },
                    { new Guid("fc44b423-58a9-a559-d16f-07e2f2586854"), new Guid("64a7790b-4b92-80a9-3a2a-03fb9d98b05f"), "James Mwangi", 2, "High-roof Van", "Van", "White", new DateTime(2022, 6, 1, 0, 0, 0, 0, DateTimeKind.Utc), "c-003", "NileTech Solutions", "Field Tech", "2.3L", "M9T-G7-22005E", 15.0, "Diesel", 3500, new DateTime(2026, 5, 28, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Renault", "Master L3H2", 34780, null, null, "NileTech Solutions", "Finance", 1300, "KAB 005E", new DateTime(2022, 5, 15, 0, 0, 0, 0, DateTimeKind.Utc), 4200000m, "Kenya", new DateTime(2022, 6, 1, 0, 0, 0, 0, DateTimeKind.Utc), 3, null, "offline", "Renault Kenya", new Guid("00000000-0000-0000-0000-000000000001"), "Manual", "VF1JMAAA5HG456789", 2022 }
                });

            migrationBuilder.InsertData(
                table: "Alerts",
                columns: new[] { "Id", "Acknowledged", "Description", "OccurredAt", "Severity", "TenantId", "Title", "Type", "VehicleId" },
                values: new object[,]
                {
                    { new Guid("74582115-f854-1471-de02-4d6e11f09db3"), false, "Vehicle left authorized zone at 14:22", new DateTime(2026, 5, 29, 0, 0, 0, 0, DateTimeKind.Utc), "critical", new Guid("00000000-0000-0000-0000-000000000001"), "Geofence breach — KAB 001A", "geofence_breach", new Guid("c189cab9-76e4-5b04-1de8-90c7a02f7532") },
                    { new Guid("81288dc9-6f04-2819-ad35-2000dd116570"), false, "Insurance expired 9 days ago. Vehicle must not operate.", new DateTime(2026, 5, 20, 0, 0, 0, 0, DateTimeKind.Utc), "critical", new Guid("00000000-0000-0000-0000-000000000001"), "Insurance expired — KAB 004D", "insurance_expired", new Guid("10067d0d-1efd-fc0c-f4a6-0b4a581c1bdd") },
                    { new Guid("d8c76e6a-46cd-e351-2d4d-5aada90c1054"), false, "Fuel level at 45%. Nearest station: 12 km", new DateTime(2026, 5, 29, 0, 0, 0, 0, DateTimeKind.Utc), "warning", new Guid("00000000-0000-0000-0000-000000000001"), "Low fuel — KAB 002B", "low_fuel", new Guid("b37c6374-2154-bfa8-e380-301baa2af18a") }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Alerts_TenantId",
                table: "Alerts",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Alerts_VehicleId",
                table: "Alerts",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_Branches_TenantId",
                table: "Branches",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_TenantId",
                table: "Customers",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Drivers_TenantId",
                table: "Drivers",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_RolePermissions_RoleId_ModuleId",
                table: "RolePermissions",
                columns: new[] { "RoleId", "ModuleId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_Slug",
                table: "Tenants",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_TenantId",
                table: "Users",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_TenantId",
                table: "Vehicles",
                column: "TenantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Alerts");

            migrationBuilder.DropTable(
                name: "Branches");

            migrationBuilder.DropTable(
                name: "Customers");

            migrationBuilder.DropTable(
                name: "Drivers");

            migrationBuilder.DropTable(
                name: "RolePermissions");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Vehicles");

            migrationBuilder.DropTable(
                name: "Tenants");
        }
    }
}
