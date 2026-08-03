/* C:\Users\Megha Prasad\documents\farmsence.ai\frontend\src\pages\assets\js\edit-blog.js */

document.addEventListener("DOMContentLoaded", function () {
  const blocksList = document.getElementById("blocks-list");
  const addBlockButtons = document.querySelectorAll(".add-block-btn");
  const actionSaveDraft = document.getElementById("action-save-draft");
  const actionSubmit = document.getElementById("action-submit");
  const actionPreview = document.getElementById("action-preview");
  const previewModal = document.getElementById("preview-modal");
  const closePreviewModal = document.getElementById("close-preview-modal");
  const previewModalBody = document.getElementById("preview-modal-body");
  const notepadEditor = document.getElementById("notepad-editor");
  const formatButtons = document.querySelectorAll(".format-btn");
  const coverImageInput = document.getElementById("cover-image-url");
  const coverSourceTabs = document.querySelectorAll(".cover-source-tab");
  const coverUrlPanel = document.getElementById("cover-url-panel");
  const coverUploadPanel = document.getElementById("cover-upload-panel");
  const coverImageFile = document.getElementById("cover-image-file");
  const coverImageFileBtn = document.getElementById("cover-image-file-btn");
  const coverUploadStatus = document.getElementById("cover-upload-status");
  const coverPreview = document.getElementById("cover-preview");
  const coverCropModal = document.getElementById("cover-crop-modal");
  const coverCropImage = document.getElementById("cover-crop-image");
  const closeCoverCrop = document.getElementById("close-cover-crop");
  const cancelCoverCrop = document.getElementById("cancel-cover-crop");
  const applyCoverCrop = document.getElementById("apply-cover-crop");
  const successToast = document.getElementById("success-toast");
  const toastTimestamp = document.getElementById("toast-timestamp");
  const adminFeedbackBox = document.getElementById("admin-feedback-box");
  const adminCommentsText = document.getElementById("admin-comments-text");

  let blocks = [];
  let blogId = null;
  let pendingCoverCrop = null;

  // Read blog ID from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  blogId = urlParams.get('id');
  const dashboardMode = urlParams.get("dashboard") === "1";

  if (dashboardMode) {
    document.body.classList.add("dashboard-editor-mode");
  }

  if (!blogId) {
    alert("No blog ID provided for editing.");
    if (dashboardMode && window.parent) {
      window.parent.postMessage({ type: "FarmSenseBlogSaved" }, window.location.origin);
    } else {
      window.location.href = 'blogs.html';
    }
    return;
  }

  // Cover image logic
  coverImageInput.addEventListener("input", function() {
    updateCoverPreview(this.value.trim());
  });

  coverImageInput.addEventListener("change", function() {
    const src = this.value.trim();
    if (src) openCoverCrop({ src, source: "url" });
  });

  coverSourceTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const source = tab.dataset.coverSource;
      coverSourceTabs.forEach(item => item.classList.toggle("active", item === tab));
      coverUrlPanel.classList.toggle("cover-source-panel-hidden", source !== "url");
      coverUploadPanel.classList.toggle("cover-source-panel-hidden", source !== "upload");
    });
  });

  coverImageFileBtn.addEventListener("click", () => coverImageFile.click());

  coverImageFile.addEventListener("change", function() {
    const file = this.files && this.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      this.value = "";
      return;
    }
    const localPreviewUrl = URL.createObjectURL(file);
    openCoverCrop({ src: localPreviewUrl, source: "file", file, revokeUrl: localPreviewUrl });
  });

  closeCoverCrop.addEventListener("click", closeCoverCropModal);
  cancelCoverCrop.addEventListener("click", closeCoverCropModal);
  applyCoverCrop.addEventListener("click", applyCoverCropSelection);

  formatButtons.forEach(button => {
    button.addEventListener("click", () => {
      notepadEditor.focus();
      if (button.dataset.command === "createLink") {
        const url = prompt("Enter the link URL");
        if (!url) return;
        document.execCommand("createLink", false, url);
        return;
      }
      document.execCommand(button.dataset.command, false, button.dataset.value || null);
    });
  });

  // Block addition triggers
  addBlockButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      addBlock(type);
    });
  });

  function addBlock(type, initialData = {}) {
    const blockId = 'block-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const blockData = { id: blockId, type, ...initialData };
    blocks.push(blockData);
    renderBlock(blockData);
  }

  function renderBlock(blockData) {
    const blockEl = document.createElement("div");
    blockEl.className = "editor-block";
    blockEl.id = blockData.id;
    blockEl.dataset.type = blockData.type;

    let inputHTML = '';

    if (blockData.type === 'image') {
      inputHTML = `
        <input type="text" class="block-input-text block-content-val" placeholder="Image URL..." value="${blockData.value || ''}" style="margin-bottom:8px;">
        <input type="text" class="block-input-text block-image-caption" placeholder="Image Caption..." value="${blockData.imageCaption || ''}">`;
    } else if (blockData.type === 'quote') {
      inputHTML = `<textarea class="block-input-text block-content-val" placeholder="Quote text...">${blockData.value || ''}</textarea>`;
    } else if (blockData.type === 'list') {
      inputHTML = `
        <textarea class="block-input-text block-content-val" placeholder="Enter list items, one per line...">${(blockData.listItems || []).join('\n')}</textarea>`;
    }

    blockEl.innerHTML = `
      <div class="block-header">
        <span>${blockData.type} Block</span>
        <div class="block-controls">
          <button type="button" class="block-btn move-btn move-up" title="Move Up"><i class="fa-solid fa-arrow-up"></i></button>
          <button type="button" class="block-btn move-btn move-down" title="Move Down"><i class="fa-solid fa-arrow-down"></i></button>
          <button type="button" class="block-btn delete-block-btn" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div class="block-body">
        ${inputHTML}
      </div>
    `;

    blockEl.querySelector('.delete-block-btn').onclick = () => deleteBlock(blockData.id);
    blockEl.querySelector('.move-up').onclick = () => moveBlock(blockData.id, -1);
    blockEl.querySelector('.move-down').onclick = () => moveBlock(blockData.id, 1);

    blocksList.appendChild(blockEl);
  }

  function deleteBlock(id) {
    blocks = blocks.filter(b => b.id !== id);
    document.getElementById(id).remove();
  }

  function moveBlock(id, direction) {
    const index = blocks.findIndex(b => b.id === id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const temp = blocks[index];
    blocks[index] = blocks[targetIndex];
    blocks[targetIndex] = temp;

    blocksList.innerHTML = '';
    blocks.forEach(b => renderBlock(b));
  }

  function updateCoverPreview(src) {
    if (src !== "") {
      coverPreview.src = src;
      coverPreview.style.display = "block";
    } else {
      coverPreview.style.display = "none";
    }
  }

  async function uploadCoverImage(file) {
    const token = localStorage.getItem("fs_token");
    if (!token) {
      alert("Please sign in before uploading an image.");
      return;
    }

    const localPreviewUrl = URL.createObjectURL(file);
    updateCoverPreview(localPreviewUrl);
    coverUploadStatus.textContent = "Uploading image...";

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/blogs/upload-image", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.imageUrl) {
        throw new Error(data.msg || "Image upload failed");
      }
      coverImageInput.value = data.imageUrl;
      updateCoverPreview(data.imageUrl);
      coverUploadStatus.textContent = file.name;
    } catch (err) {
      console.error(err);
      coverUploadStatus.textContent = "";
      coverImageInput.value = "";
      updateCoverPreview("");
      alert(err.message || "Image upload failed");
    } finally {
      URL.revokeObjectURL(localPreviewUrl);
    }
  }

  function openCoverCrop({ src, source, file = null, revokeUrl = "" }) {
    pendingCoverCrop = { src, source, file, revokeUrl };
    coverCropImage.src = src;
    coverCropModal.style.display = "block";
  }

  function closeCoverCropModal() {
    coverCropModal.style.display = "none";
    if (pendingCoverCrop && pendingCoverCrop.revokeUrl) {
      URL.revokeObjectURL(pendingCoverCrop.revokeUrl);
    }
    pendingCoverCrop = null;
  }

  async function applyCoverCropSelection() {
    if (!pendingCoverCrop) return;
    if (pendingCoverCrop.source === "file") {
      const croppedBlob = await cropImageToCoverBlob(coverCropImage);
      const croppedFile = new File([croppedBlob], pendingCoverCrop.file.name, { type: "image/jpeg" });
      closeCoverCropModal();
      await uploadCoverImage(croppedFile);
      return;
    }
    try {
      coverUploadStatus.textContent = "Cropping image...";
      const croppedFile = await cropUrlToCoverFile(pendingCoverCrop.src);
      closeCoverCropModal();
      await uploadCoverImage(croppedFile);
    } catch (err) {
      console.warn("Using original cover URL:", err.message);
      coverImageInput.value = pendingCoverCrop.src;
      updateCoverPreview(pendingCoverCrop.src);
      coverUploadStatus.textContent = "URL image will be framed to 16:9";
      closeCoverCropModal();
    }
  }

  async function cropUrlToCoverFile(src) {
    const response = await fetch(src, { mode: "cors" });
    if (!response.ok) throw new Error("Unable to load URL image for cropping");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      const img = await loadImage(objectUrl);
      const croppedBlob = await cropImageToCoverBlob(img);
      return new File([croppedBlob], "cover.jpg", { type: "image/jpeg" });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Unable to load image"));
      img.src = src;
    });
  }

  function cropImageToCoverBlob(img) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const targetWidth = 1600;
      const targetHeight = 900;
      const sourceWidth = img.naturalWidth;
      const sourceHeight = img.naturalHeight;
      const sourceRatio = sourceWidth / sourceHeight;
      const targetRatio = targetWidth / targetHeight;
      let sx = 0;
      let sy = 0;
      let sw = sourceWidth;
      let sh = sourceHeight;
      if (sourceRatio > targetRatio) {
        sw = sourceHeight * targetRatio;
        sx = (sourceWidth - sw) / 2;
      } else {
        sh = sourceWidth / targetRatio;
        sy = (sourceHeight - sh) / 2;
      }
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      canvas.getContext("2d").drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
      canvas.toBlob(blob => {
        blob ? resolve(blob) : reject(new Error("Unable to crop image"));
      }, "image/jpeg", 0.9);
    });
  }

  function sanitizeRichHTML(html) {
    const template = document.createElement("template");
    template.innerHTML = html;
    const allowedTags = new Set(["P", "BR", "B", "STRONG", "I", "EM", "U", "S", "STRIKE", "A", "UL", "OL", "LI", "H2", "H3", "H4", "DIV"]);
    template.content.querySelectorAll("*").forEach(node => {
      if (!allowedTags.has(node.tagName)) {
        node.replaceWith(document.createTextNode(node.textContent || ""));
        return;
      }
      [...node.attributes].forEach(attr => {
        if (node.tagName === "A" && attr.name === "href") {
          node.setAttribute("target", "_blank");
          node.setAttribute("rel", "noopener noreferrer");
        } else {
          node.removeAttribute(attr.name);
        }
      });
    });
    return template.innerHTML.trim();
  }

  function escapeHTML(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function convertBlocksToEditorHTML(contentBlocks = []) {
    return contentBlocks.map(block => {
      if (block.type === 'paragraph') return block.value || '';
      if (block.type === 'heading') return `<h${block.headingLevel || 2}>${escapeHTML(block.value)}</h${block.headingLevel || 2}>`;
      if (block.type === 'list') return `<ul>${(block.listItems || []).map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul>`;
      return '';
    }).join('');
  }

  // Fetch and Load current blog contents
  async function fetchBlogDetails() {
    try {
      const response = await fetch(`/api/blogs/detail/${blogId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('fs_token')}`
        }
      });
      const data = await response.json();
      if (data.success && data.blog) {
        const blog = data.blog;
        document.getElementById("blog-title").value = blog.title;
        coverImageInput.value = blog.coverImage;
        updateCoverPreview(blog.coverImage);

        if (blog.status === 'changes_requested' && blog.adminComments) {
          adminCommentsText.innerText = blog.adminComments;
          adminFeedbackBox.style.display = "block";
        }

        blocksList.innerHTML = '';
        notepadEditor.innerHTML = convertBlocksToEditorHTML(blog.contentBlocks || []);
        if (blog.contentBlocks && blog.contentBlocks.length > 0) {
          blog.contentBlocks.filter(b => ['image', 'quote'].includes(b.type)).forEach(b => {
            addBlock(b.type, b);
          });
        }
      } else {
        alert(data.msg || "Failed to load blog details.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error fetching blog details");
    }
  }

  function getBlogSubmissionPayload() {
    const title = document.getElementById("blog-title").value.trim();
    const coverImage = coverImageInput.value.trim();
    const richHTML = sanitizeRichHTML(notepadEditor.innerHTML);
    const orderedBlocks = Array.from(blocksList.children).map(el => {
      const type = el.dataset.type;
      const valInput = el.querySelector('.block-content-val');
      const value = valInput ? valInput.value.trim() : '';

      const blockPayload = { type };

      if (type === 'quote') {
        blockPayload.value = value;
      } else if (type === 'image') {
        blockPayload.value = value;
        blockPayload.imageCaption = el.querySelector('.block-image-caption').value.trim();
      }

      return blockPayload;
    });

    const contentBlocks = [];
    if (notepadEditor.textContent.trim()) {
      contentBlocks.push({ type: "paragraph", value: richHTML });
    }
    contentBlocks.push(...orderedBlocks);

    return { title, coverImage, contentBlocks };
  }

  async function submitBlogUpdate(status) {
    const payload = getBlogSubmissionPayload();
    payload.status = status;

    if (!payload.title || !payload.coverImage) {
      alert("Title and Cover Image are mandatory fields.");
      return;
    }

    try {
      const response = await fetch(`/api/blogs/${blogId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('fs_token')}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        const now = new Date();
        toastTimestamp.innerText = now.toLocaleString();
        successToast.style.display = "block";

        setTimeout(() => {
          if (dashboardMode && window.parent) {
            window.parent.postMessage({ type: "FarmSenseBlogSaved" }, window.location.origin);
          } else {
            window.location.href = 'blogs.html';
          }
        }, 1200);
      } else {
        alert(data.msg || "Update failed");
      }
    } catch (err) {
      console.error(err);
      alert("Network error updating blog");
    }
  }

  actionPreview.onclick = () => {
    const payload = getBlogSubmissionPayload();
    let previewHTML = `
      <h1 style="font-size: 28px; margin-bottom: 8px;">${payload.title || 'Untitled Blog'}</h1>
      <img src="${payload.coverImage}" style="width:100%; max-height:350px; object-fit:cover; border-radius:8px; margin-bottom:20px;">
    `;

    payload.contentBlocks.forEach(b => {
      if (b.type === 'paragraph') {
        previewHTML += `<div style="line-height:1.6; margin-bottom:16px;">${b.value}</div>`;
      } else if (b.type === 'heading') {
        previewHTML += `<h${b.headingLevel} style="margin-top:24px; margin-bottom:12px;">${b.value}</h${b.headingLevel}>`;
      } else if (b.type === 'image') {
        previewHTML += `
          <div style="margin:20px 0; text-align:center;">
            <img src="${b.value}" style="max-width:100%; border-radius:8px;">
            <div style="font-size:12px; color:#6b7280; margin-top:4px;">${b.imageCaption}</div>
          </div>`;
      } else if (b.type === 'quote') {
        previewHTML += `<blockquote style="border-left:4px solid #16a34a; padding-left:16px; font-style:italic; margin:20px 0; color:#4b5563;">${b.value}</blockquote>`;
      } else if (b.type === 'list') {
        previewHTML += `<ul style="padding-left:20px; margin-bottom:16px;">${b.listItems.map(item => `<li>${item}</li>`).join('')}</ul>`;
      }
    });

    previewModalBody.innerHTML = previewHTML;
    previewModal.style.display = "block";
  };

  closePreviewModal.onclick = () => {
    previewModal.style.display = "none";
  };

  actionSaveDraft.onclick = () => submitBlogUpdate('draft');
  actionSubmit.onclick = () => submitBlogUpdate('pending_review');

  // Load current details
  fetchBlogDetails();
});
