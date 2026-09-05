document.addEventListener("DOMContentLoaded", () => {

    const countrySelect =
        document.getElementById("countrySelect");

    const stateSelect =
        document.getElementById("stateSelect");

    // Populate countries
    Object.entries(country_and_states.country)
        .sort((a, b) =>
            a[1].localeCompare(b[1])
        )
        .forEach(([code, name]) => {

            const option =
                document.createElement("option");

            option.value = code;
            option.textContent = name;

            countrySelect.appendChild(option);
        });

    // Populate states
    countrySelect.addEventListener(
        "change",
        function () {

            const countryCode =
                this.value;

            stateSelect.innerHTML =
                '<option value="">Select State</option>';

            if (
                !countryCode ||
                !country_and_states.states[countryCode]
            ) {
                return;
            }

            country_and_states.states[countryCode]
                .forEach(state => {

                    const option =
                        document.createElement("option");

                    option.value = state.code;
                    option.textContent =
                        state.name;

                    stateSelect.appendChild(option);
                });
        }
    );

});

document
    .getElementById("demoForm")
    .addEventListener("submit", async function (e) {

        e.preventDefault();

        const formData = new FormData();

        formData.append(
            "fullName",
            document.getElementById("fullName").value
        );

        formData.append(
            "phone",
            document.getElementById("phone").value
        );

        formData.append(
            "email",
            document.getElementById("email").value
        );

        formData.append(
            "breed",
            document.getElementById("breed").value
        );

        formData.append(
            "quantity",
            document.getElementById("quantity").value
        );

        formData.append(
            "address",
            document.getElementById("address").value
        );

        formData.append(
            "country",
            document.getElementById("countrySelect").value
        );

        formData.append(
            "state",
            document.getElementById("stateSelect").value
        );

        formData.append(
            "selfie",
            document.getElementById("selfie").files[0]
        );

        formData.append(
            "shopImage",
            document.getElementById("shopImage").files[0]
        );

        try {

            const response = await fetch(
                "/api/demo/book-demo",
                {
                    method: "POST",
                    body: formData
                }
            );

            const result = await response.json();

            if (result.success) {

                alert("Demo request submitted successfully!");

                document
                    .getElementById("demoForm")
                    .reset();

                stateSelect.innerHTML =
                    '<option value="">Select State</option>';

            } else {

                alert(
                    result.message ||
                    "Submission failed."
                );
            }

        } catch (error) {

            console.error(error);

            alert(
                "Unable to submit form."
            );
        }
    });
