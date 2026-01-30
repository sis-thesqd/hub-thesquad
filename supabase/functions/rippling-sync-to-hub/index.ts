import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Destination is this project (cjeopzhpxgxnafgynspd)
const destUrl = Deno.env.get("SUPABASE_URL")!;
const destKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const destClient = createClient(destUrl, destKey);

// Table configuration with primary key info
interface TableConfig {
  destTable: string;
  primaryKey: string | string[];
}

const tableMap: Record<string, TableConfig> = {
  workers: { destTable: "rippling_workers", primaryKey: "id" },
  departments: { destTable: "rippling_departments", primaryKey: "id" },
  squad_division_mapping: { destTable: "rippling_department_mapping", primaryKey: ["squad_id", "division_id"] },
};

Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const { type, table, schema, record, old_record } = payload;

    // Only handle rippling schema
    if (schema !== "rippling") {
      return new Response(
        JSON.stringify({ skipped: true, reason: `Not rippling schema: ${schema}` }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const config = tableMap[table];
    if (!config) {
      return new Response(
        JSON.stringify({ skipped: true, reason: `Unknown table: ${table}` }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const { destTable, primaryKey } = config;
    const onConflict = Array.isArray(primaryKey) ? primaryKey.join(",") : primaryKey;

    let result;

    switch (type) {
      case "INSERT":
      case "UPDATE":
        // Add synced_at timestamp
        const recordWithSync = { ...record, synced_at: new Date().toISOString() };

        const { data, error } = await destClient
          .from(destTable)
          .upsert(recordWithSync, { onConflict })
          .select();

        if (error) throw error;
        result = { action: type, table: destTable, data };
        break;

      case "DELETE":
        let query = destClient.from(destTable).delete();

        if (Array.isArray(primaryKey)) {
          // Composite key - add multiple eq conditions
          for (const key of primaryKey) {
            const value = old_record?.[key];
            if (!value) {
              throw new Error(`No ${key} found in old_record for DELETE`);
            }
            query = query.eq(key, value);
          }
        } else {
          // Single key
          const deleteId = old_record?.[primaryKey];
          if (!deleteId) {
            throw new Error(`No ${primaryKey} found in old_record for DELETE`);
          }
          query = query.eq(primaryKey, deleteId);
        }

        const { error: deleteError } = await query;
        if (deleteError) throw deleteError;

        result = { action: "DELETE", table: destTable, keys: old_record };
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown event type: ${type}` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    console.log(`Synced ${type} on ${schema}.${table} -> ${destTable}`);

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
