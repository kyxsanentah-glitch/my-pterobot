import { Client } from 'ssh2';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    
    const { key, ip, pw, domPnl, domNode, ram } = req.body;
    
    // Sesuaikan Access Key lo di sini
    if (key !== 'SATURNX_KEY') {
        return res.status(401).json({ success: false, message: 'Invalid Access Key!' });
    }

    const conn = new Client();
    
    return new Promise((resolve) => {
        conn.on('ready', () => {
            // Menggunakan heredoc untuk otomatisasi jawaban prompt bash
            const fullCommand = `nohup bash -c "
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
            " > install.log 2>&1 &`;

            conn.exec(fullCommand, (err) => {
                if (err) {
                    resolve(res.status(500).json({ success: false, message: 'SSH Exec Error' }));
                    return conn.end();
                }
                res.status(200).json({ 
                    success: true, 
                    message: 'Installation Triggered! Silahkan cek berkala domain anda.' 
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
