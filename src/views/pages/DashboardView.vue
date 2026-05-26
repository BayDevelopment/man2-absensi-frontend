<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "../../stores/auth";
import { useRouter } from "vue-router";
import Sidebar from "../../components/AppSidebar.vue";
import Navbar from "../../components/AppNavbar.vue";
import AppFooter from "../../components/AppFooter.vue";
import api from "../../plugins/axios";

// ============================================================================
// STORE & ROUTER
// ============================================================================
const authStore = useAuthStore();
const router = useRouter();
const sidebarOpen = ref(false);

// ============================================================================
// NOTIFICATION SETTING
// ============================================================================
const notifSetting = ref({
  kehadiran: true,
  pengumuman: true,
  jadwal: false,
});

const showKehadiran = computed(() => notifSetting.value.kehadiran);
const showPengumuman = computed(() => notifSetting.value.pengumuman);
const showJadwal = computed(() => notifSetting.value.jadwal);

// ============================================================================
// 1. WAKTU, JAM & GREETING
// ============================================================================
const waktuSekarang = ref(new Date());
let timerJam = null;
let timerFetch = null; // sekarang pakai setTimeout (reschedule), bukan setInterval

const todayStr = computed(() =>
  waktuSekarang.value.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }),
);

const greeting = computed(() => {
  const jam = waktuSekarang.value.getHours();
  if (jam < 11) return "Selamat Pagi";
  if (jam < 15) return "Selamat Siang";
  if (jam < 18) return "Selamat Sore";
  return "Selamat Malam";
});

const jamSekarang = computed(() => {
  const h = waktuSekarang.value.getHours().toString().padStart(2, "0");
  const m = waktuSekarang.value.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
});

// ============================================================================
// 2. LOADING STATE, ERROR STATE & DATA MENTAH
// ============================================================================
// Tambah flag 'settings' agar template tidak flicker saat notifSetting belum siap
const isLoading = ref({ summary: true, jadwal: true, pengumuman: true, settings: true });
const errorMsg = ref(null);
const isError = ref(false);

const summary = ref(null);
const jadwalHariIni = ref([]);
const pengumuman = ref([]);
const namaSiswa = ref("");

// Pisah abort controller agar settings & dashboard bisa di-abort sendiri-sendiri
const abortDashboard = ref(null);
const abortSettings = ref(null);

// ============================================================================
// 3. HELPER WAKTU
// ============================================================================
const ambilJam = (value, fallback = "00:00") => (value ? value.toString().slice(0, 5) : fallback);

const toMenit = (str) => {
  if (!str) return 0;
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
};

// ============================================================================
// 4. COMPUTED — REKAP SUMMARY
// ============================================================================
// computed rekap di DashboardView.vue
const rekap = computed(() => {
  const s = summary.value;
  return {
    hadir: s?.hadir ?? 0,
    terlambat: s?.terlambat ?? 0,
    sakit: s?.sakit ?? 0, // ← tambahkan ini
    izin: s?.izin ?? 0,
    alfa: s?.alpha ?? 0,
    total: s?.total ?? 0,
    persentase: s?.persentase_hadir ?? 0,
  };
});

const barWidth = (val, max) => (max > 0 ? Math.round((val / max) * 100) : 0);

