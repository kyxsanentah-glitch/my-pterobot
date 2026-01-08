import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { host, ptla, ptlc, action, payload } = req.body;
  if (!host || !ptla) {
    return res.status(401).json({ error: "Missing Credentials (Host/PTLA)" });
  }

  const cleanHost = host.replace(/\/$/, "");

  // Instance untuk Application API (Admin)
  const appApi = axios.create({
    baseURL: `${cleanHost}/api/application`,
    headers: {
      'Authorization': `Bearer ${ptla}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Instance untuk Client API (User/Power)
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
        res.json({ status: 'connected', msg: `Connected to ${cleanHost}` });
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
        // 1. Create User
        const userRes = await appApi.post('/users', {
          username: username,
          email: `${username}@saturnz-x.com`,
          first_name: username,
          last_name: "Manual",
          password: password
        });

        const newUserId = userRes.data.attributes.id;

        // 2. Create Server (NodeJS: Egg 5, Loc 1, Nest 5)
        const serverPayload = {
          name: `Srv-${username}`,
          user: parseInt(newUserId),
          nest: 5,
          egg: 5,
          docker_image: "ghcr.io/pterodactyl/yolks:nodejs_20",
          startup: "if [[ -f package.json ]]; then npm install; fi; node {{MAIN_FILE}}",
          environment: { "MAIN_FILE": "index.js", "USER_UPLOAD": "0" },
          limits: { memory: 1024, swap: 0, disk: 1024, io: 500, cpu: 100 },
          feature_limits: { databases: 1, backups: 1 },
          deploy: { locations: [1], dedicated_ip: false, port_range: [] }
        };

        const newServer = await appApi.post('/servers', serverPayload);
        res.json({ 
          msg: `DEPLOY SUCCESS!`, 
          detail: `Account: ${username} | Password: ${password}` 
        });
        break;

      case 'delete_server':
        await appApi.delete(`/servers/${payload.id}`);
        res.json({ msg: "Server Deleted Successfully" });
        break;

      case 'delete_user':
        await appApi.delete(`/users/${payload.id}`);
        res.json({ msg: "User Deleted Successfully" });
        break;

      case 'delete_offline':
        if (!ptlc) return res.status(400).json({ error: "PTLC Key Required for cleanup" });
        const allServers = await appApi.get('/servers?per_page=50');
        let deletedCount = 0;

        for (const s of allServers.data.data) {
          try {
            const statusRes = await clientApi.get(`/servers/${s.attributes.uuid}/resources`);
            const state = statusRes.data.attributes.current_state;
            if (state === 'offline' || state === 'stopping') {
              await appApi.delete(`/servers/${s.attributes.id}`);
              deletedCount++;
            }
          } catch (e) {
            // Jika error cek status, biasanya server bermasalah, hapus saja
            await appApi.delete(`/servers/${s.attributes.id}`);
            deletedCount++;
          }
        }
        res.json({ msg: `Pruned ${deletedCount} offline servers.` });
        break;

      case 'nuke_all':
        if (payload.confirm !== "CONFIRM") return res.status(400).json({ error: "Nuke Denied" });
        const sList = await appApi.get('/servers?per_page=50');
        for (const s of sList.data.data) {
          await appApi.delete(`/servers/${s.attributes.id}`);
        }
        const uList = await appApi.get('/users?per_page=50');
        for (const u of uList.data.data) {
          if (!u.attributes.root_admin) await appApi.delete(`/users/${u.attributes.id}`);
        }
        res.json({ msg: "System Wipeout Complete." });
        break;

      default:
        res.status(404).json({ error: "Action not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      error: error.message, 
      detail: error.response?.data?.errors?.[0]?.detail || "Internal Server Error" 
    });
  }
}
