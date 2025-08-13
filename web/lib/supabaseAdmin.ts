import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export const supabaseAdmin = (() => {
	if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
		return null as unknown as ReturnType<typeof createClient>;
	}
	return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
})();