// ============================================================================
// 5. COMPUTED — JADWAL HARI INI
// ============================================================================
const jadwalDenganStatus = computed(() => {
  const sekarang = toMenit(jamSekarang.value);
  const listJadwal = Array.isArray(jadwalHariIni.value) ? [...jadwalHariIni.value] : [];

  return listJadwal.map((j) => {
    const mulai = ambilJam(j.jam_mulai);
    const selesai = ambilJam(j.jam_selesai);
    const bukaAbsen = ambilJam(j.jam_buka_absen, j.is_jadwal_pertama ? "07:00" : mulai);
    const tutupAbsen = ambilJam(j.jam_tutup_absen, j.is_jadwal_pertama ? "07:15" : selesai);

    const mMulai = toMenit(mulai);
    const mSelesai = toMenit(selesai);
    const mBukaAbsen = toMenit(bukaAbsen);
    const mTutupAbsen = toMenit(tutupAbsen);

    const tipeAbsen = j.tipe_absen ?? (j.is_jadwal_pertama ? "mandiri" : "guru");
    const isGuru = tipeAbsen === "guru";

    const isIstirahat =
      tipeAbsen === "non_absen" ||
      j.is_break === true ||
      j.is_break === 1 ||
      j.is_break === "1" ||
      j.is_istirahat === true;

    if (isIstirahat) {
      return {
        ...j,
        tipeAbsen,
        isGuru: false,
        isIstirahat: true,
        jamFormatted: `${mulai} – ${selesai}`,
        jamBukaAbsen: bukaAbsen,
        jamTutupAbsen: tutupAbsen,
        aktif: sekarang >= mMulai && sekarang < mSelesai,
        selesai: sekarang >= mSelesai,
        sudahAbsen: false,
        absenDisabled: true,
        absenText: "☕ Istirahat",
        absenInfo: "Waktu istirahat, tidak perlu melakukan absensi",
        absenClass: "istirahat",
        btnLabel: "",
      };
    }

    const sudahAbsen = !!j.sudah_absen;
    const absenBelumDibuka = sekarang < mBukaAbsen;
    const sudahAlfa = sekarang > mTutupAbsen && !sudahAbsen;

    const status = (() => {
      if (sudahAbsen) {
        return {
          text: j.is_jadwal_pertama ? "✅ Presensi Selesai" : "✅ Sudah Absen Mapel",
          info: `Tercatat (${j.status_absen || "Hadir"}) pada pukul ${j.waktu_absen || "-"}`,
          class: "sudah",
        };
      }
      if (isGuru) {
        if (absenBelumDibuka) {
          return {
            text: "🔒 Belum Waktunya",
            info: `Guru dapat mengisi absen mulai pukul ${bukaAbsen}`,
            class: "via-guru",
          };
        }
        if (sudahAlfa) {
          return {
            text: "❌ Waktu Absen Habis",
            info: `Batas absensi mata pelajaran pukul ${tutupAbsen} telah lewat`,
            class: "via-guru",
          };
        }
        return {
          text: "👨‍🏫 Absen oleh Guru",
          info: "Guru akan mengisi presensi mata pelajaran ini",
          class: "via-guru",
        };
      }
      if (sudahAlfa) {
        return {
          text: "❌ Waktu Absen Habis",
          info: `Batas masuk sekolah pukul ${tutupAbsen} telah lewat`,
          class: "belum-tutup",
        };
      }
      if (absenBelumDibuka) {
        return {
          text: "🔒 Absen Belum Dibuka",
          info: `Silahkan lakukan absen mulai pukul ${bukaAbsen}`,
          class: "belum",
        };
      }
      return {
        text: "⚠️ Silahkan Absen",
        info: `Batas masuk sekolah hingga pukul ${tutupAbsen}`,
        class: "belum",
      };
    })();

    return {
      ...j,
      tipeAbsen,
      isGuru,
      isIstirahat: false,
      jamFormatted: `${mulai} – ${selesai}`,
      jamBukaAbsen: bukaAbsen,
      jamTutupAbsen: tutupAbsen,
      aktif: sekarang >= mMulai && sekarang < mSelesai,
      selesai: sekarang >= mSelesai,
      sudahAbsen,
      absenDisabled: isGuru || sudahAbsen || absenBelumDibuka || sudahAlfa,
      absenText: status.text,
      absenInfo: status.info,
      absenClass: status.class,
      btnLabel: isGuru
        ? "Absen oleh Guru"
        : sudahAbsen
          ? "Sudah Absen"
          : sudahAlfa
            ? "Absen Ditutup"
            : absenBelumDibuka
              ? "Belum Dibuka"
              : "Absen Sekarang",
    };
  });
});

const sudahAbsenHariIni = computed(() => {
  const first =
    jadwalDenganStatus.value.find((j) => j.is_jadwal_pertama) ?? jadwalDenganStatus.value[0];
  return !!first?.sudahAbsen;
});

const statusAbsenHariIni = computed(() => {
  const first =
    jadwalDenganStatus.value.find((j) => j.is_jadwal_pertama) ?? jadwalDenganStatus.value[0];
  return first?.status_absen ?? null;
});

// ============================================================================
// 6. COMPUTED — PENGUMUMAN
// ============================================================================
const warnaList = [
  { warna: "#2563eb", bg: "#eff6ff", icon: "📋" },
  { warna: "#d97706", bg: "#fffbeb", icon: "📅" },
  { warna: "#16a34a", bg: "#f0fdf4", icon: "📢" },
  { warna: "#7c3aed", bg: "#f5f3ff", icon: "📌" },
  { warna: "#dc2626", bg: "#fef2f2", icon: "⚠️" },
];

const pengumumanDenganWarna = computed(() =>
  (Array.isArray(pengumuman.value) ? pengumuman.value : []).map((p, i) => ({
    ...p,
    ...warnaList[i % warnaList.length],
    tanggalFormatted: p.tanggal || "Baru saja",
    expiredFormatted: p.expired_at || null,
  })),
);

// ============================================================================
// 7. EXPAND / COLLAPSE ISI PENGUMUMAN
// ============================================================================
const expandedIds = ref(new Set());

const toggleExpand = (id) => {
  const s = new Set(expandedIds.value);
  s.has(id) ? s.delete(id) : s.add(id);
  expandedIds.value = s;
};

const isExpanded = (id) => expandedIds.value.has(id);

// ============================================================================
// 8. AKSI TOMBOL KEARAH ABSEN PAGE
// ============================================================================
const goToAbsen = (jadwal) => {
  if (jadwal.isIstirahat) return;
  if (jadwal.absenDisabled) return;
  if (jadwal.isGuru) return;

  if (!authStore.isLoggedIn) {
    router.push({ path: "/login", query: { redirect: "/absensi" } });
    return;
  }

  router.push({
    path: "/absensi",
    query: {
      jadwal_id: jadwal.id,
      mode: "masuk",
    },
  });
};

// ============================================================================
// 9. FETCH NOTIFICATION SETTING
// — Sekarang support AbortController agar tidak leak saat unmount
// ============================================================================
const fetchNotificationSetting = async () => {
  if (abortSettings.value) abortSettings.value.abort();
  abortSettings.value = new AbortController();

  try {
    const { data } = await api.get("/api/settings", {
      signal: abortSettings.value.signal,
    });
    const n = data.data?.notifikasi ?? {};
    notifSetting.value = {
      kehadiran: n.kehadiran ?? true,
      pengumuman: n.pengumuman ?? true,
      jadwal: n.jadwal ?? false,
    };
  } catch (err) {
    if (err.name === "CanceledError") return;
    console.error("[Dashboard] Gagal fetch setting notifikasi:", err);
    // fallback aman, tidak ubah state yang sudah ada jika pernah berhasil sebelumnya
    notifSetting.value = { kehadiran: true, pengumuman: true, jadwal: false };
  } finally {
    isLoading.value.settings = false;
  }
};

// ============================================================================
// 10. FETCH DATA DASHBOARD
// ============================================================================
const fetchDashboard = async () => {
  if (abortDashboard.value) abortDashboard.value.abort();
  abortDashboard.value = new AbortController();

  errorMsg.value = null;
  isError.value = false;
  isLoading.value = { ...isLoading.value, summary: true, jadwal: true, pengumuman: true };

  try {
    const { data } = await api.get("/api/dashboard", {
      signal: abortDashboard.value.signal,
    });

    summary.value = data.summary ?? null;
    jadwalHariIni.value = Array.isArray(data.jadwal_hari_ini) ? data.jadwal_hari_ini : [];
    pengumuman.value = Array.isArray(data.pengumuman) ? data.pengumuman : [];
    namaSiswa.value = data.nama_siswa || authStore.user?.name || "Siswa";
  } catch (err) {
    if (err.name === "CanceledError") return;

    console.error("[Dashboard] Gagal fetch data:", err);
    isError.value = true;
    namaSiswa.value = authStore.user?.name || "Siswa";

    if (err.response?.status === 401) {
      errorMsg.value = "Sesi Anda telah berakhir. Silakan login kembali.";
      router.push({ path: "/login", query: { redirect: "/dashboard" } });
    } else if (err.response?.status >= 500) {
      errorMsg.value = "Server sedang bermasalah. Silakan coba beberapa saat lagi.";
    } else if (!navigator.onLine) {
      errorMsg.value = "Tidak ada koneksi internet. Periksa jaringan Anda.";
    } else {
      errorMsg.value = "Gagal memuat data. Silakan coba lagi.";
    }
  } finally {
    isLoading.value = { ...isLoading.value, summary: false, jadwal: false, pengumuman: false };
  }
};

// ============================================================================
// 11. FETCH GABUNGAN — jalankan settings & dashboard secara paralel
// ============================================================================
const fetchAll = () => Promise.all([fetchNotificationSetting(), fetchDashboard()]);

// ============================================================================
// 12. RESCHEDULE — fetch selesai dulu, baru jadwalkan berikutnya
// Mencegah overlap fetch ketika koneksi lambat
// ============================================================================
const scheduleNext = () => {
  timerFetch = setTimeout(async () => {
    await fetchAll();
    scheduleNext();
  }, 5 * 60_000);
};

// ============================================================================
// 13. LIFECYCLE
// ============================================================================
onMounted(async () => {
  // Jam tetap jalan sejak awal, tidak perlu tunggu fetch
  timerJam = setInterval(() => {
    waktuSekarang.value = new Date();
  }, 60_000);

  // Fetch pertama: settings & dashboard selesai dulu sebelum render data
  await fetchAll();

  // Baru mulai siklus refresh berikutnya setelah fetch pertama selesai
  scheduleNext();
});

onUnmounted(() => {
  if (timerJam) clearInterval(timerJam);
  if (timerFetch) clearTimeout(timerFetch); // clearTimeout karena pakai setTimeout
  abortDashboard.value?.abort();
  abortSettings.value?.abort();
});
</script>

