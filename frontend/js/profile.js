/**
 * Arogya Lens — User Profile Controller
 * Demographic viewer and Edit Profile modal handler
 */

class ProfileManager {
  init() {
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById("editProfileBtn")?.addEventListener("click", () => {
      this.openEditModal();
    });

    document.getElementById("closeProfileModalBtn")?.addEventListener("click", () => {
      document.getElementById("editProfileModal").style.display = "none";
    });

    document.getElementById("editProfileForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("editName")?.value.trim();
      const age = parseInt(document.getElementById("editAge")?.value, 10);
      const sex = document.getElementById("editSex")?.value;

      try {
        window.App.showLoading(true);
        const updated = await window.API.updateProfile({ name, age, sex });
        window.App.userProfile = updated;
        this.renderProfile();
        document.getElementById("editProfileModal").style.display = "none";
        window.App.showToast("Profile updated successfully", "success");
      } catch (err) {
        window.App.showToast("Update failed: " + err.message, "error");
      } finally {
        window.App.showLoading(false);
      }
    });

    document.getElementById("logoutBtn")?.addEventListener("click", () => {
      window.API.clearToken();
      window.Camera.stopCamera();
      window.App.showToast("Logged out successfully", "success");
      window.App.showScreen("onboardingScreen");
    });
  }

  async loadProfile() {
    try {
      window.App.showLoading(true);
      const profile = await window.API.getProfile();
      window.App.userProfile = profile;
      this.renderProfile();
    } catch (err) {
      console.warn("Profile load error:", err);
    } finally {
      window.App.showLoading(false);
    }
  }

  renderProfile() {
    const p = window.App.userProfile;
    if (!p) return;

    document.getElementById("profileName").textContent = p.name || "Patient";
    document.getElementById("profileMobile").textContent = p.mobile_number ? `+91 ${p.mobile_number}` : "--";
    document.getElementById("profileAge").textContent = p.age ? `${p.age} yrs` : "--";
    document.getElementById("profileSex").textContent = p.sex ? p.sex.toUpperCase() : "--";
  }

  openEditModal() {
    const p = window.App.userProfile || {};
    document.getElementById("editName").value = p.name || "";
    document.getElementById("editAge").value = p.age || "";
    document.getElementById("editSex").value = p.sex || "female";
    document.getElementById("editProfileModal").style.display = "flex";
  }
}

window.Profile = new ProfileManager();
