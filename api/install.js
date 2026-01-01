const { Client } = require('ssh2');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    
    const { key, ip, pw, domPnl, domNode, ram } = req.body;
    
    // Ganti 'SATURNX_KEY' dengan key rahasia lo
    if (key !== 'SATURNX_KEY') return res.status(401).json({ success: false, message: 'Invalid Access Key!' });

    const conn = new Client();
    
    return new Promise((resolve) => {
        conn.on('ready', () => {
            // Kita gabungkan script Install Panel + Wings + Create Node dalam satu command berantai
            const fullCommand = `nohup bash -c "
            # Auto Install Panel
            bash <(curl -s https://pterodactyl-installer.se) <<EOF
0
kyxzan
kyxzan
kyxzan
Asia/Jakarta
kyxzan@gmail.com
kyxzan@gmail.com
kyxzan
kyxzan
kyxzan
kyxzan
${domPnl}
y
y
y
y
yes
Y
1
EOF

            # Auto Install Wings
            bash <(curl -s https://pterodactyl-installer.se) <<EOF
1
y
y
y
${domPnl}
y
kyxzan
kyxzan
y
${domNode}
y
kyxzan@gmail.com
y
EOF

            # Create Node logic
            bash <(curl -s https://raw.githubusercontent.com/LeXcZxMoDz9/Installerlex/refs/heads/main/install.sh) <<EOF
4
kyxzan
KELAZKINK
${domNode}
KELAZKINK
${ram}
${ram}
1
EOF
            " > install.log 2>&1 &`;

            conn.exec(fullCommand, (err) => {
                if (err) {
                    resolve(res.status(500).json({ success: false, message: 'SSH Exec Error' }));
                    return conn.end();
                }
                res.status(200).json({ 
                    success: true, 
                    message: 'Proses Instalasi telah dikirim! VPS sedang bekerja di background. Tunggu 5-10 menit lalu buka domain lo.' 
                });
                conn.end();
                resolve();
            });
        }).on('error', (err) => {
            res.status(400).json({ success: false, message: 'Koneksi VPS Gagal: ' + err.message });
            resolve();
        }).connect({ host: ip, port: 22, username: 'root', password: pw });
    });
}
