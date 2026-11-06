# Shopee collector

Menarik data harian Shopee Seller Centre lewat `ego-browser` dan menyimpannya
sebagai JSON yang dibaca plugin dashboard.

## Pakai

```bash
node run-sync.mjs                        # hari ini (WIB)
node run-sync.mjs --date=2026-11-06      # tanggal tertentu
node run-sync.mjs --dry                  # cetak JSON saja
```

Output: `../data/days/<YYYY-MM-DD>.json` + `../data/latest.json`.
Exit code: `0` sukses, `1` gagal scrape, `2` argumen salah, `3` sesi Shopee habis (`login_required`).

## Isi snapshot

| Bagian | Sumber | Status |
|---|---|---|
| `ads.*` (biaya, penjualan, ROAS, klik, impresi, voucher) | API `report/get_time_graph` (bucket per jam) | ✅ akurat |
| `wallet.*` | API `wallet/get` | ✅ |
| `ads.campaigns[]` | DOM halaman PAS (tab Individual) | ⚠️ parser masih rapuh |
| `store.*` (penjualan, pesanan, pengunjung, konversi) | `datacenter/overview` | ⚠️ hanya hari ini (real-time) |
| `cancellations.*` | `portal/sale/returnrefundcancel` | ⚠️ menunggu perbaikan selector |
| `orders[]` | halaman order (berat) | belum (null) |

Kolom `partial: true` menandai ada bagian yang gagal diambil; `errors[]` menyebut bagiannya.

## Catatan operasional

- Task space browser bernama `shopee-ads-daily`; tiap run membuat page baru lalu menutupnya (space tetap hidup).
- Jangan `task.finish()` — sesi login & space dipakai ulang.
- Kalau sesi Shopee habis: buka ego-browser, login QR, jalankan ulang.

## Jadwal (launchd, macOS)

`~/Library/LaunchAgents/id.mamicleo.shopee-sync.plist` — jalankan pada 08:30, 16:00, 00:30:

```xml
<key>StartCalendarInterval</key>
<array>
  <dict><key>Hour</key><integer>8</integer><key>Minute</key><integer>30</integer></dict>
  <dict><key>Hour</key><integer>16</integer><key>Minute</key><integer>0</integer></dict>
  <dict><key>Hour</key><integer>0</integer><key>Minute</key><integer>30</integer></dict>
</array>
```
