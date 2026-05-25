<script setup>
import { ref, computed, watch, onUnmounted, nextTick } from "vue";
import * as faceapi from "@vladmandic/face-api";

const props = defineProps({
  show: { type: Boolean, default: false },
  jadwalInfo: { type: Object, default: () => ({}) },
  faceRequired: { type: Boolean, default: true },
});

const emit = defineEmits(["verified", "skip", "close"]);

// ── State ─────────────────────────────────────────────────────────────────
const step = ref(1); // 1=posisikan | 2=verifikasi | 3=selesai
const modelsLoaded = ref(false);
const modelsLoading = ref(false);
const errorMsg = ref("");

const cameraActive = ref(false);
const faceDetected = ref(false);
const multipleFaces = ref(false);
const scanning = ref(false);
const scanProgress = ref(0);
const submitting = ref(false);

const capturedPhoto = ref(null);
const descriptorResult = ref(null);

const videoRef = ref(null);
const canvasRef = ref(null);

let faceapiLib = null;
let _stream = null;
let _detectionInterval = null;
let _detecting = false;
let _scanSamples = [];

// ── Computed ──────────────────────────────────────────────────────────────
const stepLabels = ["Posisikan wajah", "Verifikasi", "Selesai"];

const canScan = computed(
  () =>
    modelsLoaded.value &&
    cameraActive.value &&
    faceDetected.value &&
    !multipleFaces.value &&
    !scanning.value,
);

const statusText = computed(() => {
  if (!modelsLoaded.value) return "Memuat model AI...";
  if (!cameraActive.value) return "Klik tombol untuk aktifkan kamera";
  if (multipleFaces.value)
    return "Terdeteksi lebih dari satu wajah. Pastikan hanya wajah siswa yang terlihat.";
  if (!faceDetected.value) return "Arahkan wajah ke tengah frame";
  if (scanning.value) return "Memindai wajah...";
  return "Wajah terdeteksi — siap verifikasi";
});

const statusColor = computed(() => {
  if (!modelsLoaded.value || !cameraActive.value) return "idle";
  if (multipleFaces.value || !faceDetected.value) return "warning";
  if (scanning.value) return "scanning";
  return "ready";
});

// ── Watch ─────────────────────────────────────────────────────────────────
watch(
  () => props.show,
  async (val) => {
    if (val) {
      resetLocalState();
      if (!modelsLoaded.value && !modelsLoading.value) {
        await loadModels();
      }
    } else {
      stopCamera();
    }
  },
);

onUnmounted(() => stopCamera());

function resetLocalState() {
  step.value = 1;
  errorMsg.value = "";
  faceDetected.value = false;
  multipleFaces.value = false;
  scanning.value = false;
  scanProgress.value = 0;
  submitting.value = false;
  capturedPhoto.value = null;
  descriptorResult.value = null;
  _scanSamples = [];
}

// ── Load models ───────────────────────────────────────────────────────────
async function loadModels() {
  modelsLoading.value = true;
  errorMsg.value = "";

  try {
    // ✅ Pakai import npm @vladmandic/face-api — tidak perlu loadScript/window
    faceapiLib = faceapi;

    // ✅ Model disimpan lokal di public/models/face-api
    // Salin dari: node_modules/@vladmandic/face-api/model → public/models/face-api
    const MODEL_URL = "/models/face-api";

    await Promise.all([
      faceapiLib.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapiLib.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      faceapiLib.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);

    modelsLoaded.value = true;
  } catch (err) {
    console.error("[FaceVerification] loadModels:", err);
    errorMsg.value =
      "Gagal memuat model AI wajah. Pastikan folder /public/models/face-api tersedia.";
  } finally {
    modelsLoading.value = false;
  }
}

// ── Kamera ────────────────────────────────────────────────────────────────
async function startCamera() {
  errorMsg.value = "";
  stopCamera();
  await nextTick();

  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Browser tidak mendukung akses kamera.");
    }

    _stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      audio: false,
    });

    const video = videoRef.value;
    if (!video) throw new Error("Elemen video tidak ditemukan.");

    video.srcObject = _stream;

    await new Promise((resolve) => {
      if (video.readyState >= 2) {
        resolve();
        return;
      }
      video.onloadedmetadata = resolve;
    });

    await video.play();

    cameraActive.value = true;
    step.value = 2;
    _startDetectionLoop();
  } catch (err) {
    stopCamera();
    const messages = {
      NotAllowedError: "Izin kamera ditolak. Klik ikon kamera di address bar lalu pilih Allow.",
      NotFoundError: "Kamera tidak ditemukan di perangkat ini.",
      NotReadableError: "Kamera sedang dipakai aplikasi lain.",
    };
    errorMsg.value = messages[err.name] ?? "Kamera gagal aktif: " + (err.message || err.name);
    console.error("[FaceVerification] startCamera:", err);
  }
}

