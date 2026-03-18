const nodemailer = require('nodemailer');
require('dotenv').config({ path: 'd:/TUTORIAL_DEV/VIBE_CODE/backend_crm/.env' });

async function testMail() {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        console.log('Đang kiểm tra kết nối SMTP...');
        await transporter.verify();
        console.log('Kết nối SMTP thành công!');

        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: process.env.SMTP_USER, // Gửi thử cho chính mình
            subject: 'Kiểm tra cấu hình SMTP MarketOS',
            text: 'Đây là email kiểm tra từ hệ thống MarketOS.',
        });
        console.log('Email gửi thử thành công:', info.messageId);
    } catch (error) {
        console.error('Lỗi khi kiểm tra SMTP:', error);
    }
}

testMail();
