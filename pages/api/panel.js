// pages/api/panel.js
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { host, ptla, ptlc, action, payload } = req.body;

  if (!host || !ptla) {
    return res.status(401).json({ error: "Missing Credentials (Host/PTLA)" });
  }

  // Bersihkan trailing slash pada host
  const cleanHost = host.replace(/\/$/, "");

  // Instance Axios Dinamis
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
      'Authorization': `Bearer ${ptlc}`, // PTLC opsional kecuali untuk fitur cek status
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  try {
    switch (action) {
      case 'check_connection':
        // Cek validitas user admin
        const check = await appApi.get('/users?per_page=1');
        res.json({ status: 'connected', msg: `Connected to ${cleanHost}` });
        break;

      case 'get_stats':
        const [users, servers] = await Promise.all([
          appApi.get('/users?per_page=100'),
          appApi.get('/servers?per_page=100')
        ]);
        res.json({
          users: users.data.data,
          servers: servers.data.data
        });
        break;

      case 'create_user':
        const newUser = await appApi.post('/users', {
          username: payload.username,
          email: payload.email,
          first_name: payload.username,
          last_name: "Member",
          password: payload.password
        });
        res.json(newUser.data);
        break;

      case 'create_server':
        // NOTE: Ganti egg: 1 dan nest: 1 sesuai setup panelmu (biasanya Minecraft)
        // Gunakan docker_image yang sesuai.
        const newServer = await appApi.post('/servers', {
          name: payload.name,
          user: parseInt(payload.userId),
          egg: 1, 
          docker_image: "ghcr.io/pterodactyl/yolks:java_17",
          startup: "java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar",
          environment: { "SERVER_JARFILE": "server.jar" },
          limits: { memory: 1024, swap: 0, disk: 1024, io: 500, cpu: 100 },
          feature_limits: { databases: 0, backups: 0 },
          allocation: { default: 1 } 
        });
        res.json(newServer.data);
        break;

      case 'delete_user':
        await appApi.delete(`/users/${payload.id}`);
        res.json({ success: true });
        break;

      case 'delete_server':
        await appApi.delete(`/servers/${payload.id}`);
        res.json({ success: true });
        break;

      case 'delete_offline':
        if (!ptlc) return res.status(400).json({ error: "PTLC Key Required for this action" });
        
        const allSrv = await appApi.get('/servers?per_page=100');
        let deleted = 0;
        
        // Loop check status (Hati-hati rate limit Vercel 10s timeout)
        // Kita batasi max 10 server check per batch agar tidak timeout
        const targetServers = allSrv.data.data.slice(0, 15); 

        for (const s of targetServers) {
          try {
            const uuid = s.attributes.uuid;
            const resStatus = await clientApi.get(`/servers/${uuid}/resources`);
            const state = resStatus.data.attributes.current_state;
            
            if (state === 'offline' || state === 'stopping') {
              await appApi.delete(`/servers/${s.attributes.id}`);
              deleted++;
            }
          } catch (e) {
             // Jika error (misal server suspended/node mati), anggap offline
             // await appApi.delete(`/servers/${s.attributes.id}`);
             // deleted++;
          }
        }
        res.json({ msg: `Scanned 15 servers, deleted ${deleted} offline.` });
        break;

      case 'nuke_all':
        if (payload.confirm !== "CONFIRM") return res.status(400).json({ error: "Invalid Confirm" });
        
        // Hapus Server
        const sList = await appApi.get('/servers?per_page=50');
        for (const s of sList.data.data) {
          await appApi.delete(`/servers/${s.attributes.id}`);
        }
        // Hapus User (Kecuali Admin)
        const uList = await appApi.get('/users?per_page=50');
        for (const u of uList.data.data) {
          if (!u.attributes.root_admin) {
            await appApi.delete(`/users/${u.attributes.id}`);
          }
        }
        res.json({ msg: "Nuke executed on current page batch." });
        break;

      default:
        res.status(404).json({ error: "Action unknown" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message, detail: error.response?.data });
  }
}
