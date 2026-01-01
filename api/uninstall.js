import { Client } from 'ssh2';

export default async function handler(req, res) {
    const { key, ip, pw } = req.body;
    if (key !== 'KYXZAN') return res.status(401).json({ success: false, message: 'Invalid Key' });

    const conn = new Client();
    return new Promise((resolve) => {
        conn.on('ready', () => {
            const cmd = `nohup bash <(curl -s https://pterodactyl-installer.se) <<EOF
6
y
y
y
y


EOF
> uninstall.log 2>&1 &`;

            conn.exec(cmd, (err) => {
                res.status(200).json({ success: true, message: 'Uninstall process started.' });
                conn.end();
                resolve();
            });
        }).connect({ host: ip, port: 22, username: 'root', password: pw });
    });
}
