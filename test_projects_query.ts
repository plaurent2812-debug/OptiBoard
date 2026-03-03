import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    const { data, error } = await supabase
        .from('projects')
        .select(`
            id,
            title,
            status,
            total_ht,
            budget_estimate,
            client:client_id(name)
        `)
        .limit(1);
    
    if (error) {
        console.error("Error:", JSON.stringify(error, null, 2));
    } else {
        console.log("Success data:", data);
    }
}
testQuery();
