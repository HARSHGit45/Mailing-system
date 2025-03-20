const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: '/tmp/' }); // Use /tmp for Render

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'tech.harsh450@gmail.com',
        pass: process.env.EMAIL_PASS || 'bnzx iwhg ufyv nhku'
    }
});

// API endpoint for sending certificates
app.post('/api/send-certificates', upload.fields([
    { name: 'csvFile', maxCount: 1 },
    { name: 'certificates', maxCount: 100 },
    { name: 'collegeLogo', maxCount: 1 },
    { name: 'club1Logo', maxCount: 1 },
    { name: 'club2Logo', maxCount: 1 },
    { name: 'eventLogo', maxCount: 1 }
]), async (req, res) => {
    try {
        const { eventName, eventDate, emailSubject, emailBody } = req.body;
        const csvFile = req.files['csvFile'][0];
        const certificates = req.files['certificates'];
        const collegeLogo = req.files['collegeLogo'][0];
        const club1Logo = req.files['club1Logo'][0];
        const club2Logo = req.files['club2Logo'][0];
        const eventLogo = req.files['eventLogo'][0];

        // Read and parse CSV file
        const participants = [];
        fs.createReadStream(csvFile.path)
            .pipe(parse({ columns: true, skip_empty_lines: true }))
            .on('data', (row) => participants.push(row))
            .on('end', async () => {
                try {
                    // Process each participant
                    for (const participant of participants) {
                        // Find certificate by serial number
                        const certificateFile = certificates.find(cert => {
                            const certName = cert.originalname.toLowerCase();
                            const srNo = participant.sr_no.toString().padStart(3, '0');
                            return certName.includes(srNo);
                        });

                        if (!certificateFile) {
                            console.log(`Certificate not found for participant ${participant.name} with serial number ${participant.sr_no}`);
                            continue;
                        }

                        // Create email HTML with logos and black background
                        const emailHtml = `
                            <div style="background-color: #000000; color: #ffffff; padding: 40px;">
                                <div style="text-align: center;">
                                    <img src="cid:event-logo" style="height: 150px; margin-bottom: 30px;">
                                    <table style="width: 100%; max-width: 800px; margin: 0 auto 30px;">
                                        <tr>
                                            <td style="width: 33.33%; text-align: center; padding: 0 15px;">
                                                <img src="cid:college-logo" style="height: 100px; display: inline-block;">
                                            </td>
                                            <td style="width: 33.33%; text-align: center; padding: 0 15px;">
                                                <img src="cid:club1-logo" style="height: 100px; display: inline-block;">
                                            </td>
                                            <td style="width: 33.33%; text-align: center; padding: 0 15px;">
                                                <img src="cid:club2-logo" style="height: 100px; display: inline-block;">
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                                <div style="font-size: 16px; line-height: 1.6; max-width: 600px; margin: 0 auto; text-align: left;">
                                    <p style="margin-bottom: 20px;">Dear ${participant.name},</p>
                                    <p style="margin-bottom: 20px;">${emailBody.replace('{name}', participant.name)
                                        .replace('{eventName}', eventName)
                                        .replace('{eventDate}', eventDate)
                                        .replace('Dear {name},', '')}</p>
                                </div>
                            </div>
                        `;

                        // Send email
                        await transporter.sendMail({
                            from: process.env.EMAIL_USER || 'tech.harsh450@gmail.com',
                            to: participant.email,
                            subject: emailSubject.replace('[Event Name]', eventName),
                            html: emailHtml,
                            attachments: [
                                {
                                    filename: certificateFile.originalname,
                                    path: certificateFile.path
                                },
                                {
                                    filename: 'event-logo.png',
                                    path: eventLogo.path,
                                    cid: 'event-logo'
                                },
                                {
                                    filename: 'college-logo.png',
                                    path: collegeLogo.path,
                                    cid: 'college-logo'
                                },
                                {
                                    filename: 'club1-logo.png',
                                    path: club1Logo.path,
                                    cid: 'club1-logo'
                                },
                                {
                                    filename: 'club2-logo.png',
                                    path: club2Logo.path,
                                    cid: 'club2-logo'
                                }
                            ]
                        });
                    }

                    // Clean up uploaded files
                    fs.unlinkSync(csvFile.path);
                    certificates.forEach(cert => fs.unlinkSync(cert.path));
                    fs.unlinkSync(collegeLogo.path);
                    fs.unlinkSync(club1Logo.path);
                    fs.unlinkSync(club2Logo.path);
                    fs.unlinkSync(eventLogo.path);

                    res.json({ success: true });
                } catch (error) {
                    console.error('Error processing emails:', error);
                    res.status(500).json({ 
                        success: false, 
                        error: 'Error processing emails: ' + error.message 
                    });
                }
            });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get the port from environment variable or use 3000
const port = process.env.PORT || 3000;

// Always listen on the port
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 