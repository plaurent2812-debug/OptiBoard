import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error("Error:", JSON.stringify(error, null, 2));
    } else {
        if (data.length > 0) {
           console.log("Columns:", Object.keys(data[0]));
        } else {
           console.log("Table is empty, no data to infer columns from.");
        }
    }
}
checkSchema();
