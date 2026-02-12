export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    res.status(500).json({ error: "Supabase env missing" });
    return;
  }

  let payload = {};
  if (typeof req.body === "string") {
    try {
      payload = JSON.parse(req.body || "{}");
    } catch (error) {
      res.status(400).json({ error: "Invalid JSON" });
      return;
    }
  } else if (req.body && typeof req.body === "object") {
    payload = req.body;
  }

  const login = String(payload.login || "").trim();
  const group = String(payload.group || "").trim();
  const displayName = String(payload.displayName || login).trim();

  if (!login || !group) {
    res.status(400).json({ error: "Missing login or group" });
    return;
  }

  const openedDaysRaw = Array.isArray(payload.openedDays) ? payload.openedDays : [];
  const openedDays = Array.from(
    new Set(
      openedDaysRaw
        .map((value) => parseInt(value, 10))
        .filter((value) => Number.isFinite(value) && value > 0)
    )
  ).sort((a, b) => a - b);

  const coupons = Array.isArray(payload.coupons) ? payload.coupons : [];

  const now = new Date().toISOString();
  const record = {
    login,
    display_name: displayName,
    group,
    opened_days: openedDays,
    coupons,
    updated_at: now
  };

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/progress?on_conflict=login`,
      {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal"
        },
        body: JSON.stringify(record)
      }
    );

    if (!response.ok) {
      const text = await response.text();
      res.status(502).json({ error: "Supabase error", detail: text });
      return;
    }

    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: "Request failed" });
  }
}
