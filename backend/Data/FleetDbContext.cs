using System.Security.Cryptography;
using System.Text;
using FleetOS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FleetOS.Api.Data;

public class FleetDbContext(DbContextOptions<FleetDbContext> options) : DbContext(options)
{
    public DbSet<Tenant>               Tenants              => Set<Tenant>();
    public DbSet<AppUser>              Users                => Set<AppUser>();
    public DbSet<Vehicle>              Vehicles             => Set<Vehicle>();
    public DbSet<Driver>               Drivers              => Set<Driver>();
    public DbSet<Alert>                Alerts               => Set<Alert>();
    public DbSet<RolePermission>       RolePermissions      => Set<RolePermission>();
    public DbSet<Branch>               Branches             => Set<Branch>();
    public DbSet<Customer>             Customers            => Set<Customer>();
    public DbSet<Device>               Devices              => Set<Device>();
    public DbSet<SimCard>              SimCards             => Set<SimCard>();
    public DbSet<Trip>                 Trips                => Set<Trip>();
    public DbSet<VehicleSubscription>  VehicleSubscriptions => Set<VehicleSubscription>();
    public DbSet<CustomPlan>           CustomPlans          => Set<CustomPlan>();
    public DbSet<TenantCustomRole>     TenantCustomRoles    => Set<TenantCustomRole>();
    public DbSet<EncryptionKey>        EncryptionKeys       => Set<EncryptionKey>();
    public DbSet<AuditEvent>           AuditEvents          => Set<AuditEvent>();
    public DbSet<BackupRecord>         BackupRecords        => Set<BackupRecord>();
    public DbSet<LookupItem>           LookupItems          => Set<LookupItem>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        base.OnModelCreating(mb);

