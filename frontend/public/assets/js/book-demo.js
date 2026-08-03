document.addEventListener("DOMContentLoaded", () => {

    const countrySelect =
        document.getElementById("countrySelect");

    const stateSelect =
        document.getElementById("stateSelect");

    loadCountries();

    async function loadCountries() {

        try {

            const response = await fetch(
                "http://localhost:5000/api/book-demo",
                {
                    method: "POST",
                    body: formData
                }
            );

            const countries =
                await response.json();

            countries.sort((a, b) =>
                a.name.common.localeCompare(
                    b.name.common
                )
            );

            countrySelect.innerHTML =
                '<option value="">Select Country</option>';

            countries.forEach(country => {

                const option =
                    document.createElement("option");

                option.value =
                    country.name.common;

                option.textContent =
                    country.name.common;

                countrySelect.appendChild(option);
            });

        } catch (error) {

            console.error(error);

            countrySelect.innerHTML =
                '<option value="">Failed to load countries</option>';
        }
    }

    countrySelect.addEventListener(
        "change",
        async function () {

            const country =
                this.value;

            stateSelect.innerHTML =
                '<option>Loading States...</option>';

            if (!country) {

                stateSelect.innerHTML =
                    '<option value="">Select Country First</option>';

                return;
            }

            try {

                const response = await fetch(
                    "https://countriesnow.space/api/v0.1/countries/states",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            country
                        })
                    }
                );

                const result =
                    await response.json();

                stateSelect.innerHTML =
                    '<option value="">Select State</option>';

                if (
                    result.data &&
                    result.data.states
                ) {

                    result.data.states.forEach(
                        state => {

                            const option =
                                document.createElement("option");

                            option.value =
                                state.name;

                            option.textContent =
                                state.name;

                            stateSelect.appendChild(
                                option
                            );
                        }
                    );
                }

            } catch (error) {

                console.error(error);

                stateSelect.innerHTML =
                    '<option value="">Unable to load states</option>';
            }
        }
    );

});