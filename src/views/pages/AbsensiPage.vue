<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import api from "../../plugins/axios";
import { useAuthStore } from "../../stores/auth";
import Sidebar from "../../components/AppSidebar.vue";
import Navbar from "../../components/AppNavbar.vue";
import AppFooter from "../../components/AppFooter.vue";
import Swal from "sweetalert2";

// ============================================================================
// TOAST & ALERT HELPERS
// ============================================================================
function showToast(icon = "error", title = "Terjadi kesalahan.") {
  Swal.fire({
    toast: true,
    position: "top-end",
    icon,
    title,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: "#ffffff",
    color: "#111827",
    customClass: {
      popup: "swal-toast-popup",
      title: "swal-toast-title",
    },
  });
}

function showAbsensiAlert(error) {
  const type = error.response?.data?.type;
  const message = error.response?.data?.message || "Terjadi kesalahan.";

  const errorMap = {
    face_not_match: [
      "error",
      "Wajah tidak sama. Pastikan wajah sesuai dengan akun siswa yang login.",
    ],
    face_required: ["warning", "Absen mapel pertama wajib menggunakan verifikasi wajah."],
    face_not_registered: [
      "warning",
      "Data wajah belum terdaftar. Silakan hubungi guru atau operator.",
    ],
    attendance_not_open: ["info", "Absensi belum dibuka."],
    subject_finished: ["warning", "Mapel sudah selesai. Anda tidak bisa absen masuk."],
    already_absen: ["warning", "Anda sudah memiliki catatan di jadwal ini."],
    already_present: ["warning", "Anda sudah diabsen hadir di mapel ini."],
    invalid_schedule: ["warning", "Jadwal tidak valid atau tidak sesuai dengan kelas Anda."],
    attendance_not_found: ["warning", "Data absen masuk belum ditemukan."],
    checkin_required: ["warning", "Anda belum melakukan absen masuk."],
    already_checkout: ["info", "Anda sudah melakukan absen keluar."],
    checkout_not_open: ["info", "Absen keluar belum bisa dilakukan karena mapel belum selesai."],
    invalid_date: ["warning", "Izin/Sakit hanya bisa diajukan untuk hari ini."],
    attendance_closed: ["warning", "Batas absen siswa sudah lewat. Silakan hubungi guru."],
    student_only_morning: ["warning", "Siswa hanya dapat absen pada jam masuk pagi."],
    cannot_request_status: [
      "warning",
      "Pengajuan izin/sakit hanya bisa dilakukan pada jam absen pagi.",
    ],
    schedule_not_first_mapel: ["warning", "Izin/sakit hanya bisa diajukan pada jadwal absen pagi."],
    student_checkout_disabled: [
      "info",
      "Siswa hanya melakukan absen masuk pagi. Jam keluar dikelola guru.",
    ],
    server_error: ["error", message],
  };

  const [icon, title] = errorMap[type] ?? ["error", message];
  showToast(icon, title);
}

// ============================================================================
// STORE & REACTIVE STATE
// ============================================================================
const authStore = useAuthStore();
const sidebarOpen = ref(false);

const ABSENSI_API = "/api/absensi";

const activeTab = ref("bulan");
const searchQuery = ref("");
const filterStatus = ref("");
const filterMatpel = ref("");
const showModal = ref(false);
const modalMode = ref("view");
const selectedRecord = ref(null);

const attendanceRecords = ref([]);
const currentSiswa = ref(null);
const loadingPage = ref(false);
const loadingActionKey = ref(null);
const loadingIzin = ref(false);
const fileInput = ref(null);

const skeletonStats = Array.from({ length: 4 }, (_, i) => i);
const skeletonPills = Array.from({ length: 3 }, (_, i) => i);

const showPageSkeleton = computed(() => loadingPage.value && attendanceRecords.value.length === 0);

// FIX #2: 1 detik karena nowHms() pakai detik untuk perbandingan window absen
const nowTime = ref(new Date());
let clockInterval = null;

// FIX #5: AbortController untuk cegah race condition saat ganti tab cepat
const abortController = ref(null);

const serverTodayDate = ref(localTodayYmd());

// ============================================================================
// LIFECYCLE
// ============================================================================
onMounted(() => {
  fetchAbsensi();

  // FIX #2: interval 1 detik agar nowHms() akurat untuk cek window absen
  clockInterval = setInterval(() => {
    nowTime.value = new Date();
  }, 1_000);
});

onUnmounted(() => {
  if (clockInterval) clearInterval(clockInterval);
  // FIX #5: batalkan request yang masih pending saat komponen di-unmount
  if (abortController.value) abortController.value.abort();
});

// ============================================================================
// WAKTU & TANGGAL HELPERS
// ============================================================================
const today = computed(() =>
  nowTime.value.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }),
);

