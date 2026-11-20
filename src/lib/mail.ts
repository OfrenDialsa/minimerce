import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
});

const baseUrl =
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

export async function sendVerificationEmail(email: string, token: string) {
    const confirmLink = `${baseUrl}/api/auth/verify-email?token=${token}`;

    try {
        await transporter.sendMail({
            from: `"Aplikasi Saya" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: "Konfirmasi Email Anda",
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Selamat Datang!</h2>
          <p>Silakan klik tombol di bawah ini untuk memverifikasi alamat email Anda:</p>
          <a href="${confirmLink}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Verifikasi Email</a>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">Atau salin tautan berikut ke browser Anda: <br>${confirmLink}</p>
        </div>
      `,
        });
        console.log(`[v] Email verifikasi berhasil dikirim ke ${email}`);
    } catch (error) {
        console.error("[x] Gagal mengirim email:", error);
        throw new Error("Gagal mengirim email verifikasi.");
    }
}

export async function sendForgotPasswordEmail(
    email: string,
    token: string,
    uid?: string | null
) {
    const resetLink = uid
        ? `${baseUrl}/reset-password?token=${encodeURIComponent(token)}&uid=${encodeURIComponent(uid)}`
        : `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

    try {
        await transporter.sendMail({
            from: `"minimerce" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: "Reset Password Akun minimerce",
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Permintaan Reset Password</h2>
          <p>Kami menerima permintaan untuk mengatur ulang password akun Anda. Klik tombol di bawah ini untuk melanjutkan (tautan berlaku selama 1 jam):</p>
          <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Reset Password</a>
          <p style="margin-top: 16px; color: #555; font-size: 13px;">Jika Anda tidak meminta reset password, abaikan email ini.</p>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">Atau salin tautan berikut ke browser Anda: <br>${resetLink}</p>
        </div>
      `,
        });
        console.log(`[v] Email lupa password berhasil dikirim ke ${email}`);
    } catch (error) {
        console.error("[x] Gagal mengirim email lupa password:", error);
        throw new Error("Gagal mengirim email lupa password.");
    }
}