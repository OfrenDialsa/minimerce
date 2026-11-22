import { redirect } from "next/navigation";
import { getCurrentUserStoreAction } from "@/actions/store.action";
import { getUserAddressesAction } from "@/actions/address.action";

export async function loadStoreWithAddresses() {
    const [storeRes, addressesRes] = await Promise.all([
        getCurrentUserStoreAction(),
        getUserAddressesAction(),
    ]);

    const storeError = storeRes.error;
    const store = storeRes.data ?? null;

    const addressesError = addressesRes.error;
    const addresses = addressesRes.data ?? [];

    const needsLogin =
        (!store && storeError?.toLowerCase().includes("login")) ||
        (addresses.length === 0 && addressesError?.toLowerCase().includes("login"));

    if (needsLogin) {
        redirect("/login");
    }

    return {
        store,
        storeError,
        addresses,
        addressesError,
    };
}