<template>
  <div class="layout-root">
    <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="layout-main">
      <Navbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <main class="layout-content">
        <div class="hero-card">
          <!-- ── SKELETON STATE ── -->
          <template v-if="isLoading.jadwal || isLoading.settings">
            <div class="hero-left">
              <div class="skeleton hero-sk-greeting" />
              <div class="skeleton hero-sk-name" />
              <div class="skeleton hero-sk-date" />
              <div class="skeleton hero-sk-badge" />
            </div>

            <div class="hero-illustration hero-sk-illustration" aria-hidden="true">
              <div class="ill-circle ill-c1" />
              <div class="ill-circle ill-c2" />
              <div class="ill-circle ill-c3" />
              <div class="hero-sk-icon" />
            </div>
          </template>

          <!-- ── DATA STATE ── -->
          <template v-else>
            <div class="hero-left">
              <p class="hero-greeting">{{ greeting }},</p>
              <h1 class="hero-name">{{ namaSiswa }} 👋</h1>
              <p class="hero-date">{{ todayStr }}</p>
              <div
                class="hero-absen-badge"
                :class="sudahAbsenHariIni ? 'badge-hadir' : 'badge-belum'"
              >
                <span class="badge-dot" />
                <span v-if="sudahAbsenHariIni">
                  Sudah Absen
                  <span v-if="statusAbsenHariIni" class="badge-status">
                    · {{ statusAbsenHariIni }}
                  </span>
                </span>
                <span v-else>Belum Absen Hari Ini</span>
              </div>
            </div>

            <div class="hero-illustration" aria-hidden="true">
              <div class="ill-circle ill-c1" />
              <div class="ill-circle ill-c2" />
              <div class="ill-circle ill-c3" />

              <svg v-if="sudahAbsenHariIni" class="ill-icon" viewBox="0 0 64 64" fill="none">
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  fill="white"
                  fill-opacity="0.12"
                  stroke="white"
                  stroke-opacity="0.25"
                  stroke-width="2"
                />
                <circle cx="32" cy="32" r="18" fill="#4ade80" fill-opacity="0.2" />
                <path
                  d="M21 32l8 8 14-15"
                  stroke="white"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>

              <svg v-else class="ill-icon" viewBox="0 0 64 64" fill="none">
                <rect
                  x="8"
                  y="10"
                  width="48"
                  height="46"
                  rx="6"
                  fill="white"
                  fill-opacity="0.18"
                  stroke="white"
                  stroke-opacity="0.4"
                  stroke-width="2"
                />
                <rect
                  x="22"
                  y="6"
                  width="20"
                  height="12"
                  rx="4"
                  fill="white"
                  fill-opacity="0.25"
                  stroke="white"
                  stroke-opacity="0.5"
                  stroke-width="2"
                />
                <line
                  x1="18"
                  y1="28"
                  x2="46"
                  y2="28"
                  stroke="white"
                  stroke-opacity="0.5"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <line
                  x1="18"
                  y1="36"
                  x2="46"
                  y2="36"
                  stroke="white"
                  stroke-opacity="0.5"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <line
                  x1="18"
                  y1="44"
                  x2="34"
                  y2="44"
                  stroke="white"
                  stroke-opacity="0.5"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <circle cx="48" cy="44" r="10" fill="#fbbf24" fill-opacity="0.9" />
                <line
                  x1="48"
                  y1="40"
                  x2="48"
                  y2="45"
                  stroke="white"
                  stroke-width="2.2"
                  stroke-linecap="round"
                />
                <circle cx="48" cy="48" r="1.2" fill="white" />
              </svg>
            </div>
          </template>
        </div>

        <div v-if="showKehadiran" class="stats-row">
          <template v-if="isLoading.summary || isLoading.settings">
            <div v-for="i in 4" :key="i" class="stat-card skeleton-card">
              <div class="skeleton sk-ico" />
              <div class="skeleton sk-num" />
              <div class="skeleton sk-lbl" />
            </div>
          </template>

          <template v-else>
            <div class="stat-card" style="--c: #16a34a; --bg: #f0fdf4; --br: #bbf7d0">
              <div class="stat-ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div class="stat-num">
                {{ rekap.hadir }}<span class="stat-of">/{{ rekap.total }}</span>
              </div>
              <div class="stat-lbl">Hari Hadir</div>
            </div>

            <div class="stat-card" style="--c: #2563eb; --bg: #eff6ff; --br: #bfdbfe">
              <div class="stat-ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div class="stat-num">{{ rekap.persentase }}<span class="stat-of">%</span></div>
              <div class="stat-lbl">Kehadiran</div>
            </div>

            <div class="stat-card" style="--c: #d97706; --bg: #fffbeb; --br: #fde68a">
              <div class="stat-ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
              <div class="stat-num">{{ rekap.izin }}</div>
              <div class="stat-lbl">Izin / Sakit</div>
            </div>

            <div class="stat-card" style="--c: #dc2626; --bg: #fef2f2; --br: #fecaca">
              <div class="stat-ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <div class="stat-num">{{ rekap.alfa }}</div>
              <div class="stat-lbl">Tidak Hadir</div>
            </div>
          </template>
        </div>

        <div class="bottom-grid" :class="{ 'single-column': !showJadwal }">
          <div v-if="showJadwal" class="card jadwal-card">
            <div class="card-header">
              <div class="card-title-wrap">
                <span class="card-title-icon">📚</span>
                <h3 class="card-title">Jadwal Hari Ini</h3>
              </div>
              <router-link to="/jadwal" class="card-link">Lihat semua →</router-link>
            </div>

            <template v-if="isLoading.jadwal || isLoading.settings">
              <div class="jadwal-list">
                <div v-for="i in 4" :key="i" class="jadwal-item">
                  <div class="jadwal-dot-wrap">
                    <div class="jadwal-dot" />
                    <div v-if="i < 4" class="jadwal-line" />
                  </div>
                  <div class="jadwal-body" style="padding-bottom: 16px">
                    <div class="skeleton sk-jadwal-mapel" />
                    <div class="skeleton sk-jadwal-meta" style="margin-top: 6px" />
                  </div>
                </div>
              </div>
            </template>

            <template v-else-if="jadwalDenganStatus.length === 0">
              <div class="empty-state">
                <span class="empty-icon">📭</span>
                <p class="empty-text">Tidak ada jadwal hari ini</p>
              </div>
            </template>

            <template v-else>
              <div class="jadwal-list">
                <div
                  v-for="(j, i) in jadwalDenganStatus"
                  :key="j.id ?? i"
                  class="jadwal-item"
                  :class="{
                    'jadwal-aktif': j.aktif,
                    'jadwal-selesai': j.selesai,
                  }"
                >
                  <div class="jadwal-dot-wrap">
                    <div class="jadwal-dot" />
                    <div v-if="i < jadwalDenganStatus.length - 1" class="jadwal-line" />
                  </div>

                  <div class="jadwal-body">
                    <div class="jadwal-top">
                      <span class="jadwal-mapel">
                        {{ j.mapel ?? j.mata_pelajaran?.nama ?? "Mata Pelajaran" }}
                      </span>
                      <span v-if="j.aktif" class="jadwal-now-badge">Sekarang</span>
                      <span v-else-if="j.selesai" class="jadwal-done-badge">Selesai</span>
                    </div>

                    <div class="jadwal-meta">
                      <span>🕐 {{ j.jamFormatted }}</span>
                      <span>📍 {{ j.ruang ?? "Kelas" }}</span>
                      <span>👤 {{ j.nama_guru ?? j.guru?.nama ?? "-" }}</span>
                    </div>

                    <div class="jadwal-bottom">
                      <div class="absen-info">
                        <span class="absen-dot" :class="`absen-dot-${j.absenClass}`" />
                        <div>
                          <p class="absen-title">{{ j.absenText }}</p>
                          <p class="absen-desc">{{ j.absenInfo }}</p>
                        </div>
                      </div>
                      <button
                        v-if="!j.isIstirahat"
                        type="button"
                        class="jadwal-absen-btn"
                        :class="[`absen-btn-${j.absenClass}`, { 'absen-btn-via-guru': j.isGuru }]"
                        :disabled="j.absenDisabled"
                        :title="j.isGuru ? 'Absensi mapel ini dilakukan oleh guru' : ''"
                        @click="goToAbsen(j)"
                      >
                        <span v-if="j.isGuru" class="btn-icon">👨‍🏫</span>
                        {{ j.btnLabel }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <div class="right-col">
            <div class="card">
              <div class="card-header">
                <div class="card-title-wrap">
                  <span class="card-title-icon">📊</span>
                  <h3 class="card-title">Rekap Tahun Ini</h3>
                </div>
              </div>

              <template v-if="isLoading.summary || isLoading.settings">
                <div class="rekap-list">
                  <div v-for="i in 3" :key="i" class="rekap-item">
                    <div class="skeleton sk-rekap-label" />
                    <div class="skeleton sk-rekap-bar" style="margin-top: 6px" />
                  </div>
                </div>
              </template>

              <template v-else>
                <div class="rekap-list">
                  <div class="rekap-item">
                    <div class="rekap-row">
                      <span class="rekap-label">Hadir</span>
                      <span class="rekap-val" style="color: #16a34a">{{ rekap.hadir }} hari</span>
                    </div>
                    <div class="rekap-bg">
                      <div
                        class="rekap-fill"
                        :style="{
                          width: barWidth(rekap.hadir, rekap.total) + '%',
                          background: '#16a34a',
                        }"
                      />
                    </div>
                  </div>

                  <div class="rekap-item">
                    <div class="rekap-row">
                      <span class="rekap-label">Terlambat</span>
                      <span class="rekap-val" style="color: #f59e0b"
                        >{{ rekap.terlambat }} hari</span
                      >
                    </div>
                    <div class="rekap-bg">
                      <div
                        class="rekap-fill"
                        :style="{
                          width: barWidth(rekap.terlambat, rekap.total) + '%',
                          background: '#f59e0b',
                        }"
                      />
                    </div>
                  </div>

                  <div class="rekap-item">
                    <div class="rekap-row">
                      <span class="rekap-label">Izin / Sakit</span>
                      <span class="rekap-val" style="color: #d97706">{{ rekap.izin }} hari</span>
                    </div>
                    <div class="rekap-bg">
                      <div
                        class="rekap-fill"
                        :style="{
                          width: barWidth(rekap.izin, rekap.total) + '%',
                          background: '#d97706',
                        }"
                      />
                    </div>
                  </div>

                  <div class="rekap-item">
                    <div class="rekap-row">
                      <span class="rekap-label">Alfa</span>
                      <span class="rekap-val" style="color: #dc2626">{{ rekap.alfa }} hari</span>
                    </div>
                    <div class="rekap-bg">
                      <div
                        class="rekap-fill"
                        :style="{
                          width:
                            Math.max(barWidth(rekap.alfa, rekap.total), rekap.alfa > 0 ? 2 : 0) +
                            '%',
                          background: '#dc2626',
                        }"
                      />
                    </div>
                  </div>
                </div>

                <div
                  class="status-chip"
                  :style="
                    rekap.persentase >= 90
                      ? 'background:#f0fdf4;border-color:#bbf7d0;color:#16a34a'
                      : 'background:#fffbeb;border-color:#fde68a;color:#d97706'
                  "
                >
                  <span>{{ rekap.persentase >= 90 ? "🌟" : "⚠️" }}</span>
                  <div>
                    <p class="chip-label">Status Kehadiran</p>
                    <p class="chip-val">
                      {{ rekap.persentase >= 90 ? "Sangat Baik" : "Perlu Perhatian" }}
                    </p>
                  </div>
                </div>
              </template>
            </div>

            <div v-if="showPengumuman" class="card">
              <div class="card-header">
                <div class="card-title-wrap">
                  <span class="card-title-icon">📢</span>
                  <h3 class="card-title">Pengumuman</h3>
                </div>
              </div>

              <!-- SKELETON -->
              <template v-if="isLoading.pengumuman || isLoading.settings">
                <div class="pengumuman-list">
                  <div v-for="i in 2" :key="i" class="skeleton sk-pengumuman" />
                </div>
              </template>

              <!-- KOSONG -->
              <template v-else-if="pengumumanDenganWarna.length === 0">
                <div class="empty-state">
                  <span class="empty-icon">📭</span>
                  <p class="empty-text">Belum ada pengumuman</p>
                </div>
              </template>

              <!-- DATA -->
              <template v-else>
                <div class="pengumuman-list">
                  <article
                    v-for="(p, i) in pengumumanDenganWarna"
                    :key="p.id ?? i"
                    class="pengumuman-item"
                    :style="{ background: p.bg, borderColor: p.warna + '33' }"
                  >
                    <div class="peng-icon-wrap" :style="{ color: p.warna }">
                      <span class="peng-icon">{{ p.icon }}</span>
                    </div>

                    <div class="peng-content">
                      <div class="peng-head">
                        <p class="peng-judul" :style="{ color: p.warna }">{{ p.judul }}</p>
                        <span v-if="p.tanggalFormatted" class="peng-date">{{
                          p.tanggalFormatted
                        }}</span>
                      </div>

                      <div
                        v-if="p.isi"
                        class="peng-isi"
                        :class="{ 'peng-isi-clamped': !isExpanded(p.id ?? i) }"
                        v-html="p.isi"
                      />

                      <button
                        v-if="p.isi"
                        type="button"
                        class="peng-toggle"
                        :style="{ color: p.warna }"
                        @click="toggleExpand(p.id ?? i)"
                      >
                        {{ isExpanded(p.id ?? i) ? "Lihat sedikit ▲" : "Lihat selengkapnya ▼" }}
                      </button>

                      <div v-if="p.dibuat_oleh || p.expiredFormatted" class="peng-footer">
                        <span v-if="p.dibuat_oleh" class="peng-chip"> ✍️ {{ p.dibuat_oleh }} </span>
                        <span v-if="p.expiredFormatted" class="peng-chip peng-chip-expired">
                          ⏳ Berlaku hingga {{ p.expiredFormatted }}
                        </span>
                      </div>
                    </div>
                  </article>
                </div>
              </template>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  </div>