function stopCamera() {
  if (_detectionInterval) {
    clearInterval(_detectionInterval);
    _detectionInterval = null;
  }

  if (_stream) {
    _stream.getTracks().forEach((t) => t.stop());
    _stream = null;
  }

  const video = videoRef.value;
  if (video) {
    video.pause?.();
    video.srcObject = null;
  }

  if (canvasRef.value) {
    const ctx = canvasRef.value.getContext("2d");
    ctx?.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  }

  cameraActive.value = false;
  faceDetected.value = false;
  multipleFaces.value = false;
  scanning.value = false;
  scanProgress.value = 0;
  _detecting = false;
  _scanSamples = [];
}

// ── Detection Loop ────────────────────────────────────────────────────────
function _startDetectionLoop() {
  if (_detectionInterval) clearInterval(_detectionInterval);

  _detectionInterval = setInterval(async () => {
    if (_detecting || !cameraActive.value || !videoRef.value || !canvasRef.value || !faceapiLib)
      return;

    const video = videoRef.value;
    const canvas = canvasRef.value;
    if (!video.videoWidth || !video.videoHeight) return;

    _detecting = true;

    try {
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapiLib.matchDimensions(canvas, displaySize);

      const detections = await faceapiLib
        .detectAllFaces(video, new faceapiLib.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
        .withFaceLandmarks(true)
        .withFaceDescriptors();

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const resized = faceapiLib.resizeResults(detections, displaySize);

      if (resized.length !== 1) {
        faceDetected.value = false;
        multipleFaces.value = resized.length > 1;

        if (scanning.value) {
          scanning.value = false;
          scanProgress.value = 0;
          _scanSamples = [];
        }

        resized.forEach((d) => drawBox(ctx, d.detection.box, "#ef4444"));
        return;
      }

      multipleFaces.value = false;
      faceDetected.value = true;
      errorMsg.value = "";

      faceapiLib.draw.drawFaceLandmarks(canvas, resized);
      drawBox(ctx, resized[0].detection.box, scanning.value ? "#22c55e" : "#60a5fa");

      if (scanning.value && resized[0]?.descriptor) {
        const descriptor = Array.from(resized[0].descriptor);

        if (!isValidDescriptor(descriptor)) {
          errorMsg.value = "Descriptor wajah tidak valid. Silakan ulangi scan.";
          scanning.value = false;
          scanProgress.value = 0;
          _scanSamples = [];
          return;
        }

        _scanSamples.push(descriptor);
        scanProgress.value = Math.round((_scanSamples.length / 5) * 100);

        if (_scanSamples.length === 3) _capturePhoto();

        if (_scanSamples.length >= 5) {
          clearInterval(_detectionInterval);
          _detectionInterval = null;
          _finalizeScan(_scanSamples);
        }
      }
    } catch (e) {
      console.error("[FaceVerification] detection error:", e);
    } finally {
      _detecting = false;
    }
  }, 250);
}

function drawBox(ctx, box, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(box.x, box.y, box.width, box.height, 8);
    ctx.stroke();
    return;
  }
  ctx.strokeRect(box.x, box.y, box.width, box.height);
}

