import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { host, ptla, ptlc, action, payload } = req.body;
  if (!host || !ptla) return res.status(401).json({ error: "Access Denied" });

  const cleanHost = host.replace(/\/$/, "");
  const headers = { 'Authorization': `Bearer ${ptla}`, 'Content-Type': 'application/json', 'Accept': 'application/json' };
  const clientHeaders = { 'Authorization': `Bearer ${ptlc}`, 'Content-Type': 'application/json', 'Accept': 'application/json' };

  try {
    switch (action) {
      case 'check_connection':
        await axios.get(`${cleanHost}/api/application/users?per_page=1`, { headers });
        res.json({ status: 'connected' });
        break;

      case 'get_stats':
        const [u, s] = await Promise.all([
          axios.get(`${cleanHost}/api/application/users?per_page=100`, { headers }),
          axios.get(`${cleanHost}/api/application/servers?per_page=100`, { headers })
        ]);
        res.json({ users: u.data.data, servers: s.data.data });
        break;

      case 'auto_deploy':
        const { username, password } = payload;
        const uRes = await axios.post(`${cleanHost}/api/application/users`, {
          username, email: `${username}@saturnz-x.com`, first_name: username, last_name: "User", password
        }, { headers });
        
        const userId = uRes.data.attributes.id;
        const sPayload = {
          name: `SRV-${username.toUpperCase()}`,
          user: userId, nest: 5, egg: 5,
          docker_image: "ghcr.io/pterodactyl/yolks:nodejs_20",
          startup: "if [[ -f package.json ]]; then npm install; fi; node {{MAIN_FILE}}",
          environment: { "MAIN_FILE": "index.js", "USER_UPLOAD": "0" },
          limits: { memory: 1024, swap: 0, disk: 1024, io: 500, cpu: 100 },
          feature_limits: { databases: 1, backups: 1 },
          deploy: { locations: [1], dedicated_ip: false, port_range: [] }
        };
        await axios.post(`${cleanHost}/api/application/servers`, sPayload, { headers });
        res.json({ msg: "UPLINK SUCCESS", detail: `USER: ${username} | PASS: ${password}` });
        break;

      case 'delete_server':
        await axios.delete(`${cleanHost}/api/application/servers/${payload.id}`, { headers });
        res.json({ msg: "Wiped" });
        break;

      case 'delete_user':
        await axios.delete(`${cleanHost}/api/application/users/${payload.id}`, { headers });
        res.json({ msg: "Revoked" });
        break;

      case 'delete_offline':
        const list = await axios.get(`${cleanHost}/api/application/servers?per_page=100`, { headers });
        let count = 0;
        for (const srv of list.data.data) {
          try {
            const stats = await axios.get(`${cleanHost}/api/client/servers/${srv.attributes.uuid}/resources`, { headers: clientHeaders });
            if (stats.data.attributes.current_state === 'offline') {
              await axios.delete(`${cleanHost}/api/application/servers/${srv.attributes.id}`, { headers });
              count++;
            }
          } catch (e) {
             await axios.delete(`${cleanHost}/api/application/servers/${srv.attributes.id}`, { headers });
             count++;
          }
        }
        res.json({ msg: `${count} dead nodes pruned.` });
        break;

      case 'nuke_all':
        if (payload.confirm !== "CONFIRM") return res.status(400).end();
        const servers = await axios.get(`${cleanHost}/api/application/servers?per_page=100`, { headers });
        for (const s of servers.data.data) await axios.delete(`${cleanHost}/api/application/servers/${s.attributes.id}`, { headers });
        const users = await axios.get(`${cleanHost}/api/application/users?per_page=100`, { headers });
        for (const u of users.data.data) {
          if (!u.attributes.root_admin) await axios.delete(`${cleanHost}/api/application/users/${u.attributes.id}`, { headers });
        }
        res.json({ msg: "System Zeroed." });
        break;

      default:
        res.status(404).end();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
