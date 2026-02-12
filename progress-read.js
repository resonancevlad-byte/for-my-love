export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    res.status(500).json({ error: "Supabase env missing" });
    return;
  }

  const login = String(req.query.login || "").trim();
  if (!login) {
    res.status(400).json({ error: "Missing login" });
    return;
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/progress?login=eq.${encodeURIComponent(login)}&select=login,display_name,group,opened_days,coupons,updated_at`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`
        }
      }
    );

    if (!response.ok) {
      const text = await response.text();
      res.status(502).json({ error: "Supabase error", detail: text });
      return;
    }

    const data = await response.json();
    res.status(200).json({ data: data && data[0] ? data[0] : null });
  } catch (error) {
    res.status(500).json({ error: "Request failed" });
  }
}