function isValidDescriptor(descriptor) {
  return (
    Array.isArray(descriptor) &&
    descriptor.length === 128 &&
    descriptor.every((v) => Number.isFinite(Number(v)))
  );
}

// ── Scan ──────────────────────────────────────────────────────────────────
function startScan() {
  if (!canScan.value) return;
  errorMsg.value = "";
  _scanSamples = [];
  scanning.value = true;
  scanProgress.value = 0;
}

function _capturePhoto() {
  const video = videoRef.value;
  if (!video?.videoWidth || !video?.videoHeight) return;

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  capturedPhoto.value = canvas.toDataURL("image/jpeg", 0.82);
}

function _finalizeScan(samples) {
  scanning.value = false;

  if (!Array.isArray(samples) || samples.length < 3) {
    errorMsg.value = "Sampel wajah belum cukup. Silakan ulangi scan.";
    return;
  }

  if (!capturedPhoto.value) _capturePhoto();

  // ✅ Rata-rata descriptor dari semua sampel
  const count = samples.length;
  const avg = new Array(128).fill(0);
  for (const sample of samples) {
    for (let i = 0; i < 128; i++) {
      avg[i] += Number(sample[i]);
    }
  }
  const descriptor = avg.map((v) => v / count);

  if (!isValidDescriptor(descriptor) || !capturedPhoto.value) {
    errorMsg.value = "Data wajah tidak valid. Silakan ulangi scan.";
    descriptorResult.value = null;
    step.value = 1;
    stopCamera();
    return;
  }

  descriptorResult.value = descriptor;
  step.value = 3;
  stopCamera();
}

// ── Konfirmasi ────────────────────────────────────────────────────────────
function confirmVerification() {
  if (submitting.value) return;

  if (!isValidDescriptor(descriptorResult.value) || !capturedPhoto.value) {
    errorMsg.value = "Data wajah belum lengkap. Silakan ulangi scan.";
    return;
  }

  submitting.value = true;
  emit("verified", descriptorResult.value, capturedPhoto.value);
}

function skipVerification() {
  if (props.faceRequired) {
    errorMsg.value = "Verifikasi wajah wajib dilakukan untuk absen masuk.";
    return;
  }
  stopCamera();
  emit("skip");
}

function closeModal() {
  stopCamera();
  resetLocalState();
  emit("close");
}

async function retake() {
  descriptorResult.value = null;
  capturedPhoto.value = null;
  scanProgress.value = 0;
  step.value = 1;
  await startCamera();
}
</script>

