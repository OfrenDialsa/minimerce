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
    const confirmLink = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
    const safeConfirmLink = escapeHtml(confirmLink);

    try {
        await transporter.sendMail({
            from: `"Minimerce" <${process.env.SMTP_FROM}>`,
            to: email,
            subject: "Konfirmasi Email Akun minimerce Anda",
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #111827; max-width: 560px;">
          <h2 style="margin: 0 0 12px; color: #111827;">Selamat Datang di minimerce!</h2>
          <p style="margin: 0 0 12px; color: #374151; font-size: 14px; line-height: 1.5;">
            Terima kasih telah mendaftar di <strong>minimerce</strong>. Silakan klik tombol di bawah ini untuk memverifikasi alamat email Anda:
          </p>
          <a href="${safeConfirmLink}" style="background-color: #ee4d2d; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 8px; font-weight: 600; font-size: 14px;">Verifikasi Email</a>
          <p style="margin-top: 16px; color: #6b7280; font-size: 12px; line-height: 1.5;">
            Jika Anda tidak merasa membuat akun di minimerce, abaikan email ini.
          </p>
          <p style="margin-top: 14px; color: #6b7280; font-size: 12px; word-break: break-all;">
            Atau salin tautan berikut ke browser Anda:<br>${safeConfirmLink}
          </p>
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
    const safeResetLink = escapeHtml(resetLink);

    try {
        await transporter.sendMail({
            from: `"Minimerce" <${process.env.SMTP_FROM}>`,
            to: email,
            subject: "Reset Password Akun minimerce",
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #111827; max-width: 560px;">
          <h2 style="margin: 0 0 12px; color: #111827;">Permintaan Reset Password</h2>
          <p style="margin: 0 0 12px; color: #374151; font-size: 14px; line-height: 1.5;">
            Kami menerima permintaan untuk mengatur ulang password akun <strong>minimerce</strong> Anda. Klik tombol di bawah ini untuk melanjutkan (tautan berlaku selama 1 jam):
          </p>
          <a href="${safeResetLink}" style="background-color: #ee4d2d; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 8px; font-weight: 600; font-size: 14px;">Reset Password</a>
          <p style="margin-top: 16px; color: #6b7280; font-size: 12px; line-height: 1.5;">
            Jika Anda tidak meminta reset password, abaikan email ini. Password Anda tidak akan berubah.
          </p>
          <p style="margin-top: 14px; color: #6b7280; font-size: 12px; word-break: break-all;">
            Atau salin tautan berikut ke browser Anda:<br>${safeResetLink}
          </p>
        </div>
      `,
        });
        console.log(`[v] Email lupa password berhasil dikirim ke ${email}`);
    } catch (error) {
        console.error("[x] Gagal mengirim email lupa password:", error);
        throw new Error("Gagal mengirim email lupa password.");
    }
}

export interface OrderConfirmedEmailPayload {
    to: string;
    buyerName?: string | null;
    orderPublicId: string;
    storeName: string;
    totalAmount?: number | null;
    orderUrl?: string;
}

function formatOrderCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(amount);
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export async function sendOrderConfirmedEmail({
    to,
    buyerName,
    orderPublicId,
    storeName,
    totalAmount,
    orderUrl,
}: OrderConfirmedEmailPayload) {
    const cleanOrderId = orderPublicId.trim();
    const detailLink =
        orderUrl ?? `${baseUrl}/orders/${encodeURIComponent(cleanOrderId)}`;
    const safeBuyerName = escapeHtml(buyerName?.trim() || "Pelanggan");
    const safeOrderId = escapeHtml(cleanOrderId);
    const safeStoreName = escapeHtml(storeName.trim() || "Toko Minimerce");
    const safeDetailLink = escapeHtml(detailLink);
    const formattedTotal =
        typeof totalAmount === "number" && Number.isFinite(totalAmount)
            ? formatOrderCurrency(totalAmount)
            : null;

    try {
        await transporter.sendMail({
            from: `"Minimerce" <${process.env.SMTP_FROM}>`,
            to,
            subject: `Pesanan #${cleanOrderId} Dikonfirmasi - minimerce`,
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #111827; max-width: 560px;">
          <h2 style="margin: 0 0 12px;">Pesanan Anda Telah Dikonfirmasi</h2>
          <p style="margin: 0 0 12px;">Halo ${safeBuyerName},</p>
          <p style="margin: 0 0 16px;">
            Pembayaran dan pesanan Anda pada toko <strong>${safeStoreName}</strong> telah dikonfirmasi oleh penjual dan akan segera diproses.
          </p>
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 16px; margin-bottom: 18px; font-size: 14px;">
            <p style="margin: 4px 0;"><strong>ID Pesanan:</strong> ${safeOrderId}</p>
            <p style="margin: 4px 0;"><strong>Toko:</strong> ${safeStoreName}</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> Dikonfirmasi (CONFIRMED)</p>
            ${formattedTotal
                    ? `<p style="margin: 4px 0;"><strong>Total Pesanan:</strong> ${escapeHtml(formattedTotal)}</p>`
                    : ""
                }
          </div>
          <a href="${safeDetailLink}" style="background-color: #ee4d2d; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: 600;">Lihat Detail Pesanan</a>
          <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
            Atau salin tautan berikut ke browser Anda:<br>${safeDetailLink}
          </p>
        </div>
      `,
        });
        console.log(
            `[v] Email konfirmasi pesanan #${cleanOrderId} berhasil dikirim ke ${to}`,
        );
    } catch (error) {
        console.error("[x] Gagal mengirim email konfirmasi pesanan:", error);
        throw new Error("Gagal mengirim email konfirmasi pesanan.");
    }
}

export interface OrderShippedEmailPayload {
    to: string;
    buyerName?: string | null;
    orderPublicId: string;
    storeName: string;
    totalAmount?: number | null;
    orderUrl?: string;
}

export async function sendOrderShippedEmail({
    to,
    buyerName,
    orderPublicId,
    storeName,
    totalAmount,
    orderUrl,
}: OrderShippedEmailPayload) {
    const cleanOrderId = orderPublicId.trim();
    const detailLink =
        orderUrl ?? `${baseUrl}/orders/${encodeURIComponent(cleanOrderId)}`;
    const safeBuyerName = escapeHtml(buyerName?.trim() || "Pelanggan");
    const safeOrderId = escapeHtml(cleanOrderId);
    const safeStoreName = escapeHtml(storeName.trim() || "Toko Minimerce");
    const safeDetailLink = escapeHtml(detailLink);
    const formattedTotal =
        typeof totalAmount === "number" && Number.isFinite(totalAmount)
            ? formatOrderCurrency(totalAmount)
            : null;

    try {
        await transporter.sendMail({
            from: `"minimerce" <${process.env.SMTP_FROM}>`,
            to,
            subject: `Pesanan #${cleanOrderId} Sedang Dikirim - minimerce`,
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #111827; max-width: 560px;">
          <h2 style="margin: 0 0 12px;">Pesanan Anda Telah Dikirim</h2>
          <p style="margin: 0 0 12px;">Halo ${safeBuyerName},</p>
          <p style="margin: 0 0 16px;">
            Pesanan Anda dari toko <strong>${safeStoreName}</strong> telah diserahkan ke pengiriman dan sedang dalam perjalanan ke alamat tujuan.
          </p>
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 16px; margin-bottom: 18px; font-size: 14px;">
            <p style="margin: 4px 0;"><strong>ID Pesanan:</strong> ${safeOrderId}</p>
            <p style="margin: 4px 0;"><strong>Toko:</strong> ${safeStoreName}</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> Dikirim (SHIPPED)</p>
            ${formattedTotal
                    ? `<p style="margin: 4px 0;"><strong>Total Pesanan:</strong> ${escapeHtml(formattedTotal)}</p>`
                    : ""
                }
          </div>
          <a href="${safeDetailLink}" style="background-color: #ee4d2d; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: 600;">Lacak / Lihat Detail Pesanan</a>
          <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
            Atau salin tautan berikut ke browser Anda:<br>${safeDetailLink}
          </p>
        </div>
      `,
        });
        console.log(
            `[v] Email pengiriman pesanan #${cleanOrderId} berhasil dikirim ke ${to}`,
        );
    } catch (error) {
        console.error("[x] Gagal mengirim email pengiriman pesanan:", error);
        throw new Error("Gagal mengirim email pengiriman pesanan.");
    }
}

export interface OrderCompletedEmailPayload {
    to: string;
    storeOwnerName?: string | null;
    buyerName?: string | null;
    orderPublicId: string;
    storeName: string;
    totalAmount?: number | null;
    orderUrl?: string;
}

export async function sendOrderCompletedEmail({
    to,
    storeOwnerName,
    buyerName,
    orderPublicId,
    storeName,
    totalAmount,
    orderUrl,
}: OrderCompletedEmailPayload) {
    const cleanOrderId = orderPublicId.trim();
    const detailLink =
        orderUrl ?? `${baseUrl}/store/orders/${encodeURIComponent(cleanOrderId)}`;
    const safeOwnerName = escapeHtml(storeOwnerName?.trim() || "Pemilik Toko");
    const safeBuyerName = escapeHtml(buyerName?.trim() || "Pembeli");
    const safeOrderId = escapeHtml(cleanOrderId);
    const safeStoreName = escapeHtml(storeName.trim() || "Toko Minimerce");
    const safeDetailLink = escapeHtml(detailLink);
    const formattedTotal =
        typeof totalAmount === "number" && Number.isFinite(totalAmount)
            ? formatOrderCurrency(totalAmount)
            : null;

    try {
        await transporter.sendMail({
            from: `"minimerce" <${process.env.EMAIL_FROM}>`,
            to,
            subject: `Pesanan #${cleanOrderId} Telah Diterima Pembeli - minimerce`,
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #111827; max-width: 560px;">
          <h2 style="margin: 0 0 12px; color: #111827;">Pesanan Telah Diterima Pembeli</h2>
          <p style="margin: 0 0 12px; color: #374151; font-size: 14px; line-height: 1.5;">
            Halo ${safeOwnerName},
          </p>
          <p style="margin: 0 0 16px; color: #374151; font-size: 14px; line-height: 1.5;">
            Pembeli (<strong>${safeBuyerName}</strong>) telah mengonfirmasi bahwa pesanan pada toko <strong>${safeStoreName}</strong> sudah diterima dengan baik. Status pesanan kini <strong>Selesai (COMPLETED)</strong>.
          </p>
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 16px; margin-bottom: 18px; font-size: 14px;">
            <p style="margin: 4px 0;"><strong>ID Pesanan:</strong> ${safeOrderId}</p>
            <p style="margin: 4px 0;"><strong>Toko:</strong> ${safeStoreName}</p>
            <p style="margin: 4px 0;"><strong>Pembeli:</strong> ${safeBuyerName}</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> Selesai (COMPLETED)</p>
            ${formattedTotal
                    ? `<p style="margin: 4px 0;"><strong>Total Pesanan:</strong> ${escapeHtml(formattedTotal)}</p>`
                    : ""
                }
          </div>
          <a href="${safeDetailLink}" style="background-color: #ee4d2d; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px;">Lihat Detail Pesanan di Toko</a>
          <p style="margin-top: 20px; color: #6b7280; font-size: 12px; word-break: break-all;">
            Atau salin tautan berikut ke browser Anda:<br>${safeDetailLink}
          </p>
        </div>
      `,
        });
        console.log(
            `[v] Email konfirmasi penerimaan pesanan #${cleanOrderId} berhasil dikirim ke toko (${to})`,
        );
    } catch (error) {
        console.error("[x] Gagal mengirim email ke toko:", error);
        throw new Error("Gagal mengirim email notifikasi pesanan selesai ke toko.");
    }
}