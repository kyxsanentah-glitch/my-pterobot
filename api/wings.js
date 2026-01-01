import { Client } from 'ssh2';

export default async function handler(req, res) {
    const { key, ip, pw, token } = req.body;
    if (key !== 'KYXZAN') return res.status(401).json({ success: false, message: 'Invalid Key' });

    const conn = new Client();
    return new Promise((resolve) => {
        conn.on('ready', () => {
            const cmd = `nohup bash <(curl -s https://raw.githubusercontent.com/sevsbotz/sevsrawr/refs/heads/main/install.sh) <<EOF
3
${token}
EOF
> wings.log 2>&1 &`;

            conn.exec(cmd, (err) => {
                if (err) resolve(res.status(500).json({ success: false, message: 'Failed' }));
                res.status(200).json({ success: true, message: 'Wings start process initiated.' });
                conn.end();
                resolve();
            });
        }).connect({ host: ip, port: 22, username: 'root', password: pw });
    });
}
