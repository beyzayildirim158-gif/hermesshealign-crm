const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const nodemailer = require('nodemailer');
const multer = require('multer');
const csv = require('csv-parser');
const path = require('path');
const SibApiV3Sdk = require('@sendinblue/client');
require('dotenv').config(); // Load environment variables

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(bodyParser.json());

const membersFilePath = './data/members.json';

// Email Service Configuration
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'gmail';

// Tsoft Configuration
const TSOFT_CONFIG = {
    host: process.env.TSOFT_HOST || 'mail.hermesshealing.com',
    port: parseInt(process.env.TSOFT_PORT) || 587,
    secure: process.env.TSOFT_PORT === '465', // SSL için true
    user: process.env.TSOFT_USER || '',
    password: process.env.TSOFT_PASSWORD || '',
    tls: {
        rejectUnauthorized: false
    },
    connectionTimeout: 10000, // 10 saniye timeout
    greetingTimeout: 5000
};

// Brevo API Key
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';

// Gmail credentials
const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';

// Multer setup for file uploads (CSV)
const uploadCSV = multer({ dest: 'uploads/' });

// Multer setup for email attachments
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/attachments/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});
const uploadAttachments = multer({ storage: storage });

// Multer setup for handling both attachments and message images
const uploadEmailFiles = uploadAttachments.fields([
    { name: 'attachments', maxCount: 5 },
    { name: 'messageImages', maxCount: 10 }
]);

// Helper function to read members from the JSON file
const readMembers = () => {
    const data = fs.readFileSync(membersFilePath);
    return JSON.parse(data);
};

// Helper function to write members to the JSON file
const writeMembers = (members) => {
    fs.writeFileSync(membersFilePath, JSON.stringify(members, null, 2));
};

// API endpoint to get email service configuration
app.get('/api/email-services', (req, res) => {
    const services = {
        available: [
            {
                id: 'tsoft',
                name: 'Tsoft (1posta.com)',
                icon: 'fa-building',
                configured: TSOFT_CONFIG.user !== 'YOUR_EMAIL@1posta.com',
                description: 'Türk Telekom - Hızlı ve güvenilir'
            },
            {
                id: 'brevo',
                name: 'Brevo (Sendinblue)',
                icon: 'fa-paper-plane',
                configured: BREVO_API_KEY !== 'xkeysib-YOUR_API_KEY_HERE',
                description: '300 mail/gün ücretsiz'
            },
            {
                id: 'gmail',
                name: 'Gmail',
                icon: 'fa-envelope',
                configured: true,
                description: 'Google Mail servisi'
            }
        ],
        current: EMAIL_SERVICE
    };
    res.json(services);
});

// API endpoint to set email service
app.post('/api/email-service', (req, res) => {
    const { service } = req.body;
    if (['tsoft', 'brevo', 'gmail'].includes(service)) {
        // Note: This will only work for the current session
        // For permanent change, user needs to edit server.js
        global.CURRENT_EMAIL_SERVICE = service;
        res.json({ success: true, service: service });
    } else {
        res.status(400).json({ success: false, error: 'Invalid service' });
    }
});

// API endpoint to get all members
app.get('/api/members', (req, res) => {
    const members = readMembers();
    res.json(members);
});

// API endpoint to add a new member
app.post('/api/members', (req, res) => {
    const members = readMembers();
    const { email, name } = req.body;
    
    // Email mükerrer kontrolü
    const emailExists = members.some(m => m.email.toLowerCase() === email.toLowerCase());
    
    if (emailExists) {
        return res.status(400).json({ 
            error: 'Bu e-posta adresi zaten kayıtlı!',
            duplicate: true 
        });
    }
    
    const newMember = {
        id: Date.now(),
        email: email,
        name: name
    };
    members.push(newMember);
    writeMembers(members);
    res.status(201).json(newMember);
});

// API endpoint to delete a single member
app.delete('/api/members/:id', (req, res) => {
    const members = readMembers();
    const memberId = parseFloat(req.params.id);
    const filteredMembers = members.filter(member => member.id !== memberId);
    writeMembers(filteredMembers);
    res.status(200).json({ message: 'Member deleted successfully' });
});

// API endpoint to delete all members
app.delete('/api/members', (req, res) => {
    writeMembers([]);
    res.status(200).json({ message: 'All members deleted successfully' });
});

