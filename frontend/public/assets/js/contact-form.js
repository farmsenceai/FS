document.addEventListener("DOMContentLoaded", () => {
    const contactForm = document.getElementById("contactForm");

    if (contactForm) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const formData = {
                name: document.getElementById("name").value,
                email: document.getElementById("email").value,
                phone: document.getElementById("phone").value,
                farmSize: document.getElementById("farmSize").value,
                partnership: document.getElementById("partnership").value,
                message: document.getElementById("message").value,
                subject: "New Contact Form Lead - FarmSence"
            };

            try {
                const response = await fetch("/api/contact/submit", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (result.success) {
                    alert(result.message || "Message sent successfully!");
                    contactForm.reset();
                } else {
                    alert(result.error || "Something went wrong. Please try again.");
                }
            } catch (error) {
                console.error("Error submitting form:", error);
                alert("Failed to connect to the server. Please check your internet connection.");
            }
        });
    }
});
