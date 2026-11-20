"use client";

import { useActionState, useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createStoreAction,
  getCurrentUserStoreAction,
  type CreateStoreActionState,
} from "@/actions/store.action";
import type { PostalRegionItem } from "@/app/api/postal-code/route";
import Image from "next/image";
import Button from "@/components/ui/button";

const initialState: CreateStoreActionState = {};

export default function CreateStorePage() {
  const router = useRouter();
  const [checkingStore, setCheckingStore] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // State alamat & wilayah kode pos
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [village, setVillage] = useState("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");

  const [candidates, setCandidates] = useState<PostalRegionItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loadingPostal, setLoadingPostal] = useState(false);
  const [postalNotice, setPostalNotice] = useState<string | null>(null);

  const [state, formAction, isPending] = useActionState(
    createStoreAction,
    initialState,
  );

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      const { error, data: existingStore } = await getCurrentUserStoreAction();

      if (!active) return;

      if (!existingStore && error?.toLowerCase().includes("login")) {
        router.replace("/login");
        return;
      }

      if (existingStore) {
        router.replace("/store");
        return;
      }

      setCheckingStore(false);
    }

    checkAccess();

    return () => {
      active = false;
    };
  }, [router]);

  // Redirect ke /store setelah toko berhasil dibuat
  useEffect(() => {
    if (state.data) {
      router.push("/store");
      router.refresh();
    }
  }, [state.data, router]);

  // Bersihkan object URL agar tidak bocor memori
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Auto-generate provinsi, kabupaten/kota, kecamatan, dan opsi desa saat kode pos 5 digit diinput
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

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (file && file.size > 0) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  }

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

  if (checkingStore) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-sm text-gray-500">Memeriksa status akun...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Buat Toko Baru</h1>
        <p className="mt-1 text-sm text-gray-600">
          Lengkapi informasi dasar untuk mulai membuka tokomu.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
        {state.error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {state.error}
          </div>
        )}

        <form
          action={formAction}
          className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start lg:gap-8"
        >
          {/* KOLOM KIRI: Info Dasar & Logo Toko */}
          <div className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-900"
              >
                Nama Toko <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                minLength={2}
                maxLength={100}
                disabled={isPending}
                placeholder="Contoh: Toko Kopi Kerinci Jaya"
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none disabled:bg-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500">
                Slug URL akan dibuat otomatis dari nama toko dan dipastikan
                unik.
              </p>
              {state.fieldErrors?.name?.[0] && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {state.fieldErrors.name[0]}
                </p>
              )}
            </div>

            {/* Deskripsi Toko */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-900"
              >
                Deskripsi Toko
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                maxLength={500}
                disabled={isPending}
                placeholder="Ceritakan singkat tentang produk atau layanan toko kamu..."
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none disabled:bg-gray-100"
              />
              {state.fieldErrors?.description?.[0] && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {state.fieldErrors.description[0]}
                </p>
              )}
            </div>

            {/* Upload Gambar Logo */}
            <div>
              <label
                htmlFor="logo"
                className="block text-sm font-medium text-gray-900"
              >
                Logo Toko
              </label>
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={isPending}
                onChange={handleLogoChange}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gray-800 hover:file:bg-gray-200 focus:border-black focus:outline-none disabled:bg-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500">
                Format JPG, PNG, WebP, atau GIF (maksimal 2 MB).
              </p>

              {previewUrl && (
                <div className="mt-3 flex items-center gap-3">
                  <Image
                    src={previewUrl}
                    alt="Preview logo toko"
                    width={60}
                    height={60}
                    unoptimized
                    className="h-16 w-16 rounded-lg border border-gray-200 object-cover"
                  />
                  <span className="text-xs text-gray-500">Pratinjau logo</span>
                </div>
              )}

              {state.fieldErrors?.logoUrl?.[0] && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {state.fieldErrors.logoUrl[0]}
                </p>
              )}
            </div>
          </div>

          {/* KOLOM KANAN: Alamat & Wilayah Kode Pos */}
          <div className="space-y-4 border-t pt-5 lg:border-t-0 lg:pt-0">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Alamat &amp; Wilayah Toko
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Masukkan 5 digit kode pos untuk mengisi provinsi,
                kabupaten/kota, kecamatan, dan kelurahan/desa secara otomatis.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="postalCode"
                  className="block text-sm font-medium text-gray-900"
                >
                  Kode Pos
                </label>
                <input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={postalCode}
                  disabled={isPending}
                  onChange={handlePostalCodeChange}
                  placeholder="Contoh: 23773"
                  className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none disabled:bg-gray-100"
                />
                {loadingPostal && (
                  <p className="mt-1 text-xs text-gray-500">
                    Mencari wilayah kode pos...
                  </p>
                )}
                {state.fieldErrors?.postalCode?.[0] && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {state.fieldErrors.postalCode[0]}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-900"
                >
                  Alamat Jalan / Detail Lokasi
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  maxLength={300}
                  value={address}
                  disabled={isPending}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Contoh: Jl. Merdeka No. 12, dekat pasar"
                  className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none disabled:bg-gray-100"
                />
                {state.fieldErrors?.address?.[0] && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {state.fieldErrors.address[0]}
                  </p>
                )}
              </div>
            </div>

            {!loadingPostal && postalNotice && (
              <p className="text-xs text-amber-700">{postalNotice}</p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="province"
                  className="block text-sm font-medium text-gray-900"
                >
                  Provinsi
                </label>
                <input type="hidden" name="province" value={province} />
                <input
                  id="province"
                  type="text"
                  value={province}
                  disabled
                  placeholder="Otomatis dari kode pos"
                  className="mt-1.5 block w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
                {state.fieldErrors?.province?.[0] && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {state.fieldErrors.province[0]}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-gray-900"
                >
                  Kabupaten / Kota
                </label>
                <input type="hidden" name="city" value={city} />
                <input
                  id="city"
                  type="text"
                  value={city}
                  disabled
                  placeholder="Otomatis dari kode pos"
                  className="mt-1.5 block w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
                {state.fieldErrors?.city?.[0] && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {state.fieldErrors.city[0]}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="district"
                  className="block text-sm font-medium text-gray-900"
                >
                  Kecamatan
                </label>
                <input type="hidden" name="district" value={district} />
                <input
                  id="district"
                  type="text"
                  value={district}
                  disabled
                  placeholder="Otomatis dari kode pos"
                  className="mt-1.5 block w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
                {state.fieldErrors?.district?.[0] && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {state.fieldErrors.district[0]}
                  </p>
                )}
              </div>

              <div>
                <input type="hidden" name="village" value={village} />
                <input type="hidden" name="latitude" value={latitude} />
                <input type="hidden" name="longitude" value={longitude} />

                {candidates.length > 1 ? (
                  <>
                    <label
                      htmlFor="villageSelect"
                      className="block text-sm font-medium text-gray-900"
                    >
                      Kelurahan / Desa
                    </label>
                    <select
                      id="villageSelect"
                      value={selectedIndex}
                      disabled={isPending}
                      onChange={handleVillageSelectChange}
                      className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-black focus:outline-none disabled:bg-gray-100"
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
                      className="block text-sm font-medium text-gray-900"
                    >
                      Kelurahan / Desa
                    </label>
                    <input
                      id="villageInput"
                      type="text"
                      value={village}
                      disabled
                      placeholder="Otomatis dari kode pos"
                      className="mt-1.5 block w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                    />
                  </>
                )}

                {state.fieldErrors?.village?.[0] && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {state.fieldErrors.village[0]}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-4 lg:col-span-2">
            <Button
              type="submit"
              disabled={isPending}
              variant="outline"
              loadingText="Menyimpan"
            >
              Buat Toko
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
