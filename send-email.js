// ============================================
// API SEND EMAIL - VERCEL
// ============================================
const nodemailer = require('nodemailer');

// Konfigurasi email (pakai environment variable)
const EMAIL_USER = process.env.EMAIL_USER || 'emailkamu@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'apppasswordkamu';
const EMAIL_TO = process.env.EMAIL_TO || 'emailtujuan@gmail.com'; // Email owner

// Buat transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});

// ===== HANDLER UTAMA =====
module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Cuma terima POST
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            message: 'Method not allowed' 
        });
    }

    try {
        const { apiKey, to, subject, text, html, numbers, result } = req.body;

        // ===== VALIDASI API KEY =====
        const validApiKey = process.env.API_KEY || 'beckk001';
        if (apiKey !== validApiKey) {
            return res.status(401).json({
                success: false,
                message: 'Invalid API Key'
            });
        }

        // ===== VALIDASI DATA =====
        if (!to && !EMAIL_TO) {
            return res.status(400).json({
                success: false,
                message: 'Email tujuan tidak ditemukan'
            });
        }

        const targetEmail = to || EMAIL_TO;

        // ===== BUILD PESAN =====
        let emailSubject = subject || 'Hasil Fixmerah';
        let emailText = text || '';
        let emailHtml = html || '';

        // Kalo ada data numbers & result, bikin format otomatis
        if (numbers && result) {
            const redNumbers = result.filter(r => r.status?.includes('MERAH'));
            const normalNumbers = result.filter(r => r.status?.includes('Normal'));
            const notRegistered = result.filter(r => r.status?.includes('Tidak terdaftar'));

            emailSubject = `🔴 Hasil Fixmerah - ${numbers.length} nomor`;
            emailText = `
🔴 HASIL FIX NOMOR MERAH
━━━━━━━━━━━━━━━━━━━━━━

📊 Total: ${numbers.length} nomor

🔴 Merah: ${redNumbers.length}
🟢 Normal: ${normalNumbers.length}
❌ Tidak Terdaftar: ${notRegistered.length}

━━━━━━━━━━━━━━━━━━━━━━
🔴 NOMOR MERAH
━━━━━━━━━━━━━━━━━━━━━━

${redNumbers.map(r => `📱 ${r.nomor}
   └─ Bio: ${r.bio || '(tidak terbaca)'}
   └─ Foto: ${r.hasPhoto || '❌'}`).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━
🟢 NOMOR NORMAL
━━━━━━━━━━━━━━━━━━━━━━

${normalNumbers.map(r => `📱 ${r.nomor}
   └─ Bio: ${r.bio || '-'}`).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━
❌ TIDAK TERDAFTAR
━━━━━━━━━━━━━━━━━━━━━━

${notRegistered.map(r => `📱 ${r.nomor}`).join('\n')}
`;
            emailHtml = emailText.replace(/\n/g, '<br>');
        }

        // ===== KIRIM EMAIL =====
        const mailOptions = {
            from: `"Bot Fixmerah" <${EMAIL_USER}>`,
            to: targetEmail,
            subject: emailSubject,
            text: emailText,
            html: emailHtml || emailText.replace(/\n/g, '<br>')
        };

        const info = await transporter.sendMail(mailOptions);

        return res.status(200).json({
            success: true,
            message: 'Email berhasil dikirim!',
            messageId: info.messageId,
            to: targetEmail
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};