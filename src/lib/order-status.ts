export const ORDER_STATUS_OPTIONS = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "COMPLETED",
    "CANCELLED",
] as const;

export type OrderStatusValue = (typeof ORDER_STATUS_OPTIONS)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatusValue, string> = {
    PENDING: "Menunggu Konfirmasi (PENDING)",
    CONFIRMED: "Dikonfirmasi (CONFIRMED)",
    PROCESSING: "Diproses (PROCESSING)",
    SHIPPED: "Dikirim (SHIPPED)",
    COMPLETED: "Selesai (COMPLETED)",
    CANCELLED: "Dibatalkan (CANCELLED)",
};