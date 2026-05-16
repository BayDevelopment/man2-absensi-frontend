<template>
  <footer class="footer">
    <div class="footer-left">
      <div class="footer-logo-dot" />
      <span class="footer-copy">© 2026 MAN 2 Kota Cilegon · Sistem Absensi Digital</span>
    </div>
    <div class="footer-links">
      <a href="#" class="footer-link">Bantuan</a>
      <span class="footer-sep">·</span>
      <a href="#" class="footer-link">Kebijakan</a>
      <span class="footer-sep">·</span>
      <a href="#" class="footer-link">Kontak</a>
    </div>
  </footer>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500&display=swap");

.footer {
  padding: 12px 20px;
  border-top: 1px solid rgba(212, 160, 23, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(5, 14, 5, 0.6);
  backdrop-filter: blur(12px);
  font-family: "Plus Jakarta Sans", sans-serif;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-logo-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2d8a2d, #d4a017);
  flex-shrink: 0;
}

.footer-copy {
  font-size: 11px;
  color: #2d4a2d;
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-link {
  font-size: 11px;
  color: #2d4a2d;
  text-decoration: none;
  transition: color 0.2s;
}
.footer-link:hover {
  color: #d4a017;
}

.footer-sep {
  font-size: 11px;
  color: #1a2e1a;
}

@media (max-width: 480px) {
  .footer {
    flex-direction: column;
    gap: 6px;
    padding: 10px 16px;
  }
  .footer-links {
    justify-content: center;
  }
}
</style>