function localTodayYmd() {
  const d = nowTime.value ?? new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nowHms() {
  const d = nowTime.value;
  return (
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0") +
    ":" +
    String(d.getSeconds()).padStart(2, "0")
  );
}

function dateOnly(dateValue) {
  if (!dateValue) return "";
  return String(dateValue).split("T")[0];
}

function isTodayDate(dateValue) {
  return dateOnly(dateValue) === serverTodayDate.value;
}

function formatTanggal(dateStr) {
  if (!dateStr) return "—";
  const cleanDate = dateOnly(dateStr);
  const [year, month, day] = cleanDate.split("-");
  if (!year || !month || !day) return "—";
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function getHari(dateStr) {
  if (!dateStr) return "—";
  const cleanDate = dateOnly(dateStr);
  const [year, month, day] = cleanDate.split("-");
  if (!year || !month || !day) return "—";
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return d.toLocaleDateString("id-ID", { weekday: "long" });
}

function ucfirst(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function normalizeHms(value) {
  if (!value || value === "—") return null;
  const [hour = "00", minute = "00", second = "00"] = String(value).split(":");
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
}

function displayTime(value) {
  if (!value) return "—";
  return String(value).slice(0, 5);
}

// ============================================================================
// USER DISPLAY NAME
// ============================================================================
function cleanName(value) {
  const name = String(value ?? "").trim();
  return name.length > 0 ? name : null;
}

const userDisplayName = computed(() => {
  const siswaName = cleanName(currentSiswa.value?.nama_lengkap ?? currentSiswa.value?.nama);
  const authName = cleanName(authStore.user?.name);
  return siswaName || authName || "Siswa";
});

// ============================================================================
// STATUS CONFIG & MAPPING
// ============================================================================
const statusConfig = {
  Hadir: { cls: "badge-hadir", dot: "#16a34a" },
  Terlambat: { cls: "badge-terlambat", dot: "#9333ea" },
  Izin: { cls: "badge-izin", dot: "#d97706" },
  Sakit: { cls: "badge-sakit", dot: "#2563eb" },
  Alfa: { cls: "badge-alfa", dot: "#dc2626" },
};

function backendStatusToUi(status) {
  const map = {
    hadir: "Hadir",
    terlambat: "Terlambat",
    izin: "Izin",
    sakit: "Sakit",
    alfa: "Alfa",
    Hadir: "Hadir",
    Terlambat: "Terlambat",
    Izin: "Izin",
    Sakit: "Sakit",
    Alfa: "Alfa",
  };
  return map[status] ?? "Alfa";
}

function getStatusClass(status) {
  return statusConfig[status]?.cls ?? "badge-alfa";
}

function getStatusDot(status) {
  return statusConfig[status]?.dot ?? "#dc2626";
}

function recordKey(record) {
  return record.id ?? `jadwal-${record.jadwal_id}`;
}

function mapAbsensi(item) {
  const jadwal = item.jadwal ?? {};
  const jamJadwalMulai = displayTime(item.jam_jadwal_mulai ?? jadwal.jam_mulai);
  const jamJadwalSelesai = displayTime(item.jam_jadwal_selesai ?? jadwal.jam_selesai);
  const actionText = item.action_text ?? "Tidak Ada Aksi";

  return {
    id: item.id,
    siswa_id: item.siswa_id,
    kelas_id: item.kelas_id ?? item.kelas?.id ?? null,
    jadwal_id: item.jadwal_id ?? jadwal.id ?? null,
    tanggal: dateOnly(item.tanggal),
    hari: item.hari ?? getHari(item.tanggal),
    matpel:
      item.matpel ??
      item.mata_pelajaran ??
      jadwal.mata_pelajaran?.nama ??
      jadwal.matpel?.nama ??
      "—",
    guru: item.guru ?? jadwal.guru?.nama_lengkap ?? jadwal.guru?.nama ?? "—",
    kelas: item.kelas?.nama_kelas ?? item.kelas?.nama ?? item.nama_kelas ?? "—",
    jamMasuk: displayTime(item.jam_masuk),
    jamKeluar: displayTime(item.jam_keluar),
    jamJadwalMulai,
    jamJadwalSelesai,
    jamBukaAbsensi: displayTime(item.jam_buka_absensi),
    jamTutupAbsensi: displayTime(item.jam_tutup_absensi),
    batasTerlambat: displayTime(item.batas_terlambat),
    status: backendStatusToUi(item.status),
    keterangan: item.keterangan || actionText || "—",
    dokumenPendukung: item.dokumen_pendukung_path ?? null,
    canAbsenMasuk: Boolean(item.can_absen_masuk),
    canAbsenKeluar: Boolean(item.can_absen_keluar),
    canIzinSakit: Boolean(item.can_izin_sakit),
    isMapelSelesai: Boolean(item.is_mapel_selesai),
    actionState: item.action_state ?? null,
    actionText,
    isFirstMapel: Boolean(item.is_first_mapel),
    faceRequired: Boolean(item.face_required),
    verifiedByFace: Boolean(item.verified_by_face),
    faceConfidence: item.face_confidence ?? null,
  };
}

// ============================================================================
// FETCH ABSENSI
// ============================================================================
async function fetchAbsensi() {
  // FIX #5: abort request sebelumnya agar tidak race condition
  if (abortController.value) abortController.value.abort();
  abortController.value = new AbortController();

  try {
    loadingPage.value = true;

    const res = await api.get(ABSENSI_API, {
      params: { range: activeTab.value },
      signal: abortController.value.signal, // FIX #5
    });

    if (res.data.meta?.tanggal_hari_ini) {
      serverTodayDate.value = res.data.meta.tanggal_hari_ini;
    }

    if (res.data.meta?.siswa) {
      currentSiswa.value = res.data.meta.siswa;
    }

    const rows = Array.isArray(res.data.data) ? res.data.data : [];
    attendanceRecords.value = rows.map(mapAbsensi);
  } catch (error) {
    // FIX #5: abaikan error dari abort yang disengaja
    if (error.name === "CanceledError") return;
    console.error("[Absensi] Gagal fetch:", error);
    showToast("error", error.response?.data?.message || "Gagal mengambil data absensi.");
  } finally {
    loadingPage.value = false;
  }
}

// Re-fetch saat tab berganti
watch(activeTab, () => fetchAbsensi());

// ============================================================================
// IZIN FORM
// ============================================================================
const izinForm = ref({
  tanggal: localTodayYmd(),
  jenis: "izin",
  keterangan: "",
  file: null,
  jadwal_id: null,
});

// Bersihkan file jika jenis bukan sakit
watch(
  () => izinForm.value.jenis,
  (jenis) => {
    if (jenis !== "sakit") izinForm.value.file = null;
  },
);

// Reset jadwal_id jika tanggal berubah
watch(
  () => izinForm.value.tanggal,
  () => {
    izinForm.value.jadwal_id = null;
  },
);

// FIX #1: sync izinForm.tanggal jika hari berganti (misal halaman dibuka semalam)
watch(serverTodayDate, (newDate) => {
  if (izinForm.value.tanggal === localTodayYmd()) {
    izinForm.value.tanggal = newDate;
  }
});

// ============================================================================
// ACTION GUARDS
// ============================================================================
function canCheckIn(record) {
  return (
    Boolean(record?.canAbsenMasuk) &&
    Boolean(record?.isFirstMapel) &&
    isTodayDate(record?.tanggal) &&
    !record?.isMapelSelesai
  );
}

// Absen keluar dikelola guru/admin — siswa tidak bisa melakukan dari sini
function canCheckOut() {
  return false;
}

function isStudentMorningWindowOpen(record) {
  if (!record) return false;
  if (!isTodayDate(record.tanggal)) return false;
  if (!record.isFirstMapel || record.isMapelSelesai) return false;

  const start = normalizeHms(
    record.jamBukaAbsensi !== "—" ? record.jamBukaAbsensi : record.jamJadwalMulai,
  );
  const end = normalizeHms(
    record.batasTerlambat !== "—" ? record.batasTerlambat : record.jamTutupAbsensi,
  );

  // Fallback ke flag backend jika jam tidak tersedia
  if (!start || !end) return Boolean(record.canIzinSakit);

  const jamSekarang = nowHms();
  return jamSekarang >= start && jamSekarang <= end;
}

function canAjukanIzin(record) {
  if (!record) return false;
  return (
    Boolean(record.canIzinSakit) &&
    isStudentMorningWindowOpen(record) &&
    !["Izin", "Sakit", "Hadir", "Terlambat"].includes(record.status) &&
    ![
      "belum_dibuka",
      "lewat_batas_absen",
      "mapel_selesai",
      "hanya_absen_pagi",
      "sudah_tercatat",
    ].includes(record.actionState)
  );
}

// ============================================================================
// COMPUTED — STATS
// ============================================================================
const totalHadir = computed(
  () => attendanceRecords.value.filter((r) => r.status === "Hadir").length,
);
const totalTerlambat = computed(
  () => attendanceRecords.value.filter((r) => r.status === "Terlambat").length,
);
const totalIzinSakit = computed(
  () => attendanceRecords.value.filter((r) => ["Izin", "Sakit"].includes(r.status)).length,
);
const persenHadir = computed(() => {
  const valid = attendanceRecords.value.length;
  if (!valid) return 0;
  return Math.round(((totalHadir.value + totalTerlambat.value) / valid) * 100);
});

const stats = computed(() => [
  {
    label: "Hadir",
    value: totalHadir.value,
    suffix: "",
    color: "#16a34a",
    bg: "#f0fdf4",
    icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
  },
  {
    label: "Terlambat",
    value: totalTerlambat.value,
    suffix: "",
    color: "#9333ea",
    bg: "#fdf4ff",
    icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
  },
  {
    label: "Izin / Sakit",
    value: totalIzinSakit.value,
    suffix: "",
    color: "#d97706",
    bg: "#fffbeb",
    icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>`,
  },
  {
    label: "% Kehadiran",
    value: persenHadir.value,
    suffix: "%",
    color: "#2563eb",
    bg: "#eff6ff",
    icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>`,
  },
]);

// ============================================================================
// COMPUTED — FILTER & RECORDS
// ============================================================================
const matpelOptions = computed(() => [...new Set(attendanceRecords.value.map((r) => r.matpel))]);

const filteredRecords = computed(() => {
  return attendanceRecords.value
    .filter((r) => {
      const search = searchQuery.value.toLowerCase();
      const matchSearch =
        !searchQuery.value ||
        r.matpel.toLowerCase().includes(search) ||
        r.guru.toLowerCase().includes(search) ||
        r.hari.toLowerCase().includes(search);
      const matchStatus = !filterStatus.value || r.status === filterStatus.value;
      const matchMatpel = !filterMatpel.value || r.matpel === filterMatpel.value;

      let matchTab = true;
      if (activeTab.value === "hari") {
        matchTab = isTodayDate(r.tanggal);
      } else if (activeTab.value === "minggu") {
        const recordDate = new Date(dateOnly(r.tanggal));
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay() + 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        matchTab = recordDate >= start && recordDate <= end;
      } else if (activeTab.value === "bulan") {
        const recordDate = new Date(dateOnly(r.tanggal));
        const now = new Date();
        matchTab =
          recordDate.getMonth() === now.getMonth() &&
          recordDate.getFullYear() === now.getFullYear();
      }

      return matchSearch && matchStatus && matchMatpel && matchTab;
    })
    .sort((a, b) => {
      if (a.tanggal !== b.tanggal) return b.tanggal.localeCompare(a.tanggal);
      return (a.jamJadwalMulai || "").localeCompare(b.jamJadwalMulai || "");
    });
});

const todayRecords = computed(() =>
  attendanceRecords.value
    .filter((r) => isTodayDate(r.tanggal))
    .sort((a, b) => (a.jamJadwalMulai || "").localeCompare(b.jamJadwalMulai || "")),
);

// FIX #4: pakai HH:mm saja untuk perbandingan agar konsisten dengan displayTime()
const activeTodayRecord = computed(() => {
  const jamHm = nowHms().slice(0, 5); // HH:mm

  const bisaMasuk = todayRecords.value.find((r) => canCheckIn(r));
  if (bisaMasuk) return bisaMasuk;

  const sedangBerlangsung = todayRecords.value.find(
    (r) =>
      r.jamJadwalMulai !== "—" &&
      r.jamJadwalSelesai !== "—" &&
      jamHm >= r.jamJadwalMulai &&
      jamHm <= r.jamJadwalSelesai,
  );
  if (sedangBerlangsung) return sedangBerlangsung;

  const berikutnya = todayRecords.value.find(
    (r) => r.jamJadwalMulai !== "—" && jamHm < r.jamJadwalMulai,
  );
  if (berikutnya) return berikutnya;

  return todayRecords.value[0] ?? null;
});

// ============================================================================
// COMPUTED — IZIN HEADER & FORM OPTIONS
// ============================================================================
const headerIzinRecord = computed(() => todayRecords.value.find((r) => canAjukanIzin(r)) ?? null);
const isHeaderIzinDisabled = computed(() => !headerIzinRecord.value || loadingIzin.value);
const headerIzinTitle = computed(() => {
  if (headerIzinRecord.value) return "Ajukan izin/sakit untuk absen pagi";
  const firstToday = todayRecords.value.find((r) => r.isFirstMapel) ?? todayRecords.value[0];
  return firstToday?.actionText || "Izin/Sakit hanya tersedia pada jam absen pagi.";
});

const todayJadwalOptions = computed(() => {
  if (!izinForm.value.tanggal) return [];
  const tanggalDipilih = izinForm.value.tanggal;
  return attendanceRecords.value
    .filter((r) => r.tanggal === tanggalDipilih && canAjukanIzin(r))
    .map((r) => ({
      jadwal_id: r.jadwal_id,
      label: `${r.matpel} — Absen pagi ${r.jamBukaAbsensi || r.jamJadwalMulai} s/d ${r.batasTerlambat || "—"}`,
    }));
});

const izinSubmitDisabled = computed(() => {
  if (loadingIzin.value) return true;
  if (!izinForm.value.tanggal) return true;
  if (!izinForm.value.jadwal_id) return true;

  const selected = attendanceRecords.value.find(
    (r) =>
      Number(r.jadwal_id) === Number(izinForm.value.jadwal_id) &&
      r.tanggal === izinForm.value.tanggal,
  );
  if (!canAjukanIzin(selected)) return true;

  if (izinForm.value.jenis === "sakit") {
    return !izinForm.value.keterangan || !izinForm.value.file;
  }

  return false;
});

// ============================================================================
// COMPUTED — TODAY ATTENDANCE INFO
// ============================================================================
const todayAttendanceInfo = computed(() => {
  const record = activeTodayRecord.value;

  if (!record) {
    return {
      title: "Belum ada jadwal absensi hari ini",
      desc: "Data jadwal hari ini belum tersedia dari sistem.",
      status: "Tidak Ada Jadwal",
      statusType: "none",
    };
  }

  const mapelInfo = `${record.matpel} bersama ${record.guru} • ${record.jamJadwalMulai} – ${record.jamJadwalSelesai}`;

  if (record.canAbsenMasuk) {
    return {
      title: record.faceRequired
        ? "Kamu belum absen masuk (wajib wajah)"
        : "Kamu belum absen masuk",
      desc: mapelInfo,
      status: record.faceRequired ? "Wajib Verifikasi Wajah" : "Belum Absen",
      statusType: "warning",
    };
  }

  if (record.canAbsenKeluar) {
    return {
      title: "Absen masuk sudah tercatat",
      desc: `${mapelInfo} • Jam keluar dikelola oleh guru.`,
      status: "Menunggu Validasi Guru",
      statusType: "info",
    };
  }

  if (record.isMapelSelesai && record.jamMasuk === "—") {
    return {
      title: "Mapel sudah selesai",
      desc: `${record.matpel} • ${record.keterangan}`,
      status: "Mapel Sudah Selesai",
      statusType: "danger",
    };
  }

  if (record.status === "Hadir" || record.status === "Terlambat") {
    if (record.jamKeluar !== "—") {
      return {
        title: "Absensi lengkap hari ini",
        desc: mapelInfo,
        status: "Sudah Absen ✓",
        statusType: "success",
      };
    }
    return {
      title: "Kamu sudah absen masuk",
      desc: mapelInfo,
      status: ucfirst(record.status),
      statusType: "success",
    };
  }

  if (record.status === "Izin" || record.status === "Sakit") {
    return {
      title: `${record.status} Tercatat`,
      desc: mapelInfo,
      status: `${record.status} Tercatat`,
      statusType: "info",
    };
  }

  if (record.actionState === "belum_dibuka") {
    return {
      title: `Absensi dibuka pukul ${record.jamBukaAbsensi}`,
      desc: mapelInfo,
      status: "Belum Dibuka",
      statusType: "idle",
    };
  }

  if (record.actionState === "lewat_batas_absen") {
    return {
      title: "Batas absen pagi sudah lewat",
      desc: `${mapelInfo} • Hubungi guru untuk pencatatan absensi.`,
      status: "Batas Absen Lewat",
      statusType: "danger",
    };
  }

  if (record.actionState === "hanya_absen_pagi") {
    return {
      title: "Absensi siswa hanya untuk jam masuk pagi",
      desc: mapelInfo,
      status: "Tidak Ada Aksi",
      statusType: "idle",
    };
  }

  return {
    title: record.actionText || "Tidak ada aksi absensi",
    desc: mapelInfo,
    status: record.status,
    statusType: "none",
  };
});

// ============================================================================
// AKSI ABSEN
// ============================================================================
async function absenMasuk(record) {
  if (!record?.jadwal_id) {
    showToast("warning", "Jadwal tidak ditemukan.");
    return;
  }
  try {
    loadingActionKey.value = recordKey(record);
    const res = await api.post(`${ABSENSI_API}/masuk`, {
      jadwal_id: record.jadwal_id,
      kelas_id: record.kelas_id,
    });
    showToast("success", res.data.message || "Absen masuk berhasil.");
    await fetchAbsensi();
  } catch (error) {
    showAbsensiAlert(error);
  } finally {
    loadingActionKey.value = null;
  }
}

async function absenKeluar(record) {
  if (!record?.jadwal_id) {
    showToast("warning", "Jadwal tidak ditemukan.");
    return;
  }
  try {
    loadingActionKey.value = recordKey(record);
    const res = await api.post(`${ABSENSI_API}/keluar`, {
      jadwal_id: record.jadwal_id,
    });
    showToast("success", res.data.message || "Absen keluar berhasil.");
    await fetchAbsensi();
  } catch (error) {
    showAbsensiAlert(error);
  } finally {
    loadingActionKey.value = null;
  }
}

async function absenMasukHariIni() {
  if (!activeTodayRecord.value) {
    showToast("warning", "Tidak ada jadwal absensi hari ini.");
    return;
  }
  await absenMasuk(activeTodayRecord.value);
}

// ============================================================================
// MODAL
// ============================================================================
function openDetail(record) {
  selectedRecord.value = record;
  modalMode.value = "view";
  showModal.value = true;
}

function openIzin(record = null) {
  const targetRecord = record ?? headerIzinRecord.value;

  if (!canAjukanIzin(targetRecord)) {
    showToast(
      "warning",
      targetRecord?.actionText || "Izin/Sakit hanya bisa diajukan pada jam absen pagi.",
    );
    return;
  }

  izinForm.value = {
    tanggal: targetRecord.tanggal ?? serverTodayDate.value,
    jenis: "izin",
    keterangan: "",
    file: null,
    jadwal_id: targetRecord.jadwal_id ?? null,
  };

  modalMode.value = "izin";
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

function handleFileUpload(e) {
  izinForm.value.file = e.target.files?.[0] ?? null;
}

// ============================================================================
// SUBMIT IZIN
// ============================================================================
async function submitIzin() {
  if (!izinForm.value.jadwal_id) {
    showToast("warning", "Pilih jadwal yang ingin diizinkan terlebih dahulu.");
    return;
  }

  const selected = attendanceRecords.value.find(
    (r) =>
      Number(r.jadwal_id) === Number(izinForm.value.jadwal_id) &&
      r.tanggal === izinForm.value.tanggal,
  );

  if (!canAjukanIzin(selected)) {
    showToast("warning", selected?.actionText || "Pengajuan izin/sakit sudah tidak tersedia.");
    return;
  }

  try {
    loadingIzin.value = true;

    const formData = new FormData();
    formData.append("tanggal", izinForm.value.tanggal);
    formData.append("status", izinForm.value.jenis);
    formData.append("jadwal_id", izinForm.value.jadwal_id);

    if (izinForm.value.keterangan) {
      formData.append("keterangan", izinForm.value.keterangan);
    }

    if (izinForm.value.jenis === "sakit" && izinForm.value.file) {
      formData.append("dokumen_pendukung", izinForm.value.file);
    }

    const res = await api.post(`${ABSENSI_API}/status`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    showToast("success", res.data.message || "Pengajuan berhasil dikirim.");
    closeModal();

    // FIX #6: reset form dan input file setelah submit berhasil
    izinForm.value = {
      tanggal: serverTodayDate.value,
      jenis: "izin",
      keterangan: "",
      file: null,
      jadwal_id: null,
    };
    if (fileInput.value) fileInput.value.value = "";

    await fetchAbsensi();
  } catch (error) {
    showAbsensiAlert(error);
  } finally {
    loadingIzin.value = false;
  }
}
</script>

<template>
  <div class="layout-root">
    <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="layout-main">
      <Navbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <main class="layout-content">
        <!-- ── Header ── -->
        <div class="dash-header">
          <div v-if="showPageSkeleton" class="header-skeleton">
            <div class="skel skel-title"></div>
            <div class="skel skel-subtitle"></div>
          </div>

          <div v-else>
            <h1 class="dash-title">Absensi Saya</h1>
            <p class="dash-sub">Halo, {{ userDisplayName }} 👋 — Pantau kehadiranmu di sini.</p>
          </div>

          <div class="header-right">
            <template v-if="showPageSkeleton">
              <div class="skel skel-date-pill"></div>
              <div class="skel skel-header-btn"></div>
            </template>

            <template v-else>
              <span class="dash-date">{{ today }}</span>
              <button
                class="btn btn-primary btn-izin-header"
                @click="openIzin()"
                :disabled="isHeaderIzinDisabled"
                :title="headerIzinTitle"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Ajukan Izin / Sakit
              </button>
            </template>
          </div>
        </div>

        <!-- ── Today Card ── -->
        <div v-if="showPageSkeleton" class="today-absen-card today-skeleton-card">
          <div class="today-absen-left">
            <div class="skel skel-today-icon"></div>

            <div class="today-skeleton-content">
              <div class="skel skel-today-title"></div>
              <div class="skel skel-today-desc"></div>

              <div class="today-mapel-pills">
                <span
                  v-for="n in skeletonPills"
                  :key="`pill-sk-${n}`"
                  class="skel skel-pill"
                ></span>
              </div>

              <div class="skel skel-status-pill"></div>
            </div>
          </div>

          <div class="skel skel-today-btn"></div>
        </div>

        <div
          v-else
          class="today-absen-card"
          :class="`today-card--${todayAttendanceInfo.statusType}`"
        >
          <div class="today-absen-left">
            <div class="today-absen-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path
                  v-if="todayAttendanceInfo.statusType === 'success'"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  v-else-if="todayAttendanceInfo.statusType === 'danger'"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
                <path
                  v-else
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <div>
              <h3 class="today-absen-title">{{ todayAttendanceInfo.title }}</h3>
              <p class="today-absen-desc">{{ todayAttendanceInfo.desc }}</p>

              <div v-if="todayRecords.length" class="today-mapel-pills">
                <span
                  v-for="record in todayRecords.slice(0, 3)"
                  :key="`today-pill-${recordKey(record)}`"
                  class="mapel-pill"
                  :class="{
                    'mapel-pill--active':
                      activeTodayRecord && recordKey(record) === recordKey(activeTodayRecord),
                  }"
                >
                  {{ record.matpel }}
                </span>

                <span v-if="todayRecords.length > 3" class="mapel-pill">
                  +{{ todayRecords.length - 3 }} mapel
                </span>
              </div>

              <span
                class="today-absen-status"
                :class="`status-type--${todayAttendanceInfo.statusType}`"
              >
                {{ todayAttendanceInfo.status }}
              </span>
            </div>
          </div>

          <div class="today-absen-actions">
            <button
              v-if="canCheckIn(activeTodayRecord)"
              class="btn btn-primary"
              @click="absenMasukHariIni"
              :disabled="
                loadingActionKey === recordKey(activeTodayRecord) || !canCheckIn(activeTodayRecord)
              "
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                style="width: 15px; height: 15px"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                />
              </svg>
              {{
                loadingActionKey === recordKey(activeTodayRecord)
                  ? "Memproses..."
                  : "Absen Masuk Sekarang"
              }}
            </button>

            <div v-else class="today-no-action">
              <span v-if="todayAttendanceInfo.statusType === 'success'" class="chip chip--success">
                ✓ Absensi Selesai
              </span>
              <span
                v-else-if="todayAttendanceInfo.statusType === 'danger'"
                class="chip chip--danger"
              >
                Mapel Sudah Selesai
              </span>
              <span v-else-if="todayAttendanceInfo.statusType === 'idle'" class="chip chip--idle">
                Dibuka {{ activeTodayRecord?.jamBukaAbsensi || "—" }}
              </span>
              <span v-else-if="todayAttendanceInfo.statusType === 'info'" class="chip chip--info">
                {{ todayAttendanceInfo.status }}
              </span>
              <span v-else class="chip chip--idle">
                {{ activeTodayRecord?.actionText || "Tidak Ada Aksi" }}
              </span>
            </div>
          </div>
        </div>

        <!-- ── Stats ── -->
        <div class="stats-grid">
          <template v-if="showPageSkeleton">
            <div
              v-for="n in skeletonStats"
              :key="`stat-sk-${n}`"
              class="stat-card stat-skeleton-card"
            >
              <div class="skel skel-stat-icon"></div>
              <div class="skel skel-stat-value"></div>
              <div class="skel skel-stat-label"></div>
            </div>
          </template>

          <template v-else>
            <div
              v-for="stat in stats"
              :key="stat.label"
              class="stat-card"
              :style="{ '--card-color': stat.color, '--card-bg': stat.bg }"
            >
              <div class="stat-top">
                <div class="stat-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    v-html="stat.icon"
                  />
                </div>
              </div>
              <div class="stat-value">
                {{ stat.value }}<span class="stat-suffix">{{ stat.suffix }}</span>
              </div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </template>
        </div>

        <!-- ── Progress ── -->
        <div class="progress-card">
          <template v-if="showPageSkeleton">
            <div class="progress-header">
              <div class="skel skel-progress-title"></div>
              <div class="skel skel-progress-percent"></div>
            </div>

            <div class="skel skel-progress-track"></div>

            <div class="progress-legend">
              <span v-for="n in 4" :key="`legend-sk-${n}`" class="skel skel-legend"></span>
            </div>
          </template>

          <template v-else>
            <div class="progress-header">
              <span class="progress-title">Progres Kehadiran Bulan Ini</span>
              <span
                class="progress-pct"
                :style="{ color: persenHadir >= 80 ? '#16a34a' : '#dc2626' }"
              >
                {{ persenHadir }}%
              </span>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill"
                :style="{
                  width: persenHadir + '%',
                  background: persenHadir >= 80 ? '#16a34a' : '#dc2626',
                }"
              />
            </div>
            <div class="progress-legend">
              <span class="legend-item"
                ><span class="legend-dot" style="background: #16a34a"></span>Hadir</span
              >
              <span class="legend-item"
                ><span class="legend-dot" style="background: #9333ea"></span>Terlambat</span
              >
              <span class="legend-item"
                ><span class="legend-dot" style="background: #d97706"></span>Izin/Sakit</span
              >
              <span class="legend-item"
                ><span class="legend-dot" style="background: #dc2626"></span>Alfa</span
              >
            </div>
          </template>
        </div>

        <!-- ── Toolbar ── -->
        <div class="toolbar">
          <template v-if="showPageSkeleton">
            <div class="skel skel-tabs"></div>

            <div class="filter-group">
              <div class="skel skel-search"></div>
              <div class="skel skel-select"></div>
              <div class="skel skel-select"></div>
            </div>
          </template>

          <template v-else>
            <div class="tab-bar">
              <button
                v-for="t in [
                  { key: 'hari', label: 'Hari Ini' },
                  { key: 'minggu', label: 'Minggu Ini' },
                  { key: 'bulan', label: 'Bulan Ini' },
                ]"
                :key="t.key"
                class="tab"
                :class="{ active: activeTab === t.key }"
                @click="activeTab = t.key"
              >
                {{ t.label }}
              </button>
            </div>

            <div class="filter-group">
              <div class="search-wrap">
                <svg
                  class="search-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
                  />
                </svg>
                <input
                  v-model="searchQuery"
                  class="search-input"
                  type="text"
                  placeholder="Cari mata pelajaran, guru..."
                />
              </div>

              <select v-model="filterMatpel" class="filter-select">
                <option value="">Semua Mapel</option>
                <option v-for="m in matpelOptions" :key="m" :value="m">{{ m }}</option>
              </select>

              <select v-model="filterStatus" class="filter-select">
                <option value="">Semua Status</option>
                <option>Hadir</option>
                <option>Terlambat</option>
                <option>Izin</option>
                <option>Sakit</option>
                <option>Alfa</option>
              </select>
            </div>
          </template>
        </div>

        <!-- ── Table ── -->
        <div class="table-card">
          <div class="table-head-bar">
            <h3 class="table-title">Riwayat Kehadiran</h3>
            <span class="rec-badge">
              {{ loadingPage ? "Memuat..." : `${filteredRecords.length} catatan` }}
            </span>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Hari</th>
                  <th>Mata Pelajaran</th>
                  <th>Guru</th>
                  <th>Jam Masuk</th>
                  <th>Jam Keluar</th>
                  <th>Status</th>
                  <th>Keterangan</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                <!-- ── SKELETON ROWS ── -->
                <template v-if="loadingPage">
                  <tr v-for="n in 6" :key="`sk-${n}`" class="skeleton-row">
                    <td><div class="skel skel-date"></div></td>
                    <td><div class="skel skel-hari"></div></td>
                    <td>
                      <div class="skel skel-mapel"></div>
                      <div class="skel skel-jam" style="margin-top: 5px"></div>
                    </td>
                    <td><div class="skel skel-guru"></div></td>
                    <td><div class="skel skel-time"></div></td>
                    <td><div class="skel skel-time"></div></td>
                    <td><div class="skel skel-badge"></div></td>
                    <td><div class="skel skel-ket"></div></td>
                    <td>
                      <div class="skel-action-group">
                        <div class="skel skel-btn"></div>
                        <div class="skel skel-btn-sm"></div>
                      </div>
                    </td>
                  </tr>
                </template>

                <!-- ── DATA ROWS ── -->
                <template v-else>
                  <tr v-for="record in filteredRecords" :key="recordKey(record)" class="table-row">
                    <td class="td-date">{{ formatTanggal(record.tanggal) }}</td>
                    <td class="td-hari">{{ record.hari }}</td>
                    <td class="td-mapel">
                      <div>{{ record.matpel }}</div>
                      <small class="jadwal-jam"
                        >{{ record.jamJadwalMulai }} – {{ record.jamJadwalSelesai }}</small
                      >
                    </td>
                    <td class="td-guru">{{ record.guru }}</td>
                    <td class="td-jam">{{ record.jamMasuk }}</td>
                    <td class="td-jam">{{ record.jamKeluar }}</td>
                    <td>
                      <span class="badge" :class="getStatusClass(record.status)">
                        <span
                          class="badge-dot"
                          :style="{ background: getStatusDot(record.status) }"
                        ></span>
                        {{ record.status }}
                      </span>
                    </td>
                    <td class="td-ket">{{ record.keterangan }}</td>

                    <!-- ✅ KOLOM AKSI — REDESIGN dengan Action Group compact -->
                    <td class="td-aksi">
                      <div class="action-group">
                        <!-- [A] Ada aksi absen aktif → tampilkan tombol utama + ikon secondary -->
                        <template v-if="canCheckIn(record) || canCheckOut(record)">
                          <!-- Tombol utama: Absen Masuk atau Keluar -->
                          <button
                            v-if="canCheckIn(record)"
                            class="btn-action btn-action--masuk"
                            @click="absenMasuk(record)"
                            :disabled="loadingActionKey === recordKey(record)"
                            title="Absen Masuk"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2.2"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                              />
                            </svg>
                            <span>{{
                              loadingActionKey === recordKey(record) ? "..." : "Masuk"
                            }}</span>
                          </button>

                          <button
                            v-else-if="canCheckOut(record)"
                            class="btn-action btn-action--keluar"
                            @click="absenKeluar(record)"
                            :disabled="loadingActionKey === recordKey(record)"
                            title="Absen Keluar"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2.2"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                              />
                            </svg>
                            <span>{{
                              loadingActionKey === recordKey(record) ? "..." : "Keluar"
                            }}</span>
                          </button>

                          <!-- Ikon Izin (hanya muncul jika bisa izin + bisa masuk) -->
                          <button
                            v-if="canCheckIn(record) && canAjukanIzin(record)"
                            class="btn-icon btn-icon--izin"
                            @click="openIzin(record)"
                            :disabled="loadingIzin"
                            title="Ajukan Izin / Sakit"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                              />
                            </svg>
                          </button>

                          <!-- Ikon Detail -->
                          <button
                            class="btn-icon btn-icon--detail"
                            @click="openDetail(record)"
                            title="Lihat Detail"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                              />
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          </button>
                        </template>

                        <!-- [B] Tidak ada aksi aktif → tampilkan chip status + ikon detail -->
                        <template v-else>
                          <template v-if="isTodayDate(record.tanggal)">
                            <span
                              v-if="record.isMapelSelesai && record.jamMasuk === '—'"
                              class="status-chip status-chip--danger"
                              >Mapel Selesai</span
                            >
                            <span
                              v-else-if="record.jamMasuk !== '—' && record.jamKeluar !== '—'"
                              class="status-chip status-chip--success"
                              >Selesai ✓</span
                            >
                            <span
                              v-else-if="record.jamMasuk !== '—' && record.isMapelSelesai"
                              class="status-chip status-chip--warning"
                              >Sudah Masuk</span
                            >
                            <span
                              v-else-if="['Izin', 'Sakit'].includes(record.status)"
                              class="status-chip status-chip--info"
                              >{{ record.status }} ✓</span
                            >
                            <span
                              v-else-if="record.actionState === 'belum_dibuka'"
                              class="status-chip status-chip--idle"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                style="width: 11px; height: 11px"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {{ record.jamBukaAbsensi }}
                            </span>
                            <span
                              v-else-if="record.actionState === 'lewat_batas_absen'"
                              class="status-chip status-chip--danger"
                              >Batas Lewat</span
                            >
                            <span
                              v-else-if="record.actionState === 'hanya_absen_pagi'"
                              class="status-chip status-chip--idle"
                              >Hanya Pagi</span
                            >
                            <span v-else class="status-chip status-chip--idle">{{
                              record.actionText || "—"
                            }}</span>
                          </template>
                          <span v-else class="status-chip status-chip--idle">—</span>

                          <!-- Ikon Detail selalu ada -->
                          <button
                            class="btn-icon btn-icon--detail"
                            @click="openDetail(record)"
                            title="Lihat Detail"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                              />
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          </button>
                        </template>
                      </div>
                    </td>
                  </tr>

                  <tr v-if="filteredRecords.length === 0">
                    <td colspan="9" class="empty-state">
                      <div class="empty-inner">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.5"
                          style="width: 36px; height: 36px; color: #d1d5db"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                          />
                        </svg>
                        <p>Tidak ada data ditemukan</p>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>

    <!-- ── Modal ── -->
    <Transition name="fade">
      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <Transition name="slide-up">
          <div v-if="modalMode === 'view' && selectedRecord" class="modal" key="view">
            <div class="modal-header">
              <h3 class="modal-title">Detail Absensi</h3>
              <button class="modal-close" @click="closeModal">×</button>
            </div>
            <div class="modal-body">
              <div class="detail-badge-row">
                <span class="badge lg" :class="getStatusClass(selectedRecord.status)">
                  <span
                    class="badge-dot"
                    :style="{ background: getStatusDot(selectedRecord.status) }"
                  ></span>
                  {{ selectedRecord.status }}
                </span>
              </div>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Tanggal</span>
                  <span class="detail-value">{{ formatTanggal(selectedRecord.tanggal) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Hari</span>
                  <span class="detail-value">{{ selectedRecord.hari }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Mata Pelajaran</span>
                  <span class="detail-value">{{ selectedRecord.matpel }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Guru</span>
                  <span class="detail-value">{{ selectedRecord.guru }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Jam Masuk</span>
                  <span class="detail-value">{{ selectedRecord.jamMasuk }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Jam Keluar</span>
                  <span class="detail-value">{{ selectedRecord.jamKeluar }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Jam Jadwal</span>
                  <span class="detail-value"
                    >{{ selectedRecord.jamJadwalMulai }} –
                    {{ selectedRecord.jamJadwalSelesai }}</span
                  >
                </div>
                <div class="detail-item">
                  <span class="detail-label">Buka Absensi</span>
                  <span class="detail-value">{{ selectedRecord.jamBukaAbsensi || "—" }}</span>
                </div>
              </div>
              <div class="detail-ket">
                <span class="detail-label">Keterangan</span>
                <p class="detail-ket-val">{{ selectedRecord.keterangan }}</p>
              </div>
              <div v-if="selectedRecord.dokumenPendukung" class="detail-ket">
                <span class="detail-label">Dokumen Pendukung</span>
                <p class="detail-ket-val">Dokumen sudah diunggah.</p>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-ghost" @click="closeModal">Tutup</button>
            </div>
          </div>

          <div v-else-if="modalMode === 'izin'" class="modal" key="izin">
            <div class="modal-header">
              <h3 class="modal-title">Ajukan Izin / Sakit</h3>
              <button class="modal-close" @click="closeModal">×</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Tanggal Tidak Hadir</label>
                <input v-model="izinForm.tanggal" type="date" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Jadwal</label>
                <select v-model="izinForm.jadwal_id" class="form-input">
                  <option :value="null" disabled>-- Pilih Jadwal --</option>
                  <option
                    v-for="opt in todayJadwalOptions"
                    :key="opt.jadwal_id"
                    :value="opt.jadwal_id"
                  >
                    {{ opt.label }}
                  </option>
                </select>
                <p
                  v-if="todayJadwalOptions.length === 0"
                  class="form-hint-warn"
                  style="color: #d97706; margin-top: 5px; font-size: 0.85rem"
                >
                  ⚠️ Izin/Sakit hanya tersedia untuk jadwal absen pagi dan sebelum batas terlambat.
                </p>
              </div>
              <div class="form-group">
                <label class="form-label">Jenis Ketidakhadiran</label>
                <div class="radio-group">
                  <label class="radio-item" :class="{ active: izinForm.jenis === 'izin' }">
                    <input v-model="izinForm.jenis" type="radio" value="izin" hidden />
                    <span class="radio-dot"></span> Izin
                  </label>
                  <label class="radio-item" :class="{ active: izinForm.jenis === 'sakit' }">
                    <input v-model="izinForm.jenis" type="radio" value="sakit" hidden />
                    <span class="radio-dot"></span> Sakit
                  </label>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">
                  Keterangan
                  <span v-if="izinForm.jenis !== 'sakit'" class="form-optional">(opsional)</span>
                </label>
                <textarea
                  v-model="izinForm.keterangan"
                  class="form-input form-textarea"
                  :placeholder="
                    izinForm.jenis === 'sakit'
                      ? 'Contoh: Demam dan tidak bisa mengikuti pelajaran'
                      : 'Tuliskan alasan izin jika diperlukan...'
                  "
                  rows="3"
                />
              </div>
              <div v-if="izinForm.jenis === 'sakit'" class="form-group">
                <label class="form-label"
                  >Upload Surat Sakit <span style="color: #dc2626">*</span></label
                >
                <div class="file-upload" @click="fileInput?.click()">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    style="width: 20px; height: 20px; margin-bottom: 4px"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                  <span>{{
                    izinForm.file ? izinForm.file.name : "Klik untuk upload surat sakit"
                  }}</span>
                  <small style="color: #9ca3af">.pdf / .jpg / .png — maks 2 MB</small>
                  <input
                    ref="fileInput"
                    type="file"
                    hidden
                    @change="handleFileUpload"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-ghost" @click="closeModal">Batal</button>
              <button class="btn btn-primary" :disabled="izinSubmitDisabled" @click="submitIzin">
                {{ loadingIzin ? "Mengirim..." : "Kirim Pengajuan" }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
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

/* Header */
.dash-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}
.dash-title {
  font-size: 22px;
  font-weight: 700;
  color: #166534;
  margin: 0;
}
.dash-sub {
  font-size: 13px;
  color: #6b7280;
  margin: 2px 0 0;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.dash-date {
  font-size: 12px;
  font-weight: 600;
  color: #16a34a;
  background: #dcfce7;
  padding: 5px 12px;
  border-radius: 20px;
  white-space: nowrap;
}
.btn-izin-header {
  white-space: nowrap;
  padding: 8px 14px;
  font-size: 12.5px;
}

/* Today Card */
.today-absen-card {
  background: white;
  border: 1.5px solid #bbf7d0;
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  box-shadow: 0 8px 24px rgba(22, 163, 74, 0.08);
  transition: border-color 0.2s;
}
.today-card--warning {
  border-color: #fde68a;
  box-shadow: 0 8px 24px rgba(217, 119, 6, 0.1);
}
.today-card--danger {
  border-color: #fecaca;
  box-shadow: 0 8px 24px rgba(220, 38, 38, 0.08);
}
.today-card--success {
  border-color: #bbf7d0;
  box-shadow: 0 8px 24px rgba(22, 163, 74, 0.1);
}
.today-card--info {
  border-color: #bfdbfe;
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.08);
}
.today-card--idle {
  border-color: #e5e7eb;
}

.today-absen-left {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.today-absen-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: #dcfce7;
  color: #16a34a;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.today-absen-icon svg {
  width: 24px;
  height: 24px;
}
.today-absen-title {
  font-size: 15px;
  font-weight: 800;
  color: #111827;
  margin: 0;
}
.today-absen-desc {
  font-size: 12.5px;
  color: #6b7280;
  margin: 3px 0 6px;
}

.today-mapel-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}
.mapel-pill {
  font-size: 10.5px;
  font-weight: 600;
  color: #6b7280;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  padding: 2px 8px;
  border-radius: 20px;
}
.mapel-pill--active {
  background: #dcfce7;
  color: #16a34a;
  border-color: #bbf7d0;
}

.today-absen-status {
  display: inline-flex;
  font-size: 11px;
  font-weight: 700;
  color: #166534;
  background: #dcfce7;
  padding: 3px 10px;
  border-radius: 999px;
}
.status-type--warning {
  background: #fef3c7;
  color: #92400e;
}
.status-type--danger {
  background: #fee2e2;
  color: #991b1b;
}
.status-type--success {
  background: #dcfce7;
  color: #166534;
}
.status-type--info {
  background: #dbeafe;
  color: #1e40af;
}
.status-type--idle {
  background: #f3f4f6;
  color: #6b7280;
}

.today-absen-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.today-no-action {
  display: flex;
  align-items: center;
}

/* Chip */
.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
.chip--success {
  background: #dcfce7;
  color: #166534;
}
.chip--danger {
  background: #fee2e2;
  color: #991b1b;
}
.chip--warning {
  background: #fef3c7;
  color: #92400e;
}
.chip--info {
  background: #dbeafe;
  color: #1e40af;
}
.chip--idle {
  background: #f3f4f6;
  color: #6b7280;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
  font-family: "Poppins", sans-serif;
}
.btn-primary {
  background: #16a34a;
  color: white;
}
.btn-primary:hover {
  background: #15803d;
}
.btn-primary:disabled,
.btn-ghost:disabled,
.btn-keluar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-keluar {
  background: #eff6ff;
  color: #2563eb;
  border: 1.5px solid #bfdbfe;
}
.btn-keluar:hover {
  background: #dbeafe;
}
.btn-ghost {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}
.btn-ghost:hover {
  background: #e5e7eb;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.stat-card {
  background: white;
  border-radius: 14px;
  padding: 14px 16px;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.stat-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.stat-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: var(--card-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-icon svg {
  width: 17px;
  height: 17px;
  stroke: var(--card-color);
}
.stat-value {
  font-size: 26px;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}
.stat-suffix {
  font-size: 14px;
  font-weight: 600;
  color: var(--card-color);
}
.stat-label {
  font-size: 11.5px;
  color: #6b7280;
}

/* Progress */
.progress-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.progress-title {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
}
.progress-pct {
  font-size: 15px;
  font-weight: 800;
}
.progress-track {
  height: 10px;
  background: #f3f4f6;
  border-radius: 99px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
.progress-legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #6b7280;
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Toolbar */
.toolbar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
}
.tab-bar {
  display: flex;
  gap: 3px;
  background: #f3f4f6;
  padding: 4px;
  border-radius: 10px;
}
.tab {
  padding: 6px 14px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  border: none;
  background: transparent;
  transition: all 0.15s;
  font-family: "Poppins", sans-serif;
}
.tab.active {
  background: white;
  color: #16a34a;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
.filter-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.search-wrap {
  position: relative;
}
.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  stroke: #9ca3af;
}
.search-input {
  padding: 8px 10px 8px 32px;
  border: 1.5px solid #d1fae5;
  border-radius: 10px;
  font-size: 12px;
  font-family: "Poppins", sans-serif;
  background: white;
  color: #111827;
  outline: none;
  width: 200px;
}
.search-input:focus,
.filter-select:focus {
  border-color: #16a34a;
}
.filter-select {
  padding: 8px 12px;
  border: 1.5px solid #d1fae5;
  border-radius: 10px;
  font-size: 12px;
  font-family: "Poppins", sans-serif;
  background: white;
  color: #374151;
  outline: none;
  cursor: pointer;
}

/* Table */
.table-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
}
.table-head-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #f3f4f6;
}
.table-title {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}
.rec-badge {
  font-size: 11px;
  font-weight: 600;
  color: #16a34a;
  background: #dcfce7;
  padding: 3px 10px;
  border-radius: 20px;
}
.table-wrap {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}
thead tr {
  background: #f9fafb;
}
th {
  text-align: left;
  padding: 10px 14px;
  font-size: 10.5px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #f3f4f6;
  white-space: nowrap;
}
td {
  padding: 11px 14px;
  font-size: 12.5px;
  color: #374151;
  border-bottom: 1px solid #f9fafb;
}
.table-row:hover td {
  background: #f0fdf4;
}
.td-date,
.td-mapel,
.td-jam {
  font-weight: 600;
  color: #111827;
}
.td-hari,
.td-guru {
  color: #6b7280;
}
.td-jam {
  font-family: monospace;
}
.td-ket {
  color: #9ca3af;
  font-size: 11.5px;
  max-width: 160px;
}
.td-aksi {
  white-space: nowrap;
}
.jadwal-jam {
  display: block;
  color: #6b7280;
  margin-top: 3px;
  font-weight: 400;
}

/* ── Action Group — redesigned ────────────────────────────── */
.action-group {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Tombol aksi utama (Masuk / Keluar) — pill kecil dengan ikon */
.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 600;
  font-family: "Poppins", sans-serif;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
  white-space: nowrap;
}
.btn-action svg {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}
.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-action--masuk {
  background: #16a34a;
  color: white;
}
.btn-action--masuk:hover:not(:disabled) {
  background: #15803d;
}

.btn-action--keluar {
  background: #eff6ff;
  color: #2563eb;
  border: 1.5px solid #bfdbfe;
}
.btn-action--keluar:hover:not(:disabled) {
  background: #dbeafe;
}

/* Tombol ikon bulat kecil (Izin & Detail) */
.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1.5px solid transparent;
  cursor: pointer;
  background: transparent;
  transition: all 0.15s;
  flex-shrink: 0;
}
.btn-icon svg {
  width: 14px;
  height: 14px;
}
.btn-icon:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-icon--izin {
  color: #d97706;
  border-color: #fde68a;
  background: #fffbeb;
}
.btn-icon--izin:hover:not(:disabled) {
  background: #fef3c7;
  border-color: #f59e0b;
}

.btn-icon--detail {
  color: #6b7280;
  border-color: #e5e7eb;
  background: #f9fafb;
}
.btn-icon--detail:hover {
  background: #f0fdf4;
  color: #16a34a;
  border-color: #bbf7d0;
}

/* Status chip inline di kolom aksi */
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 10.5px;
  font-weight: 600;
  white-space: nowrap;
}
.status-chip--success {
  background: #dcfce7;
  color: #166534;
}
.status-chip--danger {
  background: #fee2e2;
  color: #991b1b;
}
.status-chip--warning {
  background: #fef3c7;
  color: #92400e;
}
.status-chip--info {
  background: #dbeafe;
  color: #1e40af;
}
.status-chip--idle {
  background: #f3f4f6;
  color: #6b7280;
}

/* Badge */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.badge.lg {
  padding: 5px 14px;
  font-size: 13px;
}
.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.badge-hadir {
  background: #f0fdf4;
  color: #16a34a;
}
.badge-terlambat {
  background: #fdf4ff;
  color: #9333ea;
}
.badge-izin {
  background: #fffbeb;
  color: #d97706;
}
.badge-sakit {
  background: #eff6ff;
  color: #2563eb;
}
.badge-alfa {
  background: #fef2f2;
  color: #dc2626;
}

/* Empty */
.empty-state {
  text-align: center;
  padding: 40px 0 !important;
}
.empty-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #9ca3af;
}
.empty-inner p {
  font-size: 13px;
  margin: 0;
}

/* ── SKELETON ─────────────────────────────────────────────── */
.skeleton-row td {
  border-bottom: 1px solid #f9fafb;
  padding: 13px 14px;
}

@keyframes shimmer {
  0% {
    background-position: -400px 0;
  }
  100% {
    background-position: 400px 0;
  }
}

.skel {
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 800px 100%;
  animation: shimmer 1.4s ease-in-out infinite;
  height: 13px;
}
.skel-date {
  width: 80px;
}
.skel-hari {
  width: 60px;
}
.skel-mapel {
  width: 110px;
  height: 13px;
}
.skel-jam {
  width: 72px;
  height: 10px;
}
.skel-guru {
  width: 90px;
}
.skel-time {
  width: 42px;
}
.skel-badge {
  width: 64px;
  height: 22px;
  border-radius: 20px;
}
.skel-ket {
  width: 100px;
}
.skel-btn {
  width: 64px;
  height: 26px;
  border-radius: 8px;
}
.skel-btn-sm {
  width: 28px;
  height: 26px;
  border-radius: 7px;
}

.skel-action-group {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}
.modal {
  background: white;
  border-radius: 18px;
  width: 100%;
  max-width: 460px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
}
.modal-title {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}
.modal-close {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  cursor: pointer;
  color: #6b7280;
  font-size: 18px;
}
.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.modal-footer {
  padding: 14px 20px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* Detail */
.detail-badge-row {
  display: flex;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.detail-item,
.detail-ket {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.detail-label {
  font-size: 10.5px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.detail-value {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}
.detail-ket-val {
  font-size: 12.5px;
  color: #374151;
  background: #f9fafb;
  border-radius: 8px;
  padding: 10px 12px;
  line-height: 1.5;
  margin: 0;
}

/* Form */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}
.form-optional {
  font-weight: 400;
  color: #9ca3af;
}
.form-input {
  padding: 9px 12px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 12.5px;
  font-family: "Poppins", sans-serif;
  color: #111827;
  outline: none;
  background: white;
}
.form-input:focus {
  border-color: #16a34a;
}
.form-textarea {
  resize: vertical;
  min-height: 80px;
}
.form-hint-warn {
  font-size: 11.5px;
  color: #d97706;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 6px 10px;
  margin: 0;
}

/* Radio */
.radio-group {
  display: flex;
  gap: 10px;
}
.radio-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 12.5px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  flex: 1;
  justify-content: center;
}
.radio-item.active {
  border-color: #16a34a;
  background: #f0fdf4;
  color: #16a34a;
}
.radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid currentColor;
  flex-shrink: 0;
}
.radio-item.active .radio-dot {
  background: #16a34a;
  border-color: #16a34a;
  box-shadow: inset 0 0 0 2px white;
}

/* File upload */
.file-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px;
  border: 2px dashed #d1fae5;
  border-radius: 12px;
  cursor: pointer;
  color: #9ca3af;
  font-size: 12px;
  text-align: center;
}
.file-upload:hover {
  border-color: #16a34a;
  background: #f0fdf4;
  color: #16a34a;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-up-enter-active {
  transition:
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.2s;
}
.slide-up-leave-active {
  transition:
    transform 0.2s ease,
    opacity 0.15s;
}
.slide-up-enter-from {
  transform: translateY(24px);
  opacity: 0;
}
.slide-up-leave-to {
  transform: translateY(10px);
  opacity: 0;
}

/* Responsive */
@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 640px) {
  .layout-content {
    padding: 14px;
    gap: 14px;
  }
  .dash-date {
    display: none;
  }
  .today-absen-card {
    flex-direction: column;
    align-items: stretch;
  }
  .today-absen-actions {
    width: 100%;
  }
  .today-absen-actions .btn {
    width: 100%;
    justify-content: center;
  }
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-group {
    flex-direction: column;
  }
  .search-input {
    width: 100%;
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

:global(.swal-toast-popup) {
  border-radius: 14px !important;
  padding: 12px 14px !important;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12) !important;
  font-family: "Poppins", sans-serif !important;
}
:global(.swal-toast-title) {
  font-size: 13px !important;
  font-weight: 600 !important;
  line-height: 1.4 !important;
}

/* Skeleton Loading */
.skel {
  position: relative;
  overflow: hidden;
  background: linear-gradient(90deg, #ecfdf5 0%, #d1fae5 45%, #ecfdf5 100%);
  background-size: 220% 100%;
  border-radius: 999px;
  animation: skeletonShimmer 1.25s ease-in-out infinite;
}

@keyframes skeletonShimmer {
  0% {
    background-position: 220% 0;
  }
  100% {
    background-position: -220% 0;
  }
}

.header-skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skel-title {
  width: 180px;
  height: 26px;
  border-radius: 8px;
}

.skel-subtitle {
  width: 300px;
  height: 14px;
  border-radius: 8px;
}

.skel-date-pill {
  width: 150px;
  height: 28px;
}

.skel-header-btn {
  width: 160px;
  height: 36px;
  border-radius: 10px;
}

.today-skeleton-card {
  border-color: #d1fae5;
}

.skel-today-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  flex-shrink: 0;
}

.today-skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skel-today-title {
  width: 230px;
  height: 18px;
  border-radius: 8px;
}

.skel-today-desc {
  width: 360px;
  max-width: 100%;
  height: 14px;
  border-radius: 8px;
}

.skel-pill {
  width: 80px;
  height: 22px;
  display: inline-flex;
}

.skel-status-pill {
  width: 130px;
  height: 24px;
}

.skel-today-btn {
  width: 180px;
  height: 38px;
  border-radius: 10px;
  flex-shrink: 0;
}

.stat-skeleton-card {
  min-height: 112px;
}

.skel-stat-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
}

.skel-stat-value {
  width: 70px;
  height: 30px;
  border-radius: 8px;
  margin-top: 4px;
}

.skel-stat-label {
  width: 100px;
  height: 13px;
  border-radius: 8px;
}

.skel-progress-title {
  width: 210px;
  height: 16px;
  border-radius: 8px;
}

.skel-progress-percent {
  width: 48px;
  height: 18px;
  border-radius: 8px;
}

.skel-progress-track {
  width: 100%;
  height: 10px;
}

.skel-legend {
  width: 85px;
  height: 14px;
  border-radius: 8px;
}

.skel-tabs {
  width: 255px;
  height: 38px;
  border-radius: 10px;
}

.skel-search {
  width: 230px;
  height: 38px;
  border-radius: 10px;
}

.skel-select {
  width: 130px;
  height: 38px;
  border-radius: 10px;
}

.skeleton-row td {
  padding-top: 14px;
  padding-bottom: 14px;
}

.skel-date {
  width: 86px;
  height: 14px;
  border-radius: 8px;
}

.skel-hari {
  width: 72px;
  height: 14px;
  border-radius: 8px;
}

.skel-mapel {
  width: 140px;
  height: 15px;
  border-radius: 8px;
}

.skel-jam {
  width: 90px;
  height: 11px;
  border-radius: 8px;
}

.skel-guru {
  width: 120px;
  height: 14px;
  border-radius: 8px;
}

.skel-time {
  width: 52px;
  height: 14px;
  border-radius: 8px;
}

.skel-badge {
  width: 86px;
  height: 26px;
}

.skel-ket {
  width: 150px;
  height: 14px;
  border-radius: 8px;
}

.skel-action-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.skel-btn {
  width: 78px;
  height: 32px;
  border-radius: 9px;
}

.skel-btn-sm {
  width: 32px;
  height: 32px;
  border-radius: 9px;
}
</style>