</template>

<style scoped>
/* font dan root */
.bottom-grid.single-column {
  grid-template-columns: 1fr;
}
.absen-dot-istirahat {
  background: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.12);
}
.layout-root {
  display: flex;
  min-height: 100vh;
  background: #f0fdf4;
  font-family: "Poppins", sans-serif;
}

.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.layout-content {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ============================================================================
   HERO CARD
============================================================================ */
.hero-card {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 60%, #166534 100%);
  border-radius: 20px;
  padding: 28px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(22, 163, 74, 0.25);
}

.hero-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 1;
}

.hero-greeting {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.75);
  margin: 0;
}

.hero-name {
  font-size: 26px;
  font-weight: 800;
  color: white;
  margin: 0;
  line-height: 1.2;
}

.hero-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
  margin: 2px 0 0;
}

/* Badge status absen */
.hero-absen-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 12px;
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.01em;
  backdrop-filter: blur(8px);
  transition:
    background 0.3s,
    border-color 0.3s;
}

.badge-hadir {
  background: rgba(74, 222, 128, 0.2);
  border: 1px solid rgba(74, 222, 128, 0.5);
  color: #ffffff;
}

.badge-belum {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 0.82);
}

.badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.badge-hadir .badge-dot {
  background: #4ade80;
  box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.3);
  animation: pulse-badge 2s ease-in-out infinite;
}

