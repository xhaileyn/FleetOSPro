using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FleetOS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDevicesSimsTripsSubscriptionsRolesAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AuditEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ShortId = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Actor = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    ActorRole = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Action = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Resource = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    ResourceId = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Outcome = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Details = table.Column<string>(type: "text", nullable: false),
                    CrossTenantAttempt = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditEvents_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BackupRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    BackupId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SizeGb = table.Column<decimal>(type: "numeric", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    EncryptedWith = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    StorageLocation = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    RpoHours = table.Column<int>(type: "integer", nullable: false),
                    RtoHours = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BackupRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BackupRecords_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CustomPlans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ShortId = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Tagline = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Price = table.Column<decimal>(type: "numeric", nullable: false),
                    Color = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Highlight = table.Column<bool>(type: "boolean", nullable: false),
                    ServicesJson = table.Column<string>(type: "text", nullable: false),
                    LimitsJson = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    VehicleCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateOnly>(type: "date", nullable: false),
                    UpdatedAt = table.Column<DateOnly>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomPlans_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Devices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ShortId = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    VehicleShortId = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    VehiclePlate = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Type = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Model = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SerialNo = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Imei = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Firmware = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Signal = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Battery = table.Column<int>(type: "integer", nullable: true),
                    LastSeen = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    SimShortId = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    InstalledAt = table.Column<DateOnly>(type: "date", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Devices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Devices_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EncryptionKeys",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    KeyId = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Algorithm = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    BitLength = table.Column<int>(type: "integer", nullable: false),
                    Created = table.Column<DateOnly>(type: "date", nullable: false),
                    LastRotated = table.Column<DateOnly>(type: "date", nullable: false),
                    NextRotation = table.Column<DateOnly>(type: "date", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    KmsProvider = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EncryptionKeys", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EncryptionKeys_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SimCards",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ShortId = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    VehicleShortId = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    VehiclePlate = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Iccid = table.Column<string>(type: "character varying(22)", maxLength: 22, nullable: false),
                    Msisdn = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Operator = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Country = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Type = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DataUsedMb = table.Column<int>(type: "integer", nullable: false),
                    DataPlanMb = table.Column<int>(type: "integer", nullable: false),
                    Apn = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    ActivatedAt = table.Column<DateOnly>(type: "date", nullable: false),
                    ExpiresAt = table.Column<DateOnly>(type: "date", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SimCards", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SimCards_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TenantCustomRoles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ShortId = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Slug = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Description = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Color = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    UserCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateOnly>(type: "date", nullable: false),
                    PermissionsJson = table.Column<string>(type: "text", nullable: false),
                    FeaturePermissionsJson = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TenantCustomRoles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TenantCustomRoles_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Trips",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ShortId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    VehicleShortId = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Date = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    DateIso = table.Column<string>(type: "character varying(12)", maxLength: 12, nullable: false),
                    From = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    To = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    DistanceKm = table.Column<double>(type: "double precision", nullable: false),
                    DurationMin = table.Column<int>(type: "integer", nullable: false),
                    AvgSpeed = table.Column<double>(type: "double precision", nullable: false),
                    MaxSpeed = table.Column<double>(type: "double precision", nullable: false),
                    FuelUsedL = table.Column<double>(type: "double precision", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    RouteJson = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Trips", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Trips_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VehicleSubscriptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VehicleShortId = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Plan = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CustomPlanId = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    ExpiryDate = table.Column<DateOnly>(type: "date", nullable: false),
                    AutoRenew = table.Column<bool>(type: "boolean", nullable: false),
                    ContactEmail = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    SmsNumbersJson = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VehicleSubscriptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VehicleSubscriptions_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "AuditEvents",
                columns: new[] { "Id", "Action", "Actor", "ActorRole", "CrossTenantAttempt", "Details", "IpAddress", "Outcome", "Resource", "ResourceId", "ShortId", "TenantId", "Timestamp" },
                values: new object[,]
                {
                    { new Guid("2e15e881-0c9f-4acb-1a80-89406f0aabd4"), "CROSS_TENANT_BLOCK", "UNKNOWN", "none", true, "Tenant 4 credentials used to probe Tenant 1 endpoint. Blocked.", "41.202.212.1", "blocked", "vehicles", "v2", "ae-008", new Guid("00000000-0000-0000-0000-000000000004"), new DateTime(2026, 5, 26, 15, 27, 15, 0, DateTimeKind.Utc) },
                    { new Guid("3bb5291f-a2c6-25db-e1e8-a1bd7e1ef378"), "VEHICLE_UPDATE", "manager@acmelogistics.co.ke", "fleet_manager", false, "Updated assignment for KAB 003C — new customer SolarRoute Ltd.", "197.248.1.11", "success", "vehicles", "v3", "ae-002", new Guid("00000000-0000-0000-0000-000000000001"), new DateTime(2026, 5, 26, 15, 40, 5, 0, DateTimeKind.Utc) },
                    { new Guid("69b98de6-032b-ceaf-5391-398953f60459"), "VEHICLE_VIEW", "admin@acmelogistics.co.ke", "fleet_admin", false, "Viewed vehicle KAB 001A master data.", "197.248.1.10", "success", "vehicles", "v1", "ae-001", new Guid("00000000-0000-0000-0000-000000000001"), new DateTime(2026, 5, 26, 15, 42, 11, 0, DateTimeKind.Utc) },
                    { new Guid("741aa799-9408-76aa-e59c-18d54a91884d"), "USER_INVITE", "admin@acmelogistics.co.ke", "fleet_admin", false, "Invited new user dispatch2@acmelogistics.co.ke with dispatcher role.", "197.248.1.10", "success", "users", "u-107", "ae-004", new Guid("00000000-0000-0000-0000-000000000001"), new DateTime(2026, 5, 26, 15, 35, 0, 0, DateTimeKind.Utc) },
                    { new Guid("89047149-17ee-659e-dd99-31fb56d46525"), "CROSS_TENANT_BLOCK", "SYSTEM", "system", true, "Tenant 3 token attempted access to Tenant 1 vehicle v1. Blocked.", "41.90.64.22", "blocked", "vehicles", "v1", "ae-003", new Guid("00000000-0000-0000-0000-000000000003"), new DateTime(2026, 5, 26, 15, 38, 22, 0, DateTimeKind.Utc) },
                    { new Guid("a1aa95d2-ed2a-e4c8-b744-a8a33745a48d"), "BACKUP_VERIFY", "admin@acmelogistics.co.ke", "fleet_admin", false, "Manual backup integrity check passed for snapshot bkp-acme-240.", "197.248.1.10", "success", "backups", "bkp-acme-240", "ae-011", new Guid("00000000-0000-0000-0000-000000000001"), new DateTime(2026, 5, 26, 15, 18, 5, 0, DateTimeKind.Utc) },
                    { new Guid("c26d7585-c3a0-64c5-0650-e67b4f47441a"), "KEY_ROTATION_START", "admin@swiftdeliver.co.ke", "fleet_admin", false, "AES-256 key rotation initiated for SwiftDeliver EA tenant.", "41.90.88.3", "success", "encryption", "kms-key-sde-2024-006", "ae-012", new Guid("00000000-0000-0000-0000-000000000006"), new DateTime(2026, 5, 26, 15, 15, 0, 0, DateTimeKind.Utc) },
                    { new Guid("ce659105-9c94-efbd-395f-31533bd8e830"), "DOCUMENT_UPLOAD", "manager@swiftcargo.co.ke", "fleet_manager", false, "Uploaded renewed insurance certificate for KCC 101B.", "154.122.3.9", "success", "documents", "doc-v8-ins", "ae-006", new Guid("00000000-0000-0000-0000-000000000002"), new DateTime(2026, 5, 26, 15, 30, 50, 0, DateTimeKind.Utc) },
                    { new Guid("d84cd3b5-2cc6-bb76-e797-09573d4b7dcb"), "LOGIN_ATTEMPT", "admin@kimtransport.co.ug", "fleet_admin", false, "Login blocked — tenant account is Suspended.", "41.202.212.1", "blocked", "auth", "session", "ae-007", new Guid("00000000-0000-0000-0000-000000000004"), new DateTime(2026, 5, 26, 15, 28, 40, 0, DateTimeKind.Utc) },
                    { new Guid("dcb2ea27-37d8-ba54-6120-5b485e81b918"), "ALERT_ACK", "dispatch@acmelogistics.co.ke", "dispatcher", false, "Alert alt-33 acknowledged: KAB 004D speeding event.", "197.248.1.19", "success", "alerts", "alt-33", "ae-009", new Guid("00000000-0000-0000-0000-000000000001"), new DateTime(2026, 5, 26, 15, 25, 0, 0, DateTimeKind.Utc) },
                    { new Guid("e6dab769-3f82-c1cc-3ac3-3b72841d982e"), "REPORT_EXPORT", "admin@peakfleet.co.tz", "fleet_admin", false, "Exported monthly fuel cost report for May 2026 (tenant-scoped data).", "102.177.2.44", "success", "reports", "rpt-88", "ae-005", new Guid("00000000-0000-0000-0000-000000000005"), new DateTime(2026, 5, 26, 15, 33, 18, 0, DateTimeKind.Utc) },
                    { new Guid("e8723df7-5f26-f1a7-8fe3-a022c3a23924"), "RBAC_DENY", "billing@peakfleet.co.tz", "billing_admin", false, "billing_admin role does not have access to vehicles. 403 returned.", "102.177.2.50", "blocked", "vehicles", "v15", "ae-010", new Guid("00000000-0000-0000-0000-000000000005"), new DateTime(2026, 5, 26, 15, 22, 33, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.InsertData(
                table: "BackupRecords",
                columns: new[] { "Id", "BackupId", "CompletedAt", "EncryptedWith", "RpoHours", "RtoHours", "SizeGb", "StartedAt", "Status", "StorageLocation", "TenantId", "Type" },
                values: new object[,]
                {
                    { new Guid("17147dec-266b-cdd7-a49f-5f827e7a9c54"), "bkp-sde-010", new DateTime(2026, 5, 26, 7, 1, 30, 0, DateTimeKind.Utc), "kms-key-sde-2024-006", 48, 12, 0.3m, new DateTime(2026, 5, 26, 7, 0, 0, 0, DateTimeKind.Utc), "Completed", "s3://fleetos-backups-af/tenant_6/", new Guid("00000000-0000-0000-0000-000000000006"), "Snapshot" },
                    { new Guid("93fdce24-67a9-6242-e6a5-43a14fb35372"), "bkp-swift-120", new DateTime(2026, 5, 26, 7, 9, 40, 0, DateTimeKind.Utc), "kms-key-swift-2024-002", 24, 6, 3.8m, new DateTime(2026, 5, 26, 7, 0, 0, 0, DateTimeKind.Utc), "Completed", "s3://fleetos-backups-af/tenant_2/", new Guid("00000000-0000-0000-0000-000000000002"), "Full" },
                    { new Guid("cc5f4d14-a9c5-d105-a3f0-9d5f9dbb0dee"), "bkp-acme-240", new DateTime(2026, 5, 26, 7, 38, 12, 0, DateTimeKind.Utc), "kms-key-acme-2024-001", 24, 4, 14.2m, new DateTime(2026, 5, 26, 7, 0, 0, 0, DateTimeKind.Utc), "Completed", "s3://fleetos-backups-af/tenant_1/", new Guid("00000000-0000-0000-0000-000000000001"), "Full" },
                    { new Guid("cef2aa26-d99a-2d94-2063-b0c13788aa1a"), "bkp-kim-055", new DateTime(2026, 5, 25, 7, 3, 10, 0, DateTimeKind.Utc), "kms-key-kim-2024-004", 48, 8, 0.2m, new DateTime(2026, 5, 25, 7, 0, 0, 0, DateTimeKind.Utc), "Completed", "s3://fleetos-backups-af/tenant_4/", new Guid("00000000-0000-0000-0000-000000000004"), "Incremental" },
                    { new Guid("d8aaac8f-f492-cdd2-2f7f-48a5d6f913af"), "bkp-nex-088", new DateTime(2026, 5, 26, 7, 4, 55, 0, DateTimeKind.Utc), "kms-key-nex-2024-003", 24, 6, 0.9m, new DateTime(2026, 5, 26, 7, 0, 0, 0, DateTimeKind.Utc), "Completed", "s3://fleetos-backups-af/tenant_3/", new Guid("00000000-0000-0000-0000-000000000003"), "Full" },
                    { new Guid("fdefe294-fc39-f17b-2fb2-73d337ae2203"), "bkp-peak-310", new DateTime(2026, 5, 26, 7, 25, 18, 0, DateTimeKind.Utc), "kms-key-peak-2024-005", 24, 4, 9.6m, new DateTime(2026, 5, 26, 7, 0, 0, 0, DateTimeKind.Utc), "Completed", "s3://fleetos-backups-af/tenant_5/", new Guid("00000000-0000-0000-0000-000000000005"), "Full" }
                });

            migrationBuilder.InsertData(
                table: "CustomPlans",
                columns: new[] { "Id", "Color", "CreatedAt", "Highlight", "IsDefault", "LimitsJson", "Name", "Price", "ServicesJson", "ShortId", "Status", "Tagline", "TenantId", "UpdatedAt", "VehicleCount" },
                values: new object[,]
                {
                    { new Guid("22bff85b-8679-580a-d505-5669c4e25eb3"), "#7c3aed", new DateOnly(2025, 9, 1), true, false, "{\"smsPerMonth\":250,\"gpsRefreshSec\":15,\"routeHistoryDays\":365,\"reportsPerMonth\":\"unlimited\"}", "ACME Premium Control", 89m, "[\"web_access\",\"live_tracking\",\"on_call_location\",\"route_playback\",\"sms_alert\",\"geofence_alert\",\"maintenance_alerts\",\"engine_cut\",\"door_lock\",\"driver_behaviour\",\"fuel_monitoring\",\"reports\"]", "cp-acme-premium", "active", "Full control suite with engine cut & door lock", new Guid("00000000-0000-0000-0000-000000000001"), new DateOnly(2026, 3, 1), 2 },
                    { new Guid("9a3f639b-fdbd-0556-dcd1-3975e79b22c9"), "#0891b2", new DateOnly(2026, 1, 15), false, false, "{\"smsPerMonth\":50,\"gpsRefreshSec\":60,\"routeHistoryDays\":30,\"reportsPerMonth\":5}", "Personal Tracker", 25m, "[\"web_access\",\"live_tracking\",\"on_call_location\",\"sms_alert\",\"geofence_alert\"]", "cp-personal-tracker", "active", "Designed for individual vehicle owners", new Guid("00000000-0000-0000-0000-000000000001"), new DateOnly(2026, 1, 15), 1 },
                    { new Guid("b305734e-a171-df17-290b-8ebdf8dfad22"), "#d97706", new DateOnly(2025, 6, 1), false, true, "{\"smsPerMonth\":100,\"gpsRefreshSec\":30,\"routeHistoryDays\":90,\"reportsPerMonth\":20}", "ACME Fleet Standard", 55m, "[\"web_access\",\"live_tracking\",\"on_call_location\",\"sms_alert\",\"maintenance_alerts\",\"geofence_alert\",\"reports\"]", "cp-acme-standard", "active", "Optimised for long-haul haulage operations", new Guid("00000000-0000-0000-0000-000000000001"), new DateOnly(2026, 1, 15), 4 },
                    { new Guid("c2b01015-dd96-98fb-5764-397cb3eae7cb"), "#6b7280", new DateOnly(2026, 4, 10), false, false, "{\"smsPerMonth\":20,\"routeHistoryDays\":30,\"reportsPerMonth\":5}", "ACME Lite", 12m, "[\"web_access\",\"on_call_location\"]", "cp-acme-lite-draft", "draft", "Low-cost plan for yard / inactive vehicles", new Guid("00000000-0000-0000-0000-000000000001"), new DateOnly(2026, 4, 10), 0 }
                });

            migrationBuilder.InsertData(
                table: "Devices",
                columns: new[] { "Id", "Battery", "Firmware", "Imei", "InstalledAt", "LastSeen", "Model", "Notes", "SerialNo", "ShortId", "Signal", "SimShortId", "Status", "TenantId", "Type", "VehiclePlate", "VehicleShortId" },
                values: new object[,]
                {
                    { new Guid("0472855a-fe51-20aa-b7b0-b09825fa7a3e"), null, "03.28.07", "356309040300001", new DateOnly(2023, 6, 1), "Just now", "Teltonika FMB920", "High-frequency position updates (10 sec).", "TLT-FMB-010A", "dev-v10-gps", "Strong", "sim-v10-p", "Online", new Guid("00000000-0000-0000-0000-000000000003"), "GPS Tracker", "KDF 200A", "v10" },
                    { new Guid("06d11e38-f0b4-ef40-b7ac-0ca2cc4267bf"), null, "03.27.14", "356311040500001", new DateOnly(2023, 8, 15), "Just now", "Teltonika FMB140", "Dual-SIM Vodacom/Tigo for Tanzania coverage.", "TLT-FMB-015A", "dev-v15-gps", "Strong", "sim-v15-p", "Online", new Guid("00000000-0000-0000-0000-000000000005"), "GPS Tracker", "T200AAA", "v15" },
                    { new Guid("06f4c9c3-547a-73f8-2493-8d0183493ed9"), null, "03.28.07", "356307040123461", new DateOnly(2023, 3, 15), "6 hr ago", "Teltonika FMB920", "Vehicle in maintenance bay — no signal.", "TLT-FMB-006F", "dev-v6-gps", "None", "sim-v6-p", "Offline", new Guid("00000000-0000-0000-0000-000000000001"), "GPS Tracker", "KAB 006F", "v6" },
                    { new Guid("0709f7ec-d74e-1d1d-12c2-8a01043b1713"), null, "03.28.07", "356307040123459", new DateOnly(2023, 1, 20), "3 min ago", "Teltonika FMB920", "Paired with dashcam dev-v4-cam.", "TLT-FMB-004D", "dev-v4-gps", "Strong", "sim-v4-p", "Online", new Guid("00000000-0000-0000-0000-000000000001"), "GPS Tracker", "KAB 004D", "v4" },
                    { new Guid("19dd8f8b-30a5-88d5-8960-be403ac3c5dd"), null, "2.1.0", "356312040600051", new DateOnly(2023, 10, 1), "Just now", "Ruptela OBD Tracker", "Driver behaviour scoring enabled.", "RUP-OBD-019A", "dev-v19-obd", "Strong", null, "Online", new Guid("00000000-0000-0000-0000-000000000006"), "OBD Dongle", "KDE 400A", "v19" },
                    { new Guid("1d0fbee6-6a6f-cea2-a7b0-b43ca18e18b7"), null, "2.3.1", "356311040500052", new DateOnly(2023, 9, 15), "5 min ago", "Tecnoton FLS-100", "Long-haul truck — fuel theft prevention.", "TCN-FLS-017C", "dev-v17-fue", "Medium", null, "Online", new Guid("00000000-0000-0000-0000-000000000005"), "Fuel Sensor", "T202CCC", "v17" },
                    { new Guid("23c81d15-6235-a282-f542-70b4c3e58a57"), 72, "1.0.3", "356307040123492", new DateOnly(2023, 3, 15), "6 hr ago", "Reefer-Track RT200", "Cargo temperature probe. Cold-chain monitoring.", "RFT-RT200-006F", "dev-v6-tmp", "None", null, "Offline", new Guid("00000000-0000-0000-0000-000000000001"), "Temp Sensor", "KAB 006F", "v6" },
                    { new Guid("2566d50f-8a69-c1c6-e153-05a79a960f7c"), null, "7.2.1", "356307040123490", new DateOnly(2023, 1, 15), "Just now", "CalAmp LMU-3030", "Reads engine diagnostics via CAN bus.", "CAL-OBD-001A", "dev-v1-obd", "Strong", null, "Online", new Guid("00000000-0000-0000-0000-000000000001"), "OBD Dongle", "KAB 001A", "v1" },
                    { new Guid("2c9c476f-8e57-0c09-90e5-3beac17704b1"), null, "04.00.09", "356310040400002", new DateOnly(2023, 8, 1), "8 min ago", "Ruptela FM-Eco4+", "", "RUP-ECO4-014B", "dev-v14-gps", "Medium", "sim-v14-p", "Online", new Guid("00000000-0000-0000-0000-000000000004"), "GPS Tracker", "UBF 301B", "v14" },
                    { new Guid("3d436086-ac0a-5b51-c7b0-7c7d0052bf54"), null, "v5.2.0", "356308040200002", new DateOnly(2023, 4, 10), "2 min ago", "Queclink GV55", "", "QLK-GV55-008B", "dev-v8-gps", "Strong", "sim-v8-p", "Online", new Guid("00000000-0000-0000-0000-000000000002"), "GPS Tracker", "KCC 101B", "v8" },
                    { new Guid("3f9409bc-b1ea-75b0-c2e3-54b2c14969c3"), 62, "2.1.0", "356307040123458", new DateOnly(2023, 2, 10), "2 min ago", "Ruptela OBD Tracker", "Self-powered via OBD port.", "RUP-OBD-003C", "dev-v3-obd", "Medium", "sim-v3-p", "Online", new Guid("00000000-0000-0000-0000-000000000001"), "OBD Dongle", "KAB 003C", "v3" },
                    { new Guid("4d94c6d6-956e-1458-22ca-580d19451500"), null, "04.00.09", "356310040400001", new DateOnly(2023, 7, 10), "Just now", "Ruptela FM-Eco4+", "Dual-SIM MTN primary / Airtel backup for KE-UG-TZ cross-border.", "RUP-ECO4-013A", "dev-v13-gps", "Strong", "sim-v13-p", "Online", new Guid("00000000-0000-0000-0000-000000000004"), "GPS Tracker", "UBF 300A", "v13" },
                    { new Guid("58a9cd8f-1565-083b-04e2-06c4468ea038"), null, "03.28.07", "356312040600001", new DateOnly(2023, 10, 1), "Just now", "Teltonika FMB920", "E-commerce delivery. 40+ stops/day.", "TLT-FMB-019A", "dev-v19-gps", "Strong", "sim-v19-p", "Online", new Guid("00000000-0000-0000-0000-000000000006"), "GPS Tracker", "KDE 400A", "v19" },
                    { new Guid("606f9d08-7288-9c6b-7cb5-46c3e0511bc4"), null, "v5.2.0", "356308040200001", new DateOnly(2023, 4, 1), "Just now", "Queclink GV55", "Dual-SIM enabled for interstate routes.", "QLK-GV55-007A", "dev-v7-gps", "Strong", "sim-v7-p", "Online", new Guid("00000000-0000-0000-0000-000000000002"), "GPS Tracker", "KCC 100A", "v7" },
                    { new Guid("75634594-bdf1-8b09-b218-87e9afa244fc"), null, "03.27.14", "356311040500003", new DateOnly(2023, 9, 15), "5 min ago", "Teltonika FMB140", "", "TLT-FMB-017C", "dev-v17-gps", "Medium", "sim-v17-p", "Online", new Guid("00000000-0000-0000-0000-000000000005"), "GPS Tracker", "T202CCC", "v17" },
                    { new Guid("863f0db4-5a18-4234-c47e-2ffd26bc39a4"), null, "03.27.14", "356308040200003", new DateOnly(2023, 5, 1), "4 min ago", "Teltonika FMB140", "Refrigerated truck — paired temp probe.", "TLT-FMB-009C", "dev-v9-gps", "Strong", "sim-v9-p", "Online", new Guid("00000000-0000-0000-0000-000000000002"), "GPS Tracker", "KCC 102C", "v9" },
                    { new Guid("8ae1fba1-a5e7-6d91-75e0-9ba5e7dc9d97"), null, "1.012_23", "356311040500051", new DateOnly(2023, 8, 15), "Just now", "BlackVue DR750X-2CH", "Driver-monitoring AI dashcam.", "BVX-015A-CAM", "dev-v15-cam", "Strong", null, "Online", new Guid("00000000-0000-0000-0000-000000000005"), "Dashcam", "T200AAA", "v15" },
                    { new Guid("9a66adce-37c7-fe4a-9eb4-c1158b94e565"), null, "3.4.0", "356308040200050", new DateOnly(2023, 4, 1), "Just now", "Viofo A129 Pro", "GPS logger + 4K dashcam.", "VIO-A129-007A", "dev-v7-cam", "Strong", null, "Online", new Guid("00000000-0000-0000-0000-000000000002"), "Dashcam", "KCC 100A", "v7" },
                    { new Guid("a49ff41d-8fde-0c8d-06f7-1853ec334847"), null, "v5.1.8", "356311040500004", new DateOnly(2024, 1, 10), "2 days ago", "Queclink GV55", "Vehicle in workshop — firmware update pending.", "QLK-GV55-018D", "dev-v18-gps", "None", "sim-v18-p", "Maintenance", new Guid("00000000-0000-0000-0000-000000000005"), "GPS Tracker", "T203DDD", "v18" },
                    { new Guid("a554afae-14b8-00ba-408f-eaf5c655b603"), null, "v5.2.0", "356309040300003", new DateOnly(2023, 7, 1), "3 min ago", "Queclink GV55", "", "QLK-GV55-012C", "dev-v12-gps", "Medium", "sim-v12-p", "Online", new Guid("00000000-0000-0000-0000-000000000003"), "GPS Tracker", "KDF 202C", "v12" },
                    { new Guid("a876d825-9b29-97d0-b8d0-eba6db80636a"), null, "03.27.14", "356311040500002", new DateOnly(2023, 9, 1), "2 min ago", "Teltonika FMB140", "", "TLT-FMB-016B", "dev-v16-gps", "Strong", "sim-v16-p", "Online", new Guid("00000000-0000-0000-0000-000000000005"), "GPS Tracker", "T201BBB", "v16" },
                    { new Guid("b1505c76-7a18-1e93-c785-a6f37c95332c"), null, "03.28.07", "356312040600002", new DateOnly(2023, 10, 15), "3 min ago", "Teltonika FMB920", "", "TLT-FMB-020B", "dev-v20-gps", "Strong", "sim-v20-p", "Online", new Guid("00000000-0000-0000-0000-000000000006"), "GPS Tracker", "KDE 401B", "v20" },
                    { new Guid("b56a99ab-ed3d-fde4-2a0e-e1be82de44e5"), null, "03.28.07", "356309040300002", new DateOnly(2023, 6, 15), "1 min ago", "Teltonika FMB920", "", "TLT-FMB-011B", "dev-v11-gps", "Strong", "sim-v11-p", "Online", new Guid("00000000-0000-0000-0000-000000000003"), "GPS Tracker", "KDF 201B", "v11" },
                    { new Guid("ba007d15-9c04-c69c-7fac-2d4718027828"), null, "1.005_23", "356307040123491", new DateOnly(2023, 1, 20), "3 min ago", "BlackVue DR900X-2CH", "Front + rear 4K recording. Parking mode enabled.", "BVX-004D-CAM", "dev-v4-cam", "Strong", "sim-v4-b", "Online", new Guid("00000000-0000-0000-0000-000000000001"), "Dashcam", "KAB 004D", "v4" },
                    { new Guid("beb16e69-23f9-5dfd-5dee-be215352ffe1"), 45, "v5.1.8", "356307040123460", new DateOnly(2023, 3, 1), "5 min ago", "Queclink GV55", "Battery weak — charge check scheduled.", "QLK-GV55-005E", "dev-v5-gps", "Weak", "sim-v5-p", "Online", new Guid("00000000-0000-0000-0000-000000000001"), "GPS Tracker", "KAB 005E", "v5" },
                    { new Guid("d277003f-29d7-08ad-1528-1cb75e6691e6"), 88, "1.0.3", "356308040200051", new DateOnly(2023, 5, 1), "4 min ago", "Reefer-Track RT200", "Multi-zone temp probe — +2°C to +8°C range.", "RFT-RT200-009C", "dev-v9-tmp", "Strong", null, "Online", new Guid("00000000-0000-0000-0000-000000000002"), "Temp Sensor", "KCC 102C", "v9" },
                    { new Guid("e1ee6c71-d8fd-9331-d06f-a8573137cf73"), null, "2.3.1", "356310040400051", new DateOnly(2023, 7, 10), "Just now", "Tecnoton FLS-100", "Ultrasonic fuel-level sensor. Reduces siphoning risk.", "TCN-FLS-013A", "dev-v13-fue", "Strong", null, "Online", new Guid("00000000-0000-0000-0000-000000000004"), "Fuel Sensor", "UBF 300A", "v13" },
                    { new Guid("ea2b5bd4-35d0-1d97-1910-5422b2602940"), null, "7.2.1", "356309040300051", new DateOnly(2023, 6, 1), "Just now", "CalAmp LMU-3030", "Harsh braking & acceleration monitoring.", "CAL-OBD-010A", "dev-v10-obd", "Strong", null, "Online", new Guid("00000000-0000-0000-0000-000000000003"), "OBD Dongle", "KDF 200A", "v10" },
                    { new Guid("eb1ae88b-1059-909d-b89f-c4ce0abcc5ee"), null, "03.28.07", "356307040123457", new DateOnly(2023, 2, 1), "1 min ago", "Teltonika FMB920", "", "TLT-FMB-002B", "dev-v2-gps", "Strong", "sim-v2-p", "Online", new Guid("00000000-0000-0000-0000-000000000001"), "GPS Tracker", "KAB 002B", "v2" },
                    { new Guid("f86adcbe-ddeb-65c7-8215-2deaf7b5466a"), null, "03.28.07", "356307040123456", new DateOnly(2023, 1, 15), "Just now", "Teltonika FMB920", "Dual-SIM failover configured.", "TLT-FMB-001A", "dev-v1-gps", "Strong", "sim-v1-p", "Online", new Guid("00000000-0000-0000-0000-000000000001"), "GPS Tracker", "KAB 001A", "v1" }
                });

            migrationBuilder.InsertData(
                table: "EncryptionKeys",
                columns: new[] { "Id", "Algorithm", "BitLength", "Created", "KeyId", "KmsProvider", "LastRotated", "NextRotation", "Status", "TenantId" },
                values: new object[,]
                {
                    { new Guid("0c87bae5-1bd6-121b-b978-cbe65621f8f1"), "AES-256-GCM", 256, new DateOnly(2024, 1, 15), "kms-key-acme-2024-001", "AWS KMS af-south-1", new DateOnly(2026, 1, 15), new DateOnly(2027, 1, 15), "Active", new Guid("00000000-0000-0000-0000-000000000001") },
                    { new Guid("76bc7c21-6820-d502-5334-3a1e7e348e86"), "AES-256-GCM", 256, new DateOnly(2024, 4, 10), "kms-key-nex-2024-003", "AWS KMS af-south-1", new DateOnly(2026, 4, 10), new DateOnly(2027, 4, 10), "Active", new Guid("00000000-0000-0000-0000-000000000003") },
                    { new Guid("80faf891-a28e-8c90-2877-60be52567c3f"), "AES-256-GCM", 256, new DateOnly(2024, 2, 20), "kms-key-kim-2024-004", "AWS KMS af-south-1", new DateOnly(2025, 2, 20), new DateOnly(2026, 2, 20), "Scheduled", new Guid("00000000-0000-0000-0000-000000000004") },
                    { new Guid("a8365952-da05-e876-fa7c-085ee4afb49a"), "AES-256-GCM", 256, new DateOnly(2023, 12, 1), "kms-key-peak-2024-005", "AWS KMS af-south-1", new DateOnly(2025, 12, 1), new DateOnly(2026, 12, 1), "Active", new Guid("00000000-0000-0000-0000-000000000005") },
                    { new Guid("cbe590f8-af6c-8087-9c5f-28b61fbbf83c"), "AES-256-GCM", 256, new DateOnly(2024, 3, 1), "kms-key-swift-2024-002", "AWS KMS af-south-1", new DateOnly(2026, 3, 1), new DateOnly(2027, 3, 1), "Active", new Guid("00000000-0000-0000-0000-000000000002") },
                    { new Guid("f99d6536-6d4d-5c18-f0ad-608fcd02dee0"), "AES-256-GCM", 256, new DateOnly(2024, 5, 1), "kms-key-sde-2024-006", "AWS KMS af-south-1", new DateOnly(2026, 5, 1), new DateOnly(2027, 5, 1), "Rotating", new Guid("00000000-0000-0000-0000-000000000006") }
                });

            migrationBuilder.InsertData(
                table: "SimCards",
                columns: new[] { "Id", "ActivatedAt", "Apn", "Country", "DataPlanMb", "DataUsedMb", "ExpiresAt", "Iccid", "Msisdn", "Notes", "Operator", "ShortId", "Status", "TenantId", "Type", "VehiclePlate", "VehicleShortId" },
                values: new object[,]
                {
                    { new Guid("05d06784-1e11-5a46-9e0c-7624b0654f7b"), new DateOnly(2023, 1, 20), "data.safaricom.com", "Kenya", 10240, 6210, new DateOnly(2026, 12, 31), "89254030012345678907", "+254722001007", "High-usage vehicle — dashcam also active.", "Safaricom", "sim-v4-p", "Active", new Guid("00000000-0000-0000-0000-000000000001"), "Primary", "KAB 004D", "v4" },
                    { new Guid("0f509c58-2ba3-524a-c3e6-74a19752c1bf"), new DateOnly(2023, 9, 15), "internet", "Tanzania", 10240, 3980, new DateOnly(2026, 12, 31), "89255060051234567005", "+255754005005", "", "Vodacom Tanzania", "sim-v17-p", "Active", new Guid("00000000-0000-0000-0000-000000000005"), "Primary", "T202CCC", "v17" },
                    { new Guid("135c780a-dc04-d277-9c2a-f92605fb4036"), new DateOnly(2023, 3, 1), "data.safaricom.com", "Kenya", 5120, 1820, new DateOnly(2026, 12, 31), "89254030012345678909", "+254722001009", "", "Safaricom", "sim-v5-p", "Active", new Guid("00000000-0000-0000-0000-000000000001"), "Primary", "KAB 005E", "v5" },
                    { new Guid("17433059-d1ad-645a-54ff-a2cc98a30fc7"), new DateOnly(2023, 6, 1), "internet.telkom.co.ke", "Kenya", 2048, 310, new DateOnly(2026, 12, 31), "89254070034567890002", "+254700003002", "Telkom backup for CBD coverage.", "Telkom Kenya", "sim-v10-b", "Active", new Guid("00000000-0000-0000-0000-000000000003"), "Backup", "KDF 200A", "v10" },
                    { new Guid("18d581c4-e454-35b7-ad51-1d0050818fa1"), new DateOnly(2023, 2, 10), "data.safaricom.com", "Kenya", 10240, 2910, new DateOnly(2026, 12, 31), "89254030012345678905", "+254722001005", "OBD dongle SIM.", "Safaricom", "sim-v3-p", "Active", new Guid("00000000-0000-0000-0000-000000000001"), "Primary", "KAB 003C", "v3" },
                    { new Guid("286c66c6-51dc-c3b1-8eab-dbb648ec9ecd"), new DateOnly(2023, 8, 15), "internet", "Tanzania", 10240, 5670, new DateOnly(2026, 12, 31), "89255060051234567001", "+255754005001", "Teltonika FMB140 primary.", "Vodacom Tanzania", "sim-v15-p", "Active", new Guid("00000000-0000-0000-0000-000000000005"), "Primary", "T200AAA", "v15" },
                    { new Guid("28889994-7698-e8f2-4976-24fdf82ab4cb"), new DateOnly(2023, 10, 1), "internet", "Kenya", 2048, 145, new DateOnly(2026, 12, 31), "89254040062345678002", "+254733006002", "", "Airtel Kenya", "sim-v19-b", "Active", new Guid("00000000-0000-0000-0000-000000000006"), "Backup", "KDE 400A", "v19" },
                    { new Guid("2bedc11d-cad3-a054-6fb2-37ea8c3b3587"), new DateOnly(2023, 7, 10), "internet.mtn.co.ug", "Uganda", 10240, 3450, new DateOnly(2026, 12, 31), "89256040041234567001", "+256772004001", "Ruptela FM-Eco4+ primary SIM.", "MTN Uganda", "sim-v13-p", "Active", new Guid("00000000-0000-0000-0000-000000000004"), "Primary", "UBF 300A", "v13" },
                    { new Guid("2f9f8f4e-f226-90de-af9d-1c0cb2e6c06d"), new DateOnly(2023, 4, 1), "data.safaricom.com", "Kenya", 10240, 5230, new DateOnly(2026, 12, 31), "89254030023456789001", "+254722002001", "Queclink GV55 primary.", "Safaricom", "sim-v7-p", "Active", new Guid("00000000-0000-0000-0000-000000000002"), "Primary", "KCC 100A", "v7" },
                    { new Guid("3fbfa589-8e49-8a84-d07b-0e9b3e59fdf7"), new DateOnly(2023, 2, 1), "data.safaricom.com", "Kenya", 10240, 3540, new DateOnly(2026, 12, 31), "89254030012345678903", "+254722001003", "", "Safaricom", "sim-v2-p", "Active", new Guid("00000000-0000-0000-0000-000000000001"), "Primary", "KAB 002B", "v2" },
                    { new Guid("6bf78dd3-05f9-f196-d259-03c0ebf434a0"), new DateOnly(2023, 7, 10), "internet.ug", "Uganda", 2048, 95, new DateOnly(2026, 12, 31), "89256050041234567002", "+256753004002", "Cross-border backup (KE/TZ roaming).", "Airtel Uganda", "sim-v13-b", "Active", new Guid("00000000-0000-0000-0000-000000000004"), "Backup", "UBF 300A", "v13" },
                    { new Guid("73212c31-1afa-0049-8c46-3b70b9c924b8"), new DateOnly(2023, 3, 15), "data.safaricom.com", "Kenya", 5120, 440, new DateOnly(2026, 12, 31), "89254030012345678911", "+254722001011", "Suspended — vehicle offline for maintenance.", "Safaricom", "sim-v6-p", "Suspended", new Guid("00000000-0000-0000-0000-000000000001"), "Primary", "KAB 006F", "v6" },
                    { new Guid("79619dcf-03e1-291a-60fd-18289206fb39"), new DateOnly(2023, 1, 15), "data.safaricom.com", "Kenya", 10240, 4820, new DateOnly(2026, 12, 31), "89254030012345678901", "+254722001001", "Teltonika FMB920 primary SIM.", "Safaricom", "sim-v1-p", "Active", new Guid("00000000-0000-0000-0000-000000000001"), "Primary", "KAB 001A", "v1" },
                    { new Guid("83c668e4-2e12-2f51-1ae3-8ed6757d9281"), new DateOnly(2024, 1, 10), "internet", "Tanzania", 5120, 210, new DateOnly(2026, 12, 31), "89255060051234567007", "+255754005007", "Vehicle maintenance — SIM deactivated.", "Vodacom Tanzania", "sim-v18-p", "Inactive", new Guid("00000000-0000-0000-0000-000000000005"), "Primary", "T203DDD", "v18" },
                    { new Guid("8b967ad0-97b3-f0ac-e04d-5a8fc036016a"), new DateOnly(2023, 10, 15), "data.safaricom.com", "Kenya", 10240, 4510, new DateOnly(2026, 12, 31), "89254030062345678003", "+254722006003", "", "Safaricom", "sim-v20-p", "Active", new Guid("00000000-0000-0000-0000-000000000006"), "Primary", "KDE 401B", "v20" },
                    { new Guid("91ca968e-6ae8-ec80-8d6b-8649710bc4f0"), new DateOnly(2023, 9, 1), "internet", "Tanzania", 10240, 4340, new DateOnly(2026, 12, 31), "89255060051234567003", "+255754005003", "", "Vodacom Tanzania", "sim-v16-p", "Active", new Guid("00000000-0000-0000-0000-000000000005"), "Primary", "T201BBB", "v16" },
                    { new Guid("93c423cc-d0dc-6464-7180-028953255989"), new DateOnly(2023, 8, 15), "internet.tigo.tz", "Tanzania", 2048, 180, new DateOnly(2026, 12, 31), "89255080051234567002", "+255652005002", "Tigo backup for remote sites.", "Tigo Tanzania", "sim-v15-b", "Active", new Guid("00000000-0000-0000-0000-000000000005"), "Backup", "T200AAA", "v15" },
                    { new Guid("964f63e9-83f5-58e6-0f38-a6743d9abddc"), new DateOnly(2023, 7, 1), "data.safaricom.com", "Kenya", 10240, 5300, new DateOnly(2026, 12, 31), "89254030034567890005", "+254722003005", "", "Safaricom", "sim-v12-p", "Active", new Guid("00000000-0000-0000-0000-000000000003"), "Primary", "KDF 202C", "v12" },
                    { new Guid("a1b0d150-cae4-d53a-87fe-8ef754ae0efe"), new DateOnly(2023, 1, 20), "internet", "Kenya", 2048, 234, new DateOnly(2026, 12, 31), "89254040012345678908", "+254733001008", "Dashcam backup SIM.", "Airtel Kenya", "sim-v4-b", "Active", new Guid("00000000-0000-0000-0000-000000000001"), "Backup", "KAB 004D", "v4" },
                    { new Guid("a3dfb2b1-dddf-fb9a-50a4-b7b612e50b8c"), new DateOnly(2023, 6, 15), "data.safaricom.com", "Kenya", 10240, 6120, new DateOnly(2026, 12, 31), "89254030034567890003", "+254722003003", "", "Safaricom", "sim-v11-p", "Active", new Guid("00000000-0000-0000-0000-000000000003"), "Primary", "KDF 201B", "v11" },
                    { new Guid("a67e0454-f5c3-8247-2758-0b3d4cfe642a"), new DateOnly(2023, 6, 1), "data.safaricom.com", "Kenya", 10240, 7840, new DateOnly(2026, 12, 31), "89254030034567890001", "+254722003001", "High city traffic — high data use.", "Safaricom", "sim-v10-p", "Active", new Guid("00000000-0000-0000-0000-000000000003"), "Primary", "KDF 200A", "v10" },
                    { new Guid("bbca6561-28e6-87e4-9fb2-d5a476b5cc9c"), new DateOnly(2023, 5, 1), "data.safaricom.com", "Kenya", 5120, 2970, new DateOnly(2026, 12, 31), "89254030023456789005", "+254722002005", "Dashcam SIM.", "Safaricom", "sim-v9-p", "Active", new Guid("00000000-0000-0000-0000-000000000002"), "Primary", "KCC 102C", "v9" },
                    { new Guid("c0202e8f-6bb9-3463-e3b7-bfad02683388"), new DateOnly(2023, 1, 15), "internet", "Kenya", 2048, 112, new DateOnly(2026, 12, 31), "89254040012345678902", "+254733001002", "Backup SIM — auto-failover on primary loss.", "Airtel Kenya", "sim-v1-b", "Active", new Guid("00000000-0000-0000-0000-000000000001"), "Backup", "KAB 001A", "v1" },
                    { new Guid("d2adecf0-7c3a-f35e-1b37-9570d87f9bf4"), new DateOnly(2023, 4, 1), "internet", "Kenya", 2048, 88, new DateOnly(2026, 12, 31), "89254040023456789002", "+254733002002", "Backup SIM for intercounty routes.", "Airtel Kenya", "sim-v7-b", "Active", new Guid("00000000-0000-0000-0000-000000000002"), "Backup", "KCC 100A", "v7" },
                    { new Guid("e984b5ac-2e92-0138-30a1-0fd4f1f4727e"), new DateOnly(2023, 4, 10), "data.safaricom.com", "Kenya", 10240, 4110, new DateOnly(2026, 12, 31), "89254030023456789003", "+254722002003", "", "Safaricom", "sim-v8-p", "Active", new Guid("00000000-0000-0000-0000-000000000002"), "Primary", "KCC 101B", "v8" },
                    { new Guid("ed3c5ec5-a818-192e-932e-fc3978240182"), new DateOnly(2023, 8, 1), "internet.mtn.co.ug", "Uganda", 5120, 2870, new DateOnly(2026, 12, 31), "89256040041234567003", "+256772004003", "", "MTN Uganda", "sim-v14-p", "Active", new Guid("00000000-0000-0000-0000-000000000004"), "Primary", "UBF 301B", "v14" },
                    { new Guid("fd67bfd3-1308-0eb7-12d9-7bd117dac198"), new DateOnly(2023, 10, 1), "data.safaricom.com", "Kenya", 10240, 6880, new DateOnly(2026, 12, 31), "89254030062345678001", "+254722006001", "High-frequency delivery routes.", "Safaricom", "sim-v19-p", "Active", new Guid("00000000-0000-0000-0000-000000000006"), "Primary", "KDE 400A", "v19" }
                });

            migrationBuilder.InsertData(
                table: "TenantCustomRoles",
                columns: new[] { "Id", "Color", "CreatedAt", "Description", "FeaturePermissionsJson", "Name", "PermissionsJson", "ShortId", "Slug", "TenantId", "UserCount" },
                values: new object[,]
                {
                    { new Guid("3a4eb3a3-6891-06b7-9609-0195286f03e5"), "#0891b2", new DateOnly(2026, 1, 15), "Full access across all fleet ops modules; cannot delete records", "{\"vehicles:export\":true,\"vehicles:import\":true,\"vehicles:telemetry\":true,\"vehicles:documents\":true,\"vehicles:transfer\":true,\"drivers:export\":true,\"drivers:scorecard\":true,\"drivers:hos\":true,\"drivers:documents\":true,\"alerts:acknowledge\":true,\"alerts:config\":true,\"alerts:history\":true,\"geo:draw\":true,\"geo:triggers\":true,\"geo:history\":true,\"maint:schedule\":true,\"maint:approve\":true,\"maint:history\":true,\"maint:cost\":true,\"rpt:mileage\":true,\"rpt:fuel\":true,\"rpt:driver\":true,\"rpt:geofence\":true,\"rpt:unauthorized\":true,\"rpt:maintenance\":true,\"rpt:cost\":true,\"rpt:export\":true,\"analytics:kpi\":true,\"analytics:trends\":true,\"analytics:compare\":true,\"analytics:export\":true}", "Operations Lead", "[{\"moduleId\":\"dashboard\",\"create\":true,\"read\":true,\"update\":true,\"delete\":false},{\"moduleId\":\"map\",\"create\":true,\"read\":true,\"update\":true,\"delete\":false},{\"moduleId\":\"playback\",\"create\":true,\"read\":true,\"update\":true,\"delete\":false},{\"moduleId\":\"alerts\",\"create\":true,\"read\":true,\"update\":true,\"delete\":false},{\"moduleId\":\"vehicles\",\"create\":true,\"read\":true,\"update\":true,\"delete\":false},{\"moduleId\":\"drivers\",\"create\":true,\"read\":true,\"update\":true,\"delete\":false},{\"moduleId\":\"routes\",\"create\":true,\"read\":true,\"update\":true,\"delete\":false},{\"moduleId\":\"geofences\",\"create\":true,\"read\":true,\"update\":true,\"delete\":false},{\"moduleId\":\"unauthorized\",\"create\":true,\"read\":true,\"update\":true,\"delete\":false},{\"moduleId\":\"maintenance\",\"create\":true,\"read\":true,\"update\":true,\"delete\":false},{\"moduleId\":\"analytics\",\"create\":true,\"read\":true,\"update\":true,\"delete\":false},{\"moduleId\":\"reports\",\"create\":true,\"read\":true,\"update\":true,\"delete\":false},{\"moduleId\":\"subscription\",\"create\":true,\"read\":true,\"update\":true,\"delete\":false},{\"moduleId\":\"tenant-users\",\"create\":true,\"read\":true,\"update\":true,\"delete\":false},{\"moduleId\":\"tenant-roles\",\"create\":true,\"read\":true,\"update\":true,\"delete\":false}]", "tr-1", "ops_lead", new Guid("00000000-0000-0000-0000-000000000001"), 3 },
                    { new Guid("3d156b32-f85b-6b20-de6e-302fce8c5e2a"), "#d97706", new DateOnly(2026, 3, 20), "Full CRUD on Maintenance; read-only on Vehicles and Drivers", "{\"vehicles:export\":false,\"vehicles:import\":false,\"vehicles:telemetry\":true,\"vehicles:documents\":true,\"vehicles:transfer\":false,\"drivers:export\":false,\"drivers:scorecard\":true,\"drivers:hos\":false,\"drivers:documents\":false,\"alerts:acknowledge\":false,\"alerts:config\":false,\"alerts:history\":false,\"geo:draw\":false,\"geo:triggers\":false,\"geo:history\":false,\"maint:schedule\":true,\"maint:approve\":true,\"maint:history\":true,\"maint:cost\":true,\"rpt:mileage\":false,\"rpt:fuel\":false,\"rpt:driver\":false,\"rpt:geofence\":false,\"rpt:unauthorized\":false,\"rpt:maintenance\":false,\"rpt:cost\":false,\"rpt:export\":false,\"analytics:kpi\":false,\"analytics:trends\":false,\"analytics:compare\":false,\"analytics:export\":false}", "Maintenance Tech", "[{\"moduleId\":\"dashboard\",\"create\":false,\"read\":false,\"update\":false,\"delete\":false},{\"moduleId\":\"map\",\"create\":false,\"read\":false,\"update\":false,\"delete\":false},{\"moduleId\":\"playback\",\"create\":false,\"read\":false,\"update\":false,\"delete\":false},{\"moduleId\":\"alerts\",\"create\":false,\"read\":false,\"update\":false,\"delete\":false},{\"moduleId\":\"vehicles\",\"create\":false,\"read\":true,\"update\":false,\"delete\":false},{\"moduleId\":\"drivers\",\"create\":false,\"read\":true,\"update\":false,\"delete\":false},{\"moduleId\":\"routes\",\"create\":false,\"read\":false,\"update\":false,\"delete\":false},{\"moduleId\":\"geofences\",\"create\":false,\"read\":false,\"update\":false,\"delete\":false},{\"moduleId\":\"unauthorized\",\"create\":false,\"read\":false,\"update\":false,\"delete\":false},{\"moduleId\":\"maintenance\",\"create\":true,\"read\":true,\"update\":true,\"delete\":true},{\"moduleId\":\"analytics\",\"create\":false,\"read\":false,\"update\":false,\"delete\":false},{\"moduleId\":\"reports\",\"create\":false,\"read\":false,\"update\":false,\"delete\":false},{\"moduleId\":\"subscription\",\"create\":false,\"read\":false,\"update\":false,\"delete\":false},{\"moduleId\":\"tenant-users\",\"create\":false,\"read\":false,\"update\":false,\"delete\":false},{\"moduleId\":\"tenant-roles\",\"create\":false,\"read\":false,\"update\":false,\"delete\":false}]", "tr-3", "maint_tech", new Guid("00000000-0000-0000-0000-000000000001"), 5 },
                    { new Guid("50bb4077-9fbe-e911-1f5d-8b83abee8599"), "#7c3aed", new DateOnly(2026, 4, 10), "Can create and update routes and alerts; read-only on fleet data", "{\"vehicles:export\":false,\"vehicles:import\":false,\"vehicles:telemetry\":true,\"vehicles:documents\":false,\"vehicles:transfer\":false,\"drivers:export\":false,\"drivers:scorecard\":true,\"drivers:hos\":false,\"drivers:documents\":false,\"alerts:acknowledge\":true,\"alerts:config\":true,\"alerts:history\":true,\"geo:draw\":false,\"geo:triggers\":false,\"geo:history\":false,\"maint:schedule\":false,\"maint:approve\":false,\"maint:history\":false,\"maint:cost\":false,\"rpt:mileage\":false,\"rpt:fuel\":false,\"rpt:driver\":false,\"rpt:geofence\":false,\"rpt:unauthorized\":false,\"rpt:maintenance\":false,\"rpt:cost\":false,\"rpt:export\":false,\"analytics:kpi\":false,\"analytics:trends\":false,\"analytics:compare\":false,\"analytics:export\":false}", "Dispatch Coordinator", "[{\"moduleId\":\"dashboard\",\"create\":false,\"read\":true,\"update\":false,\"delete\":false},{\"moduleId\":\"map\",\"create\":false,\"read\":true,\"update\":false,\"delete\":false},{\"moduleId\":\"playback\",\"create\":false,\"read\":true,\"update\":false,\"delete\":false},{\"moduleId\":\"alerts\",\"create\":true,\"read\":true,\"update\":false,\"delete\":false},{\"moduleId\":\"vehicles\",\"create\":false,\"read\":true,\"update\":false,\"delete\":false},{\"moduleId\":\"drivers\",\"create\":false,\"read\":true,\"update\":false,\"delete\":false},{\"moduleId\":\"routes\",\"create\":true,\"read\":true,\"update\":false,\"delete\":false},{\"moduleId\":\"geofences\",\"create\":false,\"read\":false,\"update\":false,\"delete\":false},{\"moduleId\":\"unauthorized\",\"create\":false,\"read\":false,\"update\":false,\"delete\":false},{\"moduleId\":\"maintenance\",\"create\":false,\"read\":false,\"update\":false,\"delete\":false},{\"moduleId\":\"analytics\",\"create\":false,\"read\":false,\"update\":false,\"delete\":false},{\"moduleId\":\"reports\",\"create\":false,\"read\":false,\"update\":false,\"delete\":false},{\"moduleId\":\"subscription\",\"create\":false,\"read\":false,\"update\":false,\"delete\":false},{\"moduleId\":\"tenant-users\",\"create\":false,\"read\":false,\"update\":false,\"delete\":false},{\"moduleId\":\"tenant-roles\",\"create\":false,\"read\":false,\"update\":false,\"delete\":false}]", "tr-4", "dispatch_coord", new Guid("00000000-0000-0000-0000-000000000001"), 2 },
                    { new Guid("b4dd274e-1f9b-8a1c-14ca-812ea1fef5c1"), "#6b7280", new DateOnly(2026, 2, 3), "Can view every module but cannot write, edit, or delete anything", "{\"vehicles:export\":true,\"vehicles:import\":false,\"vehicles:telemetry\":true,\"vehicles:documents\":false,\"vehicles:transfer\":false,\"drivers:export\":true,\"drivers:scorecard\":true,\"drivers:hos\":false,\"drivers:documents\":false,\"alerts:acknowledge\":false,\"alerts:config\":false,\"alerts:history\":true,\"geo:draw\":false,\"geo:triggers\":false,\"geo:history\":true,\"maint:schedule\":false,\"maint:approve\":false,\"maint:history\":true,\"maint:cost\":true,\"rpt:mileage\":true,\"rpt:fuel\":true,\"rpt:driver\":true,\"rpt:geofence\":true,\"rpt:unauthorized\":true,\"rpt:maintenance\":true,\"rpt:cost\":true,\"rpt:export\":false,\"analytics:kpi\":true,\"analytics:trends\":true,\"analytics:compare\":true,\"analytics:export\":true}", "Read-only Auditor", "[{\"moduleId\":\"dashboard\",\"create\":false,\"read\":true,\"update\":false,\"delete\":false},{\"moduleId\":\"map\",\"create\":false,\"read\":true,\"update\":false,\"delete\":false},{\"moduleId\":\"playback\",\"create\":false,\"read\":true,\"update\":false,\"delete\":false},{\"moduleId\":\"alerts\",\"create\":false,\"read\":true,\"update\":false,\"delete\":false},{\"moduleId\":\"vehicles\",\"create\":false,\"read\":true,\"update\":false,\"delete\":false},{\"moduleId\":\"drivers\",\"create\":false,\"read\":true,\"update\":false,\"delete\":false},{\"moduleId\":\"routes\",\"create\":false,\"read\":true,\"update\":false,\"delete\":false},{\"moduleId\":\"geofences\",\"create\":false,\"read\":true,\"update\":false,\"delete\":false},{\"moduleId\":\"unauthorized\",\"create\":false,\"read\":true,\"update\":false,\"delete\":false},{\"moduleId\":\"maintenance\",\"create\":false,\"read\":true,\"update\":false,\"delete\":false},{\"moduleId\":\"analytics\",\"create\":false,\"read\":true,\"update\":false,\"delete\":false},{\"moduleId\":\"reports\",\"create\":false,\"read\":true,\"update\":false,\"delete\":false},{\"moduleId\":\"subscription\",\"create\":false,\"read\":true,\"update\":false,\"delete\":false},{\"moduleId\":\"tenant-users\",\"create\":false,\"read\":true,\"update\":false,\"delete\":false},{\"moduleId\":\"tenant-roles\",\"create\":false,\"read\":true,\"update\":false,\"delete\":false}]", "tr-2", "auditor", new Guid("00000000-0000-0000-0000-000000000001"), 2 }
                });

            migrationBuilder.InsertData(
                table: "Trips",
                columns: new[] { "Id", "AvgSpeed", "Date", "DateIso", "DistanceKm", "DurationMin", "From", "FuelUsedL", "MaxSpeed", "RouteJson", "ShortId", "Status", "TenantId", "To", "VehicleShortId" },
                values: new object[,]
                {
                    { new Guid("4aaa5a5a-7e6e-5bc8-9aca-84dee898d57b"), 54.0, "2026-05-24 07:55", "2026-05-24", 52.0, 58, "Thika Depot", 8.0, 82.0, "[{\"lat\":-1.0332,\"lng\":37.069,\"time\":\"07:55\",\"speed\":0,\"event\":\"Departed Thika Depot\"},{\"lat\":-1.07,\"lng\":37.01,\"time\":\"08:06\",\"speed\":55,\"event\":null},{\"lat\":-1.14,\"lng\":36.95,\"time\":\"08:19\",\"speed\":60,\"event\":null},{\"lat\":-1.25,\"lng\":36.92,\"time\":\"08:32\",\"speed\":52,\"event\":\"Eastern Bypass\"},{\"lat\":-1.29,\"lng\":36.89,\"time\":\"08:44\",\"speed\":46,\"event\":null},{\"lat\":-1.32,\"lng\":36.88,\"time\":\"08:53\",\"speed\":0,\"event\":\"Arrived Nairobi ICD\"}]", "t5", "Completed", new Guid("00000000-0000-0000-0000-000000000001"), "Nairobi ICD", "v1" },
                    { new Guid("83217391-15be-599e-77ad-0e27a70bab65"), 46.0, "2026-05-25 09:10", "2026-05-25", 48.0, 62, "Nairobi HQ", 7.5, 78.0, "[{\"lat\":-1.2921,\"lng\":36.8219,\"time\":\"09:10\",\"speed\":0,\"event\":\"Departed Nairobi HQ\"},{\"lat\":-1.23,\"lng\":36.86,\"time\":\"09:22\",\"speed\":38,\"event\":null},{\"lat\":-1.17,\"lng\":36.9,\"time\":\"09:38\",\"speed\":55,\"event\":\"Githurai junction\"},{\"lat\":-1.12,\"lng\":36.94,\"time\":\"09:50\",\"speed\":62,\"event\":null},{\"lat\":-1.07,\"lng\":37.01,\"time\":\"10:04\",\"speed\":58,\"event\":null},{\"lat\":-1.0332,\"lng\":37.069,\"time\":\"10:12\",\"speed\":0,\"event\":\"Arrived Thika Depot\"}]", "t4", "Completed", new Guid("00000000-0000-0000-0000-000000000001"), "Thika Depot", "v1" },
                    { new Guid("8eb242c4-c6df-51b9-80ad-2b22c10814a2"), 74.0, "2026-05-28 07:14", "2026-05-28", 490.0, 395, "Nairobi ICD", 68.0, 96.0, "[{\"lat\":-1.32,\"lng\":36.88,\"time\":\"07:14\",\"speed\":0,\"event\":\"Departed Nairobi ICD\"},{\"lat\":-1.4631,\"lng\":36.9753,\"time\":\"07:35\",\"speed\":72,\"event\":null},{\"lat\":-1.62,\"lng\":37.14,\"time\":\"08:05\",\"speed\":80,\"event\":null},{\"lat\":-1.95,\"lng\":37.5,\"time\":\"08:55\",\"speed\":96,\"event\":\"⚠ Speed alert — 96 km/h\"},{\"lat\":-2.25,\"lng\":37.85,\"time\":\"09:40\",\"speed\":74,\"event\":null},{\"lat\":-2.6824,\"lng\":38.1706,\"time\":\"10:30\",\"speed\":68,\"event\":\"Mtito Andei rest stop\"},{\"lat\":-3.03,\"lng\":38.42,\"time\":\"11:20\",\"speed\":75,\"event\":null},{\"lat\":-3.3957,\"lng\":38.5591,\"time\":\"12:05\",\"speed\":70,\"event\":\"Voi checkpoint\"},{\"lat\":-3.75,\"lng\":39.25,\"time\":\"13:10\",\"speed\":65,\"event\":null},{\"lat\":-4.0435,\"lng\":39.6682,\"time\":\"13:49\",\"speed\":0,\"event\":\"Arrived Mombasa Port\"}]", "t1", "In Progress", new Guid("00000000-0000-0000-0000-000000000001"), "Mombasa Port", "v1" },
                    { new Guid("9b14599b-67c2-b30f-f093-b928bff2f1bf"), 68.0, "2026-05-28 06:00", "2026-05-28", 350.0, 330, "Nairobi HQ", 48.0, 88.0, "[{\"lat\":-1.2921,\"lng\":36.8219,\"time\":\"06:00\",\"speed\":0,\"event\":\"Departed Nairobi HQ\"},{\"lat\":-1.11,\"lng\":36.65,\"time\":\"06:28\",\"speed\":62,\"event\":\"Limuru\"},{\"lat\":-0.7172,\"lng\":36.4311,\"time\":\"07:15\",\"speed\":70,\"event\":\"Naivasha\"},{\"lat\":-0.3031,\"lng\":36.08,\"time\":\"08:10\",\"speed\":74,\"event\":\"Nakuru — fuel stop\"},{\"lat\":-0.1,\"lng\":35.78,\"time\":\"09:05\",\"speed\":68,\"event\":null},{\"lat\":0.1,\"lng\":35.28,\"time\":\"10:00\",\"speed\":72,\"event\":\"Kericho\"},{\"lat\":0.1,\"lng\":34.85,\"time\":\"10:55\",\"speed\":65,\"event\":null},{\"lat\":-0.1022,\"lng\":34.7617,\"time\":\"11:30\",\"speed\":0,\"event\":\"Arrived Kisumu Port\"}]", "v2-t1", "In Progress", new Guid("00000000-0000-0000-0000-000000000001"), "Kisumu Port", "v2" },
                    { new Guid("d2b17f53-e51d-e199-3612-35ed38f3d9f6"), 73.0, "2026-05-26 07:30", "2026-05-26", 310.0, 255, "Nairobi HQ", 42.0, 89.0, "[{\"lat\":-1.2921,\"lng\":36.8219,\"time\":\"07:30\",\"speed\":0,\"event\":\"Departed Nairobi HQ\"},{\"lat\":-0.7172,\"lng\":36.4311,\"time\":\"08:45\",\"speed\":71,\"event\":\"Naivasha\"},{\"lat\":-0.3031,\"lng\":36.08,\"time\":\"09:30\",\"speed\":74,\"event\":\"Nakuru\"},{\"lat\":0.09,\"lng\":35.75,\"time\":\"10:20\",\"speed\":78,\"event\":null},{\"lat\":0.52,\"lng\":35.27,\"time\":\"11:15\",\"speed\":70,\"event\":null},{\"lat\":0.5203,\"lng\":35.2699,\"time\":\"11:45\",\"speed\":0,\"event\":\"Arrived Eldoret Depot\"}]", "v2-t2", "Completed", new Guid("00000000-0000-0000-0000-000000000001"), "Eldoret Depot", "v2" },
                    { new Guid("dab26463-6955-e8ff-1dfd-93cd940229e1"), 72.0, "2026-05-27 08:00", "2026-05-27", 158.0, 132, "Nairobi HQ", 22.0, 94.0, "[{\"lat\":-1.2921,\"lng\":36.8219,\"time\":\"08:00\",\"speed\":0,\"event\":\"Departed Nairobi HQ\"},{\"lat\":-1.24,\"lng\":36.78,\"time\":\"08:14\",\"speed\":52,\"event\":null},{\"lat\":-1.11,\"lng\":36.65,\"time\":\"08:35\",\"speed\":65,\"event\":\"Limuru\"},{\"lat\":-0.92,\"lng\":36.52,\"time\":\"09:00\",\"speed\":72,\"event\":null},{\"lat\":-0.7172,\"lng\":36.4311,\"time\":\"09:22\",\"speed\":68,\"event\":\"Naivasha fuel stop\"},{\"lat\":-0.4934,\"lng\":36.323,\"time\":\"09:50\",\"speed\":75,\"event\":null},{\"lat\":-0.3031,\"lng\":36.08,\"time\":\"10:12\",\"speed\":0,\"event\":\"Arrived Nakuru Depot\"}]", "t2", "Completed", new Guid("00000000-0000-0000-0000-000000000001"), "Nakuru Depot", "v1" },
                    { new Guid("de483ed5-bfb8-05b8-7777-46dd3a2eb150"), 22.0, "2026-05-28 14:05", "2026-05-28", 8.0, 35, "Nairobi CBD", 1.2, 35.0, "[{\"lat\":-1.2821,\"lng\":36.8172,\"time\":\"14:05\",\"speed\":0,\"event\":\"Departed Nairobi CBD\"},{\"lat\":-1.27,\"lng\":36.81,\"time\":\"14:16\",\"speed\":28,\"event\":null},{\"lat\":-1.263,\"lng\":36.8,\"time\":\"14:25\",\"speed\":35,\"event\":\"Uhuru Highway\"},{\"lat\":-1.262,\"lng\":36.79,\"time\":\"14:33\",\"speed\":30,\"event\":null},{\"lat\":-1.2676,\"lng\":36.7915,\"time\":\"14:40\",\"speed\":0,\"event\":\"Arrived Westlands\"}]", "v4-t2", "Completed", new Guid("00000000-0000-0000-0000-000000000001"), "Westlands", "v4" },
                    { new Guid("de61ab05-f9fd-df58-49e6-69b72cc57584"), 32.0, "2026-05-28 08:00", "2026-05-28", 18.0, 38, "Nairobi ICD", 2.7999999999999998, 44.0, "[{\"lat\":-1.32,\"lng\":36.88,\"time\":\"08:00\",\"speed\":0,\"event\":\"Departed Nairobi ICD\"},{\"lat\":-1.305,\"lng\":36.87,\"time\":\"08:10\",\"speed\":38,\"event\":null},{\"lat\":-1.2921,\"lng\":36.85,\"time\":\"08:22\",\"speed\":44,\"event\":\"Mombasa Rd\"},{\"lat\":-1.285,\"lng\":36.83,\"time\":\"08:31\",\"speed\":32,\"event\":null},{\"lat\":-1.2821,\"lng\":36.8172,\"time\":\"08:38\",\"speed\":0,\"event\":\"Arrived Nairobi CBD\"}]", "v4-t1", "Completed", new Guid("00000000-0000-0000-0000-000000000001"), "Nairobi CBD", "v4" },
                    { new Guid("faa1bc64-cf24-6283-356b-aa2feec64677"), 70.0, "2026-05-26 06:30", "2026-05-26", 160.0, 138, "Nakuru Depot", 23.0, 90.0, "[{\"lat\":-0.3031,\"lng\":36.08,\"time\":\"06:30\",\"speed\":0,\"event\":\"Departed Nakuru Depot\"},{\"lat\":-0.4934,\"lng\":36.323,\"time\":\"06:52\",\"speed\":72,\"event\":null},{\"lat\":-0.7172,\"lng\":36.4311,\"time\":\"07:15\",\"speed\":70,\"event\":\"Naivasha\"},{\"lat\":-0.92,\"lng\":36.52,\"time\":\"07:40\",\"speed\":74,\"event\":null},{\"lat\":-1.11,\"lng\":36.65,\"time\":\"08:05\",\"speed\":65,\"event\":\"Limuru\"},{\"lat\":-1.24,\"lng\":36.78,\"time\":\"08:28\",\"speed\":58,\"event\":null},{\"lat\":-1.2921,\"lng\":36.8219,\"time\":\"08:48\",\"speed\":0,\"event\":\"Arrived Nairobi HQ\"}]", "t3", "Completed", new Guid("00000000-0000-0000-0000-000000000001"), "Nairobi HQ", "v1" }
                });

            migrationBuilder.InsertData(
                table: "VehicleSubscriptions",
                columns: new[] { "Id", "AutoRenew", "ContactEmail", "CustomPlanId", "ExpiryDate", "Plan", "SmsNumbersJson", "StartDate", "TenantId", "VehicleShortId" },
                values: new object[,]
                {
                    { new Guid("02f85a14-ca66-7f51-1b6e-49ea825123a5"), true, "ops@nairobiexpress.co.ke", null, new DateOnly(2026, 9, 30), "Professional", "[\"+254733500003\"]", new DateOnly(2025, 10, 1), new Guid("00000000-0000-0000-0000-000000000003"), "v11" },
                    { new Guid("1ab26935-9696-9e83-2f74-523d6298131d"), true, "fleet@acmeholdings.co.ke", null, new DateOnly(2026, 12, 31), "Professional", "[\"+254722110001\"]", new DateOnly(2025, 1, 1), new Guid("00000000-0000-0000-0000-000000000001"), "v1" },
                    { new Guid("20cabc69-1ee1-7a92-33cf-b09a240c6101"), true, "james.kariuki@gmail.com", "cp-personal-tracker", new DateOnly(2027, 1, 14), "Starter", "[\"+254722456789\"]", new DateOnly(2026, 1, 15), new Guid("00000000-0000-0000-0000-000000000001"), "v-ind-001" },
                    { new Guid("278a53ea-f0d2-bb69-43dd-09956e33854a"), true, "ops@nairobiexpress.co.ke", null, new DateOnly(2026, 12, 31), "Basic", "[]", new DateOnly(2026, 1, 1), new Guid("00000000-0000-0000-0000-000000000003"), "v10" },
                    { new Guid("34a1e30b-79b0-8ff9-e543-2cec945abcbc"), false, "ops@nairobiexpress.co.ke", null, new DateOnly(2026, 6, 20), "Starter", "[]", new DateOnly(2025, 6, 21), new Guid("00000000-0000-0000-0000-000000000003"), "v12" },
                    { new Guid("3f682962-dd7e-5ac9-f282-8b3223d8aac4"), true, "admin@kimtransport.ug", null, new DateOnly(2027, 6, 30), "Enterprise", "[\"+256772300001\"]", new DateOnly(2025, 7, 1), new Guid("00000000-0000-0000-0000-000000000004"), "v13" },
                    { new Guid("43f649ec-0a00-3999-4399-bf7072bc8e25"), true, "billing@swiftcargo.co.ke", null, new DateOnly(2026, 12, 31), "Enterprise", "[\"+254711400001\"]", new DateOnly(2026, 1, 1), new Guid("00000000-0000-0000-0000-000000000002"), "v7" },
                    { new Guid("4ac234b1-9fae-bd98-5fd8-488012cf7977"), true, "fleet@peakfleet.co.tz", null, new DateOnly(2027, 1, 31), "Enterprise", "[\"+255756100002\"]", new DateOnly(2026, 2, 1), new Guid("00000000-0000-0000-0000-000000000005"), "v17" },
                    { new Guid("52997f3e-55c1-7d80-15f6-8fa9f8a16a23"), false, "billing@swiftcargo.co.ke", null, new DateOnly(2026, 6, 5), "Basic", "[]", new DateOnly(2025, 6, 6), new Guid("00000000-0000-0000-0000-000000000002"), "v8" },
                    { new Guid("54ab9163-d6bf-877d-3e82-3d7b00d12add"), true, "fleet@acmeholdings.co.ke", null, new DateOnly(2027, 3, 31), "Enterprise", "[\"+254722110001\",\"+254733220002\"]", new DateOnly(2025, 4, 1), new Guid("00000000-0000-0000-0000-000000000001"), "v2" },
                    { new Guid("56374964-d7ba-cf1f-4840-afb263b30d71"), false, "fleet@transafrica.co.ke", null, new DateOnly(2026, 4, 30), "Starter", "[]", new DateOnly(2025, 5, 1), new Guid("00000000-0000-0000-0000-000000000001"), "v4" },
                    { new Guid("600ca872-c046-0477-467d-7f3c49832f0d"), false, "fleet@peakfleet.co.tz", null, new DateOnly(2026, 6, 10), "Basic", "[]", new DateOnly(2025, 6, 11), new Guid("00000000-0000-0000-0000-000000000005"), "v16" },
                    { new Guid("6d144e41-13c9-dd49-30ac-714af22eb899"), true, "fleet@peakfleet.co.tz", null, new DateOnly(2026, 12, 31), "Starter", "[]", new DateOnly(2026, 1, 1), new Guid("00000000-0000-0000-0000-000000000005"), "v18" },
                    { new Guid("7e29cd6c-e4b0-c7eb-99a8-0bfa83c631ba"), true, "admin@kimtransport.ug", null, new DateOnly(2026, 9, 30), "Basic", "[]", new DateOnly(2025, 10, 1), new Guid("00000000-0000-0000-0000-000000000004"), "v14" },
                    { new Guid("86d41f7d-b3ef-071e-38af-0ca8b5dcb34e"), false, "solarroute@ops.co.ke", null, new DateOnly(2026, 6, 14), "Basic", "[\"+254700300004\"]", new DateOnly(2025, 6, 15), new Guid("00000000-0000-0000-0000-000000000001"), "v3" },
                    { new Guid("9aefaf50-b647-3669-53e9-0a126f30c27e"), false, "ops@swiftdeliverea.com", null, new DateOnly(2026, 5, 5), "Basic", "[]", new DateOnly(2025, 5, 6), new Guid("00000000-0000-0000-0000-000000000006"), "v19" },
                    { new Guid("b0f0b6a9-d0b9-0078-8b17-1c16c7206f53"), true, "billing@swiftcargo.co.ke", null, new DateOnly(2026, 12, 31), "Professional", "[\"+254711400002\"]", new DateOnly(2026, 1, 1), new Guid("00000000-0000-0000-0000-000000000002"), "v9" },
                    { new Guid("b6dfe254-e200-3fc9-f436-2483195fb9a4"), true, "ops@swiftdeliverea.com", null, new DateOnly(2026, 12, 31), "Professional", "[\"+254700900001\"]", new DateOnly(2026, 1, 1), new Guid("00000000-0000-0000-0000-000000000006"), "v20" },
                    { new Guid("cb5cf9a3-6e0c-6139-1684-15162373b4ed"), true, "fleet@acmeholdings.co.ke", null, new DateOnly(2026, 11, 30), "Professional", "[\"+254722110001\"]", new DateOnly(2025, 12, 1), new Guid("00000000-0000-0000-0000-000000000001"), "v5" },
                    { new Guid("ddfecdd0-6171-7d67-5c16-a8e46f2046ca"), true, "fleet@peakfleet.co.tz", null, new DateOnly(2026, 12, 31), "Professional", "[\"+255756100001\"]", new DateOnly(2026, 1, 1), new Guid("00000000-0000-0000-0000-000000000005"), "v15" },
                    { new Guid("e4088137-08be-d2aa-974d-de2cfec21dd1"), false, "fleet@acmeholdings.co.ke", null, new DateOnly(2026, 5, 10), "Basic", "[]", new DateOnly(2025, 5, 11), new Guid("00000000-0000-0000-0000-000000000001"), "v6" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditEvents_ShortId",
                table: "AuditEvents",
                column: "ShortId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AuditEvents_TenantId",
                table: "AuditEvents",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_BackupRecords_BackupId",
                table: "BackupRecords",
                column: "BackupId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BackupRecords_TenantId",
                table: "BackupRecords",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomPlans_ShortId",
                table: "CustomPlans",
                column: "ShortId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CustomPlans_TenantId",
                table: "CustomPlans",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Devices_ShortId",
                table: "Devices",
                column: "ShortId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Devices_TenantId",
                table: "Devices",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_EncryptionKeys_KeyId",
                table: "EncryptionKeys",
                column: "KeyId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EncryptionKeys_TenantId",
                table: "EncryptionKeys",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_SimCards_ShortId",
                table: "SimCards",
                column: "ShortId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SimCards_TenantId",
                table: "SimCards",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_TenantCustomRoles_ShortId",
                table: "TenantCustomRoles",
                column: "ShortId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TenantCustomRoles_TenantId",
                table: "TenantCustomRoles",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Trips_ShortId",
                table: "Trips",
                column: "ShortId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Trips_TenantId",
                table: "Trips",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleSubscriptions_TenantId_VehicleShortId",
                table: "VehicleSubscriptions",
                columns: new[] { "TenantId", "VehicleShortId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditEvents");

            migrationBuilder.DropTable(
                name: "BackupRecords");

            migrationBuilder.DropTable(
                name: "CustomPlans");

            migrationBuilder.DropTable(
                name: "Devices");

            migrationBuilder.DropTable(
                name: "EncryptionKeys");

            migrationBuilder.DropTable(
                name: "SimCards");

            migrationBuilder.DropTable(
                name: "TenantCustomRoles");

            migrationBuilder.DropTable(
                name: "Trips");

            migrationBuilder.DropTable(
                name: "VehicleSubscriptions");
        }
    }
}
