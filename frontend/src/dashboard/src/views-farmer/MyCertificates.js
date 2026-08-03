window.metaMyCertificates = {
  title: 'My Certificates',
  subtitle: 'Verified training certificates'
};

function viewMyCertificates() {
  return `<style>
    .fmc-page{padding:20px;background:#f5f6fa;min-height:100%;font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1f2937}.fmc-empty{max-width:680px;margin:40px auto;padding:40px 24px;text-align:center;background:#fff;border:1px solid #e5e7eb;border-radius:14px}.fmc-icon{display:flex;width:54px;height:54px;margin:0 auto 14px;align-items:center;justify-content:center;border-radius:50%;background:#f3f4f6;color:#64748b;font-size:24px}.fmc-empty h3{margin:0 0 8px}.fmc-empty p{margin:0;color:#64748b;line-height:1.55}
  </style><section class="fmc-page"><div class="fmc-empty"><div class="fmc-icon" aria-hidden="true">◇</div><h3>Certificates are not available yet</h3><p>FarmSence does not currently have a canonical training and certificate system. Verified certificates will appear here after that module is introduced; no sample credentials are shown.</p></div></section>`;
}