.badge-belum .badge-dot {
  background: rgba(255, 255, 255, 0.55);
}

.badge-status {
  opacity: 0.8;
  font-weight: 600;
  text-transform: capitalize;
}

@keyframes pulse-badge {
  0%,
  100% {
    box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.3);
  }
  50% {
    box-shadow: 0 0 0 5px rgba(74, 222, 128, 0.08);
  }
}

/* Ilustrasi kanan */
.hero-illustration {
  position: relative;
  width: 120px;
  height: 100px;
  flex-shrink: 0;
}

.ill-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.ill-c1 {
  width: 90px;
  height: 90px;
  top: 5px;
  right: 0;
}
.ill-c2 {
  width: 55px;
  height: 55px;
  top: -10px;
  right: 20px;
  background: rgba(255, 255, 255, 0.07);
}
.ill-c3 {
  width: 30px;
  height: 30px;
  bottom: 0;
  right: 70px;
}

.ill-icon {
  position: absolute;
  width: 70px;
  height: 70px;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
}

/* ============================================================================
   HERO SKELETON
============================================================================ */
.hero-sk-greeting,
.hero-sk-name,
.hero-sk-date,
.hero-sk-badge,
.hero-sk-icon {
  animation: skeleton-shimmer-hero 1.4s ease-in-out infinite;
}

