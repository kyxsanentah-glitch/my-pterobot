import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { host, ptla, ptlc, action, payload } = req.body;
  if (!host || !ptla) return res.status(401).json({ error: "Missing Credentials" });

  const cleanHost = host.replace(/\/$/, "");
  const appApi = axios.create({
    baseURL: `${cleanHost}/api/application`,
    headers: { 'Authorization': `Bearer ${ptla}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
  });

  const clientApi = axios.create({
    baseURL: `${cleanHost}/api/client`,
    headers: { 'Authorization': `Bearer ${ptlc}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
  });

  try {
    switch (action) {
      case 'get_stats_full':
        const [uRes, sRes] = await Promise.all([
          appApi.get('/users?per_page=100'),
          appApi.get('/servers?per_page=100')
        ]);
        
        // Ambil status online/offline via Client API (Hanya jika PTLC ada)
        const serversWithStatus = await Promise.all(sRes.data.data.map(async (srv) => {
          let status = 'unknown';
          if (ptlc) {
            try {
              const st = await clientApi.get(`/servers/${srv.attributes.uuid}/resources`);
              status = st.data.attributes.current_state;
            } catch (e) { status = 'error'; }
          }
          return { ...srv, status };
        }));

        res.json({ users: uRes.data.data, servers: serversWithStatus });
        break;

      case 'auto_create':
        // 1. Buat User Otomatis
        const username = `user_${Math.random().toString(36).substring(7)}`;
        const userRes = await appApi.post('/users', {
          username, email: `${username}@saturnz.com`,
          first_name: "Saturnz", last_name: "Member",
          password: "SaturnzPassword123!"
        });
        
        // 2. Buat Server Otomatis untuk User tersebut
        // Menggunakan Nest 1, Egg 1, Node 1, Allocation 1 (Default Ptero)
        const serverRes = await appApi.post('/servers', {
          name: `Server_${username}`, user: userRes.data.attributes.id,
          egg: 1, docker_image: "ghcr.io/pterodactyl/yolks:java_17",
          startup: "java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar",
          environment: { "SERVER_JARFILE": "server.jar" },
          limits: { memory: 1024, swap: 0, disk: 1024, io: 500, cpu: 100 },
          feature_limits: { databases: 1, backups: 1 },
          allocation: { default: 1 } 
        });
        res.json({ msg: "User & Server Created Automatically!", user: userRes.data, server: serverRes.data });
        break;

      case 'nuke_panel':
        if (payload.confirm !== "SATURNZ_WIPE") return res.status(400).json({error: "Wrong Confirm"});
        const sList = await appApi.get('/servers?per_page=50');
        for (const s of sList.data.data) { await appApi.delete(`/servers/${s.attributes.id}`); }
        const uList = await appApi.get('/users?per_page=50');
        for (const u of uList.data.data) {
          if (!u.attributes.root_admin) await appApi.delete(`/users/${u.attributes.id}`);
        }
        res.json({ msg: "System Nuked: All non-admin data wiped." });
        break;

      case 'delete_server':
        await appApi.delete(`/servers/${payload.id}`);
        res.json({ msg: "Server Deleted" });
        break;

      case 'delete_user':
        await appApi.delete(`/users/${payload.id}`);
        res.json({ msg: "User Deleted" });
        break;

      default:
        res.status(404).json({ error: "Invalid Action" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message, detail: error.response?.data });
  }
}
