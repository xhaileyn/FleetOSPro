namespace FleetOS.Api.Models;

/// <summary>
/// Generic lookup / reference-data row.
/// Replaces all hardcoded arrays in the frontend (countries, industries,
/// cities, vehicle categories, fuel types, device models, operators …).
/// </summary>
public class LookupItem
{
    public int     Id        { get; set; }

    /// <summary>Bucket key, e.g. "country", "industry", "city", "vehicle_category".</summary>
    public string  Category  { get; set; } = "";

    /// <summary>Machine-readable value stored in entity rows.</summary>
    public string  Value     { get; set; } = "";

    /// <summary>Human-readable label shown in dropdowns (often same as Value).</summary>
    public string  Label     { get; set; } = "";

    /// <summary>
    /// Optional parent: used for device_model → device_type linkage,
    /// or city → country linkage.
    /// </summary>
    public string? Parent    { get; set; }

    /// <summary>ISO-2 region tag (e.g. "KE", "UG") for geographic filtering.</summary>
    public string? Region    { get; set; }

    public int     SortOrder { get; set; }
}