        mb.Entity<Tenant>(e =>
        {
            e.HasIndex(t => t.Slug).IsUnique();
            e.HasMany(t => t.Users)     .WithOne(u => u.Tenant).HasForeignKey(u => u.TenantId).OnDelete(DeleteBehavior.Restrict);
            e.HasMany(t => t.Vehicles)  .WithOne(v => v.Tenant).HasForeignKey(v => v.TenantId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(t => t.Drivers)   .WithOne(d => d.Tenant).HasForeignKey(d => d.TenantId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(t => t.Alerts)    .WithOne(a => a.Tenant).HasForeignKey(a => a.TenantId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(t => t.Branches)  .WithOne(b => b.Tenant).HasForeignKey(b => b.TenantId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(t => t.Customers) .WithOne(c => c.Tenant).HasForeignKey(c => c.TenantId).OnDelete(DeleteBehavior.Cascade);
        });

        mb.Entity<AppUser>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
        });

        mb.Entity<Vehicle>(e =>
        {
            e.HasMany(v => v.Alerts).WithOne(a => a.Vehicle).HasForeignKey(a => a.VehicleId).OnDelete(DeleteBehavior.SetNull);
        });

        mb.Entity<RolePermission>(e =>
        {
            e.HasIndex(p => new { p.RoleId, p.ModuleId }).IsUnique();
        });

        mb.Entity<Device>(e =>
        {
            e.HasIndex(d => d.ShortId).IsUnique();
            e.HasOne(d => d.Tenant).WithMany(t => t.Devices).HasForeignKey(d => d.TenantId).OnDelete(DeleteBehavior.Cascade);
        });

        mb.Entity<SimCard>(e =>
        {
            e.HasIndex(s => s.ShortId).IsUnique();
            e.HasOne(s => s.Tenant).WithMany(t => t.SimCards).HasForeignKey(s => s.TenantId).OnDelete(DeleteBehavior.Cascade);
        });

        mb.Entity<Trip>(e =>
        {
            e.HasIndex(t => t.ShortId).IsUnique();
            e.HasOne(t => t.Tenant).WithMany(t => t.Trips).HasForeignKey(t => t.TenantId).OnDelete(DeleteBehavior.Cascade);
        });

        mb.Entity<VehicleSubscription>(e =>
        {
            e.HasIndex(s => new { s.TenantId, s.VehicleShortId }).IsUnique();
            e.HasOne(s => s.Tenant).WithMany(t => t.VehicleSubscriptions).HasForeignKey(s => s.TenantId).OnDelete(DeleteBehavior.Cascade);
        });

        mb.Entity<CustomPlan>(e =>
        {
            e.HasIndex(p => p.ShortId).IsUnique();
            e.HasOne(p => p.Tenant).WithMany(t => t.CustomPlans).HasForeignKey(p => p.TenantId).OnDelete(DeleteBehavior.Cascade);
        });

        mb.Entity<TenantCustomRole>(e =>
        {
            e.HasIndex(r => r.ShortId).IsUnique();
            e.HasOne(r => r.Tenant).WithMany(t => t.CustomRoles).HasForeignKey(r => r.TenantId).OnDelete(DeleteBehavior.Cascade);
        });

        mb.Entity<EncryptionKey>(e =>
        {
            e.HasIndex(k => k.KeyId).IsUnique();
            e.HasOne(k => k.Tenant).WithMany(t => t.EncryptionKeys).HasForeignKey(k => k.TenantId).OnDelete(DeleteBehavior.Cascade);
        });

        mb.Entity<AuditEvent>(e =>
        {
            e.HasIndex(a => a.ShortId).IsUnique();
            e.HasOne(a => a.Tenant).WithMany(t => t.AuditEvents).HasForeignKey(a => a.TenantId).OnDelete(DeleteBehavior.Cascade);
        });

        mb.Entity<BackupRecord>(e =>
        {
            e.HasIndex(b => b.BackupId).IsUnique();
            e.HasOne(b => b.Tenant).WithMany(t => t.BackupRecords).HasForeignKey(b => b.TenantId).OnDelete(DeleteBehavior.Cascade);
        });

        SeedData(mb);
    }

    // ── Stable tenant GUIDs (match frontend tenantId '1'–'6') ───────────────
    private static readonly Guid TenantAcme   = Guid.Parse("00000000-0000-0000-0000-000000000001"); // ACME Logistics
    private static readonly Guid TenantSwift  = Guid.Parse("00000000-0000-0000-0000-000000000002"); // SwiftCargo Ltd
    private static readonly Guid TenantNex    = Guid.Parse("00000000-0000-0000-0000-000000000003"); // NairobiExpress
    private static readonly Guid TenantKim    = Guid.Parse("00000000-0000-0000-0000-000000000004"); // KimTransport
    private static readonly Guid TenantPeak   = Guid.Parse("00000000-0000-0000-0000-000000000005"); // PeakFleet Co
    private static readonly Guid TenantSde    = Guid.Parse("00000000-0000-0000-0000-000000000006"); // SwiftDeliver EA
    private static readonly Guid TenantStar     = Guid.Parse("00000000-0000-0000-0000-000000000007"); // Star Technologies (Pakistan)
    private static readonly Guid TenantAtlantic = Guid.Parse("00000000-0000-0000-0000-000000000008"); // Atlantic Freight Inc (USA)
    private static readonly Guid TenantMeridian  = Guid.Parse("00000000-0000-0000-0000-000000000009"); // Meridian Logistics (USA)
    private static readonly Guid TenantBritfleet = Guid.Parse("00000000-0000-0000-0000-000000000010"); // BritFleet Solutions (UK)

    private static void SeedData(ModelBuilder mb)
    {
        SeedTenants(mb);
        SeedUsers(mb);
        SeedVehicles(mb);
        SeedDrivers(mb);
        SeedAlerts(mb);
        SeedBranches(mb);
        SeedCustomers(mb);
        SeedRolePermissions(mb);
        SeedDevices(mb);
        SeedSimCards(mb);
        SeedTrips(mb);
        SeedVehicleSubscriptions(mb);
        SeedCustomPlans(mb);
        SeedTenantCustomRoles(mb);
        SeedEncryptionKeys(mb);
        SeedAuditEvents(mb);
        SeedBackupRecords(mb);
        SeedLookupItems(mb);
    }

    // ────────────────────────────────────────────────────────────────────────
    private static void SeedTenants(ModelBuilder mb)
    {
        mb.Entity<Tenant>().HasData(
            new Tenant { Id = TenantAcme,  Name = "ACME Logistics",    Slug = "acme",  Plan = "Enterprise", Region = "Kenya",    Status = "active",    PrimaryColor = "#0d7377", LogoInitials = "AL", Mrr = 3840, CreatedAt = D("2019-03-01") },
            new Tenant { Id = TenantSwift, Name = "SwiftCargo Ltd",    Slug = "swift", Plan = "Business",   Region = "Kenya",    Status = "active",    PrimaryColor = "#7c3aed", LogoInitials = "SC", Mrr = 1980, CreatedAt = D("2021-06-01") },
            new Tenant { Id = TenantNex,   Name = "NairobiExpress",    Slug = "nex",   Plan = "Business",   Region = "Kenya",    Status = "active",    PrimaryColor = "#d97706", LogoInitials = "NE", Mrr = 1540, CreatedAt = D("2022-02-01") },
            new Tenant { Id = TenantKim,   Name = "KimTransport",      Slug = "kim",   Plan = "Starter",    Region = "Uganda",   Status = "suspended", PrimaryColor = "#dc2626", LogoInitials = "KT", Mrr = 420,  CreatedAt = D("2023-01-15") },
            new Tenant { Id = TenantPeak,  Name = "PeakFleet Co",      Slug = "peak",  Plan = "Business",   Region = "Tanzania", Status = "active",    PrimaryColor = "#0891b2", LogoInitials = "PF", Mrr = 2200, CreatedAt = D("2023-11-01") },
            new Tenant { Id = TenantSde,   Name = "SwiftDeliver EA",   Slug = "sde",   Plan = "Starter",    Region = "Kenya",    Status = "active",    PrimaryColor = "#16a34a", LogoInitials = "SD", Mrr = 560,  CreatedAt = D("2024-01-01") },
            new Tenant { Id = TenantStar,     Name = "Star Technologies",   Slug = "star",     Plan = "Enterprise",    Region = "Pakistan",       Status = "active", PrimaryColor = "#0d6e5e", LogoInitials = "ST", Mrr = 3200, CreatedAt = D("2025-06-01") },
            new Tenant { Id = TenantAtlantic, Name = "Atlantic Freight Inc", Slug = "atlantic", Plan = "Enterprise",    Region = "United States",  Status = "active", PrimaryColor = "#1e40af", LogoInitials = "AF", Mrr = 4200, CreatedAt = D("2023-03-01") },
            new Tenant { Id = TenantMeridian,  Name = "Meridian Logistics",  Slug = "meridian", Plan = "Professional",  Region = "United States",  Status = "active", PrimaryColor = "#047857", LogoInitials = "ML", Mrr = 2100, CreatedAt = D("2024-01-15") },
            new Tenant { Id = TenantBritfleet, Name = "BritFleet Solutions", Slug = "britfleet",Plan = "Enterprise",    Region = "United Kingdom", Status = "active", PrimaryColor = "#7c3aed", LogoInitials = "BF", Mrr = 3600, CreatedAt = D("2023-09-01") }
        );
    }

    // ────────────────────────────────────────────────────────────────────────
    private static void SeedUsers(ModelBuilder mb)
    {
        // Platform users (no tenant)
        var superAdminId    = DG("user:super@fleetosteam.io");
        var platformAdminId = DG("user:admin@fleetosteam.io");
        var partnerId       = DG("user:partner@transroute.af");

        // Demo password: "Demo1234!"
        const string hash = "$2a$11$UPEIGLJuqMVSJ1bXoXWHlOtlBoaVxiLpxbq0xLTBMfM9NrxzMOH7W";

        mb.Entity<AppUser>().HasData(
            // ── Platform ─────────────────────────────────────────────────────────
            new AppUser { Id = superAdminId,    FirstName = "Super",    LastName = "Admin",   Email = "super@fleetosteam.io",           PasswordHash = hash, Role = "super_admin",    Status = "Active", MfaEnabled = true,  TenantId = null,        CreatedAt = D("2023-01-01") },
            new AppUser { Id = platformAdminId, FirstName = "Platform", LastName = "Admin",   Email = "admin@fleetosteam.io",           PasswordHash = hash, Role = "platform_admin", Status = "Active", MfaEnabled = true,  TenantId = null,        CreatedAt = D("2023-01-01") },
            new AppUser { Id = partnerId,       FirstName = "Partner",  LastName = "User",    Email = "partner@transroute.af",          PasswordHash = hash, Role = "partner",        Status = "Active", MfaEnabled = false, TenantId = null,        CreatedAt = D("2023-06-01") },

            // ── ACME Logistics (tenant 1) ─────────────────────────────────────
            new AppUser { Id = DG("user:u-100"), FirstName = "Sara",    LastName = "Hassan",  Email = "tenant@acmelogistics.co.ke",     PasswordHash = hash, Role = "tenant_admin",  Status = "Active",    MfaEnabled = true,  TenantId = TenantAcme,  CreatedAt = D("2023-01-10") },
            new AppUser { Id = DG("user:u-101"), FirstName = "Arif",    LastName = "Khan",    Email = "admin@acmelogistics.co.ke",      PasswordHash = hash, Role = "fleet_admin",   Status = "Active",    MfaEnabled = true,  TenantId = TenantAcme,  CreatedAt = D("2023-01-10") },
            new AppUser { Id = DG("user:u-105"), FirstName = "James",   LastName = "Mwangi",  Email = "owner@acmelogistics.co.ke",      PasswordHash = hash, Role = "vehicle_owner", Status = "Active",    MfaEnabled = false, TenantId = TenantAcme,  CreatedAt = D("2023-02-01") },
            new AppUser { Id = DG("user:u-102"), FirstName = "Grace",   LastName = "Njeri",   Email = "manager@acmelogistics.co.ke",    PasswordHash = hash, Role = "fleet_manager", Status = "Active",    MfaEnabled = true,  TenantId = TenantAcme,  CreatedAt = D("2023-02-01") },
            new AppUser { Id = DG("user:u-103"), FirstName = "Patrick", LastName = "Singh",   Email = "dispatch@acmelogistics.co.ke",   PasswordHash = hash, Role = "dispatcher",    Status = "Active",    MfaEnabled = false, TenantId = TenantAcme,  CreatedAt = D("2023-03-01") },
            new AppUser { Id = DG("user:u-104"), FirstName = "Mary",    LastName = "Ali",     Email = "viewer@acmelogistics.co.ke",     PasswordHash = hash, Role = "viewer",        Status = "Active",    MfaEnabled = false, TenantId = TenantAcme,  CreatedAt = D("2023-03-01") },
            // Legacy shortcuts
            new AppUser { Id = DG("user:tenant@acme.io"),   FirstName = "S.", LastName = "Hassan", Email = "tenant@acme.io",   PasswordHash = hash, Role = "tenant_admin", Status = "Active", MfaEnabled = false, TenantId = TenantAcme, CreatedAt = D("2023-01-01") },
            new AppUser { Id = DG("user:admin@acme.io"),    FirstName = "A.", LastName = "Khan",   Email = "admin@acme.io",    PasswordHash = hash, Role = "fleet_admin",  Status = "Active", MfaEnabled = false, TenantId = TenantAcme, CreatedAt = D("2023-01-01") },
            new AppUser { Id = DG("user:dispatch@acme.io"), FirstName = "P.", LastName = "Singh",  Email = "dispatch@acme.io", PasswordHash = hash, Role = "dispatcher",   Status = "Active", MfaEnabled = false, TenantId = TenantAcme, CreatedAt = D("2023-01-01") },
            new AppUser { Id = DG("user:viewer@acme.io"),   FirstName = "M.", LastName = "Ali",    Email = "viewer@acme.io",   PasswordHash = hash, Role = "viewer",       Status = "Active", MfaEnabled = false, TenantId = TenantAcme, CreatedAt = D("2023-01-01") },

            // ── SwiftCargo Ltd (tenant 2) ─────────────────────────────────────
            new AppUser { Id = DG("user:u-201"), FirstName = "Hassan",  LastName = "Mwangi",  Email = "admin@swiftcargo.co.ke",         PasswordHash = hash, Role = "fleet_admin",   Status = "Active",    MfaEnabled = true,  TenantId = TenantSwift, CreatedAt = D("2021-06-10") },
            new AppUser { Id = DG("user:u-202"), FirstName = "Fatuma",  LastName = "Wanjiku", Email = "manager@swiftcargo.co.ke",       PasswordHash = hash, Role = "fleet_manager", Status = "Active",    MfaEnabled = false, TenantId = TenantSwift, CreatedAt = D("2021-06-10") },
            new AppUser { Id = DG("user:u-203"), FirstName = "James",   LastName = "Ochieng", Email = "billing@swiftcargo.co.ke",       PasswordHash = hash, Role = "billing_admin", Status = "Pending",   MfaEnabled = false, TenantId = TenantSwift, CreatedAt = D("2021-07-01") },

            // ── NairobiExpress (tenant 3) ─────────────────────────────────────
            new AppUser { Id = DG("user:u-301"), FirstName = "Samuel",  LastName = "Kamau",   Email = "admin@nairobiexpress.co.ke",     PasswordHash = hash, Role = "fleet_admin",   Status = "Active",    MfaEnabled = true,  TenantId = TenantNex,   CreatedAt = D("2022-02-10") },
            new AppUser { Id = DG("user:u-302"), FirstName = "Aisha",   LastName = "Omar",    Email = "dispatch@nairobiexpress.co.ke",  PasswordHash = hash, Role = "dispatcher",    Status = "Active",    MfaEnabled = false, TenantId = TenantNex,   CreatedAt = D("2022-03-01") },
            new AppUser { Id = DG("user:u-303"), FirstName = "Brian",   LastName = "Mutua",   Email = "viewer@nairobiexpress.co.ke",    PasswordHash = hash, Role = "viewer",        Status = "Suspended", MfaEnabled = false, TenantId = TenantNex,   CreatedAt = D("2022-04-01") },

            // ── KimTransport (tenant 4) ───────────────────────────────────────
            new AppUser { Id = DG("user:u-401"), FirstName = "Kimani",  LastName = "Mwenda",  Email = "admin@kimtransport.co.ug",       PasswordHash = hash, Role = "fleet_admin",   Status = "Suspended", MfaEnabled = false, TenantId = TenantKim,   CreatedAt = D("2023-01-20") },
            new AppUser { Id = DG("user:u-402"), FirstName = "Diana",   LastName = "Achieng", Email = "manager@kimtransport.co.ug",     PasswordHash = hash, Role = "fleet_manager", Status = "Suspended", MfaEnabled = false, TenantId = TenantKim,   CreatedAt = D("2023-01-20") },
            new AppUser { Id = DG("user:u-403"), FirstName = "Peter",   LastName = "Otieno",  Email = "dispatch@kimtransport.co.ug",    PasswordHash = hash, Role = "dispatcher",    Status = "Suspended", MfaEnabled = false, TenantId = TenantKim,   CreatedAt = D("2023-02-01") },

            // ── PeakFleet Co (tenant 5) ───────────────────────────────────────
            new AppUser { Id = DG("user:u-501"), FirstName = "Nadia",   LastName = "Osman",   Email = "admin@peakfleet.co.tz",          PasswordHash = hash, Role = "fleet_admin",   Status = "Active",    MfaEnabled = true,  TenantId = TenantPeak,  CreatedAt = D("2023-11-10") },
            new AppUser { Id = DG("user:u-502"), FirstName = "Joseph",  LastName = "Baraka",  Email = "manager@peakfleet.co.tz",        PasswordHash = hash, Role = "fleet_manager", Status = "Active",    MfaEnabled = true,  TenantId = TenantPeak,  CreatedAt = D("2023-11-10") },
            new AppUser { Id = DG("user:u-503"), FirstName = "Rose",    LastName = "Nakato",  Email = "billing@peakfleet.co.tz",        PasswordHash = hash, Role = "billing_admin", Status = "Active",    MfaEnabled = false, TenantId = TenantPeak,  CreatedAt = D("2023-12-01") },
            new AppUser { Id = DG("user:u-504"), FirstName = "Tom",     LastName = "Lekuta",  Email = "dispatch@peakfleet.co.tz",       PasswordHash = hash, Role = "dispatcher",    Status = "Active",    MfaEnabled = false, TenantId = TenantPeak,  CreatedAt = D("2023-12-01") },
            new AppUser { Id = DG("user:u-505"), FirstName = "Alice",   LastName = "Mwangi",  Email = "viewer@peakfleet.co.tz",         PasswordHash = hash, Role = "viewer",        Status = "Active",    MfaEnabled = false, TenantId = TenantPeak,  CreatedAt = D("2024-01-05") },

            // ── SwiftDeliver EA (tenant 6) ────────────────────────────────────
            new AppUser { Id = DG("user:u-601"), FirstName = "Kevin",   LastName = "Ndungu",  Email = "admin@swiftdeliver.co.ke",       PasswordHash = hash, Role = "fleet_admin",   Status = "Active",    MfaEnabled = false, TenantId = TenantSde,   CreatedAt = D("2024-01-10") },
            new AppUser { Id = DG("user:u-602"), FirstName = "Mercy",   LastName = "Chebet",  Email = "dispatch@swiftdeliver.co.ke",    PasswordHash = hash, Role = "dispatcher",    Status = "Pending",   MfaEnabled = false, TenantId = TenantSde,   CreatedAt = D("2024-02-01") },

            // ── Star Technologies (tenant 7) — Pakistan ───────────────────────
            new AppUser { Id = DG("user:u-700"), FirstName = "Sara",    LastName = "Kimani",  Email = "admin@starttech.io",             PasswordHash = hash, Role = "tenant_admin",  Status = "Active",    MfaEnabled = true,  TenantId = TenantStar,  CreatedAt = D("2025-06-01") },
            new AppUser { Id = DG("user:u-701"), FirstName = "Ahmed",   LastName = "Khan",    Email = "fleet@starttech.io",             PasswordHash = hash, Role = "fleet_admin",   Status = "Active",    MfaEnabled = true,  TenantId = TenantStar,  CreatedAt = D("2025-06-05") },
            new AppUser { Id = DG("user:u-702"), FirstName = "Fatima",  LastName = "Malik",   Email = "manager@starttech.io",           PasswordHash = hash, Role = "fleet_manager", Status = "Active",    MfaEnabled = false, TenantId = TenantStar,  CreatedAt = D("2025-06-10") },
            new AppUser { Id = DG("user:u-703"), FirstName = "Usman",   LastName = "Qureshi", Email = "dispatch@starttech.io",          PasswordHash = hash, Role = "dispatcher",    Status = "Active",    MfaEnabled = false, TenantId = TenantStar,  CreatedAt = D("2025-07-01") },
            new AppUser { Id = DG("user:u-704"), FirstName = "Ayesha",  LastName = "Butt",    Email = "viewer@starttech.io",            PasswordHash = hash, Role = "viewer",        Status = "Active",    MfaEnabled = false, TenantId = TenantStar,  CreatedAt = D("2025-07-15") },
            new AppUser { Id = DG("user:u-705"), FirstName = "Bilal",     LastName = "Raza",     Email = "billing@starttech.io",              PasswordHash = hash, Role = "billing_admin", Status = "Active", MfaEnabled = false, TenantId = TenantStar,     CreatedAt = D("2025-08-01") },

            // ── Atlantic Freight Inc (tenant 8) — USA ─────────────────────────
            new AppUser { Id = DG("user:u-800"), FirstName = "Jennifer", LastName = "Walsh",    Email = "admin@atlanticfreight.com",          PasswordHash = hash, Role = "tenant_admin",  Status = "Active", MfaEnabled = true,  TenantId = TenantAtlantic, CreatedAt = D("2023-03-05") },
            new AppUser { Id = DG("user:u-801"), FirstName = "Robert",   LastName = "Mitchell", Email = "fleet@atlanticfreight.com",           PasswordHash = hash, Role = "fleet_admin",   Status = "Active", MfaEnabled = true,  TenantId = TenantAtlantic, CreatedAt = D("2023-03-05") },
            new AppUser { Id = DG("user:u-802"), FirstName = "Sarah",    LastName = "O'Brien",  Email = "manager@atlanticfreight.com",         PasswordHash = hash, Role = "fleet_manager", Status = "Active", MfaEnabled = false, TenantId = TenantAtlantic, CreatedAt = D("2023-03-10") },
            new AppUser { Id = DG("user:u-803"), FirstName = "Kevin",    LastName = "Torres",   Email = "dispatch@atlanticfreight.com",        PasswordHash = hash, Role = "dispatcher",    Status = "Active", MfaEnabled = false, TenantId = TenantAtlantic, CreatedAt = D("2023-04-01") },
            new AppUser { Id = DG("user:u-804"), FirstName = "Linda",    LastName = "Chen",     Email = "billing@atlanticfreight.com",         PasswordHash = hash, Role = "billing_admin", Status = "Active", MfaEnabled = false, TenantId = TenantAtlantic, CreatedAt = D("2023-04-01") },
            new AppUser { Id = DG("user:u-805"), FirstName = "Mark",     LastName = "Davis",    Email = "viewer@atlanticfreight.com",          PasswordHash = hash, Role = "viewer",        Status = "Active", MfaEnabled = false, TenantId = TenantAtlantic, CreatedAt = D("2023-05-01") },

            // ── Meridian Logistics (tenant 9) — USA ───────────────────────────
            new AppUser { Id = DG("user:u-900"), FirstName = "James",    LastName = "Harrison", Email = "admin@meridianlogistics.com",         PasswordHash = hash, Role = "fleet_admin",   Status = "Active", MfaEnabled = true,  TenantId = TenantMeridian,  CreatedAt = D("2024-01-20") },
            new AppUser { Id = DG("user:u-901"), FirstName = "Amy",      LastName = "Rodriguez",Email = "manager@meridianlogistics.com",       PasswordHash = hash, Role = "fleet_manager", Status = "Active", MfaEnabled = false, TenantId = TenantMeridian,  CreatedAt = D("2024-01-20") },
            new AppUser { Id = DG("user:u-902"), FirstName = "Chris",    LastName = "Evans",    Email = "dispatch@meridianlogistics.com",      PasswordHash = hash, Role = "dispatcher",    Status = "Active", MfaEnabled = false, TenantId = TenantMeridian,  CreatedAt = D("2024-02-01") },
            new AppUser { Id = DG("user:u-903"), FirstName = "Patricia", LastName = "Lee",      Email = "billing@meridianlogistics.com",       PasswordHash = hash, Role = "billing_admin", Status = "Active", MfaEnabled = false, TenantId = TenantMeridian,  CreatedAt = D("2024-02-01") },

            // ── BritFleet Solutions (tenant 10) — UK ──────────────────────────
            new AppUser { Id = DG("user:u-1000"), FirstName = "Oliver",    LastName = "Thompson", Email = "admin@britfleet.co.uk",             PasswordHash = hash, Role = "tenant_admin",  Status = "Active", MfaEnabled = true,  TenantId = TenantBritfleet, CreatedAt = D("2023-09-05") },
            new AppUser { Id = DG("user:u-1001"), FirstName = "Charlotte", LastName = "Williams", Email = "fleet@britfleet.co.uk",             PasswordHash = hash, Role = "fleet_admin",   Status = "Active", MfaEnabled = true,  TenantId = TenantBritfleet, CreatedAt = D("2023-09-05") },
            new AppUser { Id = DG("user:u-1002"), FirstName = "George",    LastName = "Brown",    Email = "manager@britfleet.co.uk",           PasswordHash = hash, Role = "fleet_manager", Status = "Active", MfaEnabled = false, TenantId = TenantBritfleet, CreatedAt = D("2023-09-10") },
            new AppUser { Id = DG("user:u-1003"), FirstName = "Emma",      LastName = "Johnson",  Email = "dispatch@britfleet.co.uk",          PasswordHash = hash, Role = "dispatcher",    Status = "Active", MfaEnabled = false, TenantId = TenantBritfleet, CreatedAt = D("2023-10-01") },
            new AppUser { Id = DG("user:u-1004"), FirstName = "Harry",     LastName = "Wilson",   Email = "viewer@britfleet.co.uk",            PasswordHash = hash, Role = "viewer",        Status = "Active", MfaEnabled = false, TenantId = TenantBritfleet, CreatedAt = D("2023-10-01") }
        );
    }

    // ────────────────────────────────────────────────────────────────────────
    private static void SeedVehicles(ModelBuilder mb)
    {
        var d1  = DG("driver:d1");
        var d2  = DG("driver:d2");
        var d3  = DG("driver:d3");
        var d4  = DG("driver:d4");
        var d7  = DG("driver:d7");
        var d8  = DG("driver:d8");
        var d10 = DG("driver:d10");
        var d11 = DG("driver:d11");
        var d13 = DG("driver:d13");
        var d15 = DG("driver:d15");
        var d16 = DG("driver:d16");
        var d18 = DG("driver:d18");
        var d19 = DG("driver:d19");
        var d20 = DG("driver:d20");
        // ── Star Technologies drivers ─────────────────────────────────────────
        var ds7_001=DG("driver:ds7-001"); var ds7_002=DG("driver:ds7-002"); var ds7_003=DG("driver:ds7-003");
        var ds7_004=DG("driver:ds7-004"); var ds7_005=DG("driver:ds7-005"); var ds7_006=DG("driver:ds7-006");
        var ds7_007=DG("driver:ds7-007"); var ds7_008=DG("driver:ds7-008"); var ds7_009=DG("driver:ds7-009");
        var ds7_010=DG("driver:ds7-010"); var ds7_011=DG("driver:ds7-011"); var ds7_012=DG("driver:ds7-012");
        var ds7_013=DG("driver:ds7-013"); var ds7_014=DG("driver:ds7-014"); var ds7_015=DG("driver:ds7-015");
        var ds7_016=DG("driver:ds7-016"); var ds7_017=DG("driver:ds7-017"); var ds7_018=DG("driver:ds7-018");
        var ds7_019=DG("driver:ds7-019"); var ds7_020=DG("driver:ds7-020"); var ds7_021=DG("driver:ds7-021");
        var ds7_022=DG("driver:ds7-022"); var ds7_023=DG("driver:ds7-023"); var ds7_024=DG("driver:ds7-024");
        var ds7_025=DG("driver:ds7-025"); var ds7_026=DG("driver:ds7-026"); var ds7_027=DG("driver:ds7-027");
        var ds7_028=DG("driver:ds7-028"); var ds7_029=DG("driver:ds7-029"); var ds7_030=DG("driver:ds7-030");
        var ds7_031=DG("driver:ds7-031"); var ds7_032=DG("driver:ds7-032"); var ds7_033=DG("driver:ds7-033");
        var ds7_034=DG("driver:ds7-034"); var ds7_035=DG("driver:ds7-035"); var ds7_036=DG("driver:ds7-036");
        var ds7_037=DG("driver:ds7-037"); var ds7_038=DG("driver:ds7-038"); var ds7_039=DG("driver:ds7-039");
        var ds7_040=DG("driver:ds7-040"); var ds7_041=DG("driver:ds7-041"); var ds7_042=DG("driver:ds7-042");
        var ds7_043=DG("driver:ds7-043"); var ds7_044=DG("driver:ds7-044"); var ds7_045=DG("driver:ds7-045");
        var ds7_046=DG("driver:ds7-046"); var ds7_047=DG("driver:ds7-047"); var ds7_048=DG("driver:ds7-048");
        var ds7_049=DG("driver:ds7-049"); var ds7_050=DG("driver:ds7-050"); var ds7_051=DG("driver:ds7-051");
        var ds7_052=DG("driver:ds7-052"); var ds7_053=DG("driver:ds7-053"); var ds7_054=DG("driver:ds7-054");
        var ds7_055=DG("driver:ds7-055"); var ds7_056=DG("driver:ds7-056"); var ds7_057=DG("driver:ds7-057");
        var ds7_058=DG("driver:ds7-058"); var ds7_059=DG("driver:ds7-059"); var ds7_060=DG("driver:ds7-060");

        mb.Entity<Vehicle>().HasData(
            // ── ACME Logistics ────────────────────────────────────────────────
            new Vehicle {
                Id = DG("vehicle:v1"), TenantId = TenantAcme,
                ShortId = "v1",
                Plate = "KAB 001A", Vin = "WDB9634031L123456",
                Make = "Mercedes-Benz", Model = "Actros 2645", Year = 2022, Category = "Truck", BodyType = "Flatbed", Color = "White",
                EngineNo = "OM471-A-4561", EngineCapacity = "12.8L", FuelType = "Diesel", Transmission = "Automatic",
                Axles = 3, GrossWeightKg = 26000, PayloadKg = 18000, SeatingCapacity = 2,
                RegistrationCountry = "Kenya", RegistrationDate = D("2022-03-10"),
                PurchaseDate = D("2022-02-28"), PurchasePrice = 14500000, Supplier = "CMC Motors Kenya",
                OwnerType = "Company", OwnerName = "ACME Logistics Ltd", OwnerIdNo = "CPR/2008/001234", OwnerContact = "+254722110001",
                Status = "active", Odometer = 45230, FuelLevel = 68,
                CustomerId = "c-011", CustomerName = "ACME Group — Nairobi Branch", Department = "Nairobi Operations",
                AssignedDriverName = "Ali Hassan", AssignedDriverId = d1,
                Latitude = -1.3100, Longitude = 36.8300, SpeedKmh = 72, LastSeenAt = D("2026-05-29"),
                CreatedAt = D("2022-03-10"),
            },
            new Vehicle {
                Id = DG("vehicle:v2"), TenantId = TenantAcme,
                ShortId = "v2",
                Plate = "KAB 002B", Vin = "YV2A4C3A8NA500123",
                Make = "Volvo", Model = "FH16 750", Year = 2021, Category = "Truck", BodyType = "Box Body", Color = "Blue",
                EngineNo = "D16G-750-78901", EngineCapacity = "16.1L", FuelType = "Diesel", Transmission = "Automatic",
                Axles = 3, GrossWeightKg = 28000, PayloadKg = 20000, SeatingCapacity = 2,
                RegistrationCountry = "Kenya", RegistrationDate = D("2021-07-22"),
                PurchaseDate = D("2021-07-01"), PurchasePrice = 18200000, Supplier = "Volvo Trucks East Africa",
                OwnerType = "Company", OwnerName = "ACME Logistics Ltd", OwnerIdNo = "CPR/2008/001234", OwnerContact = "+254722110001",
                Status = "active", Odometer = 62100, FuelLevel = 45,
                CustomerId = "c-012", CustomerName = "ACME Group — Mombasa Branch", Department = "Port Operations",
                AssignedDriverName = "Sara Malik", AssignedDriverId = d2,
                Latitude = -1.2400, Longitude = 36.8700, SpeedKmh = 55, LastSeenAt = D("2026-05-29"),
                CreatedAt = D("2021-07-22"),
            },
            new Vehicle {
                Id = DG("vehicle:v3"), TenantId = TenantAcme,
                ShortId = "v3",
                Plate = "KAB 003C", Vin = "WF0XXXTTGXNB12345",
                Make = "Ford", Model = "Transit 350 LWB", Year = 2023, Category = "Van", BodyType = "Panel Van", Color = "Silver",
                EngineNo = "FT4-TDCI-23001", EngineCapacity = "2.0L", FuelType = "Diesel", Transmission = "Manual",
                Axles = 2, GrossWeightKg = 3500, PayloadKg = 1400, SeatingCapacity = 2,
                RegistrationCountry = "Kenya", RegistrationDate = D("2023-02-14"),
                PurchaseDate = D("2023-01-30"), PurchasePrice = 3800000, Supplier = "Ford Kenya Ltd",
                OwnerType = "Company", OwnerName = "SolarRoute Ltd", OwnerIdNo = "CPR/2015/007890", OwnerContact = "+254700300004",
                Status = "idle", Odometer = 12050, FuelLevel = 82,
                CustomerId = "c-004", CustomerName = "SolarRoute Ltd", Department = "Field Services",
                AssignedDriverName = null, AssignedDriverId = null,
                Latitude = -1.2630, Longitude = 36.8050, SpeedKmh = 0, LastSeenAt = D("2026-05-28"),
                CreatedAt = D("2023-02-14"),
            },
            new Vehicle {
                Id = DG("vehicle:v4"), TenantId = TenantAcme,
                ShortId = "v4",
                Plate = "KAB 004D", Vin = "XLR0988CS0E012345",
                Make = "DAF", Model = "XF 480 FT", Year = 2020, Category = "Truck", BodyType = "Curtainsider", Color = "Red",
                EngineNo = "MX11-375-KEN4D", EngineCapacity = "10.8L", FuelType = "Diesel", Transmission = "Automatic",
                Axles = 3, GrossWeightKg = 24000, PayloadKg = 16000, SeatingCapacity = 2,
                RegistrationCountry = "Kenya", RegistrationDate = D("2020-09-05"),
                PurchaseDate = D("2020-08-15"), PurchasePrice = 11000000, Supplier = "TransAfrica Auto",
                OwnerType = "Leased", OwnerName = "TransAfrica — Kenya Division",
                Status = "maintenance", Odometer = 88400, FuelLevel = 30,
                CustomerId = "c-021", CustomerName = "TransAfrica — Kenya Division", Department = "Long-haul",
                AssignedDriverName = null, AssignedDriverId = null,
                Latitude = null, Longitude = null, SpeedKmh = null, LastSeenAt = D("2026-05-28"),
                CreatedAt = D("2020-09-05"),
            },
            new Vehicle {
                Id = DG("vehicle:v5"), TenantId = TenantAcme,
                ShortId = "v5",
                Plate = "KAB 005E", Vin = "VF1JMAAA5HG456789",
                Make = "Renault", Model = "Master L3H2", Year = 2022, Category = "Van", BodyType = "High-roof Van", Color = "White",
                EngineNo = "M9T-G7-22005E", EngineCapacity = "2.3L", FuelType = "Diesel", Transmission = "Manual",
                Axles = 2, GrossWeightKg = 3500, PayloadKg = 1300, SeatingCapacity = 3,
                RegistrationCountry = "Kenya", RegistrationDate = D("2022-06-01"),
                PurchaseDate = D("2022-05-15"), PurchasePrice = 4200000, Supplier = "Renault Kenya",
                OwnerType = "Finance", OwnerName = "NileTech Solutions",
                Status = "offline", Odometer = 34780, FuelLevel = 15,
                CustomerId = "c-003", CustomerName = "NileTech Solutions", Department = "Field Tech",
                AssignedDriverName = "James Mwangi", AssignedDriverId = d3,
                Latitude = null, Longitude = null, SpeedKmh = null, LastSeenAt = D("2026-05-28"),
                CreatedAt = D("2022-06-01"),
            },
            new Vehicle {
                Id = DG("vehicle:v6"), TenantId = TenantAcme,
                ShortId = "v6",
                Plate = "KAB 006F", Vin = "YS2P4X20005123456",
                Make = "Scania", Model = "R500 XT", Year = 2021, Category = "Truck", BodyType = "Tipper", Color = "Yellow",
                EngineNo = "DC13-500-SC6F", EngineCapacity = "12.7L", FuelType = "Diesel", Transmission = "Automatic",
                Axles = 3, GrossWeightKg = 27000, PayloadKg = 19000, SeatingCapacity = 2,
                RegistrationCountry = "Kenya", RegistrationDate = D("2021-11-20"),
                PurchaseDate = D("2021-11-01"), PurchasePrice = 17500000, Supplier = "Scania East Africa",
                OwnerType = "Company", OwnerName = "ACME Group Holdings",
                Status = "active", Odometer = 51900, FuelLevel = 71,
                CustomerId = "c-001", CustomerName = "ACME Group Holdings", Department = "Quarry & Mining",
                AssignedDriverName = "Fatima Noor", AssignedDriverId = d4,
                Latitude = -1.3086, Longitude = 36.8483, SpeedKmh = 88, LastSeenAt = D("2026-05-29"),
                CreatedAt = D("2021-11-20"),
            },
            new Vehicle {
                Id = DG("vehicle:v-ind-001"), TenantId = TenantAcme,
                ShortId = "v-ind-001",
                Plate = "KDE 501P", Vin = "JTEBR3FJ200501234",
                Make = "Toyota", Model = "Land Cruiser Prado", Year = 2022, Category = "Car", BodyType = "SUV", Color = "Pearl White",
                EngineNo = "1GD-FTV-5012345", EngineCapacity = "2.8L", FuelType = "Diesel", Transmission = "Automatic",
                Axles = 2, GrossWeightKg = 2850, PayloadKg = 600, SeatingCapacity = 7,
                RegistrationCountry = "Kenya", RegistrationDate = D("2022-03-10"),
                PurchaseDate = D("2022-03-01"), PurchasePrice = 8500000, Supplier = "Toyota Kenya Ltd",
                OwnerType = "Individual", OwnerName = "James Kariuki Mwangi", OwnerIdNo = "12345678", OwnerContact = "+254 722 456 789",
                Status = "active", Odometer = 24500, FuelLevel = 68,
                CustomerId = "c-ind-001", CustomerName = "James Kariuki Mwangi", Department = null,
                AssignedDriverName = "James Kariuki Mwangi", AssignedDriverId = null,
                Latitude = -1.2644, Longitude = 36.8062, SpeedKmh = 0, LastSeenAt = D("2026-05-29"),
                CreatedAt = D("2022-03-10"),
            },

            // ── SwiftCargo Ltd ────────────────────────────────────────────────
            new Vehicle {
                Id = DG("vehicle:v7"), TenantId = TenantSwift,
                ShortId = "v7",
                Plate = "KCC 100A", Vin = "JALE6TE1200100001",
                Make = "Isuzu", Model = "FRR 90M", Year = 2021, Category = "Truck", BodyType = "Refrigerated", Color = "White",
                EngineNo = "4HK1-TC-7001", EngineCapacity = "5.2L", FuelType = "Diesel", Transmission = "Manual",
                Axles = 2, GrossWeightKg = 9000, PayloadKg = 5500, SeatingCapacity = 2,
                RegistrationCountry = "Kenya", RegistrationDate = D("2021-05-10"),
                PurchaseDate = D("2021-04-20"), PurchasePrice = 6800000, Supplier = "Isuzu East Africa",
                Status = "active", Odometer = 38200, FuelLevel = 74,
                CustomerId = "c-t2-001", CustomerName = "Nakuru Cold Chain Ltd", Department = "Cold Chain",
                AssignedDriverName = "Hassan Mwangi", AssignedDriverId = d7,
                Latitude = -1.2921, Longitude = 36.8219, SpeedKmh = 62, LastSeenAt = D("2026-05-29"),
                CreatedAt = D("2021-05-10"),
            },
            new Vehicle {
                Id = DG("vehicle:v8"), TenantId = TenantSwift,
                ShortId = "v8",
                Plate = "KCC 101B", Vin = "JTFJL9BN800101002",
                Make = "Toyota", Model = "Hilux Revo D/C", Year = 2023, Category = "Pickup", BodyType = "Double Cab", Color = "Silver",
                EngineNo = "2GD-FTV-101B", EngineCapacity = "2.4L", FuelType = "Diesel", Transmission = "Automatic",
                Axles = 2, GrossWeightKg = 3000, PayloadKg = 1000, SeatingCapacity = 5,
                RegistrationCountry = "Kenya", RegistrationDate = D("2023-08-01"),
                PurchaseDate = D("2023-07-15"), PurchasePrice = 4500000, Supplier = "Toyota Kenya",
                Status = "idle", Odometer = 14300, FuelLevel = 88,
                CustomerId = "c-t2-001", CustomerName = "Nakuru Cold Chain Ltd", Department = "Management",
                AssignedDriverName = "Fatuma Wanjiku", AssignedDriverId = d8,
                Latitude = -1.3000, Longitude = 36.8100, SpeedKmh = 0, LastSeenAt = D("2026-05-29"),
                CreatedAt = D("2023-08-01"),
            },
            new Vehicle {
                Id = DG("vehicle:v9"), TenantId = TenantSwift,
                ShortId = "v9",
                Plate = "KCC 102C", Vin = "JMFSNKK2WGJ102003",
                Make = "Mitsubishi", Model = "Fuso Canter 4D33", Year = 2019, Category = "Truck", BodyType = "Box Body", Color = "Yellow",
                EngineNo = "4D33-6AT-9003C", EngineCapacity = "3.9L", FuelType = "Diesel", Transmission = "Manual",
                Axles = 2, GrossWeightKg = 5000, PayloadKg = 3000, SeatingCapacity = 2,
                RegistrationCountry = "Kenya", RegistrationDate = D("2019-11-12"),
                PurchaseDate = D("2019-10-30"), PurchasePrice = 3200000, Supplier = "CMC Motors Kenya",
                Status = "maintenance", Odometer = 94500, FuelLevel = 20,
                CustomerId = "c-t2-002", CustomerName = "EastAfrica Fresh Produce", Department = "Urban Delivery",
                AssignedDriverName = null, AssignedDriverId = null,
                Latitude = null, Longitude = null, SpeedKmh = null, LastSeenAt = D("2026-05-27"),
                CreatedAt = D("2019-11-12"),
            },

            // ── NairobiExpress ────────────────────────────────────────────────
            new Vehicle {
                Id = DG("vehicle:v10"), TenantId = TenantNex,
                ShortId = "v10",
                Plate = "KDF 200A", Vin = "MAT43500051200001",
                Make = "Tata", Model = "LPT 1615 TC", Year = 2022, Category = "Truck", BodyType = "Flatbed", Color = "White",
                EngineNo = "CUMMINS-ISBe-200A", EngineCapacity = "5.9L", FuelType = "Diesel", Transmission = "Manual",
                Axles = 2, GrossWeightKg = 16000, PayloadKg = 10000, SeatingCapacity = 2,
                RegistrationCountry = "Kenya", RegistrationDate = D("2022-04-18"),
                PurchaseDate = D("2022-04-01"), PurchasePrice = 5800000, Supplier = "Tata Africa Holdings",
                Status = "active", Odometer = 52100, FuelLevel = 60,
                CustomerId = "c-t3-001", CustomerName = "Urban Courier Solutions", Department = "Nairobi Metro",
                AssignedDriverName = "Samuel Kamau", AssignedDriverId = d10,
                Latitude = -1.2833, Longitude = 36.8167, SpeedKmh = 48, LastSeenAt = D("2026-05-29"),
                CreatedAt = D("2022-04-18"),
            },
            new Vehicle {
                Id = DG("vehicle:v11"), TenantId = TenantNex,
                ShortId = "v11",
                Plate = "KDF 201B", Vin = "JTGJL9GP100201002",
                Make = "Toyota", Model = "HiAce Commuter", Year = 2020, Category = "Van", BodyType = "Minibus", Color = "White",
                EngineNo = "2KD-FTV-201B", EngineCapacity = "2.5L", FuelType = "Diesel", Transmission = "Manual",
                Axles = 2, GrossWeightKg = 3000, PayloadKg = 800, SeatingCapacity = 14,
                RegistrationCountry = "Kenya", RegistrationDate = D("2020-06-10"),
                PurchaseDate = D("2020-05-25"), PurchasePrice = 3100000, Supplier = "Toyota Kenya",
                Status = "active", Odometer = 78400, FuelLevel = 52,
                CustomerId = "c-t3-002", CustomerName = "QuickMart Kenya Ltd", Department = "Staff Transport",
                AssignedDriverName = "Aisha Omar", AssignedDriverId = d11,
                Latitude = -1.3100, Longitude = 36.7900, SpeedKmh = 35, LastSeenAt = D("2026-05-29"),
                CreatedAt = D("2020-06-10"),
            },
            new Vehicle {
                Id = DG("vehicle:v12"), TenantId = TenantNex,
                ShortId = "v12",
                Plate = "KDF 202C", Vin = "JALE6TE1500202003",
                Make = "Isuzu", Model = "NPR 75L", Year = 2018, Category = "Truck", BodyType = "Curtainsider", Color = "Blue",
                EngineNo = "4HG1-T-202C", EngineCapacity = "4.6L", FuelType = "Diesel", Transmission = "Manual",
                Axles = 2, GrossWeightKg = 7500, PayloadKg = 4200, SeatingCapacity = 2,
                RegistrationCountry = "Kenya", RegistrationDate = D("2018-09-20"),
                PurchaseDate = D("2018-09-05"), PurchasePrice = 4100000, Supplier = "Isuzu East Africa",
                Status = "offline", Odometer = 129000, FuelLevel = 10,
                CustomerId = "c-t3-002", CustomerName = "QuickMart Kenya Ltd", Department = "Inter-County",
                AssignedDriverName = null, AssignedDriverId = null,
                Latitude = null, Longitude = null, SpeedKmh = null, LastSeenAt = D("2026-05-28"),
                CreatedAt = D("2018-09-20"),
            },

            // ── KimTransport ──────────────────────────────────────────────────
            new Vehicle {
                Id = DG("vehicle:v13"), TenantId = TenantKim,
                ShortId = "v13",
                Plate = "UBF 300A", Vin = "JHLRD1870MC300001",
                Make = "Hino", Model = "300 Series 614", Year = 2020, Category = "Truck", BodyType = "Box Body", Color = "White",
                EngineNo = "N04C-TJ-300A", EngineCapacity = "4.0L", FuelType = "Diesel", Transmission = "Manual",
                Axles = 2, GrossWeightKg = 6000, PayloadKg = 3500, SeatingCapacity = 2,
                RegistrationCountry = "Uganda", RegistrationDate = D("2020-08-15"),
                PurchaseDate = D("2020-08-01"), PurchasePrice = 4800000, Supplier = "Hino Uganda",
                Status = "idle", Odometer = 64200, FuelLevel = 40,
                CustomerId = "c-t4-001", CustomerName = "Kampala Tiles & Hardware", Department = "Kampala Distribution",
                AssignedDriverName = "Kimani Mwenda", AssignedDriverId = d13,
                Latitude = 0.3163, Longitude = 32.5822, SpeedKmh = 0, LastSeenAt = D("2026-05-29"),
                CreatedAt = D("2020-08-15"),
            },
            new Vehicle {
                Id = DG("vehicle:v14"), TenantId = TenantKim,
                ShortId = "v14",
                Plate = "UBF 301B", Vin = "JTMHX3FH500301002",
                Make = "Toyota", Model = "Land Cruiser 79 Series", Year = 2019, Category = "Car", BodyType = "Station Wagon", Color = "White",
                EngineNo = "1VD-FTV-301B", EngineCapacity = "4.5L", FuelType = "Diesel", Transmission = "Manual",
                Axles = 2, GrossWeightKg = 3350, PayloadKg = 900, SeatingCapacity = 8,
                RegistrationCountry = "Uganda", RegistrationDate = D("2019-05-22"),
                PurchaseDate = D("2019-05-10"), PurchasePrice = 9500000, Supplier = "Toyota Uganda",
                Status = "offline", Odometer = 88700, FuelLevel = 35,
                CustomerId = "c-t4-002", CustomerName = "Nile Agro Processing", Department = "Executive",
                AssignedDriverName = null, AssignedDriverId = null,
                Latitude = null, Longitude = null, SpeedKmh = null, LastSeenAt = D("2026-05-22"),
                CreatedAt = D("2019-05-22"),
            },

            // ── PeakFleet Co ──────────────────────────────────────────────────
            new Vehicle {
                Id = DG("vehicle:v15"), TenantId = TenantPeak,
                ShortId = "v15",
                Plate = "T200AAA", Vin = "WDF9066231S200001",
                Make = "Mercedes-Benz", Model = "Sprinter 516 CDI", Year = 2023, Category = "Van", BodyType = "Panel Van", Color = "White",
                EngineNo = "OM651-DE-22LA-200A", EngineCapacity = "2.1L", FuelType = "Diesel", Transmission = "Automatic",
                Axles = 2, GrossWeightKg = 5000, PayloadKg = 2500, SeatingCapacity = 3,
                RegistrationCountry = "Tanzania", RegistrationDate = D("2023-03-15"),
                PurchaseDate = D("2023-03-01"), PurchasePrice = 7200000, Supplier = "Mercedes-Benz Tanzania",
                Status = "active", Odometer = 22100, FuelLevel = 78,
                CustomerId = "c-t5-001", CustomerName = "Dar Construction Group", Department = "Dar es Salaam Metro",
                AssignedDriverName = "Nadia Osman", AssignedDriverId = d15,
                Latitude = -6.7924, Longitude = 39.2083, SpeedKmh = 45, LastSeenAt = D("2026-05-29"),
                CreatedAt = D("2023-03-15"),
            },
            new Vehicle {
                Id = DG("vehicle:v16"), TenantId = TenantPeak,
                ShortId = "v16",
                Plate = "T201BBB", Vin = "XLR0988CS0E201002",
                Make = "DAF", Model = "LF 290 FA", Year = 2021, Category = "Truck", BodyType = "Box Body", Color = "Blue",
                EngineNo = "PACCAR-PX7-201B", EngineCapacity = "6.7L", FuelType = "Diesel", Transmission = "Automatic",
                Axles = 2, GrossWeightKg = 12000, PayloadKg = 7500, SeatingCapacity = 2,
                RegistrationCountry = "Tanzania", RegistrationDate = D("2021-09-01"),
                PurchaseDate = D("2021-08-15"), PurchasePrice = 9800000, Supplier = "DAF Tanzania",
                Status = "active", Odometer = 41600, FuelLevel = 62,
                CustomerId = "c-t5-001", CustomerName = "Dar Construction Group", Department = "Tanga Corridor",
                AssignedDriverName = "Joseph Baraka", AssignedDriverId = d16,
                Latitude = -6.8160, Longitude = 39.2800, SpeedKmh = 70, LastSeenAt = D("2026-05-29"),
                CreatedAt = D("2021-09-01"),
            },
            new Vehicle {
                Id = DG("vehicle:v17"), TenantId = TenantPeak,
                ShortId = "v17",
                Plate = "T202CCC", Vin = "JALE6TE1800202003",
                Make = "Isuzu", Model = "FVZ 1400", Year = 2019, Category = "Truck", BodyType = "Flatbed", Color = "Red",
                EngineNo = "6HK1-TCC-202C", EngineCapacity = "7.8L", FuelType = "Diesel", Transmission = "Manual",
                Axles = 3, GrossWeightKg = 26000, PayloadKg = 17000, SeatingCapacity = 2,
                RegistrationCountry = "Tanzania", RegistrationDate = D("2019-12-10"),
                PurchaseDate = D("2019-11-25"), PurchasePrice = 10500000, Supplier = "Isuzu Tanzania",
                Status = "maintenance", Odometer = 105800, FuelLevel = 25,
                CustomerId = "c-t5-011", CustomerName = "Dar Construction — Dodoma Site", Department = "Heavy Haulage",
                AssignedDriverName = null, AssignedDriverId = null,
                Latitude = null, Longitude = null, SpeedKmh = null, LastSeenAt = D("2026-05-26"),
                CreatedAt = D("2019-12-10"),
            },
            new Vehicle {
                Id = DG("vehicle:v18"), TenantId = TenantPeak,
                ShortId = "v18",
                Plate = "T203DDD", Vin = "AHTFK3CD200203004",
                Make = "Toyota", Model = "HiLux Vigo 4x4", Year = 2022, Category = "Pickup", BodyType = "Single Cab", Color = "Black",
                EngineNo = "2GD-FTV-203D", EngineCapacity = "2.4L", FuelType = "Diesel", Transmission = "Manual",
                Axles = 2, GrossWeightKg = 2800, PayloadKg = 1000, SeatingCapacity = 3,
                RegistrationCountry = "Tanzania", RegistrationDate = D("2022-07-20"),
                PurchaseDate = D("2022-07-05"), PurchasePrice = 5100000, Supplier = "Toyota Tanzania",
                Status = "idle", Odometer = 18900, FuelLevel = 90,
                CustomerId = "c-t5-002", CustomerName = "TanzaFresh Foods Ltd", Department = "Field Operations",
                AssignedDriverName = "Tom Lekuta", AssignedDriverId = d18,
                Latitude = -6.7924, Longitude = 39.2400, SpeedKmh = 0, LastSeenAt = D("2026-05-29"),
                CreatedAt = D("2022-07-20"),
            },

            // ── SwiftDeliver EA ───────────────────────────────────────────────
            new Vehicle {
                Id = DG("vehicle:v19"), TenantId = TenantSde,
                ShortId = "v19",
                Plate = "KDE 400A", Vin = "ME3RC1840PM400001",
                Make = "Bajaj", Model = "Maxima Z Cargo", Year = 2024, Category = "Motorcycle", BodyType = "Cargo Trike", Color = "Yellow",
                EngineNo = "DTSi-CARGO-400A", EngineCapacity = "0.2L", FuelType = "Petrol", Transmission = "Automatic",
                Axles = 3, GrossWeightKg = 600, PayloadKg = 300, SeatingCapacity = 1,
                RegistrationCountry = "Kenya", RegistrationDate = D("2024-01-10"),
                PurchaseDate = D("2023-12-20"), PurchasePrice = 450000, Supplier = "Bajaj Kenya",
                Status = "active", Odometer = 8400, FuelLevel = 65,
                CustomerId = "c-t6-001", CustomerName = "Nairobi eShop Ltd", Department = "Last-Mile Delivery",
                AssignedDriverName = "Kevin Ndungu", AssignedDriverId = d20,
                Latitude = -1.2921, Longitude = 36.8500, SpeedKmh = 28, LastSeenAt = D("2026-05-29"),
                CreatedAt = D("2024-01-10"),
            },
            new Vehicle {
                Id = DG("vehicle:v20"), TenantId = TenantSde,
                ShortId = "v20",
                Plate = "KDE 401B", Vin = "JTGJL9BN100401002",
                Make = "Toyota", Model = "HiAce Panel Van", Year = 2022, Category = "Van", BodyType = "Panel Van", Color = "White",
                EngineNo = "2KD-FTV-401B", EngineCapacity = "2.5L", FuelType = "Diesel", Transmission = "Manual",
                Axles = 2, GrossWeightKg = 3000, PayloadKg = 1100, SeatingCapacity = 2,
                RegistrationCountry = "Kenya", RegistrationDate = D("2022-11-05"),
                PurchaseDate = D("2022-10-20"), PurchasePrice = 3400000, Supplier = "Toyota Kenya",
                Status = "active", Odometer = 31600, FuelLevel = 55,
                CustomerId = "c-t6-002", CustomerName = "Savanna Digital Commerce", Department = "Nairobi CBD",
                AssignedDriverName = null, AssignedDriverId = null,
                Latitude = -1.2800, Longitude = 36.8200, SpeedKmh = 22, LastSeenAt = D("2026-05-29"),
                CreatedAt = D("2022-11-05"),
            }
        );

        // ── Star Technologies Pakistan vehicles ───────────────────────────────
        mb.Entity<Vehicle>().HasData(
            new Vehicle {
                Id=DG("vehicle:vs7-001"), TenantId=TenantStar, ShortId="vs7-001",
                Plate="LHR-0001", Vin="LFAN7LHR0012022A0",
                Make="FAW", Model="J6 6x4", Year=2022, Category="Truck", BodyType="Cargo", Color="White",
                EngineNo="FAW-J6-LH001", EngineCapacity="11.0L", FuelType="Diesel", Transmission="Manual",
                Axles=3, GrossWeightKg=25000, PayloadKg=16000, SeatingCapacity=2,
                RegistrationCountry="Pakistan", RegistrationDate=D("2022-04-15"),
                PurchaseDate=D("2022-03-20"), PurchasePrice=10200000, Supplier="Al-Haj FAW Motors Pakistan",
                Status="active", Odometer=32400, FuelLevel=72,
                CustomerId="c-t7-001", CustomerName="Punjab Transport Group", Department="Punjab Operations",
                AssignedDriverName=null, AssignedDriverId=null,
                Latitude=31.4510, Longitude=74.3500, SpeedKmh=65, LastSeenAt=D("2026-05-31"),
                CreatedAt=D("2022-04-15"),
            },
            new Vehicle {
                Id=DG("vehicle:vs7-002"), TenantId=TenantStar, ShortId="vs7-002",
                Plate="KHI-0001", Vin="JH1FCKHI0012022A0",
                Make="Hino", Model="500 Series FC9JJSB", Year=2022, Category="Truck", BodyType="Box Body", Color="White",
                EngineNo="HINO5-KH001", EngineCapacity="7.7L", FuelType="Diesel", Transmission="Manual",
                Axles=2, GrossWeightKg=12000, PayloadKg=7500, SeatingCapacity=2,
                RegistrationCountry="Pakistan", RegistrationDate=D("2022-06-10"),
                PurchaseDate=D("2022-05-20"), PurchasePrice=7800000, Supplier="Ghandhara Industries Ltd",
                Status="active", Odometer=28700, FuelLevel=58,
                CustomerId="c-t7-002", CustomerName="Karachi Port Authority", Department="Port Operations",
                AssignedDriverName=null, AssignedDriverId=null,
                Latitude=24.8500, Longitude=67.0100, SpeedKmh=42, LastSeenAt=D("2026-05-31"),
                CreatedAt=D("2022-06-10"),
            },
            new Vehicle {
                Id=DG("vehicle:vs7-003"), TenantId=TenantStar, ShortId="vs7-003",
                Plate="ISB-0001", Vin="JTDBXISB0012023A0",
                Make="Toyota", Model="Hilux Revo D/C", Year=2023, Category="Pickup", BodyType="Double Cab", Color="Silver",
                EngineNo="1GD-FTV-IS001", EngineCapacity="2.8L", FuelType="Diesel", Transmission="Manual",
                Axles=2, GrossWeightKg=3200, PayloadKg=1000, SeatingCapacity=5,
                RegistrationCountry="Pakistan", RegistrationDate=D("2023-03-10"),
                PurchaseDate=D("2023-02-15"), PurchasePrice=7200000, Supplier="Indus Motor Company",
                Status="active", Odometer=14200, FuelLevel=81,
                CustomerId="c-t7-003", CustomerName="Federal Government Supplies", Department="Islamabad Capital",
                AssignedDriverName=null, AssignedDriverId=null,
                Latitude=33.6500, Longitude=73.0800, SpeedKmh=55, LastSeenAt=D("2026-05-31"),
                CreatedAt=D("2023-03-10"),
            },
            new Vehicle {
                Id=DG("vehicle:vs7-004"), TenantId=TenantStar, ShortId="vs7-004",
                Plate="MLT-0001", Vin="JH1FAMLT0012021A0",
                Make="Hino", Model="300 Series 616", Year=2021, Category="Truck", BodyType="Box Body", Color="Blue",
                EngineNo="HINO3-ML001", EngineCapacity="4.0L", FuelType="Diesel", Transmission="Manual",
                Axles=2, GrossWeightKg=6000, PayloadKg=3500, SeatingCapacity=2,
                RegistrationCountry="Pakistan", RegistrationDate=D("2021-09-20"),
                PurchaseDate=D("2021-08-25"), PurchasePrice=4500000, Supplier="Ghandhara Industries Ltd",
                Status="active", Odometer=41600, FuelLevel=45,
                CustomerId="c-t7-004", CustomerName="Multan Cotton Board", Department="Cotton Trade",
                AssignedDriverName=null, AssignedDriverId=null,
                Latitude=30.1500, Longitude=71.5200, SpeedKmh=48, LastSeenAt=D("2026-05-31"),
                CreatedAt=D("2021-09-20"),
            },
            new Vehicle {
                Id=DG("vehicle:vs7-005"), TenantId=TenantStar, ShortId="vs7-005",
                Plate="GWD-0001", Vin="LFAN7GWD0012022A0",
                Make="FAW", Model="J6 6x4", Year=2022, Category="Truck", BodyType="Cargo", Color="Orange",
                EngineNo="FAW-J6-GW001", EngineCapacity="11.0L", FuelType="Diesel", Transmission="Manual",
                Axles=3, GrossWeightKg=25000, PayloadKg=16000, SeatingCapacity=2,
                RegistrationCountry="Pakistan", RegistrationDate=D("2022-08-05"),
                PurchaseDate=D("2022-07-10"), PurchasePrice=10200000, Supplier="Al-Haj FAW Motors Pakistan",
                Status="active", Odometer=19800, FuelLevel=63,
                CustomerId="c-t7-005", CustomerName="CPEC Logistics Gwadar", Department="CPEC Corridor",
                AssignedDriverName=null, AssignedDriverId=null,
                Latitude=25.1200, Longitude=62.3200, SpeedKmh=52, LastSeenAt=D("2026-05-31"),
                CreatedAt=D("2022-08-05"),
            }
        );

        // ── Atlantic Freight Inc USA vehicles ─────────────────────────────────
        mb.Entity<Vehicle>().HasData(
            new Vehicle {
                Id=DG("vehicle:va8-001"), TenantId=TenantAtlantic, ShortId="va8-001",
                Plate="NJ-7841A", Vin="1FDUF5GT0NDA41001",
                Make="Ford", Model="F-650 Pro Loader", Year=2022, Category="Truck", BodyType="Box Body", Color="White",
                EngineNo="FF650-PL-NJ001", EngineCapacity="6.7L", FuelType="Diesel", Transmission="Automatic",
                Axles=2, GrossWeightKg=11800, PayloadKg=7200, SeatingCapacity=2,
                RegistrationCountry="United States", RegistrationDate=D("2022-04-10"),
                PurchaseDate=D("2022-03-15"), PurchasePrice=82000, Supplier="Rush Truck Centers",
                OwnerType="Company", OwnerName="Atlantic Freight Inc", OwnerIdNo="NJ-CRP-2018-001234", OwnerContact="+1 973 555 0100",
                Status="active", Odometer=38200, FuelLevel=72,
                CustomerId="c-a8-001", CustomerName="Atlantic Manufacturing Corp", Department="NJ Operations",
                AssignedDriverName="Robert Mitchell", AssignedDriverId=DG("driver:da8-001"),
                Latitude=40.7282, Longitude=-74.0776, SpeedKmh=62, LastSeenAt=D("2026-06-06"),
                CreatedAt=D("2022-04-10"),
            },
            new Vehicle {
                Id=DG("vehicle:va8-002"), TenantId=TenantAtlantic, ShortId="va8-002",
                Plate="NJ-7842B", Vin="1FUJGLDR0MLFA42002",
                Make="Freightliner", Model="Cascadia", Year=2021, Category="Truck", BodyType="Dry Van", Color="Black",
                EngineNo="DD15-CAS-NJ002", EngineCapacity="14.8L", FuelType="Diesel", Transmission="Automatic",
                Axles=3, GrossWeightKg=36000, PayloadKg=22000, SeatingCapacity=2,
                RegistrationCountry="United States", RegistrationDate=D("2021-06-20"),
                PurchaseDate=D("2021-05-25"), PurchasePrice=145000, Supplier="Rush Truck Centers",
                OwnerType="Company", OwnerName="Atlantic Freight Inc", OwnerIdNo="NJ-CRP-2018-001234", OwnerContact="+1 973 555 0100",
                Status="idle", Odometer=64100, FuelLevel=45,
                CustomerId=null, CustomerName=null, Department="Long-Haul",
                AssignedDriverName=null, AssignedDriverId=null,
                Latitude=40.6501, Longitude=-73.9496, SpeedKmh=0, LastSeenAt=D("2026-06-06"),
                CreatedAt=D("2021-06-20"),
            },
            new Vehicle {
                Id=DG("vehicle:va8-003"), TenantId=TenantAtlantic, ShortId="va8-003",
                Plate="NJ-7843C", Vin="1FTBR1C84MKA43003",
                Make="Ford", Model="Transit 250", Year=2023, Category="Van", BodyType="Panel Van", Color="White",
                EngineNo="FT250-EV-NJ003", EngineCapacity="3.5L", FuelType="Diesel", Transmission="Automatic",
                Axles=2, GrossWeightKg=3900, PayloadKg=1400, SeatingCapacity=2,
                RegistrationCountry="United States", RegistrationDate=D("2023-02-15"),
                PurchaseDate=D("2023-01-20"), PurchasePrice=48000, Supplier="Ford Motor Company",
                OwnerType="Company", OwnerName="Atlantic Freight Inc", OwnerIdNo="NJ-CRP-2018-001234", OwnerContact="+1 973 555 0100",
                Status="active", Odometer=12800, FuelLevel=81,
                CustomerId="c-a8-002", CustomerName="Metro Retail Group", Department="Metro Delivery",
                AssignedDriverName="Kevin Torres", AssignedDriverId=DG("driver:da8-003"),
                Latitude=40.7614, Longitude=-73.9776, SpeedKmh=35, LastSeenAt=D("2026-06-06"),
                CreatedAt=D("2023-02-15"),
            },
            new Vehicle {
                Id=DG("vehicle:va8-004"), TenantId=TenantAtlantic, ShortId="va8-004",
                Plate="NJ-7844D", Vin="1XP5DB9X7LD579044",
                Make="Peterbilt", Model="579", Year=2020, Category="Truck", BodyType="Sleeper Cab", Color="Blue",
                EngineNo="PACCAR-MX13-NJ004", EngineCapacity="12.9L", FuelType="Diesel", Transmission="Automatic",
                Axles=3, GrossWeightKg=36000, PayloadKg=22500, SeatingCapacity=2,
                RegistrationCountry="United States", RegistrationDate=D("2020-10-01"),
                PurchaseDate=D("2020-09-10"), PurchasePrice=138000, Supplier="Rush Truck Centers",
                OwnerType="Company", OwnerName="Atlantic Freight Inc", OwnerIdNo="NJ-CRP-2018-001234", OwnerContact="+1 973 555 0100",
                Status="maintenance", Odometer=92300, FuelLevel=25,
                CustomerId=null, CustomerName=null, Department="Long-Haul",
                AssignedDriverName=null, AssignedDriverId=null,
                Latitude=null, Longitude=null, SpeedKmh=null, LastSeenAt=D("2026-06-05"),
                CreatedAt=D("2020-10-01"),
            },
            new Vehicle {
                Id=DG("vehicle:va8-005"), TenantId=TenantAtlantic, ShortId="va8-005",
                Plate="NJ-7845E", Vin="3C6TRVDG4ME45005",
                Make="Ram", Model="ProMaster 3500", Year=2022, Category="Van", BodyType="Cargo Van", Color="Silver",
                EngineNo="RPMC-3500-NJ005", EngineCapacity="3.6L", FuelType="Diesel", Transmission="Automatic",
                Axles=2, GrossWeightKg=4500, PayloadKg=1800, SeatingCapacity=2,
                RegistrationCountry="United States", RegistrationDate=D("2022-07-20"),
                PurchaseDate=D("2022-06-25"), PurchasePrice=44000, Supplier="Ford Motor Company",
                OwnerType="Company", OwnerName="Atlantic Freight Inc", OwnerIdNo="NJ-CRP-2018-001234", OwnerContact="+1 973 555 0100",
                Status="active", Odometer=22100, FuelLevel=66,
                CustomerId="c-a8-001", CustomerName="Atlantic Manufacturing Corp", Department="NJ Operations",
                AssignedDriverName=null, AssignedDriverId=null,
                Latitude=40.8448, Longitude=-73.8648, SpeedKmh=28, LastSeenAt=D("2026-06-06"),
                CreatedAt=D("2022-07-20"),
            },
            new Vehicle {
                Id=DG("vehicle:va8-006"), TenantId=TenantAtlantic, ShortId="va8-006",
                Plate="NJ-7846F", Vin="1XKAD49X6LJ680046",
                Make="Kenworth", Model="T680", Year=2021, Category="Truck", BodyType="Dry Van", Color="Red",
                EngineNo="PACCAR-MX11-NJ006", EngineCapacity="10.9L", FuelType="Diesel", Transmission="Automatic",
                Axles=3, GrossWeightKg=36000, PayloadKg=22000, SeatingCapacity=2,
                RegistrationCountry="United States", RegistrationDate=D("2021-09-15"),
                PurchaseDate=D("2021-08-20"), PurchasePrice=140000, Supplier="Rush Truck Centers",
                OwnerType="Company", OwnerName="Atlantic Freight Inc", OwnerIdNo="NJ-CRP-2018-001234", OwnerContact="+1 973 555 0100",
                Status="active", Odometer=51700, FuelLevel=58,
                CustomerId=null, CustomerName=null, Department="Long-Haul",
                AssignedDriverName=null, AssignedDriverId=null,
                Latitude=40.5795, Longitude=-74.1502, SpeedKmh=55, LastSeenAt=D("2026-06-06"),
                CreatedAt=D("2021-09-15"),
            },
            new Vehicle {
                Id=DG("vehicle:va8-007"), TenantId=TenantAtlantic, ShortId="va8-007",
                Plate="NJ-7847G", Vin="WD3PE8CC4FP947007",
                Make="Mercedes-Benz", Model="Sprinter 2500", Year=2023, Category="Van", BodyType="Panel Van", Color="White",
                EngineNo="MBZ-S2500-NJ007", EngineCapacity="2.0L", FuelType="Diesel", Transmission="Automatic",
                Axles=2, GrossWeightKg=3500, PayloadKg=1200, SeatingCapacity=2,
                RegistrationCountry="United States", RegistrationDate=D("2023-05-10"),
                PurchaseDate=D("2023-04-15"), PurchasePrice=52000, Supplier="Ford Motor Company",
                OwnerType="Company", OwnerName="Atlantic Freight Inc", OwnerIdNo="NJ-CRP-2018-001234", OwnerContact="+1 973 555 0100",
                Status="offline", Odometer=8900, FuelLevel=90,
                CustomerId=null, CustomerName=null, Department="Local Delivery",
                AssignedDriverName=null, AssignedDriverId=null,
                Latitude=40.7282, Longitude=-74.0776, SpeedKmh=0, LastSeenAt=D("2026-06-05"),
                CreatedAt=D("2023-05-10"),
            },
            new Vehicle {
                Id=DG("vehicle:va8-008"), TenantId=TenantAtlantic, ShortId="va8-008",
                Plate="NJ-7848H", Vin="3HSDJAPR1CN648008",
                Make="International", Model="LT Series", Year=2022, Category="Truck", BodyType="Dry Van", Color="Gray",
                EngineNo="INT-LT-A26-NJ008", EngineCapacity="12.4L", FuelType="Diesel", Transmission="Automatic",
                Axles=3, GrossWeightKg=36000, PayloadKg=22500, SeatingCapacity=2,
                RegistrationCountry="United States", RegistrationDate=D("2022-06-05"),
                PurchaseDate=D("2022-05-10"), PurchasePrice=142000, Supplier="Rush Truck Centers",
                OwnerType="Company", OwnerName="Atlantic Freight Inc", OwnerIdNo="NJ-CRP-2018-001234", OwnerContact="+1 973 555 0100",
                Status="active", Odometer=41500, FuelLevel=48,
                CustomerId=null, CustomerName=null, Department="Long-Haul",
                AssignedDriverName="Robert Mitchell", AssignedDriverId=DG("driver:da8-001"),
                Latitude=40.6892, Longitude=-74.0445, SpeedKmh=72, LastSeenAt=D("2026-06-06"),
                CreatedAt=D("2022-06-05"),
            }
        );

        // ── Meridian Logistics USA vehicles ───────────────────────────────────
        mb.Entity<Vehicle>().HasData(
            new Vehicle {
                Id=DG("vehicle:vm9-001"), TenantId=TenantMeridian, ShortId="vm9-001",
                Plate="TX-MLG-001", Vin="1XKYD49X9NJ901001",
                Make="Kenworth", Model="T880", Year=2022, Category="Truck", BodyType="Dry Van", Color="White",
                EngineNo="PACCAR-MX13-TX001", EngineCapacity="12.9L", FuelType="Diesel", Transmission="Automatic",
                Axles=3, GrossWeightKg=36000, PayloadKg=23000, SeatingCapacity=2,
                RegistrationCountry="United States", RegistrationDate=D("2022-03-10"),
                PurchaseDate=D("2022-02-15"), PurchasePrice=148000, Supplier="Lone Star Truck Group",
                OwnerType="Company", OwnerName="Meridian Logistics LLC", OwnerIdNo="TX-CRP-2020-009001", OwnerContact="+1 713 555 0200",
                Status="active", Odometer=44200, FuelLevel=76,
                CustomerId="c-m9-001", CustomerName="Lone Star Energy LLC", Department="Houston Ops",
                AssignedDriverName="James Harrison", AssignedDriverId=DG("driver:dm9-001"),
                Latitude=29.7604, Longitude=-95.3698, SpeedKmh=68, LastSeenAt=D("2026-06-06"),
                CreatedAt=D("2022-03-10"),
            },
            new Vehicle {
                Id=DG("vehicle:vm9-002"), TenantId=TenantMeridian, ShortId="vm9-002",
                Plate="TX-MLG-002", Vin="1FUJGLDR5MLFA42902",
                Make="Freightliner", Model="M2 106", Year=2021, Category="Truck", BodyType="Box Body", Color="Blue",
                EngineNo="DD8-M2106-TX002", EngineCapacity="6.7L", FuelType="Diesel", Transmission="Automatic",
                Axles=2, GrossWeightKg=12000, PayloadKg=7500, SeatingCapacity=2,
                RegistrationCountry="United States", RegistrationDate=D("2021-08-20"),
                PurchaseDate=D("2021-07-25"), PurchasePrice=78000, Supplier="Lone Star Truck Group",
                OwnerType="Company", OwnerName="Meridian Logistics LLC", OwnerIdNo="TX-CRP-2020-009001", OwnerContact="+1 713 555 0200",
                Status="idle", Odometer=37800, FuelLevel=52,
                CustomerId=null, CustomerName=null, Department="Local Distribution",
                AssignedDriverName=null, AssignedDriverId=null,
                Latitude=29.8174, Longitude=-95.3943, SpeedKmh=0, LastSeenAt=D("2026-06-06"),
                CreatedAt=D("2021-08-20"),
            },
            new Vehicle {
                Id=DG("vehicle:vm9-003"), TenantId=TenantMeridian, ShortId="vm9-003",
                Plate="TX-MLG-003", Vin="1FTBR2CM4MKA43903",
                Make="Ford", Model="Transit 350", Year=2023, Category="Van", BodyType="Panel Van", Color="White",
                EngineNo="FT350-TX003", EngineCapacity="3.5L", FuelType="Diesel", Transmission="Automatic",
                Axles=2, GrossWeightKg=4200, PayloadKg=1600, SeatingCapacity=2,
                RegistrationCountry="United States", RegistrationDate=D("2023-03-15"),
                PurchaseDate=D("2023-02-20"), PurchasePrice=49000, Supplier="Lone Star Truck Group",
                OwnerType="Company", OwnerName="Meridian Logistics LLC", OwnerIdNo="TX-CRP-2020-009001", OwnerContact="+1 713 555 0200",
                Status="active", Odometer=15200, FuelLevel=88,
                CustomerId="c-m9-002", CustomerName="Gulf Coast Distributors", Department="Houston Metro",
                AssignedDriverName="Amy Rodriguez", AssignedDriverId=DG("driver:dm9-003"),
                Latitude=29.7355, Longitude=-95.4140, SpeedKmh=42, LastSeenAt=D("2026-06-06"),
                CreatedAt=D("2023-03-15"),
            },
            new Vehicle {
                Id=DG("vehicle:vm9-004"), TenantId=TenantMeridian, ShortId="vm9-004",
                Plate="TX-MLG-004", Vin="1XP5DB9X2MD389044",
                Make="Peterbilt", Model="389", Year=2020, Category="Truck", BodyType="Flatbed", Color="Black",
                EngineNo="PACCAR-MX13-TX004", EngineCapacity="12.9L", FuelType="Diesel", Transmission="Manual",
                Axles=3, GrossWeightKg=36000, PayloadKg=22500, SeatingCapacity=2,
                RegistrationCountry="United States", RegistrationDate=D("2020-11-05"),
                PurchaseDate=D("2020-10-10"), PurchasePrice=135000, Supplier="Lone Star Truck Group",
                OwnerType="Company", OwnerName="Meridian Logistics LLC", OwnerIdNo="TX-CRP-2020-009001", OwnerContact="+1 713 555 0200",
                Status="maintenance", Odometer=88900, FuelLevel=20,
                CustomerId=null, CustomerName=null, Department="Long-Haul",
                AssignedDriverName=null, AssignedDriverId=null,
                Latitude=null, Longitude=null, SpeedKmh=null, LastSeenAt=D("2026-06-04"),
                CreatedAt=D("2020-11-05"),
            },
            new Vehicle {
                Id=DG("vehicle:vm9-005"), TenantId=TenantMeridian, ShortId="vm9-005",
                Plate="TX-MLG-005", Vin="3C6TRVDG8ME45905",
                Make="Ram", Model="ProMaster 2500", Year=2022, Category="Van", BodyType="Cargo Van", Color="Silver",
                EngineNo="RPMC-2500-TX005", EngineCapacity="3.6L", FuelType="Diesel", Transmission="Automatic",
                Axles=2, GrossWeightKg=3900, PayloadKg=1500, SeatingCapacity=2,
                RegistrationCountry="United States", RegistrationDate=D("2022-09-10"),
                PurchaseDate=D("2022-08-15"), PurchasePrice=42000, Supplier="Lone Star Truck Group",
                OwnerType="Company", OwnerName="Meridian Logistics LLC", OwnerIdNo="TX-CRP-2020-009001", OwnerContact="+1 713 555 0200",
                Status="active", Odometer=19400, FuelLevel=72,
                CustomerId="c-m9-001", CustomerName="Lone Star Energy LLC", Department="South Houston",
                AssignedDriverName="Chris Evans", AssignedDriverId=DG("driver:dm9-003"),
                Latitude=29.6557, Longitude=-95.2791, SpeedKmh=31, LastSeenAt=D("2026-06-06"),
                CreatedAt=D("2022-09-10"),
            },
            new Vehicle {
                Id=DG("vehicle:vm9-006"), TenantId=TenantMeridian, ShortId="vm9-006",
                Plate="TX-MLG-006", Vin="1M1AN24Y1NM906006",
                Make="Mack", Model="Anthem", Year=2021, Category="Truck", BodyType="Dry Van", Color="Gray",
                EngineNo="MACK-MP8-TX006", EngineCapacity="12.8L", FuelType="Diesel", Transmission="Automatic",
                Axles=3, GrossWeightKg=36000, PayloadKg=22000, SeatingCapacity=2,
                RegistrationCountry="United States", RegistrationDate=D("2021-05-20"),
                PurchaseDate=D("2021-04-25"), PurchasePrice=136000, Supplier="Lone Star Truck Group",
                OwnerType="Company", OwnerName="Meridian Logistics LLC", OwnerIdNo="TX-CRP-2020-009001", OwnerContact="+1 713 555 0200",
                Status="offline", Odometer=62100, FuelLevel=38,
                CustomerId=null, CustomerName=null, Department="Long-Haul",
                AssignedDriverName=null, AssignedDriverId=null,
                Latitude=29.9511, Longitude=-95.3677, SpeedKmh=0, LastSeenAt=D("2026-06-05"),
                CreatedAt=D("2021-05-20"),
            }
        );

        // ── BritFleet Solutions UK vehicles ───────────────────────────────────
        mb.Entity<Vehicle>().HasData(
            new Vehicle {
                Id=DG("vehicle:vb10-001"), TenantId=TenantBritfleet, ShortId="vb10-001",
                Plate="LK72 ABF", Vin="WDB96340Z1L001001",
                Make="Mercedes-Benz", Model="Actros 2645", Year=2022, Category="Truck", BodyType="Curtainsider", Color="White",
                EngineNo="OM471-ACT-UK001", EngineCapacity="12.8L", FuelType="Diesel", Transmission="Automatic",
                Axles=3, GrossWeightKg=26000, PayloadKg=18000, SeatingCapacity=2,
                RegistrationCountry="United Kingdom", RegistrationDate=D("2022-09-15"),
                PurchaseDate=D("2022-08-20"), PurchasePrice=92000, Supplier="Truck & Van UK",
                OwnerType="Company", OwnerName="BritFleet Solutions Ltd", OwnerIdNo="GB-REG-2021-00001", OwnerContact="+44 20 7946 0100",
                Status="active", Odometer=34200, FuelLevel=71,
                CustomerId="c-b10-001", CustomerName="BritFleet Group Holdings", Department="London Ops",
                AssignedDriverName="Oliver Thompson", AssignedDriverId=DG("driver:db10-001"),
                Latitude=51.5074, Longitude=-0.1278, SpeedKmh=45, LastSeenAt=D("2026-06-06"),
                CreatedAt=D("2022-09-15"),
            },
            new Vehicle {
                Id=DG("vehicle:vb10-002"), TenantId=TenantBritfleet, ShortId="vb10-002",
                Plate="LK71 ABF", Vin="YV2A4C3A8NA500002",
                Make="Volvo", Model="FH16 750", Year=2021, Category="Truck", BodyType="Box Body", Color="Blue",
                EngineNo="D16G-750-UK002", EngineCapacity="16.1L", FuelType="Diesel", Transmission="Automatic",
                Axles=3, GrossWeightKg=28000, PayloadKg=20000, SeatingCapacity=2,
                RegistrationCountry="United Kingdom", RegistrationDate=D("2021-11-10"),
                PurchaseDate=D("2021-10-15"), PurchasePrice=115000, Supplier="Truck & Van UK",
                OwnerType="Company", OwnerName="BritFleet Solutions Ltd", OwnerIdNo="GB-REG-2021-00001", OwnerContact="+44 20 7946 0100",
                Status="idle", Odometer=58600, FuelLevel=44,
                CustomerId="c-b10-002", CustomerName="Northern Freight Partners", Department="Manchester Ops",
                AssignedDriverName=null, AssignedDriverId=null,
                Latitude=53.4808, Longitude=-2.2426, SpeedKmh=0, LastSeenAt=D("2026-06-06"),
                CreatedAt=D("2021-11-10"),
            },
            new Vehicle {
                Id=DG("vehicle:vb10-003"), TenantId=TenantBritfleet, ShortId="vb10-003",
                Plate="LK73 ABF", Vin="WF0XXXTTGXNB03003",
                Make="Ford", Model="Transit Custom", Year=2023, Category="Van", BodyType="Panel Van", Color="White",
                EngineNo="FTC-TDCI-UK003", EngineCapacity="2.0L", FuelType="Diesel", Transmission="Manual",
                Axles=2, GrossWeightKg=3100, PayloadKg=1100, SeatingCapacity=2,
                RegistrationCountry="United Kingdom", RegistrationDate=D("2023-03-20"),
                PurchaseDate=D("2023-02-25"), PurchasePrice=36000, Supplier="Truck & Van UK",
                OwnerType="Company", OwnerName="BritFleet Solutions Ltd", OwnerIdNo="GB-REG-2021-00001", OwnerContact="+44 20 7946 0100",
                Status="active", Odometer=18700, FuelLevel=83,
                CustomerId="c-b10-001", CustomerName="BritFleet Group Holdings", Department="London Delivery",
                AssignedDriverName="George Brown", AssignedDriverId=DG("driver:db10-003"),
                Latitude=51.5033, Longitude=-0.0875, SpeedKmh=38, LastSeenAt=D("2026-06-06"),
                CreatedAt=D("2023-03-20"),
            },
            new Vehicle {
                Id=DG("vehicle:vb10-004"), TenantId=TenantBritfleet, ShortId="vb10-004",
                Plate="LK70 ABF", Vin="XLR0988CS0E004004",
                Make="DAF", Model="XF 480", Year=2020, Category="Truck", BodyType="Curtainsider", Color="Red",
                EngineNo="MX11-480-UK004", EngineCapacity="10.8L", FuelType="Diesel", Transmission="Automatic",
                Axles=3, GrossWeightKg=26000, PayloadKg=18000, SeatingCapacity=2,
                RegistrationCountry="United Kingdom", RegistrationDate=D("2020-10-05"),
                PurchaseDate=D("2020-09-10"), PurchasePrice=85000, Supplier="Truck & Van UK",
                OwnerType="Company", OwnerName="BritFleet Solutions Ltd", OwnerIdNo="GB-REG-2021-00001", OwnerContact="+44 20 7946 0100",
                Status="maintenance", Odometer=96400, FuelLevel=18,
                CustomerId=null, CustomerName=null, Department="Long-Haul",
                AssignedDriverName=null, AssignedDriverId=null,
                Latitude=null, Longitude=null, SpeedKmh=null, LastSeenAt=D("2026-06-04"),
                CreatedAt=D("2020-10-05"),
            },
            new Vehicle {
                Id=DG("vehicle:vb10-005"), TenantId=TenantBritfleet, ShortId="vb10-005",
                Plate="LK72 CBF", Vin="VF1JMAAA5HG005005",
                Make="Renault", Model="Master L3H2", Year=2022, Category="Van", BodyType="High-roof Van", Color="Silver",
                EngineNo="RNL-M3H2-UK005", EngineCapacity="2.3L", FuelType="Diesel", Transmission="Manual",
                Axles=2, GrossWeightKg=3500, PayloadKg=1300, SeatingCapacity=3,
                RegistrationCountry="United Kingdom", RegistrationDate=D("2022-07-10"),
                PurchaseDate=D("2022-06-15"), PurchasePrice=38000, Supplier="Truck & Van UK",
                OwnerType="Company", OwnerName="BritFleet Solutions Ltd", OwnerIdNo="GB-REG-2021-00001", OwnerContact="+44 20 7946 0100",
                Status="active", Odometer=28100, FuelLevel=67,
                CustomerId="c-b10-003", CustomerName="Midlands Distribution Ltd", Department="Birmingham Ops",
                AssignedDriverName="Emma Johnson", AssignedDriverId=DG("driver:db10-005"),
                Latitude=52.4862, Longitude=-1.8904, SpeedKmh=52, LastSeenAt=D("2026-06-06"),
                CreatedAt=D("2022-07-10"),
            },
            new Vehicle {
                Id=DG("vehicle:vb10-006"), TenantId=TenantBritfleet, ShortId="vb10-006",
                Plate="LK71 CBF", Vin="YS2P4X20005006006",
                Make="Scania", Model="R500", Year=2021, Category="Truck", BodyType="Flatbed", Color="Yellow",
                EngineNo="DC13-500-UK006", EngineCapacity="12.7L", FuelType="Diesel", Transmission="Automatic",
                Axles=3, GrossWeightKg=27000, PayloadKg=19000, SeatingCapacity=2,
                RegistrationCountry="United Kingdom", RegistrationDate=D("2021-05-15"),
                PurchaseDate=D("2021-04-20"), PurchasePrice=98000, Supplier="Truck & Van UK",
                OwnerType="Company", OwnerName="BritFleet Solutions Ltd", OwnerIdNo="GB-REG-2021-00001", OwnerContact="+44 20 7946 0100",
                Status="active", Odometer=47900, FuelLevel=55,
                CustomerId="c-b10-002", CustomerName="Northern Freight Partners", Department="Leeds/Manchester",
                AssignedDriverName="Charlotte Williams", AssignedDriverId=DG("driver:db10-006"),
                Latitude=53.8008, Longitude=-1.5491, SpeedKmh=72, LastSeenAt=D("2026-06-06"),
                CreatedAt=D("2021-05-15"),
            },
            new Vehicle {
                Id=DG("vehicle:vb10-007"), TenantId=TenantBritfleet, ShortId="vb10-007",
                Plate="LK73 CBF", Vin="W0V9MHH1XM4007007",
                Make="Vauxhall", Model="Vivaro", Year=2023, Category="Van", BodyType="Panel Van", Color="White",
                EngineNo="VAUX-VIV-UK007", EngineCapacity="2.0L", FuelType="Diesel", Transmission="Manual",
                Axles=2, GrossWeightKg=3000, PayloadKg=1000, SeatingCapacity=2,
                RegistrationCountry="United Kingdom", RegistrationDate=D("2023-06-01"),
                PurchaseDate=D("2023-05-05"), PurchasePrice=32000, Supplier="Truck & Van UK",
                OwnerType="Company", OwnerName="BritFleet Solutions Ltd", OwnerIdNo="GB-REG-2021-00001", OwnerContact="+44 20 7946 0100",
                Status="offline", Odometer=9200, FuelLevel=92,
                CustomerId=null, CustomerName=null, Department="Scotland Ops",
                AssignedDriverName=null, AssignedDriverId=null,
                Latitude=55.8642, Longitude=-4.2518, SpeedKmh=0, LastSeenAt=D("2026-06-05"),
                CreatedAt=D("2023-06-01"),
            },
            new Vehicle {
                Id=DG("vehicle:vb10-008"), TenantId=TenantBritfleet, ShortId="vb10-008",
                Plate="LK72 DBF", Vin="WMA26TZZ4NM008008",
                Make="MAN", Model="TGX 26.460", Year=2022, Category="Truck", BodyType="Dry Van", Color="Gray",
                EngineNo="MAN-D2676-UK008", EngineCapacity="12.4L", FuelType="Diesel", Transmission="Automatic",
                Axles=3, GrossWeightKg=26000, PayloadKg=18500, SeatingCapacity=2,
                RegistrationCountry="United Kingdom", RegistrationDate=D("2022-12-01"),
                PurchaseDate=D("2022-11-05"), PurchasePrice=94000, Supplier="Truck & Van UK",
                OwnerType="Company", OwnerName="BritFleet Solutions Ltd", OwnerIdNo="GB-REG-2021-00001", OwnerContact="+44 20 7946 0100",
                Status="active", Odometer=39800, FuelLevel=62,
                CustomerId="c-b10-001", CustomerName="BritFleet Group Holdings", Department="South England",
                AssignedDriverName="Harry Wilson", AssignedDriverId=DG("driver:db10-008"),
                Latitude=51.4545, Longitude=-2.5879, SpeedKmh=58, LastSeenAt=D("2026-06-06"),
                CreatedAt=D("2022-12-01"),
            }
        );
    }

    // ────────────────────────────────────────────────────────────────────────
    private static void SeedDrivers(ModelBuilder mb)
    {
        var v1  = DG("vehicle:v1");
        var v2  = DG("vehicle:v2");
        var v5  = DG("vehicle:v5");
        var v6  = DG("vehicle:v6");
        var v7  = DG("vehicle:v7");
        var v8  = DG("vehicle:v8");
        var v10 = DG("vehicle:v10");
        var v11 = DG("vehicle:v11");
        var v13 = DG("vehicle:v13");
        var v15 = DG("vehicle:v15");
        var v16 = DG("vehicle:v16");
        var v18 = DG("vehicle:v18");
        var v19 = DG("vehicle:v19");

        mb.Entity<Driver>().HasData(
            // ── ACME Logistics ────────────────────────────────────────────────
            new Driver { Id = DG("driver:d1"),  TenantId = TenantAcme,  Name = "Ali Hassan",      LicenseNumber = "LIC-KE-001", LicenseClass = "C",  PhoneNumber = "+254722100001", Status = "driving",  SafetyScore = 92, HosDriven = 4.5, HosRemaining = 6.5,  AssignedVehicleId = v1,  AssignedVehiclePlate = "KAB 001A", CreatedAt = D("2022-03-15") },
            new Driver { Id = DG("driver:d2"),  TenantId = TenantAcme,  Name = "Sara Malik",       LicenseNumber = "LIC-KE-002", LicenseClass = "C",  PhoneNumber = "+254722100002", Status = "driving",  SafetyScore = 87, HosDriven = 3.0, HosRemaining = 8.0,  AssignedVehicleId = v2,  AssignedVehiclePlate = "KAB 002B", CreatedAt = D("2021-08-01") },
            new Driver { Id = DG("driver:d3"),  TenantId = TenantAcme,  Name = "James Mwangi",     LicenseNumber = "LIC-KE-003", LicenseClass = "B",  PhoneNumber = "+254722100003", Status = "on_duty",  SafetyScore = 75, HosDriven = 6.0, HosRemaining = 5.0,  AssignedVehicleId = v5,  AssignedVehiclePlate = "KAB 005E", CreatedAt = D("2022-07-01") },
            new Driver { Id = DG("driver:d4"),  TenantId = TenantAcme,  Name = "Fatima Noor",      LicenseNumber = "LIC-KE-004", LicenseClass = "C",  PhoneNumber = "+254722100004", Status = "driving",  SafetyScore = 95, HosDriven = 2.0, HosRemaining = 9.0,  AssignedVehicleId = v6,  AssignedVehiclePlate = "KAB 006F", CreatedAt = D("2021-12-01") },
            new Driver { Id = DG("driver:d5"),  TenantId = TenantAcme,  Name = "Omar Sheikh",      LicenseNumber = "LIC-KE-005", LicenseClass = "A",  PhoneNumber = "+254722100005", Status = "resting",  SafetyScore = 63, HosDriven = 9.5, HosRemaining = 1.5,  AssignedVehicleId = null, AssignedVehiclePlate = null,      CreatedAt = D("2022-01-01") },
            new Driver { Id = DG("driver:d6"),  TenantId = TenantAcme,  Name = "Grace Njeri",      LicenseNumber = "LIC-KE-006", LicenseClass = "B",  PhoneNumber = "+254722100006", Status = "off_duty", SafetyScore = 81, HosDriven = 0,   HosRemaining = 11.0, AssignedVehicleId = null, AssignedVehiclePlate = null,      CreatedAt = D("2022-02-01") },

            // ── SwiftCargo Ltd ────────────────────────────────────────────────
            new Driver { Id = DG("driver:d7"),  TenantId = TenantSwift, Name = "Hassan Mwangi",    LicenseNumber = "LIC-KE-007", LicenseClass = "CE", PhoneNumber = "+254722200001", Status = "driving",  SafetyScore = 88, HosDriven = 5.5, HosRemaining = 5.5,  AssignedVehicleId = v7,  AssignedVehiclePlate = "KCC 100A", CreatedAt = D("2021-05-15") },
            new Driver { Id = DG("driver:d8"),  TenantId = TenantSwift, Name = "Fatuma Wanjiku",   LicenseNumber = "LIC-KE-008", LicenseClass = "C",  PhoneNumber = "+254722200002", Status = "driving",  SafetyScore = 91, HosDriven = 3.5, HosRemaining = 7.5,  AssignedVehicleId = v8,  AssignedVehiclePlate = "KCC 101B", CreatedAt = D("2023-08-05") },
            new Driver { Id = DG("driver:d9"),  TenantId = TenantSwift, Name = "David Ochieng",    LicenseNumber = "LIC-KE-009", LicenseClass = "C",  PhoneNumber = "+254722200003", Status = "off_duty", SafetyScore = 79, HosDriven = 0,   HosRemaining = 11.0, AssignedVehicleId = null, AssignedVehiclePlate = null,      CreatedAt = D("2021-06-01") },

            // ── NairobiExpress ────────────────────────────────────────────────
            new Driver { Id = DG("driver:d10"), TenantId = TenantNex, ShortId = "d10",   Name = "Samuel Kamau",     LicenseNumber = "LIC-KE-010", LicenseClass = "CE", PhoneNumber = "+254722300001", Status = "driving",  SafetyScore = 84, HosDriven = 7.0, HosRemaining = 4.0,  AssignedVehicleId = v10, AssignedVehiclePlate = "KDF 200A", CreatedAt = D("2022-04-20") },
            new Driver { Id = DG("driver:d11"), TenantId = TenantNex, ShortId = "d11",   Name = "Aisha Omar",       LicenseNumber = "LIC-KE-011", LicenseClass = "C",  PhoneNumber = "+254722300002", Status = "driving",  SafetyScore = 90, HosDriven = 2.5, HosRemaining = 8.5,  AssignedVehicleId = v11, AssignedVehiclePlate = "KDF 201B", CreatedAt = D("2020-06-15") },
            new Driver { Id = DG("driver:d12"), TenantId = TenantNex, ShortId = "d12",   Name = "Peter Kimani",     LicenseNumber = "LIC-KE-012", LicenseClass = "B",  PhoneNumber = "+254722300003", Status = "off_duty", SafetyScore = 72, HosDriven = 0,   HosRemaining = 11.0, AssignedVehicleId = null, AssignedVehiclePlate = null,      CreatedAt = D("2022-05-01") },

            // ── KimTransport ──────────────────────────────────────────────────
            new Driver { Id = DG("driver:d13"), TenantId = TenantKim, ShortId = "d13",   Name = "Kimani Mwenda",    LicenseNumber = "LIC-UG-013", LicenseClass = "CE", PhoneNumber = "+256772400001", Status = "driving",  SafetyScore = 86, HosDriven = 6.0, HosRemaining = 5.0,  AssignedVehicleId = v13, AssignedVehiclePlate = "UBF 300A", CreatedAt = D("2020-08-20") },
            new Driver { Id = DG("driver:d14"), TenantId = TenantKim, ShortId = "d14",   Name = "Amina Nakato",     LicenseNumber = "LIC-UG-014", LicenseClass = "C",  PhoneNumber = "+256772400002", Status = "off_duty", SafetyScore = 77, HosDriven = 0,   HosRemaining = 11.0, AssignedVehicleId = null, AssignedVehiclePlate = null,      CreatedAt = D("2020-09-01") },

            // ── PeakFleet Co ──────────────────────────────────────────────────
            new Driver { Id = DG("driver:d15"), TenantId = TenantPeak, ShortId = "d15",  Name = "Nadia Osman",      LicenseNumber = "LIC-TZ-015", LicenseClass = "C",  PhoneNumber = "+255754500001", Status = "driving",  SafetyScore = 93, HosDriven = 1.5, HosRemaining = 9.5,  AssignedVehicleId = v15, AssignedVehiclePlate = "T200AAA", CreatedAt = D("2023-03-20") },
            new Driver { Id = DG("driver:d16"), TenantId = TenantPeak, ShortId = "d16",  Name = "Joseph Baraka",    LicenseNumber = "LIC-TZ-016", LicenseClass = "CE", PhoneNumber = "+255754500002", Status = "driving",  SafetyScore = 80, HosDriven = 4.0, HosRemaining = 7.0,  AssignedVehicleId = v16, AssignedVehiclePlate = "T201BBB", CreatedAt = D("2021-09-05") },
            new Driver { Id = DG("driver:d17"), TenantId = TenantPeak, ShortId = "d17",  Name = "Salma Juma",       LicenseNumber = "LIC-TZ-017", LicenseClass = "B",  PhoneNumber = "+255754500003", Status = "on_duty",  SafetyScore = 68, HosDriven = 8.0, HosRemaining = 3.0,  AssignedVehicleId = null, AssignedVehiclePlate = null,      CreatedAt = D("2023-12-10") },
            new Driver { Id = DG("driver:d18"), TenantId = TenantPeak, ShortId = "d18",  Name = "Tom Lekuta",       LicenseNumber = "LIC-TZ-018", LicenseClass = "C",  PhoneNumber = "+255754500004", Status = "on_duty",  SafetyScore = 74, HosDriven = 5.0, HosRemaining = 6.0,  AssignedVehicleId = v18, AssignedVehiclePlate = "T203DDD", CreatedAt = D("2022-08-01") },
            new Driver { Id = DG("driver:d19"), TenantId = TenantPeak, ShortId = "d19",  Name = "Esther Makinde",   LicenseNumber = "LIC-TZ-019", LicenseClass = "C",  PhoneNumber = "+255754500005", Status = "off_duty", SafetyScore = 85, HosDriven = 0,   HosRemaining = 11.0, AssignedVehicleId = null, AssignedVehiclePlate = null,      CreatedAt = D("2024-01-20") },

            // ── SwiftDeliver EA ───────────────────────────────────────────────
            new Driver { Id = DG("driver:d20"), TenantId = TenantSde, ShortId = "d20",   Name = "Kevin Ndungu",     LicenseNumber = "LIC-KE-020", LicenseClass = "B",  PhoneNumber = "+254722600001", Status = "driving",  SafetyScore = 88, HosDriven = 3.0, HosRemaining = 8.0,  AssignedVehicleId = v19, AssignedVehiclePlate = "KDE 400A", CreatedAt = D("2024-01-15") },
            new Driver { Id = DG("driver:d21"), TenantId = TenantSde, ShortId = "d21",   Name = "Patricia Waweru",  LicenseNumber = "LIC-KE-021", LicenseClass = "B",  PhoneNumber = "+254722600002", Status = "off_duty", SafetyScore = 76, HosDriven = 0,   HosRemaining = 11.0, AssignedVehicleId = null, AssignedVehiclePlate = null,      CreatedAt = D("2024-02-10") }
        );
    }

    // ────────────────────────────────────────────────────────────────────────
    private static void SeedAlerts(ModelBuilder mb)
    {
        var v1 = DG("vehicle:v1");
        var v2 = DG("vehicle:v2");
        var v4 = DG("vehicle:v4");

        mb.Entity<Alert>().HasData(
            new Alert { Id = DG("alert:a1"), TenantId = TenantAcme, VehicleId = v1, Severity = "critical", Type = "geofence_breach",  Title = "Geofence breach — KAB 001A",     Description = "Vehicle left authorized zone at 14:22",          OccurredAt = D("2026-05-29") },
            new Alert { Id = DG("alert:a2"), TenantId = TenantAcme, VehicleId = v2, Severity = "warning",  Type = "low_fuel",         Title = "Low fuel — KAB 002B",            Description = "Fuel level at 45%. Nearest station: 12 km",     OccurredAt = D("2026-05-29") },
            new Alert { Id = DG("alert:a3"), TenantId = TenantAcme, VehicleId = v4, Severity = "critical", Type = "insurance_expired", Title = "Insurance expired — KAB 004D",   Description = "Insurance expired 9 days ago. Vehicle must not operate.", OccurredAt = D("2026-05-20") }
        );
    }

    // ────────────────────────────────────────────────────────────────────────
    private static void SeedBranches(ModelBuilder mb)
    {
        mb.Entity<Branch>().HasData(
            // ACME Logistics
            new Branch { Id = DG("branch:b-101"), TenantId = TenantAcme, ShortId = "b-101",  Name = "Nairobi HQ",      City = "Nairobi",         Region = "Central",      VehicleCount = 52, DriverCount = 38, UserCount = 12, Active = true,  CreatedAt = D("2024-01-10") },
            new Branch { Id = DG("branch:b-102"), TenantId = TenantAcme, ShortId = "b-102",  Name = "Mombasa Branch",  City = "Mombasa",         Region = "Coast",         VehicleCount = 31, DriverCount = 24, UserCount = 6,  Active = true,  CreatedAt = D("2024-03-15") },
            new Branch { Id = DG("branch:b-103"), TenantId = TenantAcme, ShortId = "b-103",  Name = "Kisumu Branch",   City = "Kisumu",          Region = "Nyanza",        VehicleCount = 18, DriverCount = 14, UserCount = 4,  Active = true,  CreatedAt = D("2024-06-01") },
            new Branch { Id = DG("branch:b-104"), TenantId = TenantAcme, ShortId = "b-104",  Name = "Eldoret Depot",   City = "Eldoret",         Region = "Rift Valley",   VehicleCount = 9,  DriverCount = 7,  UserCount = 2,  Active = false, CreatedAt = D("2025-01-20") },
            // SwiftCargo Ltd
            new Branch { Id = DG("branch:b-201"), TenantId = TenantSwift, ShortId = "b-201", Name = "HQ Nairobi",      City = "Nairobi",         Region = "Central",      VehicleCount = 28, DriverCount = 20, UserCount = 8,  Active = true,  CreatedAt = D("2024-02-01") },
            new Branch { Id = DG("branch:b-202"), TenantId = TenantSwift, ShortId = "b-202", Name = "Nakuru Office",   City = "Nakuru",          Region = "Rift Valley",   VehicleCount = 12, DriverCount = 9,  UserCount = 3,  Active = true,  CreatedAt = D("2024-08-10") },
            // PeakFleet Co
            new Branch { Id = DG("branch:b-501"), TenantId = TenantPeak, ShortId = "b-501",  Name = "Dar es Salaam",   City = "Dar es Salaam",   Region = "Coastal",       VehicleCount = 40, DriverCount = 30, UserCount = 10, Active = true,  CreatedAt = D("2023-11-05") },
            new Branch { Id = DG("branch:b-502"), TenantId = TenantPeak, ShortId = "b-502",  Name = "Arusha Branch",   City = "Arusha",          Region = "Northern",      VehicleCount = 15, DriverCount = 12, UserCount = 4,  Active = true,  CreatedAt = D("2024-05-22") }
        );
    }

    // ────────────────────────────────────────────────────────────────────────
    private static void SeedCustomers(ModelBuilder mb)
    {
        mb.Entity<Customer>().HasData(
            // ACME Logistics customers
            new Customer { Id = DG("customer:c-001"), TenantId = TenantAcme, ParentId = null, ShortId = "c-001", Name = "ACME Group Holdings",    Type = "Company",    Status = "Active",   Industry = "Conglomerate",          Country = "Kenya",    City = "Nairobi",       Address = "Upper Hill, Nairobi, Kenya",            Phone = "+254 20 272 0000", Email = "group@acmeholdings.co.ke",  Website = "acmeholdings.co.ke",   TaxId = "P051234567A",  CreditLimit = 5000000, ComplianceStatus = "Compliant",      VehiclesAssigned = 80, ActiveContracts = 3, AccountManager = "Ali Hassan",  Notes = "Long-standing enterprise client since 2019.",       CreatedAt = D("2019-03-12") },
            new Customer { Id = DG("customer:c-002"), TenantId = TenantAcme, ParentId = null, ShortId = "c-002", Name = "TransAfrica Holdings",   Type = "Company",    Status = "Active",   Industry = "Transport & Logistics", Country = "Tanzania", City = "Dar es Salaam", Address = "14 Samora Ave, Dar es Salaam, Tanzania", Phone = "+255 22 211 0000", Email = "info@transafrica.co.tz",    Website = "transafrica.co.tz",    TaxId = "TZ-VAT-887654",CreditLimit = 3500000, ComplianceStatus = "Compliant",      VehiclesAssigned = 55, ActiveContracts = 2, AccountManager = "Grace Njeri", Notes = "Regional carrier. Handles KE-TZ-UG corridor.",      CreatedAt = D("2020-07-01") },
            new Customer { Id = DG("customer:c-003"), TenantId = TenantAcme, ParentId = null, ShortId = "c-003", Name = "NileTech Solutions",     Type = "Company",    Status = "Active",   Industry = "Technology",            Country = "Uganda",   City = "Kampala",       Address = "Plot 45 Kampala Road, Kampala, Uganda",  Phone = "+256 41 432 0000", Email = "fleet@niletech.co.ug",      Website = "niletech.co.ug",       TaxId = "UG-TIN-445566",CreditLimit = 1200000, ComplianceStatus = "Pending Review", VehiclesAssigned = 18, ActiveContracts = 1, AccountManager = "Ali Hassan",  Notes = "Tech company expanding delivery fleet.",            CreatedAt = D("2022-01-15") },
            new Customer { Id = DG("customer:c-004"), TenantId = TenantAcme, ParentId = null, ShortId = "c-004", Name = "SolarRoute Ltd",         Type = "Company",    Status = "Active",   Industry = "Renewable Energy",      Country = "Kenya",    City = "Kisumu",        Address = "Mega Plaza, Kisumu, Kenya",              Phone = "+254 57 202 0000", Email = "ops@solarroute.co.ke",      Website = "solarroute.co.ke",     TaxId = "P051987654B",  CreditLimit = 800000,  ComplianceStatus = "Compliant",      VehiclesAssigned = 24, ActiveContracts = 1, AccountManager = "Grace Njeri", Notes = "Renewable energy company with field fleet.",        CreatedAt = D("2022-08-01") },
            // Individual (Tenant 1)
            new Customer { Id = DG("customer:c-ind-001"), TenantId = TenantAcme, ParentId = null, ShortId = "c-ind-001", Name = "James Kariuki Mwangi", Type = "Individual", Status = "Active", Industry = "Individual",           Country = "Kenya",    City = "Nairobi",       Address = "Karen, Nairobi, Kenya",                  Phone = "+254 722 456 789", Email = "jkariuki@gmail.com",        Website = "",                     TaxId = "12345678",     CreditLimit = 0,       ComplianceStatus = "Compliant",      VehiclesAssigned = 1,  ActiveContracts = 1, AccountManager = "Arif Khan",   Notes = "Individual owner — Personal Tracker plan.",         CreatedAt = D("2022-03-01") },
            // SwiftCargo
            new Customer { Id = DG("customer:c-t2-001"), TenantId = TenantSwift, ParentId = null, ShortId = "c-t2-001", Name = "Nakuru Cold Chain Ltd",    Type = "Company", Status = "Active", Industry = "Cold Chain Logistics", Country = "Kenya",   City = "Nakuru",  Address = "Industrial Area, Nakuru", Phone = "+254 51 221 0001", Email = "ops@nakurucoldchain.co.ke", Website = "", TaxId = "P052001234C", CreditLimit = 1500000, ComplianceStatus = "Compliant",   VehiclesAssigned = 2, ActiveContracts = 1, AccountManager = "Hassan Mwangi", Notes = "", CreatedAt = D("2021-05-20") },
            new Customer { Id = DG("customer:c-t2-002"), TenantId = TenantSwift, ParentId = null, ShortId = "c-t2-002", Name = "EastAfrica Fresh Produce", Type = "Company", Status = "Active", Industry = "Agriculture",          Country = "Kenya",   City = "Nairobi", Address = "Wakulima Market, Nairobi", Phone = "+254 20 441 0002", Email = "info@eafresh.co.ke",         Website = "", TaxId = "P052003456D", CreditLimit = 800000,  ComplianceStatus = "Compliant",   VehiclesAssigned = 1, ActiveContracts = 1, AccountManager = "Fatuma Wanjiku", Notes = "", CreatedAt = D("2019-11-15") },
            // NairobiExpress
            new Customer { Id = DG("customer:c-t3-001"), TenantId = TenantNex, ParentId = null, ShortId = "c-t3-001", Name = "Urban Courier Solutions", Type = "Company", Status = "Active", Industry = "Courier Services", Country = "Kenya", City = "Nairobi", Address = "Westlands, Nairobi", Phone = "+254 20 321 0001", Email = "ops@urbancourier.co.ke", Website = "", TaxId = "P053001234E", CreditLimit = 600000, ComplianceStatus = "Compliant", VehiclesAssigned = 1, ActiveContracts = 1, AccountManager = "Samuel Kamau", Notes = "", CreatedAt = D("2022-04-20") },
            new Customer { Id = DG("customer:c-t3-002"), TenantId = TenantNex, ParentId = null, ShortId = "c-t3-002", Name = "QuickMart Kenya Ltd",      Type = "Company", Status = "Active", Industry = "Retail",           Country = "Kenya", City = "Nairobi", Address = "Thika Road, Nairobi",  Phone = "+254 20 552 0002", Email = "logistics@quickmart.co.ke", Website = "", TaxId = "P053002345F", CreditLimit = 2000000, ComplianceStatus = "Compliant", VehiclesAssigned = 2, ActiveContracts = 1, AccountManager = "Aisha Omar",   Notes = "", CreatedAt = D("2020-06-15") },
            // KimTransport
            new Customer { Id = DG("customer:c-t4-001"), TenantId = TenantKim, ParentId = null, ShortId = "c-t4-001", Name = "Kampala Tiles & Hardware", Type = "Company", Status = "Active", Industry = "Hardware",       Country = "Uganda", City = "Kampala", Address = "Jinja Road, Kampala",   Phone = "+256 41 321 0001", Email = "orders@kampalatiles.co.ug",  Website = "", TaxId = "UG-TIN-004001", CreditLimit = 900000,  ComplianceStatus = "Compliant", VehiclesAssigned = 1, ActiveContracts = 1, AccountManager = "Kimani Mwenda", Notes = "", CreatedAt = D("2020-08-20") },
            new Customer { Id = DG("customer:c-t4-002"), TenantId = TenantKim, ParentId = null, ShortId = "c-t4-002", Name = "Nile Agro Processing",     Type = "Company", Status = "Active", Industry = "Agriculture",    Country = "Uganda", City = "Jinja",   Address = "Nalufenya, Jinja, Uganda", Phone = "+256 43 122 0002", Email = "fleet@nileagro.co.ug",       Website = "", TaxId = "UG-TIN-004002", CreditLimit = 700000,  ComplianceStatus = "Compliant", VehiclesAssigned = 1, ActiveContracts = 1, AccountManager = "Kimani Mwenda", Notes = "", CreatedAt = D("2019-05-25") },
            // PeakFleet
            new Customer { Id = DG("customer:c-t5-001"), TenantId = TenantPeak, ParentId = null, ShortId = "c-t5-001", Name = "Dar Construction Group",        Type = "Company", Status = "Active", Industry = "Construction", Country = "Tanzania", City = "Dar es Salaam", Address = "Kariakoo, Dar es Salaam", Phone = "+255 22 210 0001", Email = "fleet@darconstruction.co.tz",  Website = "", TaxId = "TZ-TIN-005001", CreditLimit = 3000000, ComplianceStatus = "Compliant", VehiclesAssigned = 2, ActiveContracts = 2, AccountManager = "Nadia Osman",   Notes = "", CreatedAt = D("2023-03-20") },
            new Customer { Id = DG("customer:c-t5-002"), TenantId = TenantPeak, ParentId = null, ShortId = "c-t5-002", Name = "TanzaFresh Foods Ltd",          Type = "Company", Status = "Active", Industry = "Food & Beverage", Country = "Tanzania", City = "Dar es Salaam", Address = "Sinza, Dar es Salaam", Phone = "+255 22 312 0002", Email = "logistics@tanzafresh.co.tz", Website = "", TaxId = "TZ-TIN-005002", CreditLimit = 900000,  ComplianceStatus = "Compliant", VehiclesAssigned = 1, ActiveContracts = 1, AccountManager = "Joseph Baraka", Notes = "", CreatedAt = D("2022-07-25") },
            new Customer { Id = DG("customer:c-t5-011"), TenantId = TenantPeak, ParentId = DG("customer:c-t5-001"), ShortId = "c-t5-011", Name = "Dar Construction — Dodoma Site", Type = "Company", Status = "Active", Industry = "Construction", Country = "Tanzania", City = "Dodoma", Address = "Dodoma Central, Tanzania", Phone = "+255 26 210 0011", Email = "dodoma@darconstruction.co.tz", Website = "", TaxId = "TZ-TIN-005011", CreditLimit = 500000, ComplianceStatus = "Compliant", VehiclesAssigned = 1, ActiveContracts = 1, AccountManager = "Nadia Osman", Notes = "Sub-office of Dar Construction Group.", CreatedAt = D("2024-01-15") },
            // SwiftDeliver EA
            new Customer { Id = DG("customer:c-t6-001"), TenantId = TenantSde, ParentId = null, ShortId = "c-t6-001", Name = "Nairobi eShop Ltd",         Type = "Company", Status = "Active", Industry = "E-Commerce",     Country = "Kenya", City = "Nairobi", Address = "Mombasa Road, Nairobi", Phone = "+254 20 601 0001", Email = "dispatch@nairobieShop.co.ke", Website = "", TaxId = "P056001234G", CreditLimit = 400000, ComplianceStatus = "Compliant", VehiclesAssigned = 1, ActiveContracts = 1, AccountManager = "Kevin Ndungu", Notes = "", CreatedAt = D("2024-01-12") },
            new Customer { Id = DG("customer:c-t6-002"), TenantId = TenantSde, ParentId = null, ShortId = "c-t6-002", Name = "Savanna Digital Commerce",  Type = "Company", Status = "Active", Industry = "E-Commerce",     Country = "Kenya", City = "Nairobi", Address = "Ngong Road, Nairobi",   Phone = "+254 20 602 0002", Email = "ops@savannadigital.co.ke",    Website = "", TaxId = "P056002345H", CreditLimit = 350000, ComplianceStatus = "Compliant", VehiclesAssigned = 1, ActiveContracts = 1, AccountManager = "Kevin Ndungu", Notes = "", CreatedAt = D("2022-11-10") },
            // ── Star Technologies Pakistan (tenant 7) ────────────────────────
            new Customer { Id=DG("customer:c-t7-001"), TenantId=TenantStar, ParentId=null, ShortId="c-t7-001", Name="Punjab Transport Group",       Type="Company",    Status="Active",   Industry="Transport & Logistics", Country="Pakistan", City="Lahore",     Address="25-B Industrial Estate, Kot Lakhpat, Lahore",      Phone="+92 42 3576 0001", Email="fleet@punjabtransport.pk",    Website="punjabtransport.pk",   TaxId="NTN-1234567-1", CreditLimit=5000000, ComplianceStatus="Compliant",      VehiclesAssigned=8,  ActiveContracts=2, AccountManager="Zain ul Abidin", Notes="Largest fleet client in Lahore — long-haul Punjab corridor.",  CreatedAt=D("2025-06-15") },
            new Customer { Id=DG("customer:c-t7-002"), TenantId=TenantStar, ParentId=null, ShortId="c-t7-002", Name="Karachi Port Authority",       Type="Company",    Status="Active",   Industry="Port & Shipping",       Country="Pakistan", City="Karachi",    Address="Port Trust Offices, West Wharf Road, Karachi",      Phone="+92 21 9921 4001", Email="logistics@kpt.gov.pk",        Website="kpt.gov.pk",           TaxId="NTN-2345678-2", CreditLimit=8000000, ComplianceStatus="Compliant",      VehiclesAssigned=12, ActiveContracts=3, AccountManager="Zain ul Abidin", Notes="Port cargo movement — critical account, SLA 4 hrs.",           CreatedAt=D("2025-07-01") },
            new Customer { Id=DG("customer:c-t7-003"), TenantId=TenantStar, ParentId=null, ShortId="c-t7-003", Name="Federal Government Supplies",  Type="Government", Status="Active",   Industry="Government Logistics",  Country="Pakistan", City="Islamabad",  Address="Block D, Pakistan Secretariat, Constitution Ave",   Phone="+92 51 9201 5001", Email="fleet@cabinet.gov.pk",        Website="cabinet.gov.pk",       TaxId="NTN-3456789-3", CreditLimit=10000000,ComplianceStatus="Compliant",      VehiclesAssigned=6,  ActiveContracts=1, AccountManager="Zain ul Abidin", Notes="Government supply chain — Islamabad & twin cities.",           CreatedAt=D("2025-08-10") },
            new Customer { Id=DG("customer:c-t7-004"), TenantId=TenantStar, ParentId=null, ShortId="c-t7-004", Name="Multan Cotton Board",          Type="Company",    Status="Active",   Industry="Agriculture & Textile", Country="Pakistan", City="Multan",     Address="Cotton Exchange, Kutchery Road, Multan",             Phone="+92 61 4510 0041", Email="logistics@cottondboard.pk",  Website="cottonboard.pk",       TaxId="NTN-4567890-4", CreditLimit=3500000, ComplianceStatus="Compliant",      VehiclesAssigned=5,  ActiveContracts=1, AccountManager="Zain ul Abidin", Notes="Seasonal cotton bale transport — peak Oct-Dec.",              CreatedAt=D("2025-09-05") },
            new Customer { Id=DG("customer:c-t7-005"), TenantId=TenantStar, ParentId=null, ShortId="c-t7-005", Name="CPEC Logistics Gwadar",        Type="Company",    Status="Active",   Industry="Infrastructure & CPEC", Country="Pakistan", City="Gwadar",     Address="CPEC Industrial Zone, Gwadar Free Zone, Gwadar",    Phone="+92 86 4200 0051", Email="ops@cpeclogistics.pk",        Website="cpeclogistics.pk",     TaxId="NTN-5678901-5", CreditLimit=6000000, ComplianceStatus="Pending Review", VehiclesAssigned=4,  ActiveContracts=2, AccountManager="Zain ul Abidin", Notes="CPEC corridor operations — Gwadar to Lahore trunk route.",    CreatedAt=D("2025-10-20") },
            // ── Atlantic Freight Inc (tenant 8) ─────────────────────────────────
            new Customer { Id=DG("customer:c-a8-001"), TenantId=TenantAtlantic, ParentId=null, ShortId="c-a8-001", Name="Atlantic Manufacturing Corp", Type="Company", Status="Active", Industry="Manufacturing",  Country="United States", City="New York",       Address="350 Fifth Avenue, New York, NY 10118",          Phone="+1 212 555 0200", Email="fleet@atlanticmfg.com",        Website="atlanticmfg.com",    TaxId="US-EIN-13-0001001", CreditLimit=3000000, ComplianceStatus="Compliant",    VehiclesAssigned=3, ActiveContracts=2, AccountManager="Jennifer Walsh",  Notes="Key enterprise manufacturing client.", CreatedAt=D("2023-03-10") },
            new Customer { Id=DG("customer:c-a8-002"), TenantId=TenantAtlantic, ParentId=null, ShortId="c-a8-002", Name="Metro Retail Group",          Type="Company", Status="Active", Industry="Retail",         Country="United States", City="Newark",         Address="1 Gateway Center, Newark, NJ 07102",            Phone="+1 973 555 0300", Email="logistics@metroretail.com",    Website="metroretail.com",    TaxId="US-EIN-22-0002002", CreditLimit=1500000, ComplianceStatus="Compliant",    VehiclesAssigned=1, ActiveContracts=1, AccountManager="Robert Mitchell", Notes="Regional retail chain delivery.", CreatedAt=D("2023-04-15") },
            new Customer { Id=DG("customer:c-a8-003"), TenantId=TenantAtlantic, ParentId=null, ShortId="c-a8-003", Name="Harborview Imports LLC",      Type="Company", Status="Active", Industry="Import/Export",   Country="United States", City="Jersey City",    Address="111 Town Square Place, Jersey City, NJ 07310",  Phone="",                Email="ops@harborviewimports.com",    Website="harborviewimports.com",TaxId="US-EIN-22-0003003", CreditLimit=800000,  ComplianceStatus="Compliant",    VehiclesAssigned=0, ActiveContracts=0, AccountManager="Jennifer Walsh",  Notes="New client — onboarding.", CreatedAt=D("2023-06-01") },
            // ── Meridian Logistics (tenant 9) ────────────────────────────────────
            new Customer { Id=DG("customer:c-m9-001"), TenantId=TenantMeridian, ParentId=null, ShortId="c-m9-001", Name="Lone Star Energy LLC",        Type="Company", Status="Active", Industry="Energy",         Country="United States", City="Houston",        Address="1000 Main Street, Houston, TX 77002",           Phone="+1 713 555 0100", Email="fleet@lonestarenergy.com",     Website="lonestarenergy.com", TaxId="US-EIN-74-0009001", CreditLimit=4000000, ComplianceStatus="Compliant",    VehiclesAssigned=2, ActiveContracts=2, AccountManager="James Harrison", Notes="Energy sector client — Houston operations.", CreatedAt=D("2024-01-25") },
            new Customer { Id=DG("customer:c-m9-002"), TenantId=TenantMeridian, ParentId=null, ShortId="c-m9-002", Name="Gulf Coast Distributors",     Type="Company", Status="Active", Industry="Distribution",   Country="United States", City="Houston",        Address="2200 Port of Houston Road, Houston, TX 77020",  Phone="",                Email="ops@gulfcoastdist.com",        Website="gulfcoastdist.com",  TaxId="US-EIN-74-0009002", CreditLimit=1200000, ComplianceStatus="Compliant",    VehiclesAssigned=1, ActiveContracts=1, AccountManager="Amy Rodriguez",  Notes="Port distribution client.", CreatedAt=D("2024-03-01") },
            // ── BritFleet Solutions (tenant 10) ──────────────────────────────────
            new Customer { Id=DG("customer:c-b10-001"), TenantId=TenantBritfleet, ParentId=null, ShortId="c-b10-001", Name="BritFleet Group Holdings", Type="Company", Status="Active", Industry="Logistics",     Country="United Kingdom", City="London",       Address="30 St Mary Axe, London EC3A 8BF",               Phone="+44 20 7946 0200", Email="fleet@britfleetgroup.co.uk", Website="britfleetgroup.co.uk", TaxId="GB-VAT-123456789", CreditLimit=5000000, ComplianceStatus="Compliant",    VehiclesAssigned=3, ActiveContracts=2, AccountManager="Oliver Thompson",  Notes="Parent group holding company.", CreatedAt=D("2023-09-10") },
            new Customer { Id=DG("customer:c-b10-002"), TenantId=TenantBritfleet, ParentId=null, ShortId="c-b10-002", Name="Northern Freight Partners", Type="Company", Status="Active", Industry="Freight",      Country="United Kingdom", City="Manchester",   Address="1 Piccadilly Gardens, Manchester M1 1RG",        Phone="",                 Email="ops@northernfreight.co.uk",  Website="northernfreight.co.uk", TaxId="GB-VAT-234567890", CreditLimit=1800000, ComplianceStatus="Compliant",    VehiclesAssigned=2, ActiveContracts=1, AccountManager="Charlotte Williams",Notes="Northern England freight carrier.", CreatedAt=D("2023-10-15") },
            new Customer { Id=DG("customer:c-b10-003"), TenantId=TenantBritfleet, ParentId=null, ShortId="c-b10-003", Name="Midlands Distribution Ltd",Type="Company", Status="Active", Industry="Distribution",  Country="United Kingdom", City="Birmingham",   Address="Colmore Row, Birmingham B3 2QD",                 Phone="",                 Email="logistics@midlandsdist.co.uk",Website="midlandsdist.co.uk",  TaxId="GB-VAT-345678901", CreditLimit=1000000, ComplianceStatus="Compliant",    VehiclesAssigned=1, ActiveContracts=1, AccountManager="George Brown",      Notes="Midlands regional distribution.", CreatedAt=D("2023-11-01") }
        );
    }

    // ────────────────────────────────────────────────────────────────────────
    private static void SeedRolePermissions(ModelBuilder mb)
    {
        var allModules = new[]
        {
            "real-time","my-vehicle","map","playback","alerts",
            "customers","vehicles","devices","drivers","routes","geofences","unauthorized","maintenance",
            "cost-savings","analytics","reports",
            "subscription","resellers",
            "integrations","tenants","branding",
            "auth-rbac","auth-mfa","auth-sso","auth-sessions","auth-devices",
            "global-monitor","health","sys-config","tenant-mgmt","global-alerts","isolation",
            "module-config","nav-config",
            "tenant-users","tenant-roles","tenant-nav","branches",
        };

        var denied = new Dictionary<string, HashSet<string>>
        {
            ["super_admin"]    = [],
            ["platform_admin"] = ["subscription","resellers","tenants","global-monitor","health","sys-config","tenant-mgmt","global-alerts","isolation","auth-rbac","auth-mfa","auth-sso","auth-sessions","auth-devices","my-vehicle","nav-config","tenant-users","tenant-roles","tenant-nav","branches"],
            ["tenant_admin"]   = ["global-monitor","health","sys-config","tenant-mgmt","global-alerts","isolation","my-vehicle"],
            ["fleet_admin"]    = ["tenants","global-monitor","health","sys-config","tenant-mgmt","global-alerts","isolation","auth-rbac","auth-mfa","auth-sso","auth-sessions","auth-devices","my-vehicle","nav-config"],
            ["fleet_manager"]  = ["subscription","resellers","tenants","global-monitor","health","sys-config","tenant-mgmt","global-alerts","auth-rbac","auth-mfa","auth-sso","auth-sessions","auth-devices","devices","integrations","my-vehicle","nav-config","tenant-users","tenant-roles","tenant-nav","branches"],
            ["dispatcher"]     = ["subscription","resellers","tenants","branding","global-monitor","health","sys-config","tenant-mgmt","global-alerts","auth-rbac","auth-mfa","auth-sso","auth-sessions","auth-devices","cost-savings","reports","analytics","unauthorized","maintenance","devices","integrations","isolation","my-vehicle","nav-config","tenant-users","tenant-roles","tenant-nav","branches"],
            ["vehicle_owner"]  = ["real-time","customers","vehicles","devices","cost-savings","resellers","integrations","tenants","branding","auth-rbac","auth-mfa","auth-sso","auth-sessions","auth-devices","global-monitor","health","sys-config","tenant-mgmt","global-alerts","isolation","nav-config","tenant-users","tenant-roles","tenant-nav","branches"],
            ["viewer"]         = ["subscription","resellers","devices","integrations","tenants","branding","global-monitor","health","sys-config","tenant-mgmt","global-alerts","auth-rbac","auth-mfa","auth-sso","auth-sessions","auth-devices","unauthorized","maintenance","routes","map","playback","alerts","analytics","reports","cost-savings","customers","isolation","my-vehicle","nav-config","tenant-users","tenant-roles","tenant-nav","branches"],
            ["billing_admin"]  = ["map","playback","alerts","vehicles","drivers","routes","geofences","unauthorized","maintenance","cost-savings","analytics","reports","resellers","devices","integrations","tenants","branding","auth-rbac","auth-mfa","auth-sso","auth-sessions","auth-devices","global-monitor","health","sys-config","tenant-mgmt","global-alerts","isolation","my-vehicle","nav-config","tenant-users","tenant-roles","tenant-nav","branches"],
            ["partner"]        = ["global-monitor","health","sys-config","tenant-mgmt","global-alerts","vehicles","drivers","routes","geofences","unauthorized","maintenance","devices","cost-savings","analytics","reports","auth-rbac","auth-mfa","auth-sso","auth-sessions","auth-devices","isolation","tenants","my-vehicle","nav-config","tenant-users","tenant-roles","tenant-nav","branches"],
        };

        var rows = new List<RolePermission>();
        foreach (var (role, deniedSet) in denied)
        {
            foreach (var module in allModules)
            {
                if (!deniedSet.Contains(module))
                {
                    rows.Add(new RolePermission
                    {
                        Id       = DeterministicGuid($"perm:{role}:{module}"),
                        RoleId   = role,
                        ModuleId = module,
                    });
                }
            }
        }

        mb.Entity<RolePermission>().HasData(rows);
    }

    // ── Devices ──────────────────────────────────────────────────────────────
    private static void SeedDevices(ModelBuilder mb)
    {
        mb.Entity<Device>().HasData(
            // ── ACME Logistics (tenant 1) ────────────────────────────────────────
            new Device { Id=DG("dev:dev-v1-gps"),  ShortId="dev-v1-gps",  TenantId=TenantAcme,  VehicleShortId="v1",  VehiclePlate="KAB 001A", Type="GPS Tracker", Model="Teltonika FMB920",    SerialNo="TLT-FMB-001A",  Imei="356307040123456", Firmware="03.28.07", Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",      SimShortId="sim-v1-p",  InstalledAt=DO("2023-01-15"), Notes="Dual-SIM failover configured." },
            new Device { Id=DG("dev:dev-v1-obd"),  ShortId="dev-v1-obd",  TenantId=TenantAcme,  VehicleShortId="v1",  VehiclePlate="KAB 001A", Type="OBD Dongle",  Model="CalAmp LMU-3030",     SerialNo="CAL-OBD-001A",  Imei="356307040123490", Firmware="7.2.1",    Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",      SimShortId=null,        InstalledAt=DO("2023-01-15"), Notes="Reads engine diagnostics via CAN bus." },
            new Device { Id=DG("dev:dev-v2-gps"),  ShortId="dev-v2-gps",  TenantId=TenantAcme,  VehicleShortId="v2",  VehiclePlate="KAB 002B", Type="GPS Tracker", Model="Teltonika FMB920",    SerialNo="TLT-FMB-002B",  Imei="356307040123457", Firmware="03.28.07", Signal="Strong", Battery=null, LastSeen="1 min ago",  Status="Online",      SimShortId="sim-v2-p",  InstalledAt=DO("2023-02-01"), Notes="" },
            new Device { Id=DG("dev:dev-v3-obd"),  ShortId="dev-v3-obd",  TenantId=TenantAcme,  VehicleShortId="v3",  VehiclePlate="KAB 003C", Type="OBD Dongle",  Model="Ruptela OBD Tracker", SerialNo="RUP-OBD-003C",  Imei="356307040123458", Firmware="2.1.0",    Signal="Medium", Battery=62,   LastSeen="2 min ago",  Status="Online",      SimShortId="sim-v3-p",  InstalledAt=DO("2023-02-10"), Notes="Self-powered via OBD port." },
            new Device { Id=DG("dev:dev-v4-gps"),  ShortId="dev-v4-gps",  TenantId=TenantAcme,  VehicleShortId="v4",  VehiclePlate="KAB 004D", Type="GPS Tracker", Model="Teltonika FMB920",    SerialNo="TLT-FMB-004D",  Imei="356307040123459", Firmware="03.28.07", Signal="Strong", Battery=null, LastSeen="3 min ago",  Status="Online",      SimShortId="sim-v4-p",  InstalledAt=DO("2023-01-20"), Notes="Paired with dashcam dev-v4-cam." },
            new Device { Id=DG("dev:dev-v4-cam"),  ShortId="dev-v4-cam",  TenantId=TenantAcme,  VehicleShortId="v4",  VehiclePlate="KAB 004D", Type="Dashcam",     Model="BlackVue DR900X-2CH", SerialNo="BVX-004D-CAM",  Imei="356307040123491", Firmware="1.005_23", Signal="Strong", Battery=null, LastSeen="3 min ago",  Status="Online",      SimShortId="sim-v4-b",  InstalledAt=DO("2023-01-20"), Notes="Front + rear 4K recording. Parking mode enabled." },
            new Device { Id=DG("dev:dev-v5-gps"),  ShortId="dev-v5-gps",  TenantId=TenantAcme,  VehicleShortId="v5",  VehiclePlate="KAB 005E", Type="GPS Tracker", Model="Queclink GV55",       SerialNo="QLK-GV55-005E", Imei="356307040123460", Firmware="v5.1.8",   Signal="Weak",   Battery=45,   LastSeen="5 min ago",  Status="Online",      SimShortId="sim-v5-p",  InstalledAt=DO("2023-03-01"), Notes="Battery weak — charge check scheduled." },
            new Device { Id=DG("dev:dev-v6-gps"),  ShortId="dev-v6-gps",  TenantId=TenantAcme,  VehicleShortId="v6",  VehiclePlate="KAB 006F", Type="GPS Tracker", Model="Teltonika FMB920",    SerialNo="TLT-FMB-006F",  Imei="356307040123461", Firmware="03.28.07", Signal="None",   Battery=null, LastSeen="6 hr ago",   Status="Offline",     SimShortId="sim-v6-p",  InstalledAt=DO("2023-03-15"), Notes="Vehicle in maintenance bay — no signal." },
            new Device { Id=DG("dev:dev-v6-tmp"),  ShortId="dev-v6-tmp",  TenantId=TenantAcme,  VehicleShortId="v6",  VehiclePlate="KAB 006F", Type="Temp Sensor", Model="Reefer-Track RT200",  SerialNo="RFT-RT200-006F", Imei="356307040123492", Firmware="1.0.3",   Signal="None",   Battery=72,   LastSeen="6 hr ago",   Status="Offline",     SimShortId=null,        InstalledAt=DO("2023-03-15"), Notes="Cargo temperature probe. Cold-chain monitoring." },
            // ── SwiftCargo Ltd (tenant 2) ─────────────────────────────────────
            new Device { Id=DG("dev:dev-v7-gps"),  ShortId="dev-v7-gps",  TenantId=TenantSwift, VehicleShortId="v7",  VehiclePlate="KCC 100A", Type="GPS Tracker", Model="Queclink GV55",       SerialNo="QLK-GV55-007A", Imei="356308040200001", Firmware="v5.2.0",   Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",      SimShortId="sim-v7-p",  InstalledAt=DO("2023-04-01"), Notes="Dual-SIM enabled for interstate routes." },
            new Device { Id=DG("dev:dev-v7-cam"),  ShortId="dev-v7-cam",  TenantId=TenantSwift, VehicleShortId="v7",  VehiclePlate="KCC 100A", Type="Dashcam",     Model="Viofo A129 Pro",      SerialNo="VIO-A129-007A", Imei="356308040200050", Firmware="3.4.0",    Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",      SimShortId=null,        InstalledAt=DO("2023-04-01"), Notes="GPS logger + 4K dashcam." },
            new Device { Id=DG("dev:dev-v8-gps"),  ShortId="dev-v8-gps",  TenantId=TenantSwift, VehicleShortId="v8",  VehiclePlate="KCC 101B", Type="GPS Tracker", Model="Queclink GV55",       SerialNo="QLK-GV55-008B", Imei="356308040200002", Firmware="v5.2.0",   Signal="Strong", Battery=null, LastSeen="2 min ago",  Status="Online",      SimShortId="sim-v8-p",  InstalledAt=DO("2023-04-10"), Notes="" },
            new Device { Id=DG("dev:dev-v9-gps"),  ShortId="dev-v9-gps",  TenantId=TenantSwift, VehicleShortId="v9",  VehiclePlate="KCC 102C", Type="GPS Tracker", Model="Teltonika FMB140",    SerialNo="TLT-FMB-009C",  Imei="356308040200003", Firmware="03.27.14", Signal="Strong", Battery=null, LastSeen="4 min ago",  Status="Online",      SimShortId="sim-v9-p",  InstalledAt=DO("2023-05-01"), Notes="Refrigerated truck — paired temp probe." },
            new Device { Id=DG("dev:dev-v9-tmp"),  ShortId="dev-v9-tmp",  TenantId=TenantSwift, VehicleShortId="v9",  VehiclePlate="KCC 102C", Type="Temp Sensor", Model="Reefer-Track RT200",  SerialNo="RFT-RT200-009C", Imei="356308040200051", Firmware="1.0.3",   Signal="Strong", Battery=88,   LastSeen="4 min ago",  Status="Online",      SimShortId=null,        InstalledAt=DO("2023-05-01"), Notes="Multi-zone temp probe — +2°C to +8°C range." },
            // ── NairobiExpress (tenant 3) ─────────────────────────────────────
            new Device { Id=DG("dev:dev-v10-gps"), ShortId="dev-v10-gps", TenantId=TenantNex,   VehicleShortId="v10", VehiclePlate="KDF 200A", Type="GPS Tracker", Model="Teltonika FMB920",    SerialNo="TLT-FMB-010A",  Imei="356309040300001", Firmware="03.28.07", Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",      SimShortId="sim-v10-p", InstalledAt=DO("2023-06-01"), Notes="High-frequency position updates (10 sec)." },
            new Device { Id=DG("dev:dev-v10-obd"), ShortId="dev-v10-obd", TenantId=TenantNex,   VehicleShortId="v10", VehiclePlate="KDF 200A", Type="OBD Dongle",  Model="CalAmp LMU-3030",     SerialNo="CAL-OBD-010A",  Imei="356309040300051", Firmware="7.2.1",    Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",      SimShortId=null,        InstalledAt=DO("2023-06-01"), Notes="Harsh braking & acceleration monitoring." },
            new Device { Id=DG("dev:dev-v11-gps"), ShortId="dev-v11-gps", TenantId=TenantNex,   VehicleShortId="v11", VehiclePlate="KDF 201B", Type="GPS Tracker", Model="Teltonika FMB920",    SerialNo="TLT-FMB-011B",  Imei="356309040300002", Firmware="03.28.07", Signal="Strong", Battery=null, LastSeen="1 min ago",  Status="Online",      SimShortId="sim-v11-p", InstalledAt=DO("2023-06-15"), Notes="" },
            new Device { Id=DG("dev:dev-v12-gps"), ShortId="dev-v12-gps", TenantId=TenantNex,   VehicleShortId="v12", VehiclePlate="KDF 202C", Type="GPS Tracker", Model="Queclink GV55",       SerialNo="QLK-GV55-012C", Imei="356309040300003", Firmware="v5.2.0",   Signal="Medium", Battery=null, LastSeen="3 min ago",  Status="Online",      SimShortId="sim-v12-p", InstalledAt=DO("2023-07-01"), Notes="" },
            // ── KimTransport (tenant 4) ───────────────────────────────────────
            new Device { Id=DG("dev:dev-v13-gps"), ShortId="dev-v13-gps", TenantId=TenantKim,   VehicleShortId="v13", VehiclePlate="UBF 300A", Type="GPS Tracker", Model="Ruptela FM-Eco4+",    SerialNo="RUP-ECO4-013A", Imei="356310040400001", Firmware="04.00.09", Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",      SimShortId="sim-v13-p", InstalledAt=DO("2023-07-10"), Notes="Dual-SIM MTN primary / Airtel backup for KE-UG-TZ cross-border." },
            new Device { Id=DG("dev:dev-v13-fue"), ShortId="dev-v13-fue", TenantId=TenantKim,   VehicleShortId="v13", VehiclePlate="UBF 300A", Type="Fuel Sensor", Model="Tecnoton FLS-100",    SerialNo="TCN-FLS-013A",  Imei="356310040400051", Firmware="2.3.1",    Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",      SimShortId=null,        InstalledAt=DO("2023-07-10"), Notes="Ultrasonic fuel-level sensor. Reduces siphoning risk." },
            new Device { Id=DG("dev:dev-v14-gps"), ShortId="dev-v14-gps", TenantId=TenantKim,   VehicleShortId="v14", VehiclePlate="UBF 301B", Type="GPS Tracker", Model="Ruptela FM-Eco4+",    SerialNo="RUP-ECO4-014B", Imei="356310040400002", Firmware="04.00.09", Signal="Medium", Battery=null, LastSeen="8 min ago",  Status="Online",      SimShortId="sim-v14-p", InstalledAt=DO("2023-08-01"), Notes="" },
            // ── PeakFleet Co (tenant 5) ───────────────────────────────────────
            new Device { Id=DG("dev:dev-v15-gps"), ShortId="dev-v15-gps", TenantId=TenantPeak,  VehicleShortId="v15", VehiclePlate="T200AAA",  Type="GPS Tracker", Model="Teltonika FMB140",    SerialNo="TLT-FMB-015A",  Imei="356311040500001", Firmware="03.27.14", Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",      SimShortId="sim-v15-p", InstalledAt=DO("2023-08-15"), Notes="Dual-SIM Vodacom/Tigo for Tanzania coverage." },
            new Device { Id=DG("dev:dev-v15-cam"), ShortId="dev-v15-cam", TenantId=TenantPeak,  VehicleShortId="v15", VehiclePlate="T200AAA",  Type="Dashcam",     Model="BlackVue DR750X-2CH", SerialNo="BVX-015A-CAM",  Imei="356311040500051", Firmware="1.012_23", Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",      SimShortId=null,        InstalledAt=DO("2023-08-15"), Notes="Driver-monitoring AI dashcam." },
            new Device { Id=DG("dev:dev-v16-gps"), ShortId="dev-v16-gps", TenantId=TenantPeak,  VehicleShortId="v16", VehiclePlate="T201BBB",  Type="GPS Tracker", Model="Teltonika FMB140",    SerialNo="TLT-FMB-016B",  Imei="356311040500002", Firmware="03.27.14", Signal="Strong", Battery=null, LastSeen="2 min ago",  Status="Online",      SimShortId="sim-v16-p", InstalledAt=DO("2023-09-01"), Notes="" },
            new Device { Id=DG("dev:dev-v17-gps"), ShortId="dev-v17-gps", TenantId=TenantPeak,  VehicleShortId="v17", VehiclePlate="T202CCC",  Type="GPS Tracker", Model="Teltonika FMB140",    SerialNo="TLT-FMB-017C",  Imei="356311040500003", Firmware="03.27.14", Signal="Medium", Battery=null, LastSeen="5 min ago",  Status="Online",      SimShortId="sim-v17-p", InstalledAt=DO("2023-09-15"), Notes="" },
            new Device { Id=DG("dev:dev-v17-fue"), ShortId="dev-v17-fue", TenantId=TenantPeak,  VehicleShortId="v17", VehiclePlate="T202CCC",  Type="Fuel Sensor", Model="Tecnoton FLS-100",    SerialNo="TCN-FLS-017C",  Imei="356311040500052", Firmware="2.3.1",    Signal="Medium", Battery=null, LastSeen="5 min ago",  Status="Online",      SimShortId=null,        InstalledAt=DO("2023-09-15"), Notes="Long-haul truck — fuel theft prevention." },
            new Device { Id=DG("dev:dev-v18-gps"), ShortId="dev-v18-gps", TenantId=TenantPeak,  VehicleShortId="v18", VehiclePlate="T203DDD",  Type="GPS Tracker", Model="Queclink GV55",       SerialNo="QLK-GV55-018D", Imei="356311040500004", Firmware="v5.1.8",   Signal="None",   Battery=null, LastSeen="2 days ago", Status="Maintenance", SimShortId="sim-v18-p", InstalledAt=DO("2024-01-10"), Notes="Vehicle in workshop — firmware update pending." },
            // ── SwiftDeliver EA (tenant 6) ────────────────────────────────────
            new Device { Id=DG("dev:dev-v19-gps"), ShortId="dev-v19-gps", TenantId=TenantSde,   VehicleShortId="v19", VehiclePlate="KDE 400A", Type="GPS Tracker", Model="Teltonika FMB920",    SerialNo="TLT-FMB-019A",  Imei="356312040600001", Firmware="03.28.07", Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",      SimShortId="sim-v19-p", InstalledAt=DO("2023-10-01"), Notes="E-commerce delivery. 40+ stops/day." },
            new Device { Id=DG("dev:dev-v19-obd"), ShortId="dev-v19-obd", TenantId=TenantSde,   VehicleShortId="v19", VehiclePlate="KDE 400A", Type="OBD Dongle",  Model="Ruptela OBD Tracker", SerialNo="RUP-OBD-019A",  Imei="356312040600051", Firmware="2.1.0",    Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",      SimShortId=null,        InstalledAt=DO("2023-10-01"), Notes="Driver behaviour scoring enabled." },
            new Device { Id=DG("dev:dev-v20-gps"), ShortId="dev-v20-gps", TenantId=TenantSde,   VehicleShortId="v20", VehiclePlate="KDE 401B", Type="GPS Tracker", Model="Teltonika FMB920",    SerialNo="TLT-FMB-020B",  Imei="356312040600002", Firmware="03.28.07", Signal="Strong", Battery=null, LastSeen="3 min ago",  Status="Online",      SimShortId="sim-v20-p", InstalledAt=DO("2023-10-15"), Notes="" },
            // ── Star Technologies Pakistan (tenant 7) — CalAmp LMU-3030 ─────
            new Device { Id=DG("dev:dev-vs7-001"), ShortId="dev-vs7-001", TenantId=TenantStar, VehicleShortId="vs7-001", VehiclePlate="LHR-0001", Type="GPS Tracker", Model="CalAmp LMU-3030", SerialNo="CAL-LMU-ST7-001", Imei="356399070700001", Firmware="7.3.2", Signal="Strong", Battery=null, LastSeen="Just now",  Status="Online",  SimShortId="sim-vs7-001-p", InstalledAt=DO("2022-04-20"), Notes="CalAmp LMU-3030 with Jazz primary SIM. Lahore operations." },
            new Device { Id=DG("dev:dev-vs7-002"), ShortId="dev-vs7-002", TenantId=TenantStar, VehicleShortId="vs7-002", VehiclePlate="KHI-0001", Type="GPS Tracker", Model="CalAmp LMU-3030", SerialNo="CAL-LMU-ST7-002", Imei="356399070700002", Firmware="7.3.2", Signal="Strong", Battery=null, LastSeen="Just now",  Status="Online",  SimShortId="sim-vs7-002-p", InstalledAt=DO("2022-06-15"), Notes="CalAmp LMU-3030. Karachi port operations — high-frequency pings." },
            new Device { Id=DG("dev:dev-vs7-003"), ShortId="dev-vs7-003", TenantId=TenantStar, VehicleShortId="vs7-003", VehiclePlate="ISB-0001", Type="GPS Tracker", Model="CalAmp LMU-3030", SerialNo="CAL-LMU-ST7-003", Imei="356399070700003", Firmware="7.3.2", Signal="Strong", Battery=null, LastSeen="2 min ago", Status="Online",  SimShortId="sim-vs7-003-p", InstalledAt=DO("2023-03-15"), Notes="CalAmp LMU-3030. Islamabad federal vehicle — geofence enabled." },
            new Device { Id=DG("dev:dev-vs7-004"), ShortId="dev-vs7-004", TenantId=TenantStar, VehicleShortId="vs7-004", VehiclePlate="MLT-0001", Type="GPS Tracker", Model="CalAmp LMU-3030", SerialNo="CAL-LMU-ST7-004", Imei="356399070700004", Firmware="7.3.2", Signal="Medium", Battery=null, LastSeen="4 min ago", Status="Online",  SimShortId="sim-vs7-004-p", InstalledAt=DO("2021-09-25"), Notes="CalAmp LMU-3030. Multan cotton transport — seasonal high usage." },
            new Device { Id=DG("dev:dev-vs7-005"), ShortId="dev-vs7-005", TenantId=TenantStar, VehicleShortId="vs7-005", VehiclePlate="GWD-0001", Type="GPS Tracker", Model="CalAmp LMU-3030", SerialNo="CAL-LMU-ST7-005", Imei="356399070700005", Firmware="7.3.2", Signal="Medium", Battery=null, LastSeen="6 min ago", Status="Online",  SimShortId="sim-vs7-005-p", InstalledAt=DO("2022-08-10"), Notes="CalAmp LMU-3030. Gwadar CPEC corridor — remote area, signal varies." }
        );

        // ── Atlantic Freight Inc (tenant 8) — Samsara VG34 GPS + Geotab GO9 OBD ─
        mb.Entity<Device>().HasData(
            new Device { Id=DG("dev:dev-va8-001-gps"), ShortId="dev-va8-001-gps", TenantId=TenantAtlantic, VehicleShortId="va8-001", VehiclePlate="NJ-7841A", Type="GPS Tracker", Model="Samsara VG34",    SerialNo="SAM-VG34-A8-001", Imei="356308080800001", Firmware="v5.2.0", Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",  SimShortId="sim-va8-001-p", InstalledAt=DO("2022-04-15"), Notes="Samsara VG34 primary GPS. NJ truck hub." },
            new Device { Id=DG("dev:dev-va8-001-obd"), ShortId="dev-va8-001-obd", TenantId=TenantAtlantic, VehicleShortId="va8-001", VehiclePlate="NJ-7841A", Type="OBD Dongle",  Model="Geotab GO9",     SerialNo="GEO-GO9-A8-001",  Imei="356308080800051", Firmware="v5.2.0", Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",  SimShortId=null,            InstalledAt=DO("2022-04-15"), Notes="Geotab GO9 engine diagnostics." },
            new Device { Id=DG("dev:dev-va8-001-cam"), ShortId="dev-va8-001-cam", TenantId=TenantAtlantic, VehicleShortId="va8-001", VehiclePlate="NJ-7841A", Type="Dashcam",     Model="BlackVue DR900X-2CH", SerialNo="BVX-A8-001-CAM", Imei="356308080800101", Firmware="1.005_23", Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",  SimShortId=null,            InstalledAt=DO("2022-04-15"), Notes="Front + rear 4K dashcam." },
            new Device { Id=DG("dev:dev-va8-002-gps"), ShortId="dev-va8-002-gps", TenantId=TenantAtlantic, VehicleShortId="va8-002", VehiclePlate="NJ-7842B", Type="GPS Tracker", Model="Samsara VG34",    SerialNo="SAM-VG34-A8-002", Imei="356308080800002", Firmware="v5.2.0", Signal="Strong", Battery=null, LastSeen="2 min ago",  Status="Online",  SimShortId="sim-va8-002-p", InstalledAt=DO("2021-06-25"), Notes="Samsara VG34. Cascadia long-haul." },
            new Device { Id=DG("dev:dev-va8-002-obd"), ShortId="dev-va8-002-obd", TenantId=TenantAtlantic, VehicleShortId="va8-002", VehiclePlate="NJ-7842B", Type="OBD Dongle",  Model="Geotab GO9",     SerialNo="GEO-GO9-A8-002",  Imei="356308080800052", Firmware="v5.2.0", Signal="Strong", Battery=null, LastSeen="2 min ago",  Status="Online",  SimShortId=null,            InstalledAt=DO("2021-06-25"), Notes="Geotab GO9 engine monitoring." },
            new Device { Id=DG("dev:dev-va8-003-gps"), ShortId="dev-va8-003-gps", TenantId=TenantAtlantic, VehicleShortId="va8-003", VehiclePlate="NJ-7843C", Type="GPS Tracker", Model="Samsara VG34",    SerialNo="SAM-VG34-A8-003", Imei="356308080800003", Firmware="v5.2.0", Signal="Strong", Battery=null, LastSeen="1 min ago",  Status="Online",  SimShortId="sim-va8-003-p", InstalledAt=DO("2023-02-20"), Notes="Samsara VG34. Transit van city delivery." },
            new Device { Id=DG("dev:dev-va8-004-gps"), ShortId="dev-va8-004-gps", TenantId=TenantAtlantic, VehicleShortId="va8-004", VehiclePlate="NJ-7844D", Type="GPS Tracker", Model="Samsara VG34",    SerialNo="SAM-VG34-A8-004", Imei="356308080800004", Firmware="v5.2.0", Signal="None",   Battery=null, LastSeen="2 days ago", Status="Maintenance", SimShortId="sim-va8-004-p", InstalledAt=DO("2020-10-05"), Notes="Samsara VG34. Peterbilt in workshop." },
            new Device { Id=DG("dev:dev-va8-004-obd"), ShortId="dev-va8-004-obd", TenantId=TenantAtlantic, VehicleShortId="va8-004", VehiclePlate="NJ-7844D", Type="OBD Dongle",  Model="Geotab GO9",     SerialNo="GEO-GO9-A8-004",  Imei="356308080800053", Firmware="v5.2.0", Signal="None",   Battery=null, LastSeen="2 days ago", Status="Maintenance", SimShortId=null,            InstalledAt=DO("2020-10-05"), Notes="Geotab GO9. Offline — maintenance mode." },
            new Device { Id=DG("dev:dev-va8-005-gps"), ShortId="dev-va8-005-gps", TenantId=TenantAtlantic, VehicleShortId="va8-005", VehiclePlate="NJ-7845E", Type="GPS Tracker", Model="Samsara VG34",    SerialNo="SAM-VG34-A8-005", Imei="356308080800005", Firmware="v5.2.0", Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",  SimShortId="sim-va8-005-p", InstalledAt=DO("2022-07-25"), Notes="Samsara VG34. ProMaster van Bronx ops." },
            new Device { Id=DG("dev:dev-va8-006-gps"), ShortId="dev-va8-006-gps", TenantId=TenantAtlantic, VehicleShortId="va8-006", VehiclePlate="NJ-7846F", Type="GPS Tracker", Model="Samsara VG34",    SerialNo="SAM-VG34-A8-006", Imei="356308080800006", Firmware="v5.2.0", Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",  SimShortId="sim-va8-006-p", InstalledAt=DO("2021-09-20"), Notes="Samsara VG34. Kenworth T680 Staten Island." },
            new Device { Id=DG("dev:dev-va8-006-obd"), ShortId="dev-va8-006-obd", TenantId=TenantAtlantic, VehicleShortId="va8-006", VehiclePlate="NJ-7846F", Type="OBD Dongle",  Model="Geotab GO9",     SerialNo="GEO-GO9-A8-006",  Imei="356308080800054", Firmware="v5.2.0", Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",  SimShortId=null,            InstalledAt=DO("2021-09-20"), Notes="Geotab GO9 engine diagnostics." },
            new Device { Id=DG("dev:dev-va8-007-gps"), ShortId="dev-va8-007-gps", TenantId=TenantAtlantic, VehicleShortId="va8-007", VehiclePlate="NJ-7847G", Type="GPS Tracker", Model="Samsara VG34",    SerialNo="SAM-VG34-A8-007", Imei="356308080800007", Firmware="v5.2.0", Signal="None",   Battery=null, LastSeen="3 hr ago",   Status="Offline", SimShortId="sim-va8-007-p", InstalledAt=DO("2023-05-15"), Notes="Samsara VG34. Sprinter offline." },
            new Device { Id=DG("dev:dev-va8-008-gps"), ShortId="dev-va8-008-gps", TenantId=TenantAtlantic, VehicleShortId="va8-008", VehiclePlate="NJ-7848H", Type="GPS Tracker", Model="Samsara VG34",    SerialNo="SAM-VG34-A8-008", Imei="356308080800008", Firmware="v5.2.0", Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",  SimShortId="sim-va8-008-p", InstalledAt=DO("2022-06-10"), Notes="Samsara VG34. International LT Jersey City." },
            new Device { Id=DG("dev:dev-va8-008-obd"), ShortId="dev-va8-008-obd", TenantId=TenantAtlantic, VehicleShortId="va8-008", VehiclePlate="NJ-7848H", Type="OBD Dongle",  Model="Geotab GO9",     SerialNo="GEO-GO9-A8-008",  Imei="356308080800055", Firmware="v5.2.0", Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",  SimShortId=null,            InstalledAt=DO("2022-06-10"), Notes="Geotab GO9 engine diagnostics." },
            // ── Meridian Logistics (tenant 9) — Verizon Connect HUM GPS + CalAmp OBD ─
            new Device { Id=DG("dev:dev-vm9-001-gps"), ShortId="dev-vm9-001-gps", TenantId=TenantMeridian, VehicleShortId="vm9-001", VehiclePlate="TX-MLG-001", Type="GPS Tracker", Model="Verizon Connect HUM", SerialNo="VCH-HUM-M9-001", Imei="356309090900001", Firmware="v5.2.0", Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",  SimShortId="sim-vm9-001-p", InstalledAt=DO("2022-03-15"), Notes="Verizon Connect HUM. Kenworth T880 Houston." },
            new Device { Id=DG("dev:dev-vm9-001-obd"), ShortId="dev-vm9-001-obd", TenantId=TenantMeridian, VehicleShortId="vm9-001", VehiclePlate="TX-MLG-001", Type="OBD Dongle",  Model="CalAmp TTU-2830",    SerialNo="CAL-TTU-M9-001", Imei="356309090900051", Firmware="7.3.2", Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",  SimShortId=null,            InstalledAt=DO("2022-03-15"), Notes="CalAmp TTU-2830 engine diagnostics." },
            new Device { Id=DG("dev:dev-vm9-001-cam"), ShortId="dev-vm9-001-cam", TenantId=TenantMeridian, VehicleShortId="vm9-001", VehiclePlate="TX-MLG-001", Type="Dashcam",     Model="Viofo A129 Pro",     SerialNo="VIO-A129-M9-001",Imei="356309090900101", Firmware="3.4.0", Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",  SimShortId=null,            InstalledAt=DO("2022-03-15"), Notes="Viofo A129 Pro front dashcam." },
            new Device { Id=DG("dev:dev-vm9-002-gps"), ShortId="dev-vm9-002-gps", TenantId=TenantMeridian, VehicleShortId="vm9-002", VehiclePlate="TX-MLG-002", Type="GPS Tracker", Model="Verizon Connect HUM", SerialNo="VCH-HUM-M9-002", Imei="356309090900002", Firmware="v5.2.0", Signal="Strong", Battery=null, LastSeen="3 min ago",  Status="Online",  SimShortId="sim-vm9-002-p", InstalledAt=DO("2021-08-25"), Notes="Verizon Connect HUM. Freightliner M2." },
            new Device { Id=DG("dev:dev-vm9-002-obd"), ShortId="dev-vm9-002-obd", TenantId=TenantMeridian, VehicleShortId="vm9-002", VehiclePlate="TX-MLG-002", Type="OBD Dongle",  Model="CalAmp TTU-2830",    SerialNo="CAL-TTU-M9-002", Imei="356309090900052", Firmware="7.3.2", Signal="Strong", Battery=null, LastSeen="3 min ago",  Status="Online",  SimShortId=null,            InstalledAt=DO("2021-08-25"), Notes="CalAmp TTU-2830 OBD monitoring." },
            new Device { Id=DG("dev:dev-vm9-003-gps"), ShortId="dev-vm9-003-gps", TenantId=TenantMeridian, VehicleShortId="vm9-003", VehiclePlate="TX-MLG-003", Type="GPS Tracker", Model="Verizon Connect HUM", SerialNo="VCH-HUM-M9-003", Imei="356309090900003", Firmware="v5.2.0", Signal="Strong", Battery=null, LastSeen="1 min ago",  Status="Online",  SimShortId="sim-vm9-003-p", InstalledAt=DO("2023-03-20"), Notes="Verizon Connect HUM. Transit 350 city delivery." },
            new Device { Id=DG("dev:dev-vm9-004-gps"), ShortId="dev-vm9-004-gps", TenantId=TenantMeridian, VehicleShortId="vm9-004", VehiclePlate="TX-MLG-004", Type="GPS Tracker", Model="Verizon Connect HUM", SerialNo="VCH-HUM-M9-004", Imei="356309090900004", Firmware="v5.2.0", Signal="None",   Battery=null, LastSeen="2 days ago", Status="Maintenance", SimShortId="sim-vm9-004-p", InstalledAt=DO("2020-11-10"), Notes="Verizon Connect HUM. Peterbilt 389 in maintenance." },
            new Device { Id=DG("dev:dev-vm9-004-obd"), ShortId="dev-vm9-004-obd", TenantId=TenantMeridian, VehicleShortId="vm9-004", VehiclePlate="TX-MLG-004", Type="OBD Dongle",  Model="CalAmp TTU-2830",    SerialNo="CAL-TTU-M9-004", Imei="356309090900053", Firmware="7.3.2", Signal="None",   Battery=null, LastSeen="2 days ago", Status="Maintenance", SimShortId=null,            InstalledAt=DO("2020-11-10"), Notes="CalAmp TTU-2830. Offline — maintenance." },
            new Device { Id=DG("dev:dev-vm9-005-gps"), ShortId="dev-vm9-005-gps", TenantId=TenantMeridian, VehicleShortId="vm9-005", VehiclePlate="TX-MLG-005", Type="GPS Tracker", Model="Verizon Connect HUM", SerialNo="VCH-HUM-M9-005", Imei="356309090900005", Firmware="v5.2.0", Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",  SimShortId="sim-vm9-005-p", InstalledAt=DO("2022-09-15"), Notes="Verizon Connect HUM. ProMaster 2500 South Houston." },
            new Device { Id=DG("dev:dev-vm9-006-gps"), ShortId="dev-vm9-006-gps", TenantId=TenantMeridian, VehicleShortId="vm9-006", VehiclePlate="TX-MLG-006", Type="GPS Tracker", Model="Verizon Connect HUM", SerialNo="VCH-HUM-M9-006", Imei="356309090900006", Firmware="v5.2.0", Signal="None",   Battery=null, LastSeen="4 hr ago",   Status="Offline", SimShortId="sim-vm9-006-p", InstalledAt=DO("2021-05-25"), Notes="Verizon Connect HUM. Mack Anthem offline." },
            new Device { Id=DG("dev:dev-vm9-006-obd"), ShortId="dev-vm9-006-obd", TenantId=TenantMeridian, VehicleShortId="vm9-006", VehiclePlate="TX-MLG-006", Type="OBD Dongle",  Model="CalAmp TTU-2830",    SerialNo="CAL-TTU-M9-006", Imei="356309090900054", Firmware="7.3.2", Signal="None",   Battery=null, LastSeen="4 hr ago",   Status="Offline", SimShortId=null,            InstalledAt=DO("2021-05-25"), Notes="CalAmp TTU-2830. Offline." },
            // ── BritFleet Solutions (tenant 10) — Teltonika FMB920 GPS + Ruptela OBD ─
            new Device { Id=DG("dev:dev-vb10-001-gps"), ShortId="dev-vb10-001-gps", TenantId=TenantBritfleet, VehicleShortId="vb10-001", VehiclePlate="LK72 ABF", Type="GPS Tracker", Model="Teltonika FMB920",    SerialNo="TLT-FMB-B10-001", Imei="356310101000001", Firmware="03.28.07", Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",  SimShortId="sim-vb10-001-p", InstalledAt=DO("2022-09-20"), Notes="Teltonika FMB920. Actros 2645 London ops." },
            new Device { Id=DG("dev:dev-vb10-001-obd"), ShortId="dev-vb10-001-obd", TenantId=TenantBritfleet, VehicleShortId="vb10-001", VehiclePlate="LK72 ABF", Type="OBD Dongle",  Model="Ruptela OBD Tracker", SerialNo="RUP-OBD-B10-001", Imei="356310101000051", Firmware="2.1.0",    Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",  SimShortId=null,             InstalledAt=DO("2022-09-20"), Notes="Ruptela OBD engine monitoring." },
            new Device { Id=DG("dev:dev-vb10-001-cam"), ShortId="dev-vb10-001-cam", TenantId=TenantBritfleet, VehicleShortId="vb10-001", VehiclePlate="LK72 ABF", Type="Dashcam",     Model="BlackVue DR750X-2CH", SerialNo="BVX-B10-001-CAM", Imei="356310101000101", Firmware="1.012_23",  Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",  SimShortId=null,             InstalledAt=DO("2022-09-20"), Notes="BlackVue DR750X front + rear dashcam." },
            new Device { Id=DG("dev:dev-vb10-002-gps"), ShortId="dev-vb10-002-gps", TenantId=TenantBritfleet, VehicleShortId="vb10-002", VehiclePlate="LK71 ABF", Type="GPS Tracker", Model="Teltonika FMB920",    SerialNo="TLT-FMB-B10-002", Imei="356310101000002", Firmware="03.28.07", Signal="Strong", Battery=null, LastSeen="2 min ago",  Status="Online",  SimShortId="sim-vb10-002-p", InstalledAt=DO("2021-11-15"), Notes="Teltonika FMB920. Volvo FH16 Manchester." },
            new Device { Id=DG("dev:dev-vb10-002-obd"), ShortId="dev-vb10-002-obd", TenantId=TenantBritfleet, VehicleShortId="vb10-002", VehiclePlate="LK71 ABF", Type="OBD Dongle",  Model="Ruptela OBD Tracker", SerialNo="RUP-OBD-B10-002", Imei="356310101000052", Firmware="2.1.0",    Signal="Strong", Battery=null, LastSeen="2 min ago",  Status="Online",  SimShortId=null,             InstalledAt=DO("2021-11-15"), Notes="Ruptela OBD Volvo engine data." },
            new Device { Id=DG("dev:dev-vb10-003-gps"), ShortId="dev-vb10-003-gps", TenantId=TenantBritfleet, VehicleShortId="vb10-003", VehiclePlate="LK73 ABF", Type="GPS Tracker", Model="Teltonika FMB920",    SerialNo="TLT-FMB-B10-003", Imei="356310101000003", Firmware="03.28.07", Signal="Strong", Battery=null, LastSeen="1 min ago",  Status="Online",  SimShortId="sim-vb10-003-p", InstalledAt=DO("2023-03-25"), Notes="Teltonika FMB920. Transit Custom London delivery." },
            new Device { Id=DG("dev:dev-vb10-004-gps"), ShortId="dev-vb10-004-gps", TenantId=TenantBritfleet, VehicleShortId="vb10-004", VehiclePlate="LK70 ABF", Type="GPS Tracker", Model="Teltonika FMB920",    SerialNo="TLT-FMB-B10-004", Imei="356310101000004", Firmware="03.28.07", Signal="None",   Battery=null, LastSeen="2 days ago", Status="Maintenance", SimShortId="sim-vb10-004-p", InstalledAt=DO("2020-10-10"), Notes="Teltonika FMB920. DAF XF in workshop." },
            new Device { Id=DG("dev:dev-vb10-004-obd"), ShortId="dev-vb10-004-obd", TenantId=TenantBritfleet, VehicleShortId="vb10-004", VehiclePlate="LK70 ABF", Type="OBD Dongle",  Model="Ruptela OBD Tracker", SerialNo="RUP-OBD-B10-004", Imei="356310101000053", Firmware="2.1.0",    Signal="None",   Battery=null, LastSeen="2 days ago", Status="Maintenance", SimShortId=null,             InstalledAt=DO("2020-10-10"), Notes="Ruptela OBD. Offline maintenance." },
            new Device { Id=DG("dev:dev-vb10-005-gps"), ShortId="dev-vb10-005-gps", TenantId=TenantBritfleet, VehicleShortId="vb10-005", VehiclePlate="LK72 CBF", Type="GPS Tracker", Model="Teltonika FMB920",    SerialNo="TLT-FMB-B10-005", Imei="356310101000005", Firmware="03.28.07", Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",  SimShortId="sim-vb10-005-p", InstalledAt=DO("2022-07-15"), Notes="Teltonika FMB920. Renault Master Birmingham." },
            new Device { Id=DG("dev:dev-vb10-006-gps"), ShortId="dev-vb10-006-gps", TenantId=TenantBritfleet, VehicleShortId="vb10-006", VehiclePlate="LK71 CBF", Type="GPS Tracker", Model="Teltonika FMB920",    SerialNo="TLT-FMB-B10-006", Imei="356310101000006", Firmware="03.28.07", Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",  SimShortId="sim-vb10-006-p", InstalledAt=DO("2021-05-20"), Notes="Teltonika FMB920. Scania R500 Leeds." },
            new Device { Id=DG("dev:dev-vb10-006-obd"), ShortId="dev-vb10-006-obd", TenantId=TenantBritfleet, VehicleShortId="vb10-006", VehiclePlate="LK71 CBF", Type="OBD Dongle",  Model="Ruptela OBD Tracker", SerialNo="RUP-OBD-B10-006", Imei="356310101000054", Firmware="2.1.0",    Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",  SimShortId=null,             InstalledAt=DO("2021-05-20"), Notes="Ruptela OBD Scania diagnostics." },
            new Device { Id=DG("dev:dev-vb10-007-gps"), ShortId="dev-vb10-007-gps", TenantId=TenantBritfleet, VehicleShortId="vb10-007", VehiclePlate="LK73 CBF", Type="GPS Tracker", Model="Teltonika FMB920",    SerialNo="TLT-FMB-B10-007", Imei="356310101000007", Firmware="03.28.07", Signal="None",   Battery=null, LastSeen="3 hr ago",   Status="Offline", SimShortId="sim-vb10-007-p", InstalledAt=DO("2023-06-05"), Notes="Teltonika FMB920. Vauxhall Vivaro offline Glasgow." },
            new Device { Id=DG("dev:dev-vb10-008-gps"), ShortId="dev-vb10-008-gps", TenantId=TenantBritfleet, VehicleShortId="vb10-008", VehiclePlate="LK72 DBF", Type="GPS Tracker", Model="Teltonika FMB920",    SerialNo="TLT-FMB-B10-008", Imei="356310101000008", Firmware="03.28.07", Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",  SimShortId="sim-vb10-008-p", InstalledAt=DO("2022-12-05"), Notes="Teltonika FMB920. MAN TGX Bristol." },
            new Device { Id=DG("dev:dev-vb10-008-obd"), ShortId="dev-vb10-008-obd", TenantId=TenantBritfleet, VehicleShortId="vb10-008", VehiclePlate="LK72 DBF", Type="OBD Dongle",  Model="Ruptela OBD Tracker", SerialNo="RUP-OBD-B10-008", Imei="356310101000055", Firmware="2.1.0",    Signal="Strong", Battery=null, LastSeen="Just now",   Status="Online",  SimShortId=null,             InstalledAt=DO("2022-12-05"), Notes="Ruptela OBD MAN engine monitoring." }
        );
    }

    // ── SimCards ─────────────────────────────────────────────────────────────
    private static void SeedSimCards(ModelBuilder mb)
    {
        mb.Entity<SimCard>().HasData(
            // ── ACME Logistics (tenant 1) ────────────────────────────────────────
            new SimCard { Id=DG("sim:sim-v1-p"),  ShortId="sim-v1-p",  TenantId=TenantAcme,  VehicleShortId="v1",  VehiclePlate="KAB 001A", Iccid="89254030012345678901", Msisdn="+254722001001", Operator="Safaricom",     Country="Kenya",    Type="Primary", Status="Active",    DataUsedMb=4820, DataPlanMb=10240, Apn="data.safaricom.com",     ActivatedAt=DO("2023-01-15"), ExpiresAt=DO("2026-12-31"), Notes="Teltonika FMB920 primary SIM." },
            new SimCard { Id=DG("sim:sim-v1-b"),  ShortId="sim-v1-b",  TenantId=TenantAcme,  VehicleShortId="v1",  VehiclePlate="KAB 001A", Iccid="89254040012345678902", Msisdn="+254733001002", Operator="Airtel Kenya",  Country="Kenya",    Type="Backup",  Status="Active",    DataUsedMb=112,  DataPlanMb=2048,  Apn="internet",               ActivatedAt=DO("2023-01-15"), ExpiresAt=DO("2026-12-31"), Notes="Backup SIM — auto-failover on primary loss." },
            new SimCard { Id=DG("sim:sim-v2-p"),  ShortId="sim-v2-p",  TenantId=TenantAcme,  VehicleShortId="v2",  VehiclePlate="KAB 002B", Iccid="89254030012345678903", Msisdn="+254722001003", Operator="Safaricom",     Country="Kenya",    Type="Primary", Status="Active",    DataUsedMb=3540, DataPlanMb=10240, Apn="data.safaricom.com",     ActivatedAt=DO("2023-02-01"), ExpiresAt=DO("2026-12-31"), Notes="" },
            new SimCard { Id=DG("sim:sim-v3-p"),  ShortId="sim-v3-p",  TenantId=TenantAcme,  VehicleShortId="v3",  VehiclePlate="KAB 003C", Iccid="89254030012345678905", Msisdn="+254722001005", Operator="Safaricom",     Country="Kenya",    Type="Primary", Status="Active",    DataUsedMb=2910, DataPlanMb=10240, Apn="data.safaricom.com",     ActivatedAt=DO("2023-02-10"), ExpiresAt=DO("2026-12-31"), Notes="OBD dongle SIM." },
            new SimCard { Id=DG("sim:sim-v4-p"),  ShortId="sim-v4-p",  TenantId=TenantAcme,  VehicleShortId="v4",  VehiclePlate="KAB 004D", Iccid="89254030012345678907", Msisdn="+254722001007", Operator="Safaricom",     Country="Kenya",    Type="Primary", Status="Active",    DataUsedMb=6210, DataPlanMb=10240, Apn="data.safaricom.com",     ActivatedAt=DO("2023-01-20"), ExpiresAt=DO("2026-12-31"), Notes="High-usage vehicle — dashcam also active." },
            new SimCard { Id=DG("sim:sim-v4-b"),  ShortId="sim-v4-b",  TenantId=TenantAcme,  VehicleShortId="v4",  VehiclePlate="KAB 004D", Iccid="89254040012345678908", Msisdn="+254733001008", Operator="Airtel Kenya",  Country="Kenya",    Type="Backup",  Status="Active",    DataUsedMb=234,  DataPlanMb=2048,  Apn="internet",               ActivatedAt=DO("2023-01-20"), ExpiresAt=DO("2026-12-31"), Notes="Dashcam backup SIM." },
            new SimCard { Id=DG("sim:sim-v5-p"),  ShortId="sim-v5-p",  TenantId=TenantAcme,  VehicleShortId="v5",  VehiclePlate="KAB 005E", Iccid="89254030012345678909", Msisdn="+254722001009", Operator="Safaricom",     Country="Kenya",    Type="Primary", Status="Active",    DataUsedMb=1820, DataPlanMb=5120,  Apn="data.safaricom.com",     ActivatedAt=DO("2023-03-01"), ExpiresAt=DO("2026-12-31"), Notes="" },
            new SimCard { Id=DG("sim:sim-v6-p"),  ShortId="sim-v6-p",  TenantId=TenantAcme,  VehicleShortId="v6",  VehiclePlate="KAB 006F", Iccid="89254030012345678911", Msisdn="+254722001011", Operator="Safaricom",     Country="Kenya",    Type="Primary", Status="Suspended", DataUsedMb=440,  DataPlanMb=5120,  Apn="data.safaricom.com",     ActivatedAt=DO("2023-03-15"), ExpiresAt=DO("2026-12-31"), Notes="Suspended — vehicle offline for maintenance." },
            // ── SwiftCargo Ltd (tenant 2) ─────────────────────────────────────
            new SimCard { Id=DG("sim:sim-v7-p"),  ShortId="sim-v7-p",  TenantId=TenantSwift, VehicleShortId="v7",  VehiclePlate="KCC 100A", Iccid="89254030023456789001", Msisdn="+254722002001", Operator="Safaricom",     Country="Kenya",    Type="Primary", Status="Active",    DataUsedMb=5230, DataPlanMb=10240, Apn="data.safaricom.com",     ActivatedAt=DO("2023-04-01"), ExpiresAt=DO("2026-12-31"), Notes="Queclink GV55 primary." },
            new SimCard { Id=DG("sim:sim-v7-b"),  ShortId="sim-v7-b",  TenantId=TenantSwift, VehicleShortId="v7",  VehiclePlate="KCC 100A", Iccid="89254040023456789002", Msisdn="+254733002002", Operator="Airtel Kenya",  Country="Kenya",    Type="Backup",  Status="Active",    DataUsedMb=88,   DataPlanMb=2048,  Apn="internet",               ActivatedAt=DO("2023-04-01"), ExpiresAt=DO("2026-12-31"), Notes="Backup SIM for intercounty routes." },
            new SimCard { Id=DG("sim:sim-v8-p"),  ShortId="sim-v8-p",  TenantId=TenantSwift, VehicleShortId="v8",  VehiclePlate="KCC 101B", Iccid="89254030023456789003", Msisdn="+254722002003", Operator="Safaricom",     Country="Kenya",    Type="Primary", Status="Active",    DataUsedMb=4110, DataPlanMb=10240, Apn="data.safaricom.com",     ActivatedAt=DO("2023-04-10"), ExpiresAt=DO("2026-12-31"), Notes="" },
            new SimCard { Id=DG("sim:sim-v9-p"),  ShortId="sim-v9-p",  TenantId=TenantSwift, VehicleShortId="v9",  VehiclePlate="KCC 102C", Iccid="89254030023456789005", Msisdn="+254722002005", Operator="Safaricom",     Country="Kenya",    Type="Primary", Status="Active",    DataUsedMb=2970, DataPlanMb=5120,  Apn="data.safaricom.com",     ActivatedAt=DO("2023-05-01"), ExpiresAt=DO("2026-12-31"), Notes="Dashcam SIM." },
            // ── NairobiExpress (tenant 3) ─────────────────────────────────────
            new SimCard { Id=DG("sim:sim-v10-p"), ShortId="sim-v10-p", TenantId=TenantNex,   VehicleShortId="v10", VehiclePlate="KDF 200A", Iccid="89254030034567890001", Msisdn="+254722003001", Operator="Safaricom",     Country="Kenya",    Type="Primary", Status="Active",    DataUsedMb=7840, DataPlanMb=10240, Apn="data.safaricom.com",     ActivatedAt=DO("2023-06-01"), ExpiresAt=DO("2026-12-31"), Notes="High city traffic — high data use." },
            new SimCard { Id=DG("sim:sim-v10-b"), ShortId="sim-v10-b", TenantId=TenantNex,   VehicleShortId="v10", VehiclePlate="KDF 200A", Iccid="89254070034567890002", Msisdn="+254700003002", Operator="Telkom Kenya",  Country="Kenya",    Type="Backup",  Status="Active",    DataUsedMb=310,  DataPlanMb=2048,  Apn="internet.telkom.co.ke",  ActivatedAt=DO("2023-06-01"), ExpiresAt=DO("2026-12-31"), Notes="Telkom backup for CBD coverage." },
            new SimCard { Id=DG("sim:sim-v11-p"), ShortId="sim-v11-p", TenantId=TenantNex,   VehicleShortId="v11", VehiclePlate="KDF 201B", Iccid="89254030034567890003", Msisdn="+254722003003", Operator="Safaricom",     Country="Kenya",    Type="Primary", Status="Active",    DataUsedMb=6120, DataPlanMb=10240, Apn="data.safaricom.com",     ActivatedAt=DO("2023-06-15"), ExpiresAt=DO("2026-12-31"), Notes="" },
            new SimCard { Id=DG("sim:sim-v12-p"), ShortId="sim-v12-p", TenantId=TenantNex,   VehicleShortId="v12", VehiclePlate="KDF 202C", Iccid="89254030034567890005", Msisdn="+254722003005", Operator="Safaricom",     Country="Kenya",    Type="Primary", Status="Active",    DataUsedMb=5300, DataPlanMb=10240, Apn="data.safaricom.com",     ActivatedAt=DO("2023-07-01"), ExpiresAt=DO("2026-12-31"), Notes="" },
            // ── KimTransport (tenant 4) ───────────────────────────────────────
            new SimCard { Id=DG("sim:sim-v13-p"), ShortId="sim-v13-p", TenantId=TenantKim,   VehicleShortId="v13", VehiclePlate="UBF 300A", Iccid="89256040041234567001", Msisdn="+256772004001", Operator="MTN Uganda",    Country="Uganda",   Type="Primary", Status="Active",    DataUsedMb=3450, DataPlanMb=10240, Apn="internet.mtn.co.ug",     ActivatedAt=DO("2023-07-10"), ExpiresAt=DO("2026-12-31"), Notes="Ruptela FM-Eco4+ primary SIM." },
            new SimCard { Id=DG("sim:sim-v13-b"), ShortId="sim-v13-b", TenantId=TenantKim,   VehicleShortId="v13", VehiclePlate="UBF 300A", Iccid="89256050041234567002", Msisdn="+256753004002", Operator="Airtel Uganda", Country="Uganda",   Type="Backup",  Status="Active",    DataUsedMb=95,   DataPlanMb=2048,  Apn="internet.ug",            ActivatedAt=DO("2023-07-10"), ExpiresAt=DO("2026-12-31"), Notes="Cross-border backup (KE/TZ roaming)." },
            new SimCard { Id=DG("sim:sim-v14-p"), ShortId="sim-v14-p", TenantId=TenantKim,   VehicleShortId="v14", VehiclePlate="UBF 301B", Iccid="89256040041234567003", Msisdn="+256772004003", Operator="MTN Uganda",    Country="Uganda",   Type="Primary", Status="Active",    DataUsedMb=2870, DataPlanMb=5120,  Apn="internet.mtn.co.ug",     ActivatedAt=DO("2023-08-01"), ExpiresAt=DO("2026-12-31"), Notes="" },
            // ── PeakFleet Co (tenant 5) ───────────────────────────────────────
            new SimCard { Id=DG("sim:sim-v15-p"), ShortId="sim-v15-p", TenantId=TenantPeak,  VehicleShortId="v15", VehiclePlate="T200AAA",  Iccid="89255060051234567001", Msisdn="+255754005001", Operator="Vodacom Tanzania",Country="Tanzania", Type="Primary", Status="Active",    DataUsedMb=5670, DataPlanMb=10240, Apn="internet",               ActivatedAt=DO("2023-08-15"), ExpiresAt=DO("2026-12-31"), Notes="Teltonika FMB140 primary." },
            new SimCard { Id=DG("sim:sim-v15-b"), ShortId="sim-v15-b", TenantId=TenantPeak,  VehicleShortId="v15", VehiclePlate="T200AAA",  Iccid="89255080051234567002", Msisdn="+255652005002", Operator="Tigo Tanzania",  Country="Tanzania", Type="Backup",  Status="Active",    DataUsedMb=180,  DataPlanMb=2048,  Apn="internet.tigo.tz",       ActivatedAt=DO("2023-08-15"), ExpiresAt=DO("2026-12-31"), Notes="Tigo backup for remote sites." },
            new SimCard { Id=DG("sim:sim-v16-p"), ShortId="sim-v16-p", TenantId=TenantPeak,  VehicleShortId="v16", VehiclePlate="T201BBB",  Iccid="89255060051234567003", Msisdn="+255754005003", Operator="Vodacom Tanzania",Country="Tanzania", Type="Primary", Status="Active",    DataUsedMb=4340, DataPlanMb=10240, Apn="internet",               ActivatedAt=DO("2023-09-01"), ExpiresAt=DO("2026-12-31"), Notes="" },
            new SimCard { Id=DG("sim:sim-v17-p"), ShortId="sim-v17-p", TenantId=TenantPeak,  VehicleShortId="v17", VehiclePlate="T202CCC",  Iccid="89255060051234567005", Msisdn="+255754005005", Operator="Vodacom Tanzania",Country="Tanzania", Type="Primary", Status="Active",    DataUsedMb=3980, DataPlanMb=10240, Apn="internet",               ActivatedAt=DO("2023-09-15"), ExpiresAt=DO("2026-12-31"), Notes="" },
            new SimCard { Id=DG("sim:sim-v18-p"), ShortId="sim-v18-p", TenantId=TenantPeak,  VehicleShortId="v18", VehiclePlate="T203DDD",  Iccid="89255060051234567007", Msisdn="+255754005007", Operator="Vodacom Tanzania",Country="Tanzania", Type="Primary", Status="Inactive",  DataUsedMb=210,  DataPlanMb=5120,  Apn="internet",               ActivatedAt=DO("2024-01-10"), ExpiresAt=DO("2026-12-31"), Notes="Vehicle maintenance — SIM deactivated." },
            // ── SwiftDeliver EA (tenant 6) ────────────────────────────────────
            new SimCard { Id=DG("sim:sim-v19-p"), ShortId="sim-v19-p", TenantId=TenantSde,   VehicleShortId="v19", VehiclePlate="KDE 400A", Iccid="89254030062345678001", Msisdn="+254722006001", Operator="Safaricom",     Country="Kenya",    Type="Primary", Status="Active",    DataUsedMb=6880, DataPlanMb=10240, Apn="data.safaricom.com",     ActivatedAt=DO("2023-10-01"), ExpiresAt=DO("2026-12-31"), Notes="High-frequency delivery routes." },
            new SimCard { Id=DG("sim:sim-v19-b"), ShortId="sim-v19-b", TenantId=TenantSde,   VehicleShortId="v19", VehiclePlate="KDE 400A", Iccid="89254040062345678002", Msisdn="+254733006002", Operator="Airtel Kenya",  Country="Kenya",    Type="Backup",  Status="Active",    DataUsedMb=145,  DataPlanMb=2048,  Apn="internet",               ActivatedAt=DO("2023-10-01"), ExpiresAt=DO("2026-12-31"), Notes="" },
            new SimCard { Id=DG("sim:sim-v20-p"), ShortId="sim-v20-p", TenantId=TenantSde,   VehicleShortId="v20", VehiclePlate="KDE 401B", Iccid="89254030062345678003", Msisdn="+254722006003", Operator="Safaricom",     Country="Kenya",    Type="Primary", Status="Active",    DataUsedMb=4510, DataPlanMb=10240, Apn="data.safaricom.com",     ActivatedAt=DO("2023-10-15"), ExpiresAt=DO("2026-12-31"), Notes="" },
            // ── Star Technologies Pakistan (tenant 7) — Jazz SIMs ───────────
            new SimCard { Id=DG("sim:sim-vs7-001-p"), ShortId="sim-vs7-001-p", TenantId=TenantStar, VehicleShortId="vs7-001", VehiclePlate="LHR-0001", Iccid="89920107000001234501", Msisdn="+92 300 1234501", Operator="Jazz", Country="Pakistan", Type="Primary", Status="Active",   DataUsedMb=3820, DataPlanMb=10240, Apn="internet.jazz.net", ActivatedAt=DO("2022-04-20"), ExpiresAt=DO("2027-04-20"), Notes="Jazz primary SIM — CalAmp LMU-3030. Lahore coverage." },
            new SimCard { Id=DG("sim:sim-vs7-002-p"), ShortId="sim-vs7-002-p", TenantId=TenantStar, VehicleShortId="vs7-002", VehiclePlate="KHI-0001", Iccid="89920107000001234502", Msisdn="+92 300 1234502", Operator="Jazz", Country="Pakistan", Type="Primary", Status="Active",   DataUsedMb=5140, DataPlanMb=10240, Apn="internet.jazz.net", ActivatedAt=DO("2022-06-15"), ExpiresAt=DO("2027-06-15"), Notes="Jazz primary SIM — CalAmp LMU-3030. Karachi port high-data route." },
            new SimCard { Id=DG("sim:sim-vs7-003-p"), ShortId="sim-vs7-003-p", TenantId=TenantStar, VehicleShortId="vs7-003", VehiclePlate="ISB-0001", Iccid="89920107000001234503", Msisdn="+92 300 1234503", Operator="Jazz", Country="Pakistan", Type="Primary", Status="Active",   DataUsedMb=2290, DataPlanMb=10240, Apn="internet.jazz.net", ActivatedAt=DO("2023-03-15"), ExpiresAt=DO("2027-03-15"), Notes="Jazz primary SIM — CalAmp LMU-3030. Islamabad federal vehicle." },
            new SimCard { Id=DG("sim:sim-vs7-004-p"), ShortId="sim-vs7-004-p", TenantId=TenantStar, VehicleShortId="vs7-004", VehiclePlate="MLT-0001", Iccid="89920107000001234504", Msisdn="+92 300 1234504", Operator="Jazz", Country="Pakistan", Type="Primary", Status="Active",   DataUsedMb=4670, DataPlanMb=10240, Apn="internet.jazz.net", ActivatedAt=DO("2021-09-25"), ExpiresAt=DO("2026-09-25"), Notes="Jazz primary SIM — CalAmp LMU-3030. Multan cotton corridor." },
            new SimCard { Id=DG("sim:sim-vs7-005-p"), ShortId="sim-vs7-005-p", TenantId=TenantStar, VehicleShortId="vs7-005", VehiclePlate="GWD-0001", Iccid="89920107000001234505", Msisdn="+92 300 1234505", Operator="Jazz", Country="Pakistan", Type="Primary", Status="Active",   DataUsedMb=1850, DataPlanMb=5120,  Apn="internet.jazz.net", ActivatedAt=DO("2022-08-10"), ExpiresAt=DO("2027-08-10"), Notes="Jazz primary SIM — CalAmp LMU-3030. Gwadar CPEC route, limited plan." },
            // ── Atlantic Freight Inc (tenant 8) — AT&T primary, Verizon backup for trucks ─
            new SimCard { Id=DG("sim:sim-va8-001-p"), ShortId="sim-va8-001-p", TenantId=TenantAtlantic, VehicleShortId="va8-001", VehiclePlate="NJ-7841A", Iccid="89014103080800001", Msisdn="+1 973 800 0001", Operator="AT&T",    Country="United States", Type="Primary", Status="Active", DataUsedMb=5200, DataPlanMb=10240, Apn="broadband.att.com",  ActivatedAt=DO("2022-04-15"), ExpiresAt=DO("2027-04-15"), Notes="AT&T primary SIM — Samsara VG34 truck." },
            new SimCard { Id=DG("sim:sim-va8-001-b"), ShortId="sim-va8-001-b", TenantId=TenantAtlantic, VehicleShortId="va8-001", VehiclePlate="NJ-7841A", Iccid="89014103080800101", Msisdn="+1 973 800 0101", Operator="Verizon", Country="United States", Type="Backup",  Status="Active", DataUsedMb=120,  DataPlanMb=2048,  Apn="vzwinternet",        ActivatedAt=DO("2022-04-15"), ExpiresAt=DO("2027-04-15"), Notes="Verizon backup SIM — truck failover." },
            new SimCard { Id=DG("sim:sim-va8-002-p"), ShortId="sim-va8-002-p", TenantId=TenantAtlantic, VehicleShortId="va8-002", VehiclePlate="NJ-7842B", Iccid="89014103080800002", Msisdn="+1 973 800 0002", Operator="AT&T",    Country="United States", Type="Primary", Status="Active", DataUsedMb=6800, DataPlanMb=10240, Apn="broadband.att.com",  ActivatedAt=DO("2021-06-25"), ExpiresAt=DO("2026-06-25"), Notes="AT&T primary SIM — Cascadia truck." },
            new SimCard { Id=DG("sim:sim-va8-002-b"), ShortId="sim-va8-002-b", TenantId=TenantAtlantic, VehicleShortId="va8-002", VehiclePlate="NJ-7842B", Iccid="89014103080800102", Msisdn="+1 973 800 0102", Operator="Verizon", Country="United States", Type="Backup",  Status="Active", DataUsedMb=88,   DataPlanMb=2048,  Apn="vzwinternet",        ActivatedAt=DO("2021-06-25"), ExpiresAt=DO("2026-06-25"), Notes="Verizon backup SIM." },
            new SimCard { Id=DG("sim:sim-va8-003-p"), ShortId="sim-va8-003-p", TenantId=TenantAtlantic, VehicleShortId="va8-003", VehiclePlate="NJ-7843C", Iccid="89014103080800003", Msisdn="+1 973 800 0003", Operator="AT&T",    Country="United States", Type="Primary", Status="Active", DataUsedMb=2100, DataPlanMb=5120,  Apn="broadband.att.com",  ActivatedAt=DO("2023-02-20"), ExpiresAt=DO("2027-02-20"), Notes="AT&T primary SIM — Transit van." },
            new SimCard { Id=DG("sim:sim-va8-004-p"), ShortId="sim-va8-004-p", TenantId=TenantAtlantic, VehicleShortId="va8-004", VehiclePlate="NJ-7844D", Iccid="89014103080800004", Msisdn="+1 973 800 0004", Operator="AT&T",    Country="United States", Type="Primary", Status="Active", DataUsedMb=4100, DataPlanMb=10240, Apn="broadband.att.com",  ActivatedAt=DO("2020-10-05"), ExpiresAt=DO("2025-10-05"), Notes="AT&T primary SIM — Peterbilt maintenance." },
            new SimCard { Id=DG("sim:sim-va8-004-b"), ShortId="sim-va8-004-b", TenantId=TenantAtlantic, VehicleShortId="va8-004", VehiclePlate="NJ-7844D", Iccid="89014103080800104", Msisdn="+1 973 800 0104", Operator="Verizon", Country="United States", Type="Backup",  Status="Active", DataUsedMb=55,   DataPlanMb=2048,  Apn="vzwinternet",        ActivatedAt=DO("2020-10-05"), ExpiresAt=DO("2025-10-05"), Notes="Verizon backup SIM — truck." },
            new SimCard { Id=DG("sim:sim-va8-005-p"), ShortId="sim-va8-005-p", TenantId=TenantAtlantic, VehicleShortId="va8-005", VehiclePlate="NJ-7845E", Iccid="89014103080800005", Msisdn="+1 973 800 0005", Operator="AT&T",    Country="United States", Type="Primary", Status="Active", DataUsedMb=1800, DataPlanMb=5120,  Apn="broadband.att.com",  ActivatedAt=DO("2022-07-25"), ExpiresAt=DO("2027-07-25"), Notes="AT&T primary SIM — ProMaster van." },
            new SimCard { Id=DG("sim:sim-va8-006-p"), ShortId="sim-va8-006-p", TenantId=TenantAtlantic, VehicleShortId="va8-006", VehiclePlate="NJ-7846F", Iccid="89014103080800006", Msisdn="+1 973 800 0006", Operator="AT&T",    Country="United States", Type="Primary", Status="Active", DataUsedMb=5900, DataPlanMb=10240, Apn="broadband.att.com",  ActivatedAt=DO("2021-09-20"), ExpiresAt=DO("2026-09-20"), Notes="AT&T primary SIM — Kenworth T680." },
            new SimCard { Id=DG("sim:sim-va8-006-b"), ShortId="sim-va8-006-b", TenantId=TenantAtlantic, VehicleShortId="va8-006", VehiclePlate="NJ-7846F", Iccid="89014103080800106", Msisdn="+1 973 800 0106", Operator="Verizon", Country="United States", Type="Backup",  Status="Active", DataUsedMb=95,   DataPlanMb=2048,  Apn="vzwinternet",        ActivatedAt=DO("2021-09-20"), ExpiresAt=DO("2026-09-20"), Notes="Verizon backup SIM." },
            new SimCard { Id=DG("sim:sim-va8-007-p"), ShortId="sim-va8-007-p", TenantId=TenantAtlantic, VehicleShortId="va8-007", VehiclePlate="NJ-7847G", Iccid="89014103080800007", Msisdn="+1 973 800 0007", Operator="AT&T",    Country="United States", Type="Primary", Status="Active", DataUsedMb=3400, DataPlanMb=5120,  Apn="broadband.att.com",  ActivatedAt=DO("2023-05-15"), ExpiresAt=DO("2027-05-15"), Notes="AT&T primary SIM — Sprinter van offline." },
            new SimCard { Id=DG("sim:sim-va8-008-p"), ShortId="sim-va8-008-p", TenantId=TenantAtlantic, VehicleShortId="va8-008", VehiclePlate="NJ-7848H", Iccid="89014103080800008", Msisdn="+1 973 800 0008", Operator="AT&T",    Country="United States", Type="Primary", Status="Active", DataUsedMb=4700, DataPlanMb=10240, Apn="broadband.att.com",  ActivatedAt=DO("2022-06-10"), ExpiresAt=DO("2027-06-10"), Notes="AT&T primary SIM — International LT truck." },
            new SimCard { Id=DG("sim:sim-va8-008-b"), ShortId="sim-va8-008-b", TenantId=TenantAtlantic, VehicleShortId="va8-008", VehiclePlate="NJ-7848H", Iccid="89014103080800108", Msisdn="+1 973 800 0108", Operator="Verizon", Country="United States", Type="Backup",  Status="Active", DataUsedMb=110,  DataPlanMb=2048,  Apn="vzwinternet",        ActivatedAt=DO("2022-06-10"), ExpiresAt=DO("2027-06-10"), Notes="Verizon backup SIM." },
            // ── Meridian Logistics (tenant 9) — T-Mobile US primary ─────────────
            new SimCard { Id=DG("sim:sim-vm9-001-p"), ShortId="sim-vm9-001-p", TenantId=TenantMeridian, VehicleShortId="vm9-001", VehiclePlate="TX-MLG-001", Iccid="89014103090900001", Msisdn="+1 713 900 0001", Operator="T-Mobile US", Country="United States", Type="Primary", Status="Active", DataUsedMb=5800, DataPlanMb=10240, Apn="fast.t-mobile.com", ActivatedAt=DO("2022-03-15"), ExpiresAt=DO("2027-03-15"), Notes="T-Mobile US primary SIM — Kenworth T880." },
            new SimCard { Id=DG("sim:sim-vm9-002-p"), ShortId="sim-vm9-002-p", TenantId=TenantMeridian, VehicleShortId="vm9-002", VehiclePlate="TX-MLG-002", Iccid="89014103090900002", Msisdn="+1 713 900 0002", Operator="T-Mobile US", Country="United States", Type="Primary", Status="Active", DataUsedMb=4200, DataPlanMb=10240, Apn="fast.t-mobile.com", ActivatedAt=DO("2021-08-25"), ExpiresAt=DO("2026-08-25"), Notes="T-Mobile US primary SIM — Freightliner M2." },
            new SimCard { Id=DG("sim:sim-vm9-003-p"), ShortId="sim-vm9-003-p", TenantId=TenantMeridian, VehicleShortId="vm9-003", VehiclePlate="TX-MLG-003", Iccid="89014103090900003", Msisdn="+1 713 900 0003", Operator="T-Mobile US", Country="United States", Type="Primary", Status="Active", DataUsedMb=2400, DataPlanMb=10240, Apn="fast.t-mobile.com", ActivatedAt=DO("2023-03-20"), ExpiresAt=DO("2027-03-20"), Notes="T-Mobile US primary SIM — Transit 350 van." },
            new SimCard { Id=DG("sim:sim-vm9-004-p"), ShortId="sim-vm9-004-p", TenantId=TenantMeridian, VehicleShortId="vm9-004", VehiclePlate="TX-MLG-004", Iccid="89014103090900004", Msisdn="+1 713 900 0004", Operator="T-Mobile US", Country="United States", Type="Primary", Status="Active", DataUsedMb=3100, DataPlanMb=10240, Apn="fast.t-mobile.com", ActivatedAt=DO("2020-11-10"), ExpiresAt=DO("2025-11-10"), Notes="T-Mobile US primary SIM — Peterbilt maintenance." },
            new SimCard { Id=DG("sim:sim-vm9-005-p"), ShortId="sim-vm9-005-p", TenantId=TenantMeridian, VehicleShortId="vm9-005", VehiclePlate="TX-MLG-005", Iccid="89014103090900005", Msisdn="+1 713 900 0005", Operator="T-Mobile US", Country="United States", Type="Primary", Status="Active", DataUsedMb=2000, DataPlanMb=10240, Apn="fast.t-mobile.com", ActivatedAt=DO("2022-09-15"), ExpiresAt=DO("2027-09-15"), Notes="T-Mobile US primary SIM — ProMaster 2500." },
            new SimCard { Id=DG("sim:sim-vm9-006-p"), ShortId="sim-vm9-006-p", TenantId=TenantMeridian, VehicleShortId="vm9-006", VehiclePlate="TX-MLG-006", Iccid="89014103090900006", Msisdn="+1 713 900 0006", Operator="T-Mobile US", Country="United States", Type="Primary", Status="Active", DataUsedMb=5500, DataPlanMb=10240, Apn="fast.t-mobile.com", ActivatedAt=DO("2021-05-25"), ExpiresAt=DO("2026-05-25"), Notes="T-Mobile US primary SIM — Mack Anthem offline." },
            // ── BritFleet Solutions (tenant 10) — Vodafone UK primary, EE backup for trucks ─
            new SimCard { Id=DG("sim:sim-vb10-001-p"), ShortId="sim-vb10-001-p", TenantId=TenantBritfleet, VehicleShortId="vb10-001", VehiclePlate="LK72 ABF", Iccid="89440404101000001", Msisdn="+44 7700 100001", Operator="Vodafone UK", Country="United Kingdom", Type="Primary", Status="Active", DataUsedMb=5100, DataPlanMb=10240, Apn="internet", ActivatedAt=DO("2022-09-20"), ExpiresAt=DO("2027-09-20"), Notes="Vodafone UK primary SIM — Actros 2645 truck." },
            new SimCard { Id=DG("sim:sim-vb10-001-b"), ShortId="sim-vb10-001-b", TenantId=TenantBritfleet, VehicleShortId="vb10-001", VehiclePlate="LK72 ABF", Iccid="89440404101000101", Msisdn="+44 7700 100101", Operator="EE",          Country="United Kingdom", Type="Backup",  Status="Active", DataUsedMb=95,   DataPlanMb=2048,  Apn="everywhere",   ActivatedAt=DO("2022-09-20"), ExpiresAt=DO("2027-09-20"), Notes="EE backup SIM — truck failover." },
            new SimCard { Id=DG("sim:sim-vb10-002-p"), ShortId="sim-vb10-002-p", TenantId=TenantBritfleet, VehicleShortId="vb10-002", VehiclePlate="LK71 ABF", Iccid="89440404101000002", Msisdn="+44 7700 100002", Operator="Vodafone UK", Country="United Kingdom", Type="Primary", Status="Active", DataUsedMb=6200, DataPlanMb=10240, Apn="internet", ActivatedAt=DO("2021-11-15"), ExpiresAt=DO("2026-11-15"), Notes="Vodafone UK primary SIM — Volvo FH16 truck." },
            new SimCard { Id=DG("sim:sim-vb10-002-b"), ShortId="sim-vb10-002-b", TenantId=TenantBritfleet, VehicleShortId="vb10-002", VehiclePlate="LK71 ABF", Iccid="89440404101000102", Msisdn="+44 7700 100102", Operator="EE",          Country="United Kingdom", Type="Backup",  Status="Active", DataUsedMb=78,   DataPlanMb=2048,  Apn="everywhere",   ActivatedAt=DO("2021-11-15"), ExpiresAt=DO("2026-11-15"), Notes="EE backup SIM." },
            new SimCard { Id=DG("sim:sim-vb10-003-p"), ShortId="sim-vb10-003-p", TenantId=TenantBritfleet, VehicleShortId="vb10-003", VehiclePlate="LK73 ABF", Iccid="89440404101000003", Msisdn="+44 7700 100003", Operator="Vodafone UK", Country="United Kingdom", Type="Primary", Status="Active", DataUsedMb=3200, DataPlanMb=5120,  Apn="internet", ActivatedAt=DO("2023-03-25"), ExpiresAt=DO("2027-03-25"), Notes="Vodafone UK primary SIM — Transit Custom van." },
            new SimCard { Id=DG("sim:sim-vb10-004-p"), ShortId="sim-vb10-004-p", TenantId=TenantBritfleet, VehicleShortId="vb10-004", VehiclePlate="LK70 ABF", Iccid="89440404101000004", Msisdn="+44 7700 100004", Operator="Vodafone UK", Country="United Kingdom", Type="Primary", Status="Active", DataUsedMb=4800, DataPlanMb=10240, Apn="internet", ActivatedAt=DO("2020-10-10"), ExpiresAt=DO("2025-10-10"), Notes="Vodafone UK primary SIM — DAF XF maintenance." },
            new SimCard { Id=DG("sim:sim-vb10-004-b"), ShortId="sim-vb10-004-b", TenantId=TenantBritfleet, VehicleShortId="vb10-004", VehiclePlate="LK70 ABF", Iccid="89440404101000104", Msisdn="+44 7700 100104", Operator="EE",          Country="United Kingdom", Type="Backup",  Status="Active", DataUsedMb=42,   DataPlanMb=2048,  Apn="everywhere",   ActivatedAt=DO("2020-10-10"), ExpiresAt=DO("2025-10-10"), Notes="EE backup SIM — truck." },
            new SimCard { Id=DG("sim:sim-vb10-005-p"), ShortId="sim-vb10-005-p", TenantId=TenantBritfleet, VehicleShortId="vb10-005", VehiclePlate="LK72 CBF", Iccid="89440404101000005", Msisdn="+44 7700 100005", Operator="Vodafone UK", Country="United Kingdom", Type="Primary", Status="Active", DataUsedMb=2900, DataPlanMb=5120,  Apn="internet", ActivatedAt=DO("2022-07-15"), ExpiresAt=DO("2027-07-15"), Notes="Vodafone UK primary SIM — Renault Master van." },
            new SimCard { Id=DG("sim:sim-vb10-006-p"), ShortId="sim-vb10-006-p", TenantId=TenantBritfleet, VehicleShortId="vb10-006", VehiclePlate="LK71 CBF", Iccid="89440404101000006", Msisdn="+44 7700 100006", Operator="Vodafone UK", Country="United Kingdom", Type="Primary", Status="Active", DataUsedMb=5500, DataPlanMb=10240, Apn="internet", ActivatedAt=DO("2021-05-20"), ExpiresAt=DO("2026-05-20"), Notes="Vodafone UK primary SIM — Scania R500 truck." },
            new SimCard { Id=DG("sim:sim-vb10-006-b"), ShortId="sim-vb10-006-b", TenantId=TenantBritfleet, VehicleShortId="vb10-006", VehiclePlate="LK71 CBF", Iccid="89440404101000106", Msisdn="+44 7700 100106", Operator="EE",          Country="United Kingdom", Type="Backup",  Status="Active", DataUsedMb=88,   DataPlanMb=2048,  Apn="everywhere",   ActivatedAt=DO("2021-05-20"), ExpiresAt=DO("2026-05-20"), Notes="EE backup SIM — Scania truck." },
            new SimCard { Id=DG("sim:sim-vb10-007-p"), ShortId="sim-vb10-007-p", TenantId=TenantBritfleet, VehicleShortId="vb10-007", VehiclePlate="LK73 CBF", Iccid="89440404101000007", Msisdn="+44 7700 100007", Operator="Vodafone UK", Country="United Kingdom", Type="Primary", Status="Active", DataUsedMb=1800, DataPlanMb=5120,  Apn="internet", ActivatedAt=DO("2023-06-05"), ExpiresAt=DO("2027-06-05"), Notes="Vodafone UK primary SIM — Vauxhall Vivaro van offline." },
            new SimCard { Id=DG("sim:sim-vb10-008-p"), ShortId="sim-vb10-008-p", TenantId=TenantBritfleet, VehicleShortId="vb10-008", VehiclePlate="LK72 DBF", Iccid="89440404101000008", Msisdn="+44 7700 100008", Operator="Vodafone UK", Country="United Kingdom", Type="Primary", Status="Active", DataUsedMb=4400, DataPlanMb=10240, Apn="internet", ActivatedAt=DO("2022-12-05"), ExpiresAt=DO("2027-12-05"), Notes="Vodafone UK primary SIM — MAN TGX truck." },
            new SimCard { Id=DG("sim:sim-vb10-008-b"), ShortId="sim-vb10-008-b", TenantId=TenantBritfleet, VehicleShortId="vb10-008", VehiclePlate="LK72 DBF", Iccid="89440404101000108", Msisdn="+44 7700 100108", Operator="EE",          Country="United Kingdom", Type="Backup",  Status="Active", DataUsedMb=66,   DataPlanMb=2048,  Apn="everywhere",   ActivatedAt=DO("2022-12-05"), ExpiresAt=DO("2027-12-05"), Notes="EE backup SIM — MAN truck." }
        );
    }

    // ── Trips ─────────────────────────────────────────────────────────────────
    private static void SeedTrips(ModelBuilder mb)
    {
        const string R_T1 = """[{"lat":-1.32,"lng":36.88,"time":"07:14","speed":0,"event":"Departed Nairobi ICD"},{"lat":-1.4631,"lng":36.9753,"time":"07:35","speed":72,"event":null},{"lat":-1.62,"lng":37.14,"time":"08:05","speed":80,"event":null},{"lat":-1.95,"lng":37.5,"time":"08:55","speed":96,"event":"⚠ Speed alert — 96 km/h"},{"lat":-2.25,"lng":37.85,"time":"09:40","speed":74,"event":null},{"lat":-2.6824,"lng":38.1706,"time":"10:30","speed":68,"event":"Mtito Andei rest stop"},{"lat":-3.03,"lng":38.42,"time":"11:20","speed":75,"event":null},{"lat":-3.3957,"lng":38.5591,"time":"12:05","speed":70,"event":"Voi checkpoint"},{"lat":-3.75,"lng":39.25,"time":"13:10","speed":65,"event":null},{"lat":-4.0435,"lng":39.6682,"time":"13:49","speed":0,"event":"Arrived Mombasa Port"}]""";
        const string R_T2 = """[{"lat":-1.2921,"lng":36.8219,"time":"08:00","speed":0,"event":"Departed Nairobi HQ"},{"lat":-1.24,"lng":36.78,"time":"08:14","speed":52,"event":null},{"lat":-1.11,"lng":36.65,"time":"08:35","speed":65,"event":"Limuru"},{"lat":-0.92,"lng":36.52,"time":"09:00","speed":72,"event":null},{"lat":-0.7172,"lng":36.4311,"time":"09:22","speed":68,"event":"Naivasha fuel stop"},{"lat":-0.4934,"lng":36.323,"time":"09:50","speed":75,"event":null},{"lat":-0.3031,"lng":36.08,"time":"10:12","speed":0,"event":"Arrived Nakuru Depot"}]""";
        const string R_T3 = """[{"lat":-0.3031,"lng":36.08,"time":"06:30","speed":0,"event":"Departed Nakuru Depot"},{"lat":-0.4934,"lng":36.323,"time":"06:52","speed":72,"event":null},{"lat":-0.7172,"lng":36.4311,"time":"07:15","speed":70,"event":"Naivasha"},{"lat":-0.92,"lng":36.52,"time":"07:40","speed":74,"event":null},{"lat":-1.11,"lng":36.65,"time":"08:05","speed":65,"event":"Limuru"},{"lat":-1.24,"lng":36.78,"time":"08:28","speed":58,"event":null},{"lat":-1.2921,"lng":36.8219,"time":"08:48","speed":0,"event":"Arrived Nairobi HQ"}]""";
        const string R_T4 = """[{"lat":-1.2921,"lng":36.8219,"time":"09:10","speed":0,"event":"Departed Nairobi HQ"},{"lat":-1.23,"lng":36.86,"time":"09:22","speed":38,"event":null},{"lat":-1.17,"lng":36.9,"time":"09:38","speed":55,"event":"Githurai junction"},{"lat":-1.12,"lng":36.94,"time":"09:50","speed":62,"event":null},{"lat":-1.07,"lng":37.01,"time":"10:04","speed":58,"event":null},{"lat":-1.0332,"lng":37.069,"time":"10:12","speed":0,"event":"Arrived Thika Depot"}]""";
        const string R_T5 = """[{"lat":-1.0332,"lng":37.069,"time":"07:55","speed":0,"event":"Departed Thika Depot"},{"lat":-1.07,"lng":37.01,"time":"08:06","speed":55,"event":null},{"lat":-1.14,"lng":36.95,"time":"08:19","speed":60,"event":null},{"lat":-1.25,"lng":36.92,"time":"08:32","speed":52,"event":"Eastern Bypass"},{"lat":-1.29,"lng":36.89,"time":"08:44","speed":46,"event":null},{"lat":-1.32,"lng":36.88,"time":"08:53","speed":0,"event":"Arrived Nairobi ICD"}]""";
        const string R_V2_T1 = """[{"lat":-1.2921,"lng":36.8219,"time":"06:00","speed":0,"event":"Departed Nairobi HQ"},{"lat":-1.11,"lng":36.65,"time":"06:28","speed":62,"event":"Limuru"},{"lat":-0.7172,"lng":36.4311,"time":"07:15","speed":70,"event":"Naivasha"},{"lat":-0.3031,"lng":36.08,"time":"08:10","speed":74,"event":"Nakuru — fuel stop"},{"lat":-0.1,"lng":35.78,"time":"09:05","speed":68,"event":null},{"lat":0.1,"lng":35.28,"time":"10:00","speed":72,"event":"Kericho"},{"lat":0.1,"lng":34.85,"time":"10:55","speed":65,"event":null},{"lat":-0.1022,"lng":34.7617,"time":"11:30","speed":0,"event":"Arrived Kisumu Port"}]""";
        const string R_V2_T2 = """[{"lat":-1.2921,"lng":36.8219,"time":"07:30","speed":0,"event":"Departed Nairobi HQ"},{"lat":-0.7172,"lng":36.4311,"time":"08:45","speed":71,"event":"Naivasha"},{"lat":-0.3031,"lng":36.08,"time":"09:30","speed":74,"event":"Nakuru"},{"lat":0.09,"lng":35.75,"time":"10:20","speed":78,"event":null},{"lat":0.52,"lng":35.27,"time":"11:15","speed":70,"event":null},{"lat":0.5203,"lng":35.2699,"time":"11:45","speed":0,"event":"Arrived Eldoret Depot"}]""";
        const string R_V4_T1 = """[{"lat":-1.32,"lng":36.88,"time":"08:00","speed":0,"event":"Departed Nairobi ICD"},{"lat":-1.305,"lng":36.87,"time":"08:10","speed":38,"event":null},{"lat":-1.2921,"lng":36.85,"time":"08:22","speed":44,"event":"Mombasa Rd"},{"lat":-1.285,"lng":36.83,"time":"08:31","speed":32,"event":null},{"lat":-1.2821,"lng":36.8172,"time":"08:38","speed":0,"event":"Arrived Nairobi CBD"}]""";
        const string R_V4_T2 = """[{"lat":-1.2821,"lng":36.8172,"time":"14:05","speed":0,"event":"Departed Nairobi CBD"},{"lat":-1.27,"lng":36.81,"time":"14:16","speed":28,"event":null},{"lat":-1.263,"lng":36.8,"time":"14:25","speed":35,"event":"Uhuru Highway"},{"lat":-1.262,"lng":36.79,"time":"14:33","speed":30,"event":null},{"lat":-1.2676,"lng":36.7915,"time":"14:40","speed":0,"event":"Arrived Westlands"}]""";

        mb.Entity<Trip>().HasData(
            new Trip { Id=DG("trip:t1"),    ShortId="t1",    TenantId=TenantAcme, VehicleShortId="v1", Date="2026-05-28 07:14", DateIso="2026-05-28", From="Nairobi ICD",    To="Mombasa Port",   DistanceKm=490, DurationMin=395, AvgSpeed=74, MaxSpeed=96, FuelUsedL=68,  Status="In Progress", RouteJson=R_T1 },
            new Trip { Id=DG("trip:t2"),    ShortId="t2",    TenantId=TenantAcme, VehicleShortId="v1", Date="2026-05-27 08:00", DateIso="2026-05-27", From="Nairobi HQ",     To="Nakuru Depot",   DistanceKm=158, DurationMin=132, AvgSpeed=72, MaxSpeed=94, FuelUsedL=22,  Status="Completed",   RouteJson=R_T2 },
            new Trip { Id=DG("trip:t3"),    ShortId="t3",    TenantId=TenantAcme, VehicleShortId="v1", Date="2026-05-26 06:30", DateIso="2026-05-26", From="Nakuru Depot",   To="Nairobi HQ",     DistanceKm=160, DurationMin=138, AvgSpeed=70, MaxSpeed=90, FuelUsedL=23,  Status="Completed",   RouteJson=R_T3 },
            new Trip { Id=DG("trip:t4"),    ShortId="t4",    TenantId=TenantAcme, VehicleShortId="v1", Date="2026-05-25 09:10", DateIso="2026-05-25", From="Nairobi HQ",     To="Thika Depot",    DistanceKm=48,  DurationMin=62,  AvgSpeed=46, MaxSpeed=78, FuelUsedL=7.5, Status="Completed",   RouteJson=R_T4 },
            new Trip { Id=DG("trip:t5"),    ShortId="t5",    TenantId=TenantAcme, VehicleShortId="v1", Date="2026-05-24 07:55", DateIso="2026-05-24", From="Thika Depot",    To="Nairobi ICD",    DistanceKm=52,  DurationMin=58,  AvgSpeed=54, MaxSpeed=82, FuelUsedL=8,   Status="Completed",   RouteJson=R_T5 },
            new Trip { Id=DG("trip:v2-t1"), ShortId="v2-t1", TenantId=TenantAcme, VehicleShortId="v2", Date="2026-05-28 06:00", DateIso="2026-05-28", From="Nairobi HQ",     To="Kisumu Port",    DistanceKm=350, DurationMin=330, AvgSpeed=68, MaxSpeed=88, FuelUsedL=48,  Status="In Progress", RouteJson=R_V2_T1 },
            new Trip { Id=DG("trip:v2-t2"), ShortId="v2-t2", TenantId=TenantAcme, VehicleShortId="v2", Date="2026-05-26 07:30", DateIso="2026-05-26", From="Nairobi HQ",     To="Eldoret Depot",  DistanceKm=310, DurationMin=255, AvgSpeed=73, MaxSpeed=89, FuelUsedL=42,  Status="Completed",   RouteJson=R_V2_T2 },
            new Trip { Id=DG("trip:v4-t1"), ShortId="v4-t1", TenantId=TenantAcme, VehicleShortId="v4", Date="2026-05-28 08:00", DateIso="2026-05-28", From="Nairobi ICD",    To="Nairobi CBD",    DistanceKm=18,  DurationMin=38,  AvgSpeed=32, MaxSpeed=44, FuelUsedL=2.8, Status="Completed",   RouteJson=R_V4_T1 },
            new Trip { Id=DG("trip:v4-t2"), ShortId="v4-t2", TenantId=TenantAcme, VehicleShortId="v4", Date="2026-05-28 14:05", DateIso="2026-05-28", From="Nairobi CBD",    To="Westlands",      DistanceKm=8,   DurationMin=35,  AvgSpeed=22, MaxSpeed=35, FuelUsedL=1.2, Status="Completed",   RouteJson=R_V4_T2 }
        );

        // ── Atlantic Freight Inc (tenant 8) trips — NYC/NJ area ─────────────
        const string R_A8_DEMO = """[{"lat":40.7282,"lng":-74.0776,"time":"07:00:00","speed":0,"event":"🔑 Ignition ON — engine warming up","ignition":true},{"lat":40.7282,"lng":-74.0776,"time":"07:00:30","speed":0,"event":null,"ignition":true},{"lat":40.7282,"lng":-74.0776,"time":"07:01:00","speed":0,"event":null,"ignition":true},{"lat":40.7282,"lng":-74.0776,"time":"07:01:30","speed":0,"event":"Pre-trip check complete","ignition":true},{"lat":40.7265,"lng":-74.0822,"time":"07:02:00","speed":14,"event":"Departing Newark Hub","ignition":true},{"lat":40.7241,"lng":-74.0867,"time":"07:02:30","speed":28,"event":null,"ignition":true},{"lat":40.7210,"lng":-74.0912,"time":"07:03:00","speed":36,"event":null,"ignition":true},{"lat":40.7175,"lng":-74.0958,"time":"07:03:30","speed":38,"event":"📍 Geofence EXIT — leaving Newark Depot zone","ignition":true},{"lat":40.7138,"lng":-74.1005,"time":"07:04:00","speed":46,"event":null,"ignition":true},{"lat":40.7093,"lng":-74.1055,"time":"07:04:30","speed":56,"event":null,"ignition":true},{"lat":40.7038,"lng":-74.1110,"time":"07:05:00","speed":65,"event":"NJ Turnpike I-95 South — entering highway","ignition":true},{"lat":40.6975,"lng":-74.1168,"time":"07:05:30","speed":82,"event":null,"ignition":true},{"lat":40.6890,"lng":-74.1255,"time":"07:06:00","speed":96,"event":null,"ignition":true},{"lat":40.6665,"lng":-74.1670,"time":"07:08:00","speed":104,"event":"Steady cruise — I-95 South through Elizabeth","ignition":true},{"lat":40.6290,"lng":-74.2125,"time":"07:11:00","speed":108,"event":null,"ignition":true},{"lat":40.5875,"lng":-74.2510,"time":"07:13:30","speed":148,"event":"⚠ OVERSPEED — 148 km/h on I-95","ignition":true},{"lat":40.5545,"lng":-74.2788,"time":"07:15:30","speed":114,"event":null,"ignition":true},{"lat":40.5180,"lng":-74.3172,"time":"07:18:00","speed":104,"event":"Woodbridge area","ignition":true},{"lat":40.4780,"lng":-74.3620,"time":"07:20:30","speed":100,"event":null,"ignition":true},{"lat":40.4280,"lng":-74.4075,"time":"07:23:00","speed":96,"event":null,"ignition":true},{"lat":40.3780,"lng":-74.4640,"time":"07:25:30","speed":104,"event":"Edison — I-95 mile 87","ignition":true},{"lat":40.3275,"lng":-74.5175,"time":"07:28:00","speed":100,"event":null,"ignition":true},{"lat":40.2775,"lng":-74.5715,"time":"07:30:30","speed":96,"event":"Princeton area — I-95 mile 67","ignition":true},{"lat":40.2480,"lng":-74.6105,"time":"07:33:00","speed":28,"event":"Molly Pitcher Service Area — pulling in","ignition":true},{"lat":40.2462,"lng":-74.6130,"time":"07:33:30","speed":0,"event":"🔑 Ignition OFF — parked at service area","ignition":false},{"lat":40.2462,"lng":-74.6130,"time":"08:03:30","speed":0,"event":"⏱ Idle ping — 30 min parked","ignition":false},{"lat":40.2462,"lng":-74.6130,"time":"08:13:30","speed":0,"event":"🔑 Ignition ON — resuming trip","ignition":true},{"lat":40.2478,"lng":-74.6090,"time":"08:14:00","speed":18,"event":"Departing service area","ignition":true},{"lat":40.2488,"lng":-74.6048,"time":"08:14:30","speed":46,"event":null,"ignition":true},{"lat":40.2495,"lng":-74.6002,"time":"08:15:00","speed":80,"event":"Back on I-95 South","ignition":true},{"lat":40.1975,"lng":-74.6558,"time":"08:18:00","speed":100,"event":null,"ignition":true},{"lat":40.1380,"lng":-74.7148,"time":"08:21:30","speed":96,"event":"Approaching Pennsylvania border","ignition":true},{"lat":40.0792,"lng":-74.7815,"time":"08:25:00","speed":88,"event":"Bristol PA — I-95 crossing Delaware River","ignition":true},{"lat":40.0285,"lng":-74.8618,"time":"08:28:00","speed":84,"event":"📍 Geofence ENTER — Philadelphia metro zone","ignition":true},{"lat":40.0088,"lng":-74.9310,"time":"08:30:30","speed":72,"event":null,"ignition":true},{"lat":40.0005,"lng":-75.0085,"time":"08:33:00","speed":64,"event":null,"ignition":true},{"lat":39.9842,"lng":-75.0822,"time":"08:35:30","speed":55,"event":"Northeast Philadelphia — approaching destination","ignition":true},{"lat":39.9672,"lng":-75.1248,"time":"08:37:30","speed":42,"event":null,"ignition":true},{"lat":39.9580,"lng":-75.1522,"time":"08:39:30","speed":28,"event":null,"ignition":true},{"lat":39.9526,"lng":-75.1672,"time":"08:41:00","speed":0,"event":"Arrived Philadelphia Distribution Center","ignition":true},{"lat":39.9526,"lng":-75.1672,"time":"08:41:30","speed":0,"event":"🔑 Ignition OFF","ignition":false},{"lat":39.9526,"lng":-75.1672,"time":"09:11:30","speed":0,"event":"⏱ Idle ping — 30 min parked","ignition":false},{"lat":39.9526,"lng":-75.1672,"time":"09:41:30","speed":0,"event":"⏱ Idle ping — 60 min parked","ignition":false}]""";

        mb.Entity<Trip>().HasData(
            new Trip { Id=DG("trip:t-a8-demo"), ShortId="t-a8-demo", TenantId=TenantAtlantic, VehicleShortId="va8-001", Date="2026-06-07 07:00", DateIso="2026-06-07", From="Newark Hub, NJ", To="Philadelphia Distribution Center, PA", DistanceKm=110, DurationMin=101, AvgSpeed=76, MaxSpeed=148, FuelUsedL=22, Status="Completed", RouteJson=R_A8_DEMO }
        );

        mb.Entity<Trip>().HasData(
            new Trip { Id=DG("trip:t-a8-001"), ShortId="t-a8-001", TenantId=TenantAtlantic, VehicleShortId="va8-001", Date="2026-06-06 08:00", DateIso="2026-06-06", From="Newark, NJ",      To="JFK Airport, NY",   DistanceKm=34,  DurationMin=58,  AvgSpeed=35, MaxSpeed=68, FuelUsedL=9.2,  Status="Completed",   RouteJson="""[{"lat":40.7282,"lng":-74.0776,"time":"08:00","speed":0,"event":"Departed Newark Hub"},{"lat":40.7145,"lng":-74.0134,"time":"08:12","speed":42,"event":null},{"lat":40.6950,"lng":-73.9840,"time":"08:22","speed":55,"event":"Brooklyn Battery Tunnel"},{"lat":40.6780,"lng":-73.9500,"time":"08:35","speed":62,"event":null},{"lat":40.6501,"lng":-73.9496,"time":"08:44","speed":58,"event":"Brooklyn"},{"lat":40.6400,"lng":-73.9300,"time":"08:52","speed":48,"event":null},{"lat":40.6413,"lng":-73.7781,"time":"09:01","speed":0,"event":"Arrived JFK Terminal 4"}]""" },
            new Trip { Id=DG("trip:t-a8-002"), ShortId="t-a8-002", TenantId=TenantAtlantic, VehicleShortId="va8-002", Date="2026-06-05 07:30", DateIso="2026-06-05", From="Newark, NJ",      To="Manhattan, NY",     DistanceKm=18,  DurationMin=48,  AvgSpeed=22, MaxSpeed=55, FuelUsedL=5.8,  Status="Completed",   RouteJson="""[{"lat":40.7282,"lng":-74.0776,"time":"07:30","speed":0,"event":"Departed Newark Hub"},{"lat":40.7200,"lng":-74.0500,"time":"07:42","speed":38,"event":"NJ Turnpike"},{"lat":40.7350,"lng":-74.0200,"time":"07:53","speed":45,"event":"Holland Tunnel approach"},{"lat":40.7270,"lng":-74.0080,"time":"08:02","speed":28,"event":"Holland Tunnel"},{"lat":40.7282,"lng":-73.9942,"time":"08:11","speed":22,"event":"Manhattan — TriBeCa"},{"lat":40.7480,"lng":-73.9870,"time":"08:18","speed":0,"event":"Arrived Midtown delivery point"}]""" },
            new Trip { Id=DG("trip:t-a8-003"), ShortId="t-a8-003", TenantId=TenantAtlantic, VehicleShortId="va8-008", Date="2026-06-06 05:00", DateIso="2026-06-06", From="Jersey City, NJ", To="Boston, MA",        DistanceKm=360, DurationMin=290, AvgSpeed=74, MaxSpeed=90, FuelUsedL=68.0, Status="In Progress", RouteJson="""[{"lat":40.6892,"lng":-74.0445,"time":"05:00","speed":0,"event":"Departed Jersey City Depot"},{"lat":40.7500,"lng":-73.9800,"time":"05:22","speed":65,"event":"George Washington Bridge"},{"lat":40.9000,"lng":-73.8500,"time":"05:38","speed":72,"event":"I-95 North"},{"lat":41.3500,"lng":-72.9500,"time":"06:40","speed":78,"event":"New Haven, CT"},{"lat":41.7800,"lng":-72.5200,"time":"07:25","speed":82,"event":"Hartford, CT — ⚠ Speed alert"},{"lat":42.0000,"lng":-72.0000,"time":"08:10","speed":75,"event":"Springfield, MA"},{"lat":42.3601,"lng":-71.0589,"time":"09:50","speed":0,"event":"Approaching Boston — ETA 10:10"}]""" },
            new Trip { Id=DG("trip:t-a8-004"), ShortId="t-a8-004", TenantId=TenantAtlantic, VehicleShortId="va8-003", Date="2026-06-05 10:00", DateIso="2026-06-05", From="Midtown, NY",     To="Newark, NJ",        DistanceKm=22,  DurationMin=52,  AvgSpeed=25, MaxSpeed=60, FuelUsedL=6.1,  Status="Completed",   RouteJson="""[{"lat":40.7614,"lng":-73.9776,"time":"10:00","speed":0,"event":"Departed Midtown pickup"},{"lat":40.7480,"lng":-73.9870,"time":"10:08","speed":28,"event":"7th Avenue"},{"lat":40.7300,"lng":-74.0050,"time":"10:18","speed":35,"event":"Hudson River crossing"},{"lat":40.7200,"lng":-74.0300,"time":"10:28","speed":42,"event":"NJ Turnpike on-ramp"},{"lat":40.7282,"lng":-74.0500,"time":"10:38","speed":55,"event":"NJ-95 South"},{"lat":40.7282,"lng":-74.0776,"time":"10:52","speed":0,"event":"Arrived Newark Hub"}]""" }
        );

        // ── Meridian Logistics (tenant 9) trips — Houston TX area ────────────
        mb.Entity<Trip>().HasData(
            new Trip { Id=DG("trip:t-m9-001"), ShortId="t-m9-001", TenantId=TenantMeridian, VehicleShortId="vm9-001", Date="2026-06-06 06:30", DateIso="2026-06-06", From="Houston, TX",  To="Baytown, TX",     DistanceKm=42,  DurationMin=48,  AvgSpeed=52, MaxSpeed=80, FuelUsedL=14.0, Status="Completed",   RouteJson="""[{"lat":29.7604,"lng":-95.3698,"time":"06:30","speed":0,"event":"Departed Houston Hub"},{"lat":29.7500,"lng":-95.2500,"time":"06:42","speed":60,"event":"I-10 East"},{"lat":29.7400,"lng":-95.1500,"time":"06:52","speed":72,"event":"Channelview"},{"lat":29.7400,"lng":-95.0500,"time":"07:02","speed":80,"event":"⚠ Speed alert"},{"lat":29.7350,"lng":-94.9700,"time":"07:10","speed":68,"event":"La Porte junction"},{"lat":29.7355,"lng":-94.9770,"time":"07:18","speed":0,"event":"Arrived Baytown Industrial Park"}]""" },
            new Trip { Id=DG("trip:t-m9-002"), ShortId="t-m9-002", TenantId=TenantMeridian, VehicleShortId="vm9-003", Date="2026-06-06 09:00", DateIso="2026-06-06", From="Houston, TX",  To="Sugar Land, TX",  DistanceKm=48,  DurationMin=55,  AvgSpeed=52, MaxSpeed=75, FuelUsedL=11.8, Status="Completed",   RouteJson="""[{"lat":29.7355,"lng":-95.4140,"time":"09:00","speed":0,"event":"Departed SW Houston depot"},{"lat":29.7200,"lng":-95.4800,"time":"09:12","speed":45,"event":"US-59 South"},{"lat":29.6800,"lng":-95.5000,"time":"09:22","speed":60,"event":"Fort Bend area"},{"lat":29.6200,"lng":-95.6200,"time":"09:35","speed":72,"event":"Sugar Land approach"},{"lat":29.6197,"lng":-95.6349,"time":"09:55","speed":0,"event":"Arrived Sugar Land Warehouse"}]""" },
            new Trip { Id=DG("trip:t-m9-003"), ShortId="t-m9-003", TenantId=TenantMeridian, VehicleShortId="vm9-006", Date="2026-06-04 04:00", DateIso="2026-06-04", From="Houston, TX",  To="Dallas, TX",      DistanceKm=390, DurationMin=255, AvgSpeed=91, MaxSpeed=96, FuelUsedL=82.0, Status="Completed",   RouteJson="""[{"lat":29.9511,"lng":-95.3677,"time":"04:00","speed":0,"event":"Departed North Houston"},{"lat":30.2500,"lng":-95.4500,"time":"04:30","speed":72,"event":"I-45 North"},{"lat":31.0000,"lng":-96.4500,"time":"05:40","speed":85,"event":"Corsicana"},{"lat":31.5000,"lng":-96.9000,"time":"06:25","speed":88,"event":"Waxahachie"},{"lat":32.0000,"lng":-96.9000,"time":"07:00","speed":90,"event":"Grand Prairie — ⚠ Near speed limit"},{"lat":32.7767,"lng":-96.7970,"time":"08:15","speed":0,"event":"Arrived Dallas Distribution Center"}]""" }
        );

        // ── BritFleet Solutions (tenant 10) trips — UK routes ────────────────
        mb.Entity<Trip>().HasData(
            new Trip { Id=DG("trip:t-b10-001"), ShortId="t-b10-001", TenantId=TenantBritfleet, VehicleShortId="vb10-001", Date="2026-06-06 06:00", DateIso="2026-06-06", From="London",       To="Birmingham",     DistanceKm=190, DurationMin=145, AvgSpeed=79, MaxSpeed=90, FuelUsedL=32.0, Status="Completed",   RouteJson="""[{"lat":51.5074,"lng":-0.1278,"time":"06:00","speed":0,"event":"Departed London Depot"},{"lat":51.5500,"lng":-0.2500,"time":"06:18","speed":55,"event":"A40 West"},{"lat":51.5800,"lng":-0.4800,"time":"06:35","speed":72,"event":"M40 Junction 1"},{"lat":51.7500,"lng":-1.2500,"time":"07:20","speed":85,"event":"Oxford services"},{"lat":52.0000,"lng":-1.5000,"time":"08:00","speed":88,"event":"Banbury"},{"lat":52.2800,"lng":-1.7500,"time":"08:38","speed":82,"event":"M40 approach Birmingham"},{"lat":52.4862,"lng":-1.8904,"time":"09:05","speed":0,"event":"Arrived Birmingham Freight Terminal"}]""" },
            new Trip { Id=DG("trip:t-b10-002"), ShortId="t-b10-002", TenantId=TenantBritfleet, VehicleShortId="vb10-006", Date="2026-06-06 07:00", DateIso="2026-06-06", From="Manchester",   To="Leeds",          DistanceKm=68,  DurationMin=72,  AvgSpeed=57, MaxSpeed=80, FuelUsedL=14.2, Status="Completed",   RouteJson="""[{"lat":53.4808,"lng":-2.2426,"time":"07:00","speed":0,"event":"Departed Manchester Depot"},{"lat":53.5000,"lng":-2.1000,"time":"07:12","speed":52,"event":"M62 East"},{"lat":53.7000,"lng":-1.8000,"time":"07:38","speed":72,"event":"Rochdale"},{"lat":53.7500,"lng":-1.6000,"time":"07:52","speed":78,"event":"Brighouse"},{"lat":53.8008,"lng":-1.5491,"time":"08:12","speed":0,"event":"Arrived Leeds Distribution Park"}]""" },
            new Trip { Id=DG("trip:t-b10-003"), ShortId="t-b10-003", TenantId=TenantBritfleet, VehicleShortId="vb10-003", Date="2026-06-06 09:00", DateIso="2026-06-06", From="London City",  To="Canary Wharf",   DistanceKm=8,   DurationMin=28,  AvgSpeed=17, MaxSpeed=40, FuelUsedL=2.1,  Status="Completed",   RouteJson="""[{"lat":51.5033,"lng":-0.0875,"time":"09:00","speed":0,"event":"Departed London City depot"},{"lat":51.5050,"lng":-0.0600,"time":"09:08","speed":28,"event":"A1203 East"},{"lat":51.5080,"lng":-0.0300,"time":"09:16","speed":35,"event":"Limehouse"},{"lat":51.5050,"lng":-0.0100,"time":"09:22","speed":30,"event":"Approach Canary Wharf"},{"lat":51.5054,"lng":-0.0235,"time":"09:28","speed":0,"event":"Arrived Canary Wharf delivery"}]""" },
            new Trip { Id=DG("trip:t-b10-004"), ShortId="t-b10-004", TenantId=TenantBritfleet, VehicleShortId="vb10-005", Date="2026-06-05 07:30", DateIso="2026-06-05", From="Birmingham",   To="Bristol",        DistanceKm=155, DurationMin=110, AvgSpeed=84, MaxSpeed=90, FuelUsedL=22.5, Status="Completed",   RouteJson="""[{"lat":52.4862,"lng":-1.8904,"time":"07:30","speed":0,"event":"Departed Birmingham Freight Terminal"},{"lat":52.4000,"lng":-2.0500,"time":"07:45","speed":62,"event":"M5 South"},{"lat":52.1000,"lng":-2.1500,"time":"08:15","speed":82,"event":"Worcester"},{"lat":51.8500,"lng":-2.2500,"time":"08:45","speed":88,"event":"Cheltenham"},{"lat":51.6500,"lng":-2.4000,"time":"09:05","speed":85,"event":"M5 approaching Bristol"},{"lat":51.4545,"lng":-2.5879,"time":"09:20","speed":0,"event":"Arrived Bristol Logistics Park"}]""" }
        );
    }

    // ── VehicleSubscriptions ──────────────────────────────────────────────────
    private static void SeedVehicleSubscriptions(ModelBuilder mb)
    {
        mb.Entity<VehicleSubscription>().HasData(
            // ── ACME Logistics (tenant 1) ────────────────────────────────────────
            new VehicleSubscription { Id=DG("sub:v1"),      TenantId=TenantAcme,  VehicleShortId="v1",      Plan="Professional", StartDate=DO("2025-01-01"), ExpiryDate=DO("2026-12-31"), AutoRenew=true,  ContactEmail="fleet@acmeholdings.co.ke", SmsNumbersJson="""["+254722110001"]""" },
            new VehicleSubscription { Id=DG("sub:v2"),      TenantId=TenantAcme,  VehicleShortId="v2",      Plan="Enterprise",   StartDate=DO("2025-04-01"), ExpiryDate=DO("2027-03-31"), AutoRenew=true,  ContactEmail="fleet@acmeholdings.co.ke", SmsNumbersJson="""["+254722110001","+254733220002"]""" },
            new VehicleSubscription { Id=DG("sub:v3"),      TenantId=TenantAcme,  VehicleShortId="v3",      Plan="Basic",        StartDate=DO("2025-06-15"), ExpiryDate=DO("2026-06-14"), AutoRenew=false, ContactEmail="solarroute@ops.co.ke",     SmsNumbersJson="""["+254700300004"]""" },
            new VehicleSubscription { Id=DG("sub:v4"),      TenantId=TenantAcme,  VehicleShortId="v4",      Plan="Starter",      StartDate=DO("2025-05-01"), ExpiryDate=DO("2026-04-30"), AutoRenew=false, ContactEmail="fleet@transafrica.co.ke",  SmsNumbersJson="[]" },
            new VehicleSubscription { Id=DG("sub:v5"),      TenantId=TenantAcme,  VehicleShortId="v5",      Plan="Professional", StartDate=DO("2025-12-01"), ExpiryDate=DO("2026-11-30"), AutoRenew=true,  ContactEmail="fleet@acmeholdings.co.ke", SmsNumbersJson="""["+254722110001"]""" },
            new VehicleSubscription { Id=DG("sub:v6"),      TenantId=TenantAcme,  VehicleShortId="v6",      Plan="Basic",        StartDate=DO("2025-05-11"), ExpiryDate=DO("2026-05-10"), AutoRenew=false, ContactEmail="fleet@acmeholdings.co.ke", SmsNumbersJson="[]" },
            new VehicleSubscription { Id=DG("sub:v-ind-001"), TenantId=TenantAcme, VehicleShortId="v-ind-001", Plan="Starter", CustomPlanId="cp-personal-tracker", StartDate=DO("2026-01-15"), ExpiryDate=DO("2027-01-14"), AutoRenew=true, ContactEmail="james.kariuki@gmail.com", SmsNumbersJson="""["+254722456789"]""" },
            // ── SwiftCargo Ltd (tenant 2) ─────────────────────────────────────
            new VehicleSubscription { Id=DG("sub:v7"),      TenantId=TenantSwift, VehicleShortId="v7",      Plan="Enterprise",   StartDate=DO("2026-01-01"), ExpiryDate=DO("2026-12-31"), AutoRenew=true,  ContactEmail="billing@swiftcargo.co.ke", SmsNumbersJson="""["+254711400001"]""" },
            new VehicleSubscription { Id=DG("sub:v8"),      TenantId=TenantSwift, VehicleShortId="v8",      Plan="Basic",        StartDate=DO("2025-06-06"), ExpiryDate=DO("2026-06-05"), AutoRenew=false, ContactEmail="billing@swiftcargo.co.ke", SmsNumbersJson="[]" },
            new VehicleSubscription { Id=DG("sub:v9"),      TenantId=TenantSwift, VehicleShortId="v9",      Plan="Professional", StartDate=DO("2026-01-01"), ExpiryDate=DO("2026-12-31"), AutoRenew=true,  ContactEmail="billing@swiftcargo.co.ke", SmsNumbersJson="""["+254711400002"]""" },
            // ── NairobiExpress (tenant 3) ─────────────────────────────────────
            new VehicleSubscription { Id=DG("sub:v10"),     TenantId=TenantNex,   VehicleShortId="v10",     Plan="Basic",        StartDate=DO("2026-01-01"), ExpiryDate=DO("2026-12-31"), AutoRenew=true,  ContactEmail="ops@nairobiexpress.co.ke", SmsNumbersJson="[]" },
            new VehicleSubscription { Id=DG("sub:v11"),     TenantId=TenantNex,   VehicleShortId="v11",     Plan="Professional", StartDate=DO("2025-10-01"), ExpiryDate=DO("2026-09-30"), AutoRenew=true,  ContactEmail="ops@nairobiexpress.co.ke", SmsNumbersJson="""["+254733500003"]""" },
            new VehicleSubscription { Id=DG("sub:v12"),     TenantId=TenantNex,   VehicleShortId="v12",     Plan="Starter",      StartDate=DO("2025-06-21"), ExpiryDate=DO("2026-06-20"), AutoRenew=false, ContactEmail="ops@nairobiexpress.co.ke", SmsNumbersJson="[]" },
            // ── KimTransport (tenant 4) ───────────────────────────────────────
            new VehicleSubscription { Id=DG("sub:v13"),     TenantId=TenantKim,   VehicleShortId="v13",     Plan="Enterprise",   StartDate=DO("2025-07-01"), ExpiryDate=DO("2027-06-30"), AutoRenew=true,  ContactEmail="admin@kimtransport.ug",    SmsNumbersJson="""["+256772300001"]""" },
            new VehicleSubscription { Id=DG("sub:v14"),     TenantId=TenantKim,   VehicleShortId="v14",     Plan="Basic",        StartDate=DO("2025-10-01"), ExpiryDate=DO("2026-09-30"), AutoRenew=true,  ContactEmail="admin@kimtransport.ug",    SmsNumbersJson="[]" },
            // ── PeakFleet Co (tenant 5) ───────────────────────────────────────
            new VehicleSubscription { Id=DG("sub:v15"),     TenantId=TenantPeak,  VehicleShortId="v15",     Plan="Professional", StartDate=DO("2026-01-01"), ExpiryDate=DO("2026-12-31"), AutoRenew=true,  ContactEmail="fleet@peakfleet.co.tz",   SmsNumbersJson="""["+255756100001"]""" },
            new VehicleSubscription { Id=DG("sub:v16"),     TenantId=TenantPeak,  VehicleShortId="v16",     Plan="Basic",        StartDate=DO("2025-06-11"), ExpiryDate=DO("2026-06-10"), AutoRenew=false, ContactEmail="fleet@peakfleet.co.tz",   SmsNumbersJson="[]" },
            new VehicleSubscription { Id=DG("sub:v17"),     TenantId=TenantPeak,  VehicleShortId="v17",     Plan="Enterprise",   StartDate=DO("2026-02-01"), ExpiryDate=DO("2027-01-31"), AutoRenew=true,  ContactEmail="fleet@peakfleet.co.tz",   SmsNumbersJson="""["+255756100002"]""" },
            new VehicleSubscription { Id=DG("sub:v18"),     TenantId=TenantPeak,  VehicleShortId="v18",     Plan="Starter",      StartDate=DO("2026-01-01"), ExpiryDate=DO("2026-12-31"), AutoRenew=true,  ContactEmail="fleet@peakfleet.co.tz",   SmsNumbersJson="[]" },
            // ── SwiftDeliver EA (tenant 6) ────────────────────────────────────
            new VehicleSubscription { Id=DG("sub:v19"),     TenantId=TenantSde,   VehicleShortId="v19",     Plan="Basic",        StartDate=DO("2025-05-06"), ExpiryDate=DO("2026-05-05"), AutoRenew=false, ContactEmail="ops@swiftdeliverea.com",   SmsNumbersJson="[]" },
            new VehicleSubscription { Id=DG("sub:v20"),     TenantId=TenantSde,   VehicleShortId="v20",     Plan="Professional", StartDate=DO("2026-01-01"), ExpiryDate=DO("2026-12-31"), AutoRenew=true,  ContactEmail="ops@swiftdeliverea.com",   SmsNumbersJson="""["+254700900001"]""" },
            // ── Star Technologies Pakistan (tenant 7) ─────────────────────────
            new VehicleSubscription { Id=DG("sub:vs7-001"), TenantId=TenantStar, VehicleShortId="vs7-001", Plan="Enterprise",   StartDate=DO("2022-04-20"), ExpiryDate=DO("2027-04-19"), AutoRenew=true,  ContactEmail="fleet@starttech.io", SmsNumbersJson="""["+92 300 1234501"]""" },
            new VehicleSubscription { Id=DG("sub:vs7-002"), TenantId=TenantStar, VehicleShortId="vs7-002", Plan="Enterprise",   StartDate=DO("2022-05-10"), ExpiryDate=DO("2027-05-09"), AutoRenew=true,  ContactEmail="fleet@starttech.io", SmsNumbersJson="""["+92 300 1234502"]""" },
            new VehicleSubscription { Id=DG("sub:vs7-003"), TenantId=TenantStar, VehicleShortId="vs7-003", Plan="Professional", StartDate=DO("2023-03-01"), ExpiryDate=DO("2027-02-28"), AutoRenew=true,  ContactEmail="fleet@starttech.io", SmsNumbersJson="""["+92 300 1234503"]""" },
            new VehicleSubscription { Id=DG("sub:vs7-004"), TenantId=TenantStar, VehicleShortId="vs7-004", Plan="Professional", StartDate=DO("2023-09-15"), ExpiryDate=DO("2027-09-14"), AutoRenew=true,  ContactEmail="fleet@starttech.io", SmsNumbersJson="""["+92 300 1234504"]""" },
            new VehicleSubscription { Id=DG("sub:vs7-005"), TenantId=TenantStar, VehicleShortId="vs7-005", Plan="Enterprise",   StartDate=DO("2024-01-20"), ExpiryDate=DO("2027-01-19"), AutoRenew=true,  ContactEmail="fleet@starttech.io", SmsNumbersJson="""["+92 300 1234505"]""" }
        );
    }

    // ── CustomPlans ───────────────────────────────────────────────────────────
    private static void SeedCustomPlans(ModelBuilder mb)
    {
        mb.Entity<CustomPlan>().HasData(
            new CustomPlan {
                Id=DG("cp:cp-acme-standard"), ShortId="cp-acme-standard", TenantId=TenantAcme,
                Name="ACME Fleet Standard", Tagline="Optimised for long-haul haulage operations", Price=55m, Color="#d97706", Highlight=false,
                ServicesJson="""["web_access","live_tracking","on_call_location","sms_alert","maintenance_alerts","geofence_alert","reports"]""",
                LimitsJson="""{"smsPerMonth":100,"gpsRefreshSec":30,"routeHistoryDays":90,"reportsPerMonth":20}""",
                Status="active", IsDefault=true, VehicleCount=4, CreatedAt=DO("2025-06-01"), UpdatedAt=DO("2026-01-15"),
            },
            new CustomPlan {
                Id=DG("cp:cp-acme-premium"), ShortId="cp-acme-premium", TenantId=TenantAcme,
                Name="ACME Premium Control", Tagline="Full control suite with engine cut & door lock", Price=89m, Color="#7c3aed", Highlight=true,
                ServicesJson="""["web_access","live_tracking","on_call_location","route_playback","sms_alert","geofence_alert","maintenance_alerts","engine_cut","door_lock","driver_behaviour","fuel_monitoring","reports"]""",
                LimitsJson="""{"smsPerMonth":250,"gpsRefreshSec":15,"routeHistoryDays":365,"reportsPerMonth":"unlimited"}""",
                Status="active", IsDefault=false, VehicleCount=2, CreatedAt=DO("2025-09-01"), UpdatedAt=DO("2026-03-01"),
            },
            new CustomPlan {
                Id=DG("cp:cp-acme-lite-draft"), ShortId="cp-acme-lite-draft", TenantId=TenantAcme,
                Name="ACME Lite", Tagline="Low-cost plan for yard / inactive vehicles", Price=12m, Color="#6b7280", Highlight=false,
                ServicesJson="""["web_access","on_call_location"]""",
                LimitsJson="""{"smsPerMonth":20,"routeHistoryDays":30,"reportsPerMonth":5}""",
                Status="draft", IsDefault=false, VehicleCount=0, CreatedAt=DO("2026-04-10"), UpdatedAt=DO("2026-04-10"),
            },
            new CustomPlan {
                Id=DG("cp:cp-personal-tracker"), ShortId="cp-personal-tracker", TenantId=TenantAcme,
                Name="Personal Tracker", Tagline="Designed for individual vehicle owners", Price=25m, Color="#0891b2", Highlight=false,
                ServicesJson="""["web_access","live_tracking","on_call_location","sms_alert","geofence_alert"]""",
                LimitsJson="""{"smsPerMonth":50,"gpsRefreshSec":60,"routeHistoryDays":30,"reportsPerMonth":5}""",
                Status="active", IsDefault=false, VehicleCount=1, CreatedAt=DO("2026-01-15"), UpdatedAt=DO("2026-01-15"),
            }
        );
    }

    // ── TenantCustomRoles ─────────────────────────────────────────────────────
    private static void SeedTenantCustomRoles(ModelBuilder mb)
    {
        // TENANT_MODULES order: dashboard,map,playback,alerts,vehicles,drivers,routes,geofences,unauthorized,maintenance,analytics,reports,subscription,tenant-users,tenant-roles
        const string ALL_MODULES_FULL_NO_DEL = """[{"moduleId":"dashboard","create":true,"read":true,"update":true,"delete":false},{"moduleId":"map","create":true,"read":true,"update":true,"delete":false},{"moduleId":"playback","create":true,"read":true,"update":true,"delete":false},{"moduleId":"alerts","create":true,"read":true,"update":true,"delete":false},{"moduleId":"vehicles","create":true,"read":true,"update":true,"delete":false},{"moduleId":"drivers","create":true,"read":true,"update":true,"delete":false},{"moduleId":"routes","create":true,"read":true,"update":true,"delete":false},{"moduleId":"geofences","create":true,"read":true,"update":true,"delete":false},{"moduleId":"unauthorized","create":true,"read":true,"update":true,"delete":false},{"moduleId":"maintenance","create":true,"read":true,"update":true,"delete":false},{"moduleId":"analytics","create":true,"read":true,"update":true,"delete":false},{"moduleId":"reports","create":true,"read":true,"update":true,"delete":false},{"moduleId":"subscription","create":true,"read":true,"update":true,"delete":false},{"moduleId":"tenant-users","create":true,"read":true,"update":true,"delete":false},{"moduleId":"tenant-roles","create":true,"read":true,"update":true,"delete":false}]""";
        const string ALL_MODULES_READ_ONLY   = """[{"moduleId":"dashboard","create":false,"read":true,"update":false,"delete":false},{"moduleId":"map","create":false,"read":true,"update":false,"delete":false},{"moduleId":"playback","create":false,"read":true,"update":false,"delete":false},{"moduleId":"alerts","create":false,"read":true,"update":false,"delete":false},{"moduleId":"vehicles","create":false,"read":true,"update":false,"delete":false},{"moduleId":"drivers","create":false,"read":true,"update":false,"delete":false},{"moduleId":"routes","create":false,"read":true,"update":false,"delete":false},{"moduleId":"geofences","create":false,"read":true,"update":false,"delete":false},{"moduleId":"unauthorized","create":false,"read":true,"update":false,"delete":false},{"moduleId":"maintenance","create":false,"read":true,"update":false,"delete":false},{"moduleId":"analytics","create":false,"read":true,"update":false,"delete":false},{"moduleId":"reports","create":false,"read":true,"update":false,"delete":false},{"moduleId":"subscription","create":false,"read":true,"update":false,"delete":false},{"moduleId":"tenant-users","create":false,"read":true,"update":false,"delete":false},{"moduleId":"tenant-roles","create":false,"read":true,"update":false,"delete":false}]""";
        const string MAINT_TECH_PERMS        = """[{"moduleId":"dashboard","create":false,"read":false,"update":false,"delete":false},{"moduleId":"map","create":false,"read":false,"update":false,"delete":false},{"moduleId":"playback","create":false,"read":false,"update":false,"delete":false},{"moduleId":"alerts","create":false,"read":false,"update":false,"delete":false},{"moduleId":"vehicles","create":false,"read":true,"update":false,"delete":false},{"moduleId":"drivers","create":false,"read":true,"update":false,"delete":false},{"moduleId":"routes","create":false,"read":false,"update":false,"delete":false},{"moduleId":"geofences","create":false,"read":false,"update":false,"delete":false},{"moduleId":"unauthorized","create":false,"read":false,"update":false,"delete":false},{"moduleId":"maintenance","create":true,"read":true,"update":true,"delete":true},{"moduleId":"analytics","create":false,"read":false,"update":false,"delete":false},{"moduleId":"reports","create":false,"read":false,"update":false,"delete":false},{"moduleId":"subscription","create":false,"read":false,"update":false,"delete":false},{"moduleId":"tenant-users","create":false,"read":false,"update":false,"delete":false},{"moduleId":"tenant-roles","create":false,"read":false,"update":false,"delete":false}]""";
        const string DISPATCH_COORD_PERMS    = """[{"moduleId":"dashboard","create":false,"read":true,"update":false,"delete":false},{"moduleId":"map","create":false,"read":true,"update":false,"delete":false},{"moduleId":"playback","create":false,"read":true,"update":false,"delete":false},{"moduleId":"alerts","create":true,"read":true,"update":false,"delete":false},{"moduleId":"vehicles","create":false,"read":true,"update":false,"delete":false},{"moduleId":"drivers","create":false,"read":true,"update":false,"delete":false},{"moduleId":"routes","create":true,"read":true,"update":false,"delete":false},{"moduleId":"geofences","create":false,"read":false,"update":false,"delete":false},{"moduleId":"unauthorized","create":false,"read":false,"update":false,"delete":false},{"moduleId":"maintenance","create":false,"read":false,"update":false,"delete":false},{"moduleId":"analytics","create":false,"read":false,"update":false,"delete":false},{"moduleId":"reports","create":false,"read":false,"update":false,"delete":false},{"moduleId":"subscription","create":false,"read":false,"update":false,"delete":false},{"moduleId":"tenant-users","create":false,"read":false,"update":false,"delete":false},{"moduleId":"tenant-roles","create":false,"read":false,"update":false,"delete":false}]""";

        const string ALL_FEATURES_TRUE = """{"vehicles:export":true,"vehicles:import":true,"vehicles:telemetry":true,"vehicles:documents":true,"vehicles:transfer":true,"drivers:export":true,"drivers:scorecard":true,"drivers:hos":true,"drivers:documents":true,"alerts:acknowledge":true,"alerts:config":true,"alerts:history":true,"geo:draw":true,"geo:triggers":true,"geo:history":true,"maint:schedule":true,"maint:approve":true,"maint:history":true,"maint:cost":true,"rpt:mileage":true,"rpt:fuel":true,"rpt:driver":true,"rpt:geofence":true,"rpt:unauthorized":true,"rpt:maintenance":true,"rpt:cost":true,"rpt:export":true,"analytics:kpi":true,"analytics:trends":true,"analytics:compare":true,"analytics:export":true}""";
        const string AUDITOR_FEATURES  = """{"vehicles:export":true,"vehicles:import":false,"vehicles:telemetry":true,"vehicles:documents":false,"vehicles:transfer":false,"drivers:export":true,"drivers:scorecard":true,"drivers:hos":false,"drivers:documents":false,"alerts:acknowledge":false,"alerts:config":false,"alerts:history":true,"geo:draw":false,"geo:triggers":false,"geo:history":true,"maint:schedule":false,"maint:approve":false,"maint:history":true,"maint:cost":true,"rpt:mileage":true,"rpt:fuel":true,"rpt:driver":true,"rpt:geofence":true,"rpt:unauthorized":true,"rpt:maintenance":true,"rpt:cost":true,"rpt:export":false,"analytics:kpi":true,"analytics:trends":true,"analytics:compare":true,"analytics:export":true}""";
        const string MAINT_FEATURES    = """{"vehicles:export":false,"vehicles:import":false,"vehicles:telemetry":true,"vehicles:documents":true,"vehicles:transfer":false,"drivers:export":false,"drivers:scorecard":true,"drivers:hos":false,"drivers:documents":false,"alerts:acknowledge":false,"alerts:config":false,"alerts:history":false,"geo:draw":false,"geo:triggers":false,"geo:history":false,"maint:schedule":true,"maint:approve":true,"maint:history":true,"maint:cost":true,"rpt:mileage":false,"rpt:fuel":false,"rpt:driver":false,"rpt:geofence":false,"rpt:unauthorized":false,"rpt:maintenance":false,"rpt:cost":false,"rpt:export":false,"analytics:kpi":false,"analytics:trends":false,"analytics:compare":false,"analytics:export":false}""";
        const string DISPATCH_FEATURES = """{"vehicles:export":false,"vehicles:import":false,"vehicles:telemetry":true,"vehicles:documents":false,"vehicles:transfer":false,"drivers:export":false,"drivers:scorecard":true,"drivers:hos":false,"drivers:documents":false,"alerts:acknowledge":true,"alerts:config":true,"alerts:history":true,"geo:draw":false,"geo:triggers":false,"geo:history":false,"maint:schedule":false,"maint:approve":false,"maint:history":false,"maint:cost":false,"rpt:mileage":false,"rpt:fuel":false,"rpt:driver":false,"rpt:geofence":false,"rpt:unauthorized":false,"rpt:maintenance":false,"rpt:cost":false,"rpt:export":false,"analytics:kpi":false,"analytics:trends":false,"analytics:compare":false,"analytics:export":false}""";

        mb.Entity<TenantCustomRole>().HasData(
            new TenantCustomRole { Id=DG("role:tr-1"), ShortId="tr-1", TenantId=TenantAcme, Name="Operations Lead",       Slug="ops_lead",      Description="Full access across all fleet ops modules; cannot delete records", Color="#0891b2", UserCount=3, CreatedAt=DO("2026-01-15"), PermissionsJson=ALL_MODULES_FULL_NO_DEL, FeaturePermissionsJson=ALL_FEATURES_TRUE },
            new TenantCustomRole { Id=DG("role:tr-2"), ShortId="tr-2", TenantId=TenantAcme, Name="Read-only Auditor",     Slug="auditor",       Description="Can view every module but cannot write, edit, or delete anything", Color="#6b7280", UserCount=2, CreatedAt=DO("2026-02-03"), PermissionsJson=ALL_MODULES_READ_ONLY,   FeaturePermissionsJson=AUDITOR_FEATURES  },
            new TenantCustomRole { Id=DG("role:tr-3"), ShortId="tr-3", TenantId=TenantAcme, Name="Maintenance Tech",      Slug="maint_tech",    Description="Full CRUD on Maintenance; read-only on Vehicles and Drivers",    Color="#d97706", UserCount=5, CreatedAt=DO("2026-03-20"), PermissionsJson=MAINT_TECH_PERMS,         FeaturePermissionsJson=MAINT_FEATURES    },
            new TenantCustomRole { Id=DG("role:tr-4"), ShortId="tr-4", TenantId=TenantAcme, Name="Dispatch Coordinator",  Slug="dispatch_coord",Description="Can create and update routes and alerts; read-only on fleet data",  Color="#7c3aed", UserCount=2, CreatedAt=DO("2026-04-10"), PermissionsJson=DISPATCH_COORD_PERMS,     FeaturePermissionsJson=DISPATCH_FEATURES }
        );
    }

    // ── EncryptionKeys ────────────────────────────────────────────────────────
    private static void SeedEncryptionKeys(ModelBuilder mb)
    {
        mb.Entity<EncryptionKey>().HasData(
            new EncryptionKey { Id=DG("ekey:acme"),  TenantId=TenantAcme,  KeyId="kms-key-acme-2024-001",  Algorithm="AES-256-GCM", BitLength=256, Created=DO("2024-01-15"), LastRotated=DO("2026-01-15"), NextRotation=DO("2027-01-15"), Status="Active",    KmsProvider="AWS KMS af-south-1" },
            new EncryptionKey { Id=DG("ekey:swift"), TenantId=TenantSwift, KeyId="kms-key-swift-2024-002", Algorithm="AES-256-GCM", BitLength=256, Created=DO("2024-03-01"), LastRotated=DO("2026-03-01"), NextRotation=DO("2027-03-01"), Status="Active",    KmsProvider="AWS KMS af-south-1" },
            new EncryptionKey { Id=DG("ekey:nex"),   TenantId=TenantNex,   KeyId="kms-key-nex-2024-003",   Algorithm="AES-256-GCM", BitLength=256, Created=DO("2024-04-10"), LastRotated=DO("2026-04-10"), NextRotation=DO("2027-04-10"), Status="Active",    KmsProvider="AWS KMS af-south-1" },
            new EncryptionKey { Id=DG("ekey:kim"),   TenantId=TenantKim,   KeyId="kms-key-kim-2024-004",   Algorithm="AES-256-GCM", BitLength=256, Created=DO("2024-02-20"), LastRotated=DO("2025-02-20"), NextRotation=DO("2026-02-20"), Status="Scheduled", KmsProvider="AWS KMS af-south-1" },
            new EncryptionKey { Id=DG("ekey:peak"),  TenantId=TenantPeak,  KeyId="kms-key-peak-2024-005",  Algorithm="AES-256-GCM", BitLength=256, Created=DO("2023-12-01"), LastRotated=DO("2025-12-01"), NextRotation=DO("2026-12-01"), Status="Active",    KmsProvider="AWS KMS af-south-1" },
            new EncryptionKey { Id=DG("ekey:sde"),   TenantId=TenantSde,   KeyId="kms-key-sde-2024-006",   Algorithm="AES-256-GCM", BitLength=256, Created=DO("2024-05-01"), LastRotated=DO("2026-05-01"), NextRotation=DO("2027-05-01"), Status="Rotating",  KmsProvider="AWS KMS af-south-1" }
        );
    }

    // ── AuditEvents ───────────────────────────────────────────────────────────
    private static void SeedAuditEvents(ModelBuilder mb)
    {
        mb.Entity<AuditEvent>().HasData(
            new AuditEvent { Id=DG("ae:ae-001"), ShortId="ae-001", TenantId=TenantAcme,  Timestamp=T("2026-05-26T10:42:11Z"), Actor="admin@acmelogistics.co.ke",    ActorRole="fleet_admin",   Action="VEHICLE_VIEW",       Resource="vehicles",  ResourceId="v1",         Outcome="success", IpAddress="197.248.1.10", Details="Viewed vehicle KAB 001A master data.",                                     CrossTenantAttempt=false },
            new AuditEvent { Id=DG("ae:ae-002"), ShortId="ae-002", TenantId=TenantAcme,  Timestamp=T("2026-05-26T10:40:05Z"), Actor="manager@acmelogistics.co.ke",  ActorRole="fleet_manager", Action="VEHICLE_UPDATE",     Resource="vehicles",  ResourceId="v3",         Outcome="success", IpAddress="197.248.1.11", Details="Updated assignment for KAB 003C — new customer SolarRoute Ltd.",            CrossTenantAttempt=false },
            new AuditEvent { Id=DG("ae:ae-003"), ShortId="ae-003", TenantId=TenantNex,   Timestamp=T("2026-05-26T10:38:22Z"), Actor="SYSTEM",                       ActorRole="system",        Action="CROSS_TENANT_BLOCK", Resource="vehicles",  ResourceId="v1",         Outcome="blocked", IpAddress="41.90.64.22",   Details="Tenant 3 token attempted access to Tenant 1 vehicle v1. Blocked.",          CrossTenantAttempt=true  },
            new AuditEvent { Id=DG("ae:ae-004"), ShortId="ae-004", TenantId=TenantAcme,  Timestamp=T("2026-05-26T10:35:00Z"), Actor="admin@acmelogistics.co.ke",    ActorRole="fleet_admin",   Action="USER_INVITE",        Resource="users",     ResourceId="u-107",      Outcome="success", IpAddress="197.248.1.10", Details="Invited new user dispatch2@acmelogistics.co.ke with dispatcher role.",      CrossTenantAttempt=false },
            new AuditEvent { Id=DG("ae:ae-005"), ShortId="ae-005", TenantId=TenantPeak,  Timestamp=T("2026-05-26T10:33:18Z"), Actor="admin@peakfleet.co.tz",        ActorRole="fleet_admin",   Action="REPORT_EXPORT",      Resource="reports",   ResourceId="rpt-88",     Outcome="success", IpAddress="102.177.2.44", Details="Exported monthly fuel cost report for May 2026 (tenant-scoped data).",      CrossTenantAttempt=false },
            new AuditEvent { Id=DG("ae:ae-006"), ShortId="ae-006", TenantId=TenantSwift, Timestamp=T("2026-05-26T10:30:50Z"), Actor="manager@swiftcargo.co.ke",     ActorRole="fleet_manager", Action="DOCUMENT_UPLOAD",    Resource="documents", ResourceId="doc-v8-ins", Outcome="success", IpAddress="154.122.3.9",  Details="Uploaded renewed insurance certificate for KCC 101B.",                      CrossTenantAttempt=false },
            new AuditEvent { Id=DG("ae:ae-007"), ShortId="ae-007", TenantId=TenantKim,   Timestamp=T("2026-05-26T10:28:40Z"), Actor="admin@kimtransport.co.ug",     ActorRole="fleet_admin",   Action="LOGIN_ATTEMPT",      Resource="auth",      ResourceId="session",    Outcome="blocked", IpAddress="41.202.212.1", Details="Login blocked — tenant account is Suspended.",                              CrossTenantAttempt=false },
            new AuditEvent { Id=DG("ae:ae-008"), ShortId="ae-008", TenantId=TenantKim,   Timestamp=T("2026-05-26T10:27:15Z"), Actor="UNKNOWN",                      ActorRole="none",          Action="CROSS_TENANT_BLOCK", Resource="vehicles",  ResourceId="v2",         Outcome="blocked", IpAddress="41.202.212.1", Details="Tenant 4 credentials used to probe Tenant 1 endpoint. Blocked.",            CrossTenantAttempt=true  },
            new AuditEvent { Id=DG("ae:ae-009"), ShortId="ae-009", TenantId=TenantAcme,  Timestamp=T("2026-05-26T10:25:00Z"), Actor="dispatch@acmelogistics.co.ke", ActorRole="dispatcher",    Action="ALERT_ACK",          Resource="alerts",    ResourceId="alt-33",     Outcome="success", IpAddress="197.248.1.19", Details="Alert alt-33 acknowledged: KAB 004D speeding event.",                      CrossTenantAttempt=false },
            new AuditEvent { Id=DG("ae:ae-010"), ShortId="ae-010", TenantId=TenantPeak,  Timestamp=T("2026-05-26T10:22:33Z"), Actor="billing@peakfleet.co.tz",      ActorRole="billing_admin", Action="RBAC_DENY",          Resource="vehicles",  ResourceId="v15",        Outcome="blocked", IpAddress="102.177.2.50", Details="billing_admin role does not have access to vehicles. 403 returned.",        CrossTenantAttempt=false },
            new AuditEvent { Id=DG("ae:ae-011"), ShortId="ae-011", TenantId=TenantAcme,  Timestamp=T("2026-05-26T10:18:05Z"), Actor="admin@acmelogistics.co.ke",    ActorRole="fleet_admin",   Action="BACKUP_VERIFY",      Resource="backups",   ResourceId="bkp-acme-240",Outcome="success", IpAddress="197.248.1.10", Details="Manual backup integrity check passed for snapshot bkp-acme-240.",           CrossTenantAttempt=false },
            new AuditEvent { Id=DG("ae:ae-012"), ShortId="ae-012", TenantId=TenantSde,   Timestamp=T("2026-05-26T10:15:00Z"), Actor="admin@swiftdeliver.co.ke",     ActorRole="fleet_admin",   Action="KEY_ROTATION_START", Resource="encryption",ResourceId="kms-key-sde-2024-006", Outcome="success", IpAddress="41.90.88.3", Details="AES-256 key rotation initiated for SwiftDeliver EA tenant.", CrossTenantAttempt=false }
        );
    }

    // ── BackupRecords ─────────────────────────────────────────────────────────
    private static void SeedBackupRecords(ModelBuilder mb)
    {
        mb.Entity<BackupRecord>().HasData(
            new BackupRecord { Id=DG("bkp:acme"),  TenantId=TenantAcme,  BackupId="bkp-acme-240",  Type="Full",        StartedAt=T("2026-05-26T02:00:00Z"), CompletedAt=T("2026-05-26T02:38:12Z"), SizeGb=14.2m,  Status="Completed", EncryptedWith="kms-key-acme-2024-001",  StorageLocation="s3://fleetos-backups-af/tenant_1/", RpoHours=24, RtoHours=4  },
            new BackupRecord { Id=DG("bkp:swift"), TenantId=TenantSwift, BackupId="bkp-swift-120", Type="Full",        StartedAt=T("2026-05-26T02:00:00Z"), CompletedAt=T("2026-05-26T02:09:40Z"), SizeGb=3.8m,   Status="Completed", EncryptedWith="kms-key-swift-2024-002", StorageLocation="s3://fleetos-backups-af/tenant_2/", RpoHours=24, RtoHours=6  },
            new BackupRecord { Id=DG("bkp:nex"),   TenantId=TenantNex,   BackupId="bkp-nex-088",   Type="Full",        StartedAt=T("2026-05-26T02:00:00Z"), CompletedAt=T("2026-05-26T02:04:55Z"), SizeGb=0.9m,   Status="Completed", EncryptedWith="kms-key-nex-2024-003",   StorageLocation="s3://fleetos-backups-af/tenant_3/", RpoHours=24, RtoHours=6  },
            new BackupRecord { Id=DG("bkp:kim"),   TenantId=TenantKim,   BackupId="bkp-kim-055",   Type="Incremental", StartedAt=T("2026-05-25T02:00:00Z"), CompletedAt=T("2026-05-25T02:03:10Z"), SizeGb=0.2m,   Status="Completed", EncryptedWith="kms-key-kim-2024-004",   StorageLocation="s3://fleetos-backups-af/tenant_4/", RpoHours=48, RtoHours=8  },
            new BackupRecord { Id=DG("bkp:peak"),  TenantId=TenantPeak,  BackupId="bkp-peak-310",  Type="Full",        StartedAt=T("2026-05-26T02:00:00Z"), CompletedAt=T("2026-05-26T02:25:18Z"), SizeGb=9.6m,   Status="Completed", EncryptedWith="kms-key-peak-2024-005",  StorageLocation="s3://fleetos-backups-af/tenant_5/", RpoHours=24, RtoHours=4  },
            new BackupRecord { Id=DG("bkp:sde"),   TenantId=TenantSde,   BackupId="bkp-sde-010",   Type="Snapshot",    StartedAt=T("2026-05-26T02:00:00Z"), CompletedAt=T("2026-05-26T02:01:30Z"), SizeGb=0.3m,   Status="Completed", EncryptedWith="kms-key-sde-2024-006",   StorageLocation="s3://fleetos-backups-af/tenant_6/", RpoHours=48, RtoHours=12 }
        );
    }

    // ── Reference / Lookup Data ──────────────────────────────────────────────

    private static void SeedLookupItems(ModelBuilder mb)
    {
        static LookupItem L(int id, string cat, string val, int sort, string? parent = null, string? region = null)
            => new() { Id = id, Category = cat, Value = val, Label = val, SortOrder = sort, Parent = parent, Region = region };

        mb.Entity<LookupItem>().HasData(

            // ── Countries ─────────────────────────────────────── USA / UK first
            L(  1, "country", "United States",   1,  region: "US"),
            L(  2, "country", "United Kingdom",  2,  region: "GB"),
            L(  3, "country", "Canada",          3,  region: "CA"),
            L(  4, "country", "Australia",       4,  region: "AU"),
            L(  5, "country", "Germany",         5,  region: "DE"),
            L(  6, "country", "France",          6,  region: "FR"),
            L(  7, "country", "Netherlands",     7,  region: "NL"),
            L(  8, "country", "Ireland",         8,  region: "IE"),
            L(  9, "country", "New Zealand",     9,  region: "NZ"),
            L( 10, "country", "UAE",            10,  region: "AE"),
            L( 11, "country", "Singapore",      11,  region: "SG"),
            L( 12, "country", "India",          12,  region: "IN"),
            L( 13, "country", "Pakistan",       13,  region: "PK"),
            L( 14, "country", "South Africa",   14,  region: "ZA"),
            L( 15, "country", "Nigeria",        15,  region: "NG"),
            L( 16, "country", "Kenya",          16,  region: "KE"),

            // ── Industries ─────────────────────────────────────────────────────
            L( 50, "industry", "Logistics",           1),
            L( 51, "industry", "Transport",           2),
            L( 52, "industry", "Cargo & Freight",     3),
            L( 53, "industry", "Courier & Delivery",  4),
            L( 54, "industry", "Fleet Management",    5),
            L( 55, "industry", "Technology",          6),
            L( 56, "industry", "Renewable Energy",    7),
            L( 57, "industry", "E-commerce",          8),
            L( 58, "industry", "Construction",        9),
            L( 59, "industry", "Agriculture",        10),
            L( 60, "industry", "Healthcare",         11),
            L( 61, "industry", "Mining",             12),
            L( 62, "industry", "Finance",            13),
            L( 63, "industry", "Retail",             14),
            L( 64, "industry", "Government",         15),
            L( 65, "industry", "Utilities",          16),
            L( 66, "industry", "Other",              17),

            // ── Cities — United States ─────────────────────────────────────────
            L(100, "city", "New York",       1,  parent: "United States", region: "US"),
            L(101, "city", "Los Angeles",    2,  parent: "United States", region: "US"),
            L(102, "city", "Chicago",        3,  parent: "United States", region: "US"),
            L(103, "city", "Houston",        4,  parent: "United States", region: "US"),
            L(104, "city", "Phoenix",        5,  parent: "United States", region: "US"),
            L(105, "city", "Philadelphia",   6,  parent: "United States", region: "US"),
            L(106, "city", "San Antonio",    7,  parent: "United States", region: "US"),
            L(107, "city", "San Diego",      8,  parent: "United States", region: "US"),
            L(108, "city", "Dallas",         9,  parent: "United States", region: "US"),
            L(109, "city", "San Jose",      10,  parent: "United States", region: "US"),
            L(110, "city", "Austin",        11,  parent: "United States", region: "US"),
            L(111, "city", "Denver",        12,  parent: "United States", region: "US"),
            L(112, "city", "Seattle",       13,  parent: "United States", region: "US"),
            L(113, "city", "Boston",        14,  parent: "United States", region: "US"),
            L(114, "city", "Washington DC", 15,  parent: "United States", region: "US"),
            L(115, "city", "Atlanta",       16,  parent: "United States", region: "US"),
            L(116, "city", "Miami",         17,  parent: "United States", region: "US"),
            L(117, "city", "Minneapolis",   18,  parent: "United States", region: "US"),

            // ── Cities — United Kingdom ────────────────────────────────────────
            L(120, "city", "London",        1,  parent: "United Kingdom", region: "GB"),
            L(121, "city", "Manchester",    2,  parent: "United Kingdom", region: "GB"),
            L(122, "city", "Birmingham",    3,  parent: "United Kingdom", region: "GB"),
            L(123, "city", "Leeds",         4,  parent: "United Kingdom", region: "GB"),
            L(124, "city", "Glasgow",       5,  parent: "United Kingdom", region: "GB"),
            L(125, "city", "Sheffield",     6,  parent: "United Kingdom", region: "GB"),
            L(126, "city", "Edinburgh",     7,  parent: "United Kingdom", region: "GB"),
            L(127, "city", "Liverpool",     8,  parent: "United Kingdom", region: "GB"),
            L(128, "city", "Bristol",       9,  parent: "United Kingdom", region: "GB"),
            L(129, "city", "Cardiff",      10,  parent: "United Kingdom", region: "GB"),
            L(130, "city", "Belfast",      11,  parent: "United Kingdom", region: "GB"),
            L(131, "city", "Leicester",    12,  parent: "United Kingdom", region: "GB"),

            // ── Cities — Canada ────────────────────────────────────────────────
            L(132, "city", "Toronto",    1,  parent: "Canada", region: "CA"),
            L(133, "city", "Vancouver",  2,  parent: "Canada", region: "CA"),
            L(134, "city", "Montreal",   3,  parent: "Canada", region: "CA"),
            L(135, "city", "Calgary",    4,  parent: "Canada", region: "CA"),
            L(136, "city", "Ottawa",     5,  parent: "Canada", region: "CA"),

            // ── Cities — Australia ─────────────────────────────────────────────
            L(137, "city", "Sydney",     1,  parent: "Australia", region: "AU"),
            L(138, "city", "Melbourne",  2,  parent: "Australia", region: "AU"),
            L(139, "city", "Brisbane",   3,  parent: "Australia", region: "AU"),
            L(148, "city", "Perth",      4,  parent: "Australia", region: "AU"),
            L(149, "city", "Adelaide",   5,  parent: "Australia", region: "AU"),

            // ── Cities — Pakistan ───────────────────────────────────────────────
            L(140, "city", "Karachi",    1, parent: "Pakistan", region: "PK"),
            L(141, "city", "Lahore",     2, parent: "Pakistan", region: "PK"),
            L(142, "city", "Islamabad",  3, parent: "Pakistan", region: "PK"),
            L(143, "city", "Rawalpindi", 4, parent: "Pakistan", region: "PK"),
            L(144, "city", "Faisalabad", 5, parent: "Pakistan", region: "PK"),
            L(145, "city", "Multan",     6, parent: "Pakistan", region: "PK"),
            L(146, "city", "Peshawar",   7, parent: "Pakistan", region: "PK"),
            L(147, "city", "Quetta",     8, parent: "Pakistan", region: "PK"),

            // ── Vehicle Categories ─────────────────────────────────────────────
            L(200, "vehicle_category", "Truck",       1),
            L(201, "vehicle_category", "Van",         2),
            L(202, "vehicle_category", "Pickup",      3),
            L(203, "vehicle_category", "Car",         4),
            L(204, "vehicle_category", "Bus",         5),
            L(205, "vehicle_category", "Motorcycle",  6),
            L(206, "vehicle_category", "Trailer",     7),
            L(207, "vehicle_category", "Tractor",     8),
            L(208, "vehicle_category", "Other",       9),

            // ── Fuel Types ─────────────────────────────────────────────────────
            L(220, "fuel_type", "Diesel",       1),
            L(221, "fuel_type", "Petrol",       2),
            L(222, "fuel_type", "Electric",     3),
            L(223, "fuel_type", "Hybrid",       4),
            L(224, "fuel_type", "CNG",          5),
            L(225, "fuel_type", "LPG",          6),
            L(226, "fuel_type", "Hydrogen",     7),

            // ── Device Types ───────────────────────────────────────────────────
            L(240, "device_type", "GPS Tracker",  1),
            L(241, "device_type", "OBD Dongle",   2),
            L(242, "device_type", "Dashcam",      3),
            L(243, "device_type", "Temp Sensor",  4),
            L(244, "device_type", "Fuel Sensor",  5),

            // ── Device Models — GPS Tracker ────────────────────────────────────
            L(260, "device_model", "Teltonika FMB920",    1,  parent: "GPS Tracker"),
            L(261, "device_model", "Teltonika FMB140",    2,  parent: "GPS Tracker"),
            L(262, "device_model", "Teltonika FMC003",    3,  parent: "GPS Tracker"),
            L(263, "device_model", "Queclink GV55",       4,  parent: "GPS Tracker"),
            L(264, "device_model", "Queclink GV350MG",    5,  parent: "GPS Tracker"),
            L(265, "device_model", "Ruptela FM-Eco4+",    6,  parent: "GPS Tracker"),
            L(266, "device_model", "Samsara VG34",        7,  parent: "GPS Tracker"),
            L(267, "device_model", "Verizon Connect HUM", 8,  parent: "GPS Tracker"),
            L(268, "device_model", "CalAmp TTU-2830",     9,  parent: "GPS Tracker"),

            // ── Device Models — OBD Dongle ─────────────────────────────────────
            L(270, "device_model", "CalAmp LMU-3030",        1, parent: "OBD Dongle"),
            L(271, "device_model", "Samsara OBD Gateway",    2, parent: "OBD Dongle"),
            L(272, "device_model", "Verizon Networkfleet",   3, parent: "OBD Dongle"),
            L(273, "device_model", "Geotab GO9",             4, parent: "OBD Dongle"),

            // ── Device Models — Dashcam ────────────────────────────────────────
            L(280, "device_model", "BlackVue DR900X-2CH", 1, parent: "Dashcam"),
            L(281, "device_model", "BlackVue DR750X-2CH", 2, parent: "Dashcam"),
            L(282, "device_model", "Viofo A129 Pro",      3, parent: "Dashcam"),
            L(283, "device_model", "Thinkware U1000",     4, parent: "Dashcam"),
            L(284, "device_model", "Garmin Dash Cam 67W", 5, parent: "Dashcam"),

            // ── Device Models — Temp Sensor ────────────────────────────────────
            L(290, "device_model", "Reefer-Track RT200",       1, parent: "Temp Sensor"),
            L(291, "device_model", "Cold Chain Monitor CC-1",  2, parent: "Temp Sensor"),
            L(292, "device_model", "Sensitech TempTale 4",     3, parent: "Temp Sensor"),

            // ── Device Models — Fuel Sensor ────────────────────────────────────
            L(295, "device_model", "Tecnoton FLS-100", 1, parent: "Fuel Sensor"),
            L(296, "device_model", "DFM Flow Meter",   2, parent: "Fuel Sensor"),
            L(297, "device_model", "LLS-AF 20160",     3, parent: "Fuel Sensor"),

            // ── Telecom Operators ────────────────────────────── USA / UK first
            L(310, "telecom_operator", "AT&T",             1,  region: "US"),
            L(311, "telecom_operator", "Verizon",          2,  region: "US"),
            L(312, "telecom_operator", "T-Mobile US",      3,  region: "US"),
            L(313, "telecom_operator", "US Cellular",      4,  region: "US"),
            L(314, "telecom_operator", "Vodafone UK",      5,  region: "GB"),
            L(315, "telecom_operator", "EE",               6,  region: "GB"),
            L(316, "telecom_operator", "O2 UK",            7,  region: "GB"),
            L(317, "telecom_operator", "Three UK",         8,  region: "GB"),
            L(318, "telecom_operator", "Bell Canada",      9,  region: "CA"),
            L(319, "telecom_operator", "Telstra",         10,  region: "AU"),
            L(320, "telecom_operator", "Airtel",          11),
            L(321, "telecom_operator", "Other",           99),

            // ── Geofence Types ─────────────────────────────────────────────────
            L(340, "geofence_type", "Home base",    1),
            L(341, "geofence_type", "Depot",        2),
            L(342, "geofence_type", "Restricted",   3),
            L(343, "geofence_type", "Airport",      4),
            L(344, "geofence_type", "Customer",     5),
            L(345, "geofence_type", "Fuel Station", 6),
            L(346, "geofence_type", "Workshop",     7),
            L(347, "geofence_type", "Port / Dock",  8),
            L(348, "geofence_type", "Warehouse",    9)
        );
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /// <summary>Parse a date string to UTC DateTime.</summary>
    private static DateTime D(string iso) => DateTime.SpecifyKind(DateTime.Parse(iso), DateTimeKind.Utc);

    /// <summary>Parse an ISO-8601 string to UTC DateTime (alias for explicitness).</summary>
    private static DateTime T(string iso) => DateTime.SpecifyKind(DateTime.Parse(iso), DateTimeKind.Utc);

    /// <summary>Parse a date string to DateOnly.</summary>
    private static DateOnly DO(string iso) => DateOnly.Parse(iso);

    /// <summary>Produces a stable GUID from a domain-scoped string via MD5.</summary>
    private static Guid DG(string input) => DeterministicGuid(input);

    /// <summary>Produces a stable GUID from an arbitrary string via MD5.</summary>
    private static Guid DeterministicGuid(string input)
    {
        var hash = MD5.HashData(Encoding.UTF8.GetBytes(input));
        return new Guid(hash);
    }
}
