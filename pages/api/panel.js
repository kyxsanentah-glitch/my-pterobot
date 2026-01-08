// pages/api/panel.js
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { host, ptla, ptlc, action, payload } = req.body;
  if (!host || !ptla) {
    return res.status(401).json({ error: "Missing Credentials" });
  }

  const cleanHost = host.replace(/\/$/, "");

  const appApi = axios.create({
    baseURL: `${cleanHost}/api/application`,
    headers: {
      'Authorization': `Bearer ${ptla}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  const clientApi = axios.create({
    baseURL: `${cleanHost}/api/client`,
    headers: {
      'Authorization': `Bearer ${ptlc}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  try {
    switch (action) {
      case 'check_connection':
        await appApi.get('/users?per_page=1');
        res.json({ status: 'connected' });
        break;

      case 'get_stats':
        const [uRes, sRes] = await Promise.all([
          appApi.get('/users?per_page=100'),
          appApi.get('/servers?per_page=100')
        ]);
        res.json({
          users: uRes.data.data,
          servers: sRes.data.data
        });
        break;

      case 'auto_deploy':
        const { username, password } = payload;
        const userRes = await appApi.post('/users', {
          username,
          email: `${username}@saturnz-x.com`,
          first_name: username,
          last_name: "Manual",
          password
        });
        const newUserId = userRes.data.attributes.id;

        const serverPayload = {
          name: `Srv-${username}`,
          user: parseInt(newUserId),
          nest: 5, egg: 5,
          docker_image: "ghcr.io/pterodactyl/yolks:nodejs_20",
          startup: "if [[ -f package.json ]]; then npm install; fi; node {{MAIN_FILE}}",
          environment: { "MAIN_FILE": "index.js", "USER_UPLOAD": "0" },
          limits: { memory: 1024, swap: 0, disk: 1024, io: 500, cpu: 100 },
          feature_limits: { databases: 1, backups: 1 },
          deploy: { locations: [1], dedicated_ip: false, port_range: [] }
        };
        await appApi.post('/servers', serverPayload);
        res.json({ msg: "DEPLOY SUCCESS", detail: `User: ${username} | Pass: ${password}` });
        break;

      case 'delete_server':
        await appApi.delete(`/servers/${payload.id}`);
        res.json({ msg: "Server Deleted" });
        break;

      case 'delete_user':
        await appApi.delete(`/users/${payload.id}`);
        res.json({ msg: "User Deleted" });
        break;

      case 'delete_offline':
        const allServers = await appApi.get('/servers?per_page=50');
        let deletedCount = 0;
        for (const s of allServers.data.data) {
          try {
            const statusRes = await clientApi.get(`/servers/${s.attributes.uuid}/resources`);
            if (statusRes.data.attributes.current_state === 'offline') {
              await appApi.delete(`/servers/${s.attributes.id}`);
              deletedCount++;
            }
          } catch (e) {
            await appApi.delete(`/servers/${s.attributes.id}`);
            deletedCount++;
          }
        }
        res.json({ msg: `Pruned ${deletedCount} servers` });
        break;

      case 'nuke_all':
        if (payload.confirm !== "CONFIRM") return res.status(400).end();
        const sList = await appApi.get('/servers?per_page=50');
        for (const s of sList.data.data) await appApi.delete(`/servers/${s.attributes.id}`);
        const uList = await appApi.get('/users?per_page=50');
        for (const u of uList.data.data) {
          if (!u.attributes.root_admin) await appApi.delete(`/users/${u.attributes.id}`);
        }
        res.json({ msg: "Wipeout Complete" });
        break;

      default:
        res.status(404).json({ error: "Action not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
