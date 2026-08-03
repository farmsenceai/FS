window.metaSOPsChecklists = {
  title: 'SOPs &amp; Checklists',
  subtitle: 'Assigned standard operating procedures and checklists'
};

function viewSOPsChecklists() {
  return `<style>
    .fsc-page{padding:20px;background:#f5f6fa;min-height:100%;font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1f2937}.fsc-empty{max-width:680px;margin:40px auto;padding:40px 24px;text-align:center;background:#fff;border:1px solid #e5e7eb;border-radius:14px}.fsc-icon{display:flex;width:54px;height:54px;margin:0 auto 14px;align-items:center;justify-content:center;border-radius:50%;background:#f3f4f6;color:#64748b;font-size:24px}.fsc-empty h3{margin:0 0 8px}.fsc-empty p{margin:0;color:#64748b;line-height:1.55}
  </style><section class="fsc-page"><div class="fsc-empty"><div class="fsc-icon" aria-hidden="true">✓</div><h3>No assigned SOPs or checklists</h3><p>FarmSence does not currently have a canonical SOP assignment and completion module. Administrator-issued procedures will appear here when that module is available; no sample progress is shown.</p></div></section>`;
}