<template>
  <Transition name="fvm-backdrop">
    <div v-if="show" class="fvm-backdrop" @click.self="closeModal">
      <Transition name="fvm-modal">
        <div v-if="show" class="fvm-modal">
          <!-- Header -->
          <div class="fvm-header">
            <div class="fvm-header-left">
              <div class="fvm-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 class="fvm-title">Absen Masuk — Verifikasi Wajah</h2>
                <p v-if="jadwalInfo?.matpel" class="fvm-subtitle">
                  {{ jadwalInfo.matpel }} · {{ jadwalInfo.guru }} · {{ jadwalInfo.jam_mulai }} –
                  {{ jadwalInfo.jam_selesai }}
                </p>
              </div>
            </div>
            <button class="fvm-close" @click="closeModal">×</button>
          </div>

          <!-- Step indicator -->
          <div class="fvm-steps">
            <template v-for="(label, i) in stepLabels" :key="i">
              <div class="fvm-step" :class="{ active: step === i + 1, done: step > i + 1 }">
                <div class="fvm-step-circle">
                  <svg
                    v-if="step > i + 1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  <span v-else>{{ i + 1 }}</span>
                </div>
                <span class="fvm-step-label">{{ label }}</span>
              </div>
              <div v-if="i < 2" class="fvm-step-line" :class="{ done: step > i + 1 }"></div>
            </template>
          </div>

          <!-- Jadwal card -->
          <div v-if="jadwalInfo?.matpel" class="fvm-jadwal-card">
            <div class="fvm-jadwal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
            </div>
            <div>
              <p class="fvm-jadwal-mapel">{{ jadwalInfo.matpel }} — {{ jadwalInfo.kelas }}</p>
              <p class="fvm-jadwal-detail">
                {{ jadwalInfo.guru }} · {{ jadwalInfo.jam_mulai }} – {{ jadwalInfo.jam_selesai }}
              </p>
            </div>
          </div>

          <!-- Body -->
          <div class="fvm-body">
            <template v-if="step < 3">
              <!-- Error -->
              <div v-if="errorMsg" class="fvm-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
                {{ errorMsg }}
              </div>

              <!-- Loading models -->
              <div v-if="!modelsLoaded && modelsLoading" class="fvm-loading">
                <div class="fvm-spinner"></div>
                <span>Memuat model AI pengenalan wajah...</span>
              </div>

              <!-- Camera -->
              <div class="fvm-camera-wrap" :class="`fvm-camera--${statusColor}`">
                <video
                  ref="videoRef"
                  autoplay
                  playsinline
                  muted
                  class="fvm-video"
                  :style="{ display: cameraActive ? 'block' : 'none' }"
                ></video>
                <canvas
                  ref="canvasRef"
                  class="fvm-canvas"
                  :style="{ display: cameraActive ? 'block' : 'none' }"
                ></canvas>

                <div v-if="!cameraActive" class="fvm-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                    />
                  </svg>
                  <p>
                    Klik tombol di bawah untuk<br />mengaktifkan kamera dan mulai<br />verifikasi
                  </p>
                </div>

                <div
                  v-if="cameraActive && !scanning"
                  class="fvm-face-guide"
                  :class="{ detected: faceDetected }"
                ></div>

                <div v-if="scanning" class="fvm-scan-bar"></div>

                <div v-if="faceDetected && !scanning" class="fvm-detected-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  Wajah Terdeteksi
                </div>

                <div v-if="scanning" class="fvm-scan-progress">
                  <p>Memindai {{ Math.round(scanProgress / 20) }}/5</p>
                  <div class="fvm-scan-bar-track">
                    <div class="fvm-scan-bar-fill" :style="{ width: scanProgress + '%' }"></div>
                  </div>
                </div>
              </div>

              <!-- Status -->
              <div class="fvm-status" :class="`fvm-status--${statusColor}`">
                <div class="fvm-status-dot"></div>
                {{ statusText }}
              </div>

              <!-- Tip -->
              <div class="fvm-tip">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                  />
                </svg>
                Pastikan wajah Anda berada di tengah frame, pencahayaan cukup, dan tidak menggunakan
                masker atau topi.
              </div>
            </template>

            <!-- Step 3 -->
            <template v-else>
              <div class="fvm-success-wrap">
                <div class="fvm-success-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 class="fvm-success-title">Data wajah berhasil dipindai</h3>
                <p class="fvm-success-sub">
                  Klik "Konfirmasi Absen" untuk memverifikasi ke server dan mencatat kehadiran Anda.
                </p>
                <div v-if="capturedPhoto" class="fvm-photo-preview">
                  <img :src="capturedPhoto" alt="Foto verifikasi" />
                  <p>Foto yang akan dikirim</p>
                </div>
              </div>
            </template>
          </div>

          <!-- Footer -->
          <div class="fvm-footer">
            <button class="fvm-btn fvm-btn--ghost" @click="closeModal">Batal</button>

            <button
              v-if="step === 1"
              class="fvm-btn fvm-btn--primary"
              :disabled="!modelsLoaded || modelsLoading"
              @click="startCamera"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
              </svg>
              {{ modelsLoading ? "Memuat..." : "Mulai Verifikasi Wajah" }}
            </button>

            <template v-if="step === 2">
              <button v-if="!faceRequired" class="fvm-btn fvm-btn--ghost" @click="skipVerification">
                Lewati
              </button>
              <button class="fvm-btn fvm-btn--primary" :disabled="!canScan" @click="startScan">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {{ scanning ? "Memindai..." : "Mulai Scan Wajah" }}
              </button>
            </template>

            <template v-if="step === 3">
              <button class="fvm-btn fvm-btn--ghost" @click="retake">Ulangi</button>
              <button
                class="fvm-btn fvm-btn--success"
                :disabled="submitting"
                @click="confirmVerification"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {{ submitting ? "Mengirim..." : "Konfirmasi Absen" }}
              </button>
            </template>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.fvm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 16px;
  backdrop-filter: blur(2px);
}
.fvm-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 540px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
}
.fvm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
}
.fvm-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.fvm-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #f0fdf4;
  color: #16a34a;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.fvm-icon svg {
  width: 20px;
  height: 20px;
}
.fvm-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}
.fvm-subtitle {
  font-size: 11.5px;
  color: #6b7280;
  margin: 2px 0 0;
}
.fvm-close {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  cursor: pointer;
  color: #6b7280;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fvm-steps {
  display: flex;
  align-items: center;
  padding: 14px 24px;
  gap: 0;
  background: #fafafa;
  border-bottom: 1px solid #f3f4f6;
}
.fvm-step {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
}
.fvm-step-circle {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid #d1d5db;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  transition: all 0.2s;
}
.fvm-step-circle svg {
  width: 12px;
  height: 12px;
}
.fvm-step.active .fvm-step-circle {
  border-color: #16a34a;
  background: #16a34a;
  color: white;
}
.fvm-step.done .fvm-step-circle {
  border-color: #16a34a;
  background: #f0fdf4;
  color: #16a34a;
}
.fvm-step-label {
  font-size: 11.5px;
  font-weight: 600;
  color: #9ca3af;
}
.fvm-step.active .fvm-step-label,
.fvm-step.done .fvm-step-label {
  color: #16a34a;
}
.fvm-step-line {
  flex: 1;
  height: 2px;
  background: #e5e7eb;
  margin: 0 8px;
  border-radius: 1px;
  transition: background 0.3s;
}
.fvm-step-line.done {
  background: #16a34a;
}
.fvm-jadwal-card {
  margin: 12px 16px 0;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.fvm-jadwal-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #dcfce7;
  color: #16a34a;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.fvm-jadwal-icon svg {
  width: 17px;
  height: 17px;
}
.fvm-jadwal-mapel {
  font-size: 12.5px;
  font-weight: 700;
  color: #166534;
  margin: 0;
}
.fvm-jadwal-detail {
  font-size: 11.5px;
  color: #16a34a;
  margin: 2px 0 0;
}
.fvm-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.fvm-error {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12.5px;
  color: #991b1b;
}
.fvm-error svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.fvm-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12.5px;
  color: #1e40af;
}
.fvm-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #bfdbfe;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.fvm-camera-wrap {
  position: relative;
  background: #0f172a;
  border-radius: 16px;
  overflow: hidden;
  aspect-ratio: 4/3;
  border: 2px solid #334155;
  transition: border-color 0.2s;
}
.fvm-camera--ready {
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
}
.fvm-camera--scanning {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}
.fvm-camera--warning {
  border-color: #f59e0b;
}
.fvm-camera--idle {
  border-color: #334155;
}
.fvm-video,
.fvm-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.fvm-canvas {
  pointer-events: none;
}
.fvm-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #475569;
  text-align: center;
  padding: 16px;
}
.fvm-placeholder svg {
  width: 40px;
  height: 40px;
  opacity: 0.5;
}
.fvm-placeholder p {
  font-size: 13px;
  line-height: 1.6;
}
.fvm-face-guide {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.fvm-face-guide::after {
  content: "";
  width: 50%;
  height: 75%;
  border: 2px dashed rgba(148, 163, 184, 0.6);
  border-radius: 50%;
  transition:
    border-color 0.3s,
    border-style 0.3s;
}
.fvm-face-guide.detected::after {
  border-color: #22c55e;
  border-style: solid;
}
.fvm-scan-bar {
  position: absolute;
  inset-x: 0;
  height: 2px;
  background: rgba(34, 197, 94, 0.8);
  animation: scanDown 1.5s ease-in-out infinite;
}
@keyframes scanDown {
  0% {
    top: 0;
  }
  50% {
    top: calc(100% - 2px);
  }
  100% {
    top: 0;
  }
}
.fvm-detected-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(34, 197, 94, 0.9);
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
}
.fvm-detected-badge svg {
  width: 12px;
  height: 12px;
}
.fvm-scan-progress {
  position: absolute;
  bottom: 10px;
  left: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 10px;
  padding: 8px 12px;
  text-align: center;
}
.fvm-scan-progress p {
  font-size: 11px;
  color: white;
  font-weight: 600;
  margin: 0 0 5px;
}
.fvm-scan-bar-track {
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}
.fvm-scan-bar-fill {
  height: 100%;
  background: #22c55e;
  border-radius: 2px;
  transition: width 0.2s;
}
.fvm-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 10px;
}
.fvm-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.fvm-status--idle {
  background: #f3f4f6;
  color: #6b7280;
}
.fvm-status--idle .fvm-status-dot {
  background: #9ca3af;
}
.fvm-status--warning {
  background: #fffbeb;
  color: #92400e;
}
.fvm-status--warning .fvm-status-dot {
  background: #f59e0b;
}
.fvm-status--ready {
  background: #f0fdf4;
  color: #166534;
}
.fvm-status--ready .fvm-status-dot {
  background: #22c55e;
  animation: pulse-dot 1s ease infinite;
}
.fvm-status--scanning {
  background: #eff6ff;
  color: #1e40af;
}
.fvm-status--scanning .fvm-status-dot {
  background: #3b82f6;
  animation: pulse-dot 0.5s ease infinite;
}
@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.3);
  }
}
.fvm-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  color: #374151;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  padding: 10px 12px;
}
.fvm-tip svg {
  width: 15px;
  height: 15px;
  color: #2563eb;
  flex-shrink: 0;
  margin-top: 1px;
}
.fvm-success-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  padding: 10px 0;
}
.fvm-success-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #f0fdf4;
  color: #16a34a;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fvm-success-icon svg {
  width: 30px;
  height: 30px;
}
.fvm-success-title {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}
.fvm-success-sub {
  font-size: 12.5px;
  color: #6b7280;
  margin: 0;
  max-width: 340px;
}
.fvm-photo-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}
.fvm-photo-preview img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 12px;
  border: 2px solid #bbf7d0;
}
.fvm-photo-preview p {
  font-size: 11px;
  color: #9ca3af;
}
.fvm-footer {
  padding: 12px 16px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.fvm-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: 10px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
  font-family: inherit;
}
.fvm-btn svg {
  width: 15px;
  height: 15px;
}
.fvm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.fvm-btn--ghost {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}
.fvm-btn--ghost:hover:not(:disabled) {
  background: #e5e7eb;
}
.fvm-btn--primary {
  background: #111827;
  color: white;
}
.fvm-btn--primary:hover:not(:disabled) {
  background: #1f2937;
}
.fvm-btn--success {
  background: #16a34a;
  color: white;
}
.fvm-btn--success:hover:not(:disabled) {
  background: #15803d;
}
.fvm-backdrop-enter-active,
.fvm-backdrop-leave-active {
  transition: opacity 0.2s;
}
.fvm-backdrop-enter-from,
.fvm-backdrop-leave-to {
  opacity: 0;
}
.fvm-modal-enter-active {
  transition:
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.2s;
}
.fvm-modal-leave-active {
  transition:
    transform 0.18s ease,
    opacity 0.15s;
}
.fvm-modal-enter-from {
  transform: translateY(24px);
  opacity: 0;
}
.fvm-modal-leave-to {
  transform: translateY(8px);
  opacity: 0;
}
@media (max-width: 600px) {
  .fvm-modal {
    max-height: 100vh;
    border-radius: 20px 20px 0 0;
  }
  .fvm-backdrop {
    align-items: flex-end;
    padding: 0;
  }
}
</style>