.hero-sk-greeting {
  width: 120px;
  height: 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.25);
  margin-bottom: 10px;
}

.hero-sk-name {
  width: 200px;
  height: 32px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.3);
  margin-bottom: 10px;
  animation-delay: 0.1s;
}

.hero-sk-date {
  width: 160px;
  height: 13px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.2);
  margin-bottom: 16px;
  animation-delay: 0.15s;
}

.hero-sk-badge {
  width: 150px;
  height: 28px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.2);
  animation-delay: 0.2s;
}

.hero-sk-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  animation-delay: 0.25s;
}

@keyframes skeleton-shimmer-hero {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

/* ============================================================================
   STAT CARDS
============================================================================ */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  border: 1px solid var(--br);
  padding: 18px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition:
    box-shadow 0.2s,
    transform 0.2s;
}

.stat-card:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.stat-ico {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.stat-ico svg {
  width: 18px;
  height: 18px;
  stroke: var(--c);
}

.stat-num {
  font-size: 30px;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}

.stat-of {
  font-size: 16px;
  font-weight: 600;
  color: var(--c);
}

.stat-lbl {
  font-size: 11.5px;
  font-weight: 500;
  color: #6b7280;
}

/* ============================================================================
   SKELETON (GLOBAL)
============================================================================ */
.skeleton {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 6px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton-card {
  --br: #e5e7eb;
  min-height: 110px;
}
.sk-ico {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  margin-bottom: 10px;
}
.sk-num {
  width: 70px;
  height: 28px;
  border-radius: 6px;
}
.sk-lbl {
  width: 80px;
  height: 12px;
  border-radius: 4px;
  margin-top: 4px;
}
.sk-jadwal-mapel {
  width: 140px;
  height: 14px;
  border-radius: 4px;
}
.sk-jadwal-meta {
  width: 200px;
  height: 11px;
  border-radius: 4px;
}
.sk-rekap-label {
  width: 100%;
  height: 14px;
  border-radius: 4px;
}
.sk-rekap-bar {
  width: 100%;
  height: 7px;
  border-radius: 99px;
}
.sk-pengumuman {
  width: 100%;
  height: 72px;
  border-radius: 12px;
  margin-bottom: 10px;
}

/* ============================================================================
   EMPTY STATE
============================================================================ */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 0;
}

.empty-icon {
  font-size: 28px;
}

.empty-text {
  font-size: 12.5px;
  color: #9ca3af;
  margin: 0;
}

/* ============================================================================
   LAYOUT GRID
============================================================================ */
.bottom-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 16px;
  align-items: start;
}

.right-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ============================================================================
   CARD BASE
============================================================================ */
.card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title-icon {
  font-size: 16px;
  line-height: 1;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.card-link {
  font-size: 12px;
  font-weight: 600;
  color: #16a34a;
  text-decoration: none;
}

.card-link:hover {
  text-decoration: underline;
}

/* ============================================================================
   JADWAL
============================================================================ */
.jadwal-list {
  display: flex;
  flex-direction: column;
}

.jadwal-item {
  display: flex;
  gap: 12px;
  position: relative;
}

.jadwal-dot-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  padding-top: 3px;
}

.jadwal-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #d1d5db;
  border: 2px solid #e5e7eb;
  flex-shrink: 0;
  transition: background 0.2s;
}

.jadwal-line {
  width: 2px;
  flex: 1;
  background: #f3f4f6;
  margin: 3px 0;
  min-height: 16px;
}

.jadwal-aktif .jadwal-dot {
  background: #16a34a;
  border-color: #bbf7d0;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
}

.jadwal-selesai .jadwal-dot {
  background: #d1d5db;
  border-color: #e5e7eb;
}

.jadwal-body {
  padding-bottom: 18px;
  flex: 1;
}

.jadwal-item:last-child .jadwal-body {
  padding-bottom: 0;
}

.jadwal-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.jadwal-mapel {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.jadwal-selesai .jadwal-mapel {
  color: #9ca3af;
  text-decoration: line-through;
}

.jadwal-now-badge {
  font-size: 10px;
  font-weight: 700;
  color: #16a34a;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 2px 8px;
  border-radius: 99px;
  animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.jadwal-done-badge {
  font-size: 10px;
  font-weight: 600;
  color: #9ca3af;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  padding: 2px 8px;
  border-radius: 99px;
}

.jadwal-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 11px;
  color: #9ca3af;
}

/* ============================================================================
   STATUS ABSEN
============================================================================ */
.jadwal-bottom {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.absen-info {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 180px;
}

.absen-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
}

.absen-dot-sudah {
  background: #16a34a;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12);
}
.absen-dot-belum {
  background: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.12);
}
.absen-dot-belum-tutup {
  background: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12);
}
.absen-dot-via-guru {
  background: #94a3b8;
  box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.12);
}

