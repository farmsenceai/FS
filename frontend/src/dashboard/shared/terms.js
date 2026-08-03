(function () {
  function createTermsController({ contentDiv, modalOverlay, termsCheckbox, confirmBtn, onConfirm }) {
    function resetConfirmButton(label = 'Confirm') {
      if (termsCheckbox) termsCheckbox.checked = false;
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = label;
      }
    }

    function showContent() {
      if (contentDiv) contentDiv.classList.remove('db-content-hidden');
      if (modalOverlay) modalOverlay.classList.add('db-hidden');
      resetConfirmButton();
    }

    function showModal() {
      resetConfirmButton();
      if (modalOverlay) modalOverlay.classList.remove('db-hidden');
      if (contentDiv) contentDiv.classList.add('db-content-hidden');
    }

    if (termsCheckbox && confirmBtn) {
      termsCheckbox.onchange = () => {
        confirmBtn.disabled = !termsCheckbox.checked;
      };

      confirmBtn.onclick = async () => {
        if (!termsCheckbox.checked) return;
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Updating...';

        try {
          await onConfirm();
        } catch (err) {
          alert(err.message || 'Error connecting to server. Please check your connection and try again.');
          confirmBtn.disabled = false;
          confirmBtn.textContent = 'Confirm';
        }
      };
    }

    return {
      showContent,
      showModal
    };
  }

  window.FarmSenseDashboardTerms = {
    createTermsController
  };
})();
