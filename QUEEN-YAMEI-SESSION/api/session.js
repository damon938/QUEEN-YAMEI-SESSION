import { default as makeWASocket, fetchLatestBaileysVersion, useMultiFileAuthState } from "@whiskeysockets/baileys";
import QRCode from "qrcode";

export default async function handler(req, res) {
    const type = req.query.type; // "pair" ou "qr"
    try {
        const { state, saveCreds } = await useMultiFileAuthState("./session");
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({ version, auth: state, printQRInTerminal: false });

        if (type === "pair") {
            const code = await sock.requestPairingCode();
            res.status(200).json({ pairCode: code });
        } else if (type === "qr") {
            sock.ev.on("connection.update", async (update) => {
                const { qr } = update;
                if (qr) {
                    const qrImage = await QRCode.toDataURL(qr);
                    res.status(200).json({ qr: qrImage });
                }
            });
        } else {
            res.status(400).json({ error: "Type manquant" });
        }

        sock.ev.on("creds.update", saveCreds);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}api/session.js
