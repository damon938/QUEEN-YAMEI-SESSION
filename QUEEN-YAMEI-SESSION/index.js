import express from "express";
import { default as makeWASocket, fetchLatestBaileysVersion, useMultiFileAuthState } from "@whiskeysockets/baileys";
import QRCode from "qrcode";

const app = express();
app.use(express.static("public"));
app.use(express.json());

const PORT = process.env.PORT || 3000;

// PAIR CODE
app.get("/pair", async (req, res) => {
    try {
        const { state, saveCreds } = await useMultiFileAuthState("./session");
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({ version, auth: state, printQRInTerminal: false });
        const code = await sock.requestPairingCode();
        res.json({ pairCode: code });

        sock.ev.on("creds.update", saveCreds);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// QR CODE
app.get("/qr", async (req, res) => {
    try {
        const { state, saveCreds } = await useMultiFileAuthState("./session");
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({ version, auth: state, printQRInTerminal: false });
        sock.ev.on("connection.update", async (update) => {
            const { qr } = update;
            if (qr) {
                const qrImage = await QRCode.toDataURL(qr);
                res.json({ qr: qrImage });
            }
        });

        sock.ev.on("creds.update", saveCreds);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, () => console.log(`QUEEN YAMEI SESSION RUNNING on ${PORT}`));
