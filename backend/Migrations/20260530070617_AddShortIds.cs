using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FleetOS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddShortIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ShortId",
                table: "Vehicles",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ShortId",
                table: "Drivers",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ShortId",
                table: "Customers",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ShortId",
                table: "Branches",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Branches",
                keyColumn: "Id",
                keyValue: new Guid("2338707e-cc54-cf7e-d719-da49c99fa42e"),
                column: "ShortId",
                value: "b-502");

            migrationBuilder.UpdateData(
                table: "Branches",
                keyColumn: "Id",
                keyValue: new Guid("464966cd-559d-19fd-b8fa-5adf51e50d67"),
                column: "ShortId",
                value: "b-102");

            migrationBuilder.UpdateData(
                table: "Branches",
                keyColumn: "Id",
                keyValue: new Guid("51a56787-ae87-1186-6da6-0735a9f71359"),
                column: "ShortId",
                value: "b-101");

            migrationBuilder.UpdateData(
                table: "Branches",
                keyColumn: "Id",
                keyValue: new Guid("8b76e4e3-3143-e99f-ec8c-75d100884a58"),
                column: "ShortId",
                value: "b-202");

            migrationBuilder.UpdateData(
                table: "Branches",
                keyColumn: "Id",
                keyValue: new Guid("a57f1ad8-fe59-e1b7-9319-171bba28d081"),
                column: "ShortId",
                value: "b-104");

            migrationBuilder.UpdateData(
                table: "Branches",
                keyColumn: "Id",
                keyValue: new Guid("c7125620-e39c-cf70-ebb7-07aac553f8a3"),
                column: "ShortId",
                value: "b-103");

            migrationBuilder.UpdateData(
                table: "Branches",
                keyColumn: "Id",
                keyValue: new Guid("e93f3cd9-e00f-6e4d-f613-6b56398bf52e"),
                column: "ShortId",
                value: "b-201");

            migrationBuilder.UpdateData(
                table: "Branches",
                keyColumn: "Id",
                keyValue: new Guid("ef991207-a2db-9c9f-4a2f-8cc27caf7c9e"),
                column: "ShortId",
                value: "b-501");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("05b794d4-90de-0a9f-579a-474fea9aac87"),
                column: "ShortId",
                value: "c-t5-011");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("128b33db-8815-78a8-f9fc-b8e81af05716"),
                column: "ShortId",
                value: "c-001");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("2e141688-10be-4a72-67e6-9162125ac264"),
                column: "ShortId",
                value: "c-003");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("2ec8842d-6d58-cd81-cdf2-84f92e00da18"),
                column: "ShortId",
                value: "c-t6-002");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("3c315919-1d06-2b3d-eb2f-ce83010e10c4"),
                column: "ShortId",
                value: "c-t3-001");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("4cef7f91-0aab-498c-32da-3b92cc4a317e"),
                column: "ShortId",
                value: "c-ind-001");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("4ef579c5-cd1f-44f7-e9f0-af0d5e70b619"),
                column: "ShortId",
                value: "c-t2-001");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("944671a3-cd94-3312-2d1f-fd86c8dd2a8b"),
                column: "ShortId",
                value: "c-002");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("9915600b-fc4c-a3d4-3738-fe10c6304731"),
                column: "ShortId",
                value: "c-t6-001");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("a1d62cc2-c5f8-b0e0-0c1e-533c7d146659"),
                column: "ShortId",
                value: "c-t5-002");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("d2fc714f-46bc-0291-0004-d5e576529ef6"),
                column: "ShortId",
                value: "c-004");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("d5c6c1ae-273b-fc48-56e7-81f65e5bc592"),
                column: "ShortId",
                value: "c-t2-002");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("db6ef748-aced-3b77-cb7b-1af1c89390d2"),
                column: "ShortId",
                value: "c-t4-002");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("df273454-6001-4844-2591-44d1642f7349"),
                column: "ShortId",
                value: "c-t4-001");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("eb9bce9f-8adf-9f6b-629e-6eb8e02e9a3b"),
                column: "ShortId",
                value: "c-t3-002");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: new Guid("fd4e0fea-8d11-e0ae-68ff-36efa2f536a6"),
                column: "ShortId",
                value: "c-t5-001");

            migrationBuilder.UpdateData(
                table: "Drivers",
                keyColumn: "Id",
                keyValue: new Guid("1d148bb5-cafa-84c6-b430-bf5fe108254f"),
                column: "ShortId",
                value: "");

            migrationBuilder.UpdateData(
                table: "Drivers",
                keyColumn: "Id",
                keyValue: new Guid("1dc03854-e633-7edf-0959-f50115dc5905"),
                column: "ShortId",
                value: "d13");

            migrationBuilder.UpdateData(
                table: "Drivers",
                keyColumn: "Id",
                keyValue: new Guid("2599d684-837a-dde7-608f-84ecd840f619"),
                column: "ShortId",
                value: "");

            migrationBuilder.UpdateData(
                table: "Drivers",
                keyColumn: "Id",
                keyValue: new Guid("271b7442-22da-d47b-76ce-12414158ef8b"),
                column: "ShortId",
                value: "");

            migrationBuilder.UpdateData(
                table: "Drivers",
                keyColumn: "Id",
                keyValue: new Guid("31d26652-9752-111c-00ee-6fcbc92fc010"),
                column: "ShortId",
                value: "d18");

            migrationBuilder.UpdateData(
                table: "Drivers",
                keyColumn: "Id",
                keyValue: new Guid("50b666a8-1264-a3b6-48b6-249b67353e83"),
                column: "ShortId",
                value: "");

            migrationBuilder.UpdateData(
                table: "Drivers",
                keyColumn: "Id",
                keyValue: new Guid("64a7790b-4b92-80a9-3a2a-03fb9d98b05f"),
                column: "ShortId",
                value: "");

            migrationBuilder.UpdateData(
                table: "Drivers",
                keyColumn: "Id",
                keyValue: new Guid("735e85c2-9ba1-f60f-0dea-8e21f1c4dc9a"),
                column: "ShortId",
                value: "d15");

            migrationBuilder.UpdateData(
                table: "Drivers",
                keyColumn: "Id",
                keyValue: new Guid("745050ab-268c-5754-2606-d663597b570f"),
                column: "ShortId",
                value: "d17");

            migrationBuilder.UpdateData(
                table: "Drivers",
                keyColumn: "Id",
                keyValue: new Guid("7b6577b2-0a6a-c5b3-aaca-b30c33f25d7c"),
                column: "ShortId",
                value: "");

            migrationBuilder.UpdateData(
                table: "Drivers",
                keyColumn: "Id",
                keyValue: new Guid("91e3394b-3bd9-f44b-3171-849b1c57732a"),
                column: "ShortId",
                value: "d14");

            migrationBuilder.UpdateData(
                table: "Drivers",
                keyColumn: "Id",
                keyValue: new Guid("9886fa28-c6f5-8ac6-0c21-c541a9f852c6"),
                column: "ShortId",
                value: "");

            migrationBuilder.UpdateData(
                table: "Drivers",
                keyColumn: "Id",
                keyValue: new Guid("ab8d917d-ec64-eb66-3773-cf8582e96cba"),
                column: "ShortId",
                value: "d16");

            migrationBuilder.UpdateData(
                table: "Drivers",
                keyColumn: "Id",
                keyValue: new Guid("c244732e-477c-e11a-b1f5-348679b94a10"),
                column: "ShortId",
                value: "d10");

            migrationBuilder.UpdateData(
                table: "Drivers",
                keyColumn: "Id",
                keyValue: new Guid("cbb32719-50f5-65fc-163f-32d5f9aaf4c6"),
                column: "ShortId",
                value: "d20");

            migrationBuilder.UpdateData(
                table: "Drivers",
                keyColumn: "Id",
                keyValue: new Guid("cdd4c299-9631-55d1-16ef-8468b02b7f6a"),
                column: "ShortId",
                value: "d11");

            migrationBuilder.UpdateData(
                table: "Drivers",
                keyColumn: "Id",
                keyValue: new Guid("d508bc6b-ad33-2380-ebaf-352f3bba5371"),
                column: "ShortId",
                value: "");

            migrationBuilder.UpdateData(
                table: "Drivers",
                keyColumn: "Id",
                keyValue: new Guid("dea9228a-a0d5-9748-d831-db804e477fc6"),
                column: "ShortId",
                value: "d19");

            migrationBuilder.UpdateData(
                table: "Drivers",
                keyColumn: "Id",
                keyValue: new Guid("e514af89-84d6-002d-adc5-0eb3e9a24948"),
                column: "ShortId",
                value: "d21");

            migrationBuilder.UpdateData(
                table: "Drivers",
                keyColumn: "Id",
                keyValue: new Guid("f0d37f82-ded8-8ff2-a952-9ab5be53ea8d"),
                column: "ShortId",
                value: "");

            migrationBuilder.UpdateData(
                table: "Drivers",
                keyColumn: "Id",
                keyValue: new Guid("fbc7ca24-e841-a075-50f1-69ca092ef3e1"),
                column: "ShortId",
                value: "d12");

            migrationBuilder.UpdateData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("0149216f-68a5-d03c-1e6e-7732583cfb28"),
                column: "ShortId",
                value: "v16");

            migrationBuilder.UpdateData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("10067d0d-1efd-fc0c-f4a6-0b4a581c1bdd"),
                column: "ShortId",
                value: "v4");

            migrationBuilder.UpdateData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("17e89bf7-b127-d6a7-5797-9761c11594e8"),
                column: "ShortId",
                value: "v17");

            migrationBuilder.UpdateData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("21169e6b-40e5-3a40-c9d4-eef6c38112cf"),
                column: "ShortId",
                value: "v11");

            migrationBuilder.UpdateData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("21b53a09-1be0-a850-d0bf-e2578a2ebdba"),
                column: "ShortId",
                value: "v8");

            migrationBuilder.UpdateData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("4a7bf352-ed88-78ce-3579-ed38e0ee2faf"),
                column: "ShortId",
                value: "v15");

            migrationBuilder.UpdateData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("4fa3efcc-e035-45e0-7034-4f0a27742267"),
                column: "ShortId",
                value: "v10");

            migrationBuilder.UpdateData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("5c8013f1-10c7-5d49-9b4c-2ba4f56990f6"),
                column: "ShortId",
                value: "v18");

            migrationBuilder.UpdateData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("6e0077f4-1f0b-c67b-2eb2-b764279207b8"),
                column: "ShortId",
                value: "v6");

            migrationBuilder.UpdateData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("783dc9b7-365c-8fe3-4c34-ae63ee83284b"),
                column: "ShortId",
                value: "v12");

            migrationBuilder.UpdateData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("7de94cc6-2982-88e8-c2da-3559a894fea5"),
                column: "ShortId",
                value: "v7");

            migrationBuilder.UpdateData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("9dd7185b-0853-96c5-d1e6-df175f4bbed1"),
                column: "ShortId",
                value: "v20");

            migrationBuilder.UpdateData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("b37c6374-2154-bfa8-e380-301baa2af18a"),
                column: "ShortId",
                value: "v2");

            migrationBuilder.UpdateData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("c189cab9-76e4-5b04-1de8-90c7a02f7532"),
                column: "ShortId",
                value: "v1");

            migrationBuilder.UpdateData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("c44c3bee-3748-3bef-49a8-aee25a5e2d26"),
                column: "ShortId",
                value: "v-ind-001");

            migrationBuilder.UpdateData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("c4731324-0015-4689-b173-2b5acf5fda80"),
                column: "ShortId",
                value: "v14");

            migrationBuilder.UpdateData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("debe8e1b-0e14-e18a-7311-ddf05b47e365"),
                column: "ShortId",
                value: "v9");

            migrationBuilder.UpdateData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("e4557749-9e52-3e01-8df5-cc79338d17fd"),
                column: "ShortId",
                value: "v19");

            migrationBuilder.UpdateData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("eeb3d93a-10c8-f3d9-90d1-bf6f82d9d4a3"),
                column: "ShortId",
                value: "v3");

            migrationBuilder.UpdateData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("fad28352-9c16-ef00-306c-29b60bb6c655"),
                column: "ShortId",
                value: "v13");

            migrationBuilder.UpdateData(
                table: "Vehicles",
                keyColumn: "Id",
                keyValue: new Guid("fc44b423-58a9-a559-d16f-07e2f2586854"),
                column: "ShortId",
                value: "v5");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ShortId",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "ShortId",
                table: "Drivers");

            migrationBuilder.DropColumn(
                name: "ShortId",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "ShortId",
                table: "Branches");
        }
    }
}
