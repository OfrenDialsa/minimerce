"use client";

import { useActionState, useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createAddressAction,
  type AddressActionState,
} from "@/actions/address.action";
import type { PostalRegionItem } from "@/app/api/postal-code/route";

const initialState: AddressActionState = {};

export default function CreateAddressPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    createAddressAction,
    initialState,
  );

  const [postalCode, setPostalCode] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [village, setVillage] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [candidates, setCandidates] = useState<PostalRegionItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loadingPostal, setLoadingPostal] = useState(false);
  const [postalNotice, setPostalNotice] = useState<string | null>(null);

  useEffect(() => {
    if (state?.data) {
      router.push("/profile");
      router.refresh();
    }
  }, [state?.data, router]);

  useEffect(() => {
    const cleanCode = postalCode.replace(/\D/g, "").slice(0, 5);

    if (cleanCode.length < 5) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoadingPostal(true);
      setPostalNotice(null);

      try {
        const res = await fetch(
          `/api/postal-code?code=${encodeURIComponent(cleanCode)}`,
          { signal: controller.signal },
        );
        const json = await res.json();
        const items: PostalRegionItem[] = Array.isArray(json?.items)
          ? json.items
          : [];

        if (!res.ok || items.length === 0) {
          setCandidates([]);
          setSelectedIndex(0);
          setPostalNotice(
            json?.error ??
              "Kode pos tidak ditemukan di data lokal. Silakan lengkapi wilayah secara manual.",
          );
          return;
        }

        const first = items[0];
        setCandidates(items);
        setSelectedIndex(0);
        setProvince(first.province ?? "");
        setCity(first.city ?? "");
        setDistrict(first.district ?? "");
        setVillage(first.subDistrict ?? "");
        setLatitude(first.latitude !== undefined ? String(first.latitude) : "");
        setLongitude(
          first.longitude !== undefined ? String(first.longitude) : "",
        );

        if (items.length > 1) {
          setPostalNotice(
            `Ditemukan ${items.length} kelurahan/desa untuk kode pos ${cleanCode}. Silakan pilih desa pada dropdown.`,
          );
        }
      } catch (err: unknown) {
        if ((err as { name?: string })?.name !== "AbortError") {
          setPostalNotice(
            "Gagal memuat data kode pos. Kamu tetap bisa mengisi secara manual.",
          );
        }
      } finally {
        setLoadingPostal(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [postalCode]);

  function handlePostalCodeChange(event: ChangeEvent<HTMLInputElement>) {
    const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, 5);
    setPostalCode(digitsOnly);

    if (digitsOnly.length < 5) {
      setCandidates([]);
      setSelectedIndex(0);
      setPostalNotice(null);
      setProvince("");
      setCity("");
      setDistrict("");
      setVillage("");
      setLatitude("");
      setLongitude("");
    }
  }

  function handleVillageSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    const idx = Number(event.target.value);
    const chosen = candidates[idx];
    if (!chosen) return;

    setSelectedIndex(idx);
    setProvince(chosen.province ?? "");
    setCity(chosen.city ?? "");
    setDistrict(chosen.district ?? "");
    setVillage(chosen.subDistrict ?? "");
    setLatitude(chosen.latitude !== undefined ? String(chosen.latitude) : "");
    setLongitude(
      chosen.longitude !== undefined ? String(chosen.longitude) : "",
    );
  }

  return (
    <main className="min-h-screen w-full bg-white">
      <div className="h-2 bg-linear-to-r from-[#ee4d2d] via-[#f05d40] to-[#ff7337]" />

      <div className="border-b border-gray-200 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Tambah Alamat Baru
            </h1>
            <p className="mt-0.5 text-xs text-gray-500">
              Masukkan 5 digit kode pos untuk mengisi provinsi, kabupaten/kota,
              kecamatan, dan kelurahan/desa secara otomatis.
            </p>
          </div>

          <Link
            href="/addresses"
            className="border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Kembali ke Daftar Alamat
          </Link>
        </div>
      </div>

      <form action={formAction} className="divide-y divide-gray-200">
        {state?.error && (
          <div className="border-l-4 border-red-500 bg-red-50 px-6 py-4 text-sm text-red-700">
            {state.error}
          </div>
        )}

        {/* Bagian 1: Identitas & Label Alamat */}
        <section className="grid gap-4 p-6 md:grid-cols-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Identitas Penerima &amp; Label
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Gunakan label seperti Rumah, Kantor, atau Toko agar mudah
              dibedakan.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:col-span-2">
            <div>
              <label
                htmlFor="label"
                className="block text-xs font-semibold text-gray-700"
              >
                Label Alamat <span className="text-[#ee4d2d]">*</span>
              </label>
              <input
                id="label"
                name="label"
                type="text"
                required
                disabled={isPending}
                placeholder="Contoh: Rumah, Toko Utama"
                className="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#ee4d2d] focus:outline-none disabled:bg-gray-100"
              />
              {state?.fieldErrors?.label?.[0] && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.label[0]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="recipientName"
                className="block text-xs font-semibold text-gray-700"
              >
                Nama Penerima / Penanggung Jawab{" "}
                <span className="text-[#ee4d2d]">*</span>
              </label>
              <input
                id="recipientName"
                name="recipientName"
                type="text"
                required
                disabled={isPending}
                placeholder="Nama lengkap penerima"
                className="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#ee4d2d] focus:outline-none disabled:bg-gray-100"
              />
              {state?.fieldErrors?.recipientName?.[0] && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.recipientName[0]}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="phone"
                className="block text-xs font-semibold text-gray-700"
              >
                Nomor HP <span className="text-[#ee4d2d]">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                disabled={isPending}
                placeholder="Contoh: 081234567890"
                className="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#ee4d2d] focus:outline-none disabled:bg-gray-100"
              />
              {state?.fieldErrors?.phone?.[0] && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.phone[0]}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Bagian 2: Kode Pos Auto-Generate & Detail Lokasi */}
        <section className="grid gap-4 p-6 md:grid-cols-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Wilayah Kode Pos &amp; Alamat
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Ketik 5 digit kode pos untuk mengisi data wilayah otomatis, lalu
              lengkapi alamat jalan.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:col-span-2">
            <div>
              <label
                htmlFor="postalCode"
                className="block text-xs font-semibold text-gray-700"
              >
                Kode Pos <span className="text-[#ee4d2d]">*</span>
              </label>
              <input
                id="postalCode"
                name="postalCode"
                type="text"
                inputMode="numeric"
                maxLength={5}
                required
                value={postalCode}
                disabled={isPending}
                onChange={handlePostalCodeChange}
                placeholder="Contoh: 23773"
                className="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#ee4d2d] focus:outline-none disabled:bg-gray-100"
              />
              {loadingPostal && (
                <p className="mt-1 text-xs text-gray-500">
                  Mencari wilayah kode pos...
                </p>
              )}
              {state?.fieldErrors?.postalCode?.[0] && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.postalCode[0]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="province"
                className="block text-xs font-semibold text-gray-700"
              >
                Provinsi <span className="text-[#ee4d2d]">*</span>
              </label>
              <input
                id="province"
                name="province"
                type="text"
                required
                value={province}
                disabled={isPending}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="Otomatis dari kode pos"
                className="mt-1.5 w-full border border-gray-300 bg-gray-50/60 px-3 py-2 text-sm text-gray-900 focus:border-[#ee4d2d] focus:bg-white focus:outline-none disabled:bg-gray-100"
              />
              {state?.fieldErrors?.province?.[0] && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.province[0]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="city"
                className="block text-xs font-semibold text-gray-700"
              >
                Kabupaten / Kota <span className="text-[#ee4d2d]">*</span>
              </label>
              <input
                id="city"
                name="city"
                type="text"
                required
                value={city}
                disabled={isPending}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Otomatis dari kode pos"
                className="mt-1.5 w-full border border-gray-300 bg-gray-50/60 px-3 py-2 text-sm text-gray-900 focus:border-[#ee4d2d] focus:bg-white focus:outline-none disabled:bg-gray-100"
              />
              {state?.fieldErrors?.city?.[0] && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.city[0]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="district"
                className="block text-xs font-semibold text-gray-700"
              >
                Kecamatan
              </label>
              <input
                id="district"
                name="district"
                type="text"
                value={district}
                disabled={isPending}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Otomatis dari kode pos"
                className="mt-1.5 w-full border border-gray-300 bg-gray-50/60 px-3 py-2 text-sm text-gray-900 focus:border-[#ee4d2d] focus:bg-white focus:outline-none disabled:bg-gray-100"
              />
              {state?.fieldErrors?.district?.[0] && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.district[0]}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <input type="hidden" name="village" value={village} />

              {candidates.length > 1 ? (
                <>
                  <label
                    htmlFor="villageSelect"
                    className="block text-xs font-semibold text-gray-700"
                  >
                    Kelurahan / Desa
                  </label>
                  <select
                    id="villageSelect"
                    value={selectedIndex}
                    disabled={isPending}
                    onChange={handleVillageSelectChange}
                    className="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#ee4d2d] focus:outline-none disabled:bg-gray-100"
                  >
                    {candidates.map((item, idx) => (
                      <option
                        key={`${item.postalCode}-${item.district}-${item.subDistrict ?? idx}`}
                        value={idx}
                      >
                        {item.subDistrict || `Wilayah ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label
                    htmlFor="villageInput"
                    className="block text-xs font-semibold text-gray-700"
                  >
                    Kelurahan / Desa
                  </label>
                  <input
                    id="villageInput"
                    type="text"
                    value={village}
                    disabled={isPending}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="Otomatis dari kode pos"
                    className="mt-1.5 w-full border border-gray-300 bg-gray-50/60 px-3 py-2 text-sm text-gray-900 focus:border-[#ee4d2d] focus:bg-white focus:outline-none disabled:bg-gray-100"
                  />
                </>
              )}

              {state?.fieldErrors?.village?.[0] && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.village[0]}
                </p>
              )}
            </div>

            {!loadingPostal && postalNotice && (
              <p className="sm:col-span-2 text-xs text-amber-700">
                {postalNotice}
              </p>
            )}

            <div className="sm:col-span-2">
              <label
                htmlFor="addressLine"
                className="block text-xs font-semibold text-gray-700"
              >
                Alamat Jalan / Detail Lokasi{" "}
                <span className="text-[#ee4d2d]">*</span>
              </label>
              <textarea
                id="addressLine"
                name="addressLine"
                rows={3}
                required
                disabled={isPending}
                placeholder="Contoh: Jl. Merdeka No. 12, dekat pasar"
                className="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#ee4d2d] focus:outline-none disabled:bg-gray-100"
              />
              {state?.fieldErrors?.addressLine?.[0] && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.addressLine[0]}
                </p>
              )}
            </div>
          </div>
        </section>
        {/* Bagian 3: Pengaturan Alamat */}
        <section className="grid gap-4 p-6 md:grid-cols-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Pengaturan Alamat
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Tentukan apakah alamat ini dijadikan sebagai alamat utama akun.
            </p>
          </div>

          <div className="space-y-4 md:col-span-2">
            <input type="hidden" name="latitude" value={latitude} />
            <input type="hidden" name="longitude" value={longitude} />

            <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-sm text-gray-800">
              <input
                type="checkbox"
                name="isDefault"
                value="true"
                disabled={isPending}
                className="h-4 w-4 accent-[#ee4d2d]"
              />
              <span>Jadikan sebagai alamat utama saya</span>
            </label>
          </div>
        </section>

        {/* Footer Aksi */}
        <div className="flex items-center justify-end gap-3 bg-gray-50/70 px-6 py-4">
          <Link
            href="/profile"
            className="border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="bg-[#ee4d2d] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#d73211] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Menyimpan..." : "Simpan Alamat"}
          </button>
        </div>
      </form>
    </main>
  );
}