// API endpoint to send emails with attachments and inline images
app.post('/api/send-email', uploadEmailFiles, async (req, res) => {
    console.log('📧 Email send request received');
    console.log('Request body:', req.body);
    console.log('Files:', req.files);
    
    const { subject, message, recipientIds, emailService } = req.body;
    const members = readMembers();
    
    console.log(`📋 Total members: ${members.length}`);
    console.log(`📨 Email service: ${emailService}`);
    
    // Use the service selected from frontend, or fall back to server default
    const selectedService = emailService || global.CURRENT_EMAIL_SERVICE || EMAIL_SERVICE;
    console.log(`✅ Selected service: ${selectedService}`);
    
    // Filter members based on selection
    let recipients = members;
    if (recipientIds) {
        const selectedIds = JSON.parse(recipientIds);
        recipients = members.filter(m => selectedIds.includes(m.id));
        console.log(`🎯 Filtered to ${recipients.length} selected recipients`);
    } else {
        console.log(`📬 Sending to all ${recipients.length} members`);
    }

    let successCount = 0;
    let failedEmails = [];

    try {
        if (selectedService === 'brevo') {
            // ===== BREVO (SENDINBLUE) INTEGRATION =====
            const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
            apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, BREVO_API_KEY);

            // Prepare attachments
            let attachments = [];
            if (req.files?.attachments) {
                attachments = req.files.attachments.map(file => ({
                    name: file.originalname,
                    content: fs.readFileSync(file.path).toString('base64')
                }));
            }

            // Prepare HTML content with embedded images
            let htmlContent = `<div style="font-family: Arial, sans-serif; padding: 20px;">
                <p style="white-space: pre-wrap;">${message}</p>`;
            
            if (req.files?.messageImages) {
                req.files.messageImages.forEach((file, index) => {
                    const base64Image = fs.readFileSync(file.path).toString('base64');
                    const mimeType = file.mimetype;
                    htmlContent += `<div style="margin: 15px 0;">
                        <img src="data:${mimeType};base64,${base64Image}" style="max-width: 100%; height: auto; border-radius: 10px;" />
                    </div>`;
                });
            }
            
            htmlContent += '</div>';

            // Send emails with Brevo
            const BATCH_SIZE = 50; // Brevo allows larger batches
            const EMAIL_DELAY = 100; // Much faster with Brevo

            for (let i = 0; i < recipients.length; i++) {
                const recipient = recipients[i];
                
                try {
                    const sendSmtpEmail = {
                        sender: { name: "Hermesshealing", email: GMAIL_USER },
                        to: [{ email: recipient.email, name: recipient.name }],
                        subject: subject,
                        htmlContent: htmlContent,
                        attachment: attachments
                    };

                    await apiInstance.sendTransacEmail(sendSmtpEmail);
                    successCount++;
                    console.log(`✓ [Brevo] Email sent to ${recipient.email} (${i + 1}/${recipients.length})`);
                    
                    // Small delay between emails
                    if (i < recipients.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, EMAIL_DELAY));
                    }
                    
                } catch (emailError) {
                    failedEmails.push({ email: recipient.email, error: emailError.message });
                    console.error(`✗ Failed to send email to ${recipient.email}:`, emailError.message);
                }
            }

        } else if (selectedService === 'tsoft') {
            // ===== TSOFT (1POSTA.COM - TELEKOM) INTEGRATION =====
            console.log('🔧 Creating Tsoft transporter with config:', {
                host: TSOFT_CONFIG.host,
                port: TSOFT_CONFIG.port,
                secure: TSOFT_CONFIG.secure,
                user: TSOFT_CONFIG.user
            });
            
            const transporter = nodemailer.createTransport({
                host: TSOFT_CONFIG.host,
                port: TSOFT_CONFIG.port,
                secure: TSOFT_CONFIG.secure,
                auth: {
                    user: TSOFT_CONFIG.user,
                    pass: TSOFT_CONFIG.password
                },
                tls: TSOFT_CONFIG.tls,
                connectionTimeout: TSOFT_CONFIG.connectionTimeout,
                greetingTimeout: TSOFT_CONFIG.greetingTimeout,
                pool: true,
                maxConnections: 5,
                maxMessages: 100,
                rateDelta: 1000,
                rateLimit: 5
            });
            
            // Test connection
            try {
                console.log('🔌 Testing Tsoft SMTP connection...');
                await transporter.verify();
                console.log('✅ Tsoft SMTP connection verified!');
            } catch (verifyError) {
                console.error('❌ Tsoft SMTP connection failed:', verifyError);
                throw new Error(`Tsoft SMTP bağlantısı başarısız: ${verifyError.message}`);
            }

            // Prepare regular attachments
            const attachments = req.files?.attachments ? req.files.attachments.map(file => ({
                filename: file.originalname,
                path: file.path
            })) : [];

            // Prepare inline images
            const messageImages = req.files?.messageImages || [];
            const inlineImages = messageImages.map((file, index) => ({
                filename: file.originalname,
                path: file.path,
                cid: `image${index}`
            }));

            // Build HTML content
            let htmlContent = `<div style="font-family: Arial, sans-serif; padding: 20px;">
                <p style="white-space: pre-wrap;">${message}</p>`;
            
            messageImages.forEach((file, index) => {
                htmlContent += `<div style="margin: 15px 0;">
                    <img src="cid:image${index}" style="max-width: 100%; height: auto; border-radius: 10px;" />
                </div>`;
            });
            
            htmlContent += '</div>';

            const allAttachments = [...attachments, ...inlineImages];

            // Send emails with Tsoft - daha hızlı gönderim
            const BATCH_SIZE = 50; // Tsoft toplu gönderimde daha iyi
            const BATCH_DELAY = 2000; // 2 saniye batch arası
            const EMAIL_DELAY = 200; // Mail arası 200ms yeterli

            for (let i = 0; i < recipients.length; i++) {
                const recipient = recipients[i];
                
                try {
                    await transporter.sendMail({
                        from: '"Hermesshealing" <' + TSOFT_CONFIG.user + '>',
                        to: recipient.email,
                        subject: subject,
                        text: message,
                        html: htmlContent,
                        attachments: allAttachments
                    });
                    
                    successCount++;
                    console.log(`✓ [Tsoft] Email sent to ${recipient.email} (${i + 1}/${recipients.length})`);
                    
                    if (i < recipients.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, EMAIL_DELAY));
                    }
                    
                    if ((i + 1) % BATCH_SIZE === 0 && i < recipients.length - 1) {
                        console.log(`⏳ Batch complete. Waiting ${BATCH_DELAY/1000} seconds before next batch...`);
                        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
                    }
                    
                } catch (emailError) {
                    failedEmails.push({ email: recipient.email, error: emailError.message });
                    console.error(`✗ Failed to send email to ${recipient.email}:`, emailError.message);
                    
                    if (emailError.code === 'EAUTH') {
                        console.error('❌ Authentication error detected. Stopping email sending.');
                        break;
                    }
                }
            }

            transporter.close();

        } else {
            // ===== GMAIL INTEGRATION =====
            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: GMAIL_USER,
                    pass: GMAIL_APP_PASSWORD
                },
                pool: true,
                maxConnections: 1,
                maxMessages: 10,
                rateDelta: 1000,
                rateLimit: 1
            });

            // Prepare regular attachments
            const attachments = req.files?.attachments ? req.files.attachments.map(file => ({
                filename: file.originalname,
                path: file.path
            })) : [];

            // Prepare inline images
            const messageImages = req.files?.messageImages || [];
            const inlineImages = messageImages.map((file, index) => ({
                filename: file.originalname,
                path: file.path,
                cid: `image${index}`
            }));

            // Build HTML content
            let htmlContent = `<div style="font-family: Arial, sans-serif; padding: 20px;">
                <p style="white-space: pre-wrap;">${message}</p>`;
            
            messageImages.forEach((file, index) => {
                htmlContent += `<div style="margin: 15px 0;">
                    <img src="cid:image${index}" style="max-width: 100%; height: auto; border-radius: 10px;" />
                </div>`;
            });
            
            htmlContent += '</div>';

            const allAttachments = [...attachments, ...inlineImages];

            // Send emails with Gmail
            const BATCH_SIZE = 10;
            const BATCH_DELAY = 5000;
            const EMAIL_DELAY = 1500;

            for (let i = 0; i < recipients.length; i++) {
                const recipient = recipients[i];
                
                try {
                    await transporter.sendMail({
                        from: '"Hermesshealing" <' + GMAIL_USER + '>',
                        to: recipient.email,
                        subject: subject,
                        text: message,
                        html: htmlContent,
                        attachments: allAttachments
                    });
                    
                    successCount++;
                    console.log(`✓ [Gmail] Email sent to ${recipient.email} (${i + 1}/${recipients.length})`);
                    
                    if (i < recipients.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, EMAIL_DELAY));
                    }
                    
                    if ((i + 1) % BATCH_SIZE === 0 && i < recipients.length - 1) {
                        console.log(`⏳ Batch complete. Waiting ${BATCH_DELAY/1000} seconds before next batch...`);
                        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
                    }
                    
                } catch (emailError) {
                    failedEmails.push({ email: recipient.email, error: emailError.message });
                    console.error(`✗ Failed to send email to ${recipient.email}:`, emailError.message);
                    
                    if (emailError.code === 'EAUTH') {
                        console.error('❌ Authentication error detected. Stopping email sending.');
                        break;
                    }
                }
            }

            transporter.close();
        }

        // Clean up all uploaded files
        if (req.files?.attachments) {
            req.files.attachments.forEach(file => {
                try { fs.unlinkSync(file.path); } catch(e) {}
            });
        }
        if (req.files?.messageImages) {
            req.files.messageImages.forEach(file => {
                try { fs.unlinkSync(file.path); } catch(e) {}
            });
        }

        // Send detailed response
        const response = {
            success: successCount > 0,
            total: recipients.length,
            sent: successCount,
            failed: failedEmails.length,
            service: selectedService,
            message: `${successCount} mail başarıyla gönderildi${failedEmails.length > 0 ? `, ${failedEmails.length} mail gönderilemedi` : ''}! (${selectedService.toUpperCase()})`
        };

        if (failedEmails.length > 0) {
            response.failedEmails = failedEmails.map(f => f.email);
        }

        res.status(200).json(response);
    } catch (error) {
        console.error('Error sending emails:', error);
        
        // Clean up files on error
        if (req.files?.attachments) {
            req.files.attachments.forEach(file => {
                try { fs.unlinkSync(file.path); } catch(e) {}
            });
        }
        if (req.files?.messageImages) {
            req.files.messageImages.forEach(file => {
                try { fs.unlinkSync(file.path); } catch(e) {}
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// API endpoint to upload members from a CSV file
app.post('/api/members/upload', uploadCSV.single('membersFile'), (req, res) => {
    try {
        // Read the entire file as text
        const fileContent = fs.readFileSync(req.file.path, 'utf8');
        console.log('=== Dosya yüklendi, işleniyor... ===');
        
        // Split by lines and process
        const lines = fileContent.split(/\r?\n/).filter(line => line.trim());
        console.log('Toplam satır sayısı:', lines.length);
        
        const members = readMembers();
        const newMembers = [];
        const skippedEmails = [];
        const duplicateEmails = [];
        
        // Mevcut email adreslerini bir Set'e al (hızlı arama için)
        const existingEmails = new Set(members.map(m => m.email.toLowerCase()));
        
        // Start from index 1 to skip header
        const startIndex = 1;
        
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            
            // CSV dosyanız noktalı virgül (;) kullanıyor
            const parts = line.split(';').map(p => p.trim());
            
            if (parts.length >= 1 && parts[0]) {
                const email = parts[0];
                const emailLower = email.toLowerCase();
                const isim = parts[1] || '';
                const soyisim = parts[2] || '';
                
                // Sadece geçerli e-posta adresi olanları kontrol et
                if (email && email.includes('@')) {
                    // Email daha önce eklendi mi kontrol et
                    if (existingEmails.has(emailLower)) {
                        skippedEmails.push(email);
                        console.log(`⚠️ Atlandı (zaten var): ${email}`);
                    } else {
                        // Yeni eklenecekler arasında da mükerrer olmasın
                        const alreadyInNewMembers = newMembers.some(m => m.email.toLowerCase() === emailLower);
                        if (alreadyInNewMembers) {
                            duplicateEmails.push(email);
                            console.log(`⚠️ Atlandı (CSV'de mükerrer): ${email}`);
                        } else {
                            newMembers.push({
                                id: Date.now() + Math.random(),
                                email: email,
                                name: `${isim} ${soyisim}`.trim() || 'İsimsiz'
                            });
                            existingEmails.add(emailLower); // Yeni eklediğimizi Set'e ekle
                            console.log(`✓ Eklendi: ${email}`);
                        }
                    }
                } else {
                    console.log(`✗ Geçersiz email: ${email}`);
                }
            }
        }
        
        console.log(`\n=== Özet ===`);
        console.log(`Toplam satır: ${lines.length - 1}`);
        console.log(`✓ Yeni eklenen: ${newMembers.length}`);
        console.log(`⚠️ Zaten var (atlandı): ${skippedEmails.length}`);
        console.log(`⚠️ CSV'de mükerrer (atlandı): ${duplicateEmails.length}`);
        
        const updatedMembers = [...members, ...newMembers];
        writeMembers(updatedMembers);
        fs.unlinkSync(req.file.path); // Clean up uploaded file
        
        res.status(200).json({ 
            message: `${newMembers.length} yeni üye eklendi! ${skippedEmails.length} mükerrer kayıt atlandı.`,
            added: newMembers.length,
            skipped: skippedEmails.length,
            duplicates: duplicateEmails.length,
            total: updatedMembers.length
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).send('Dosya yüklenirken hata oluştu: ' + error.message);
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