.absen-title {
  font-size: 12px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.absen-desc {
  font-size: 10.5px;
  color: #9ca3af;
  margin: 2px 0 0;
}

/* Tombol absen */
.jadwal-absen-btn {
  border: 1px solid transparent;
  outline: none;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s,
    opacity 0.2s,
    box-shadow 0.2s;
}

.jadwal-absen-btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
}

.jadwal-absen-btn:disabled {
  cursor: not-allowed;
  opacity: 0.8;
}

.absen-btn-sudah {
  color: #16a34a;
  background: #f0fdf4;
  border-color: #bbf7d0;
}
.absen-btn-belum {
  color: #92400e;
  background: #fffbeb;
  border-color: #fde68a;
}
.absen-btn-belum-tutup {
  color: #991b1b;
  background: #fef2f2;
  border-color: #fecaca;
}

/* Tombol via guru — selalu disabled, abu-abu */
.absen-btn-via-guru {
  background: #f1f5f9 !important;
  color: #94a3b8 !important;
  border: 1.5px solid #e2e8f0 !important;
  cursor: not-allowed !important;
  opacity: 0.85;
  box-shadow: none !important;
}

.absen-btn-via-guru:hover {
  background: #f1f5f9 !important;
  color: #94a3b8 !important;
  transform: none !important;
  box-shadow: none !important;
}

.btn-icon {
  margin-right: 4px;
  font-size: 0.95em;
}

/* ============================================================================
   REKAP
============================================================================ */
.rekap-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rekap-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rekap-row {
  display: flex;
  justify-content: space-between;
}

.rekap-label {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.rekap-val {
  font-size: 12px;
  font-weight: 700;
}

.rekap-bg {
  height: 7px;
  background: #f3f4f6;
  border-radius: 99px;
  overflow: hidden;
}

.rekap-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.8s ease;
}

.status-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid;
  font-size: 20px;
}

.chip-label {
  font-size: 10.5px;
  color: #6b7280;
  margin: 0;
}

.chip-val {
  font-size: 15px;
  font-weight: 800;
  margin: 0;
  line-height: 1.2;
}

/* ============================================================================
   PENGUMUMAN
============================================================================ */
.pengumuman-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 360px;
  overflow-y: auto;
  padding-right: 4px;
}

.pengumuman-list::-webkit-scrollbar {
  width: 5px;
}
.pengumuman-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 999px;
}

.pengumuman-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.pengumuman-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
}

.peng-icon-wrap {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.peng-icon {
  font-size: 17px;
  line-height: 1;
}

.peng-content {
  flex: 1;
  min-width: 0;
}

.peng-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.peng-judul {
  font-size: 13px;
  font-weight: 800;
  margin: 0;
  line-height: 1.35;
}

.peng-date {
  font-size: 10px;
  color: #6b7280;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(209, 213, 219, 0.7);
  padding: 3px 7px;
  border-radius: 999px;
  white-space: nowrap;
}

/* Isi pengumuman — expand/collapse dengan max-height */
.peng-isi {
  font-size: 11.5px;
  color: #4b5563;
  margin: 0;
  line-height: 1.55;
  overflow: hidden;
  transition:
    max-height 0.4s ease,
    -webkit-mask-image 0.4s ease,
    mask-image 0.4s ease;
  max-height: 2000px; /* expanded: cukup besar untuk konten apapun */
}

.peng-isi.peng-isi-clamped {
  max-height: 4.8em; /* collapsed: ~3 baris */
  -webkit-mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
  mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
}

.peng-isi :deep(p) {
  margin: 0 0 6px;
}
.peng-isi :deep(p:last-child) {
  margin-bottom: 0;
}
.peng-isi :deep(ul),
.peng-isi :deep(ol) {
  padding-left: 18px;
  margin: 6px 0;
}

/* Tombol lihat selengkapnya / sedikit */
.peng-toggle {
  display: inline-block;
  margin-top: 6px;
  font-size: 11px;
  font-weight: 700;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.15s;
}

.peng-toggle:hover {
  opacity: 1;
  text-decoration: underline;
}

/* Footer chip */
.peng-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 9px;
}

.peng-chip {
  font-size: 10px;
  font-weight: 700;
  color: #374151;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(209, 213, 219, 0.7);
  padding: 3px 8px;
  border-radius: 999px;
}

.peng-chip-expired {
  color: #c2410c;
  background: #fff7ed;
  border-color: #fed7aa;
}

/* ============================================================================
   RESPONSIVE
============================================================================ */
@media (max-width: 1024px) {
  .bottom-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .layout-content {
    padding: 14px;
    gap: 14px;
  }
  .hero-card {
    padding: 20px;
  }
  .hero-name {
    font-size: 20px;
  }
  .hero-illustration {
    display: none;
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .jadwal-bottom {
    align-items: stretch;
  }
  .jadwal-absen-btn {
    width: 100%;
  }

  .peng-head {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
