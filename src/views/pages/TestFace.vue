<template>
  <div style="padding: 20px; background: #0f172a; min-height: 100vh; color: white">
    <h2>🧪 Test Face Detection</h2>

    <div id="status" :style="{ color: statusColor }">{{ statusText }}</div>

    <div style="margin-top: 16px; position: relative; display: inline-block">
      <video
        ref="videoEl"
        autoplay
        muted
        playsinline
        style="border-radius: 12px; border: 2px solid #334155"
        width="640"
        height="480"
      />
      <canvas ref="canvasEl" style="position: absolute; top: 0; left: 0" width="640" height="480" />
    </div>

    <div style="margin-top: 16px">
      <div>
        Faces detected: <strong>{{ faceCount }}</strong>
      </div>
      <div>
        Model loaded: <strong>{{ modelLoaded ? "✅ Ya" : "⏳ Loading..." }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import * as faceapi from "@vladmandic/face-api";

const videoEl = ref(null);
const canvasEl = ref(null);
const statusText = ref("Loading model...");
const statusColor = ref("#facc15");
const modelLoaded = ref(false);
const faceCount = ref(0);

let detectInterval = null;

onMounted(async () => {
  try {
    // 1. Load models
    statusText.value = "⏳ Loading model AI...";
    const MODEL_URL = "/models";

    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

    modelLoaded.value = true;
    statusText.value = "✅ Model loaded! Memulai kamera...";
    statusColor.value = "#4ade80";

    // 2. Start camera
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
    });
    videoEl.value.srcObject = stream;
    await new Promise((resolve) => (videoEl.value.onloadedmetadata = resolve));

    statusText.value = "📸 Kamera aktif — arahkan wajah ke kamera";

    // 3. Mulai deteksi
    detectInterval = setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(videoEl.value, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      faceCount.value = detections.length;

      // Gambar bounding box di canvas
      const dims = faceapi.matchDimensions(canvasEl.value, videoEl.value, true);
      const resized = faceapi.resizeResults(detections, dims);

      const ctx = canvasEl.value.getContext("2d");
      ctx.clearRect(0, 0, canvasEl.value.width, canvasEl.value.height);
      faceapi.draw.drawDetections(canvasEl.value, resized);
      faceapi.draw.drawFaceLandmarks(canvasEl.value, resized);

      if (detections.length > 0) {
        statusText.value = `😊 ${detections.length} wajah terdeteksi!`;
        statusColor.value = "#4ade80";
      } else {
        statusText.value = "👀 Tidak ada wajah — arahkan ke kamera";
        statusColor.value = "#94a3b8";
      }
    }, 300);
  } catch (err) {
    statusText.value = `❌ Error: ${err.message}`;
    statusColor.value = "#f87171";
    console.error(err);
  }
});

onUnmounted(() => {
  clearInterval(detectInterval);
  videoEl.value?.srcObject?.getTracks().forEach((t) => t.stop());
});
</script>
