
document.addEventListener('DOMContentLoaded', function() {
const cities = {{ cities_json|safe }};
const language = "{{ language }}";
const locationInput = document.getElementById('location-input');
const locationSelect = document.getElementById('location-select');

locationInput.addEventListener('input', function() {
    const query = locationInput.value.toLowerCase();
    console.log("User query:", query);

    // Clear previous options
    locationSelect.innerHTML = '';

    if (query.length >= 2) {  // Adjust the length as per your requirement
        // Filter cities based on the user input
        const filteredCities = cities.filter(city => city.name_fr.toLowerCase().startsWith(query));
        console.log("Filtered cities:", filteredCities);

        // Add filtered cities to the select options
        filteredCities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.name_fr;
            option.textContent = `${city.name_fr} (${city.zip_code})`;
            locationSelect.appendChild(option);
        });

        // Show the select dropdown if there are matches
        if (filteredCities.length > 0) {
            locationSelect.style.display = 'block';
        } else {
            locationSelect.style.display = 'none';
        }
    } else {
        // Hide the select dropdown if the input is less than 2 characters
        locationSelect.style.display = 'none';
    }
});

locationSelect.addEventListener('change', function() {
    const selectedOption = locationSelect.options[locationSelect.selectedIndex];
    locationInput.value = selectedOption.value;
    locationSelect.style.display = 'none';
});

// Hide the dropdown if the user clicks outside
document.addEventListener('click', function(event) {
    if (!locationSelect.contains(event.target) && !locationInput.contains(event.target)) {
        locationSelect.style.display = 'none';
    }
});

// Keep the dropdown visible if the user focuses on the input again
locationInput.addEventListener('focus', function() {
    if (locationInput.value.length >= 2 && locationSelect.options.length > 0) {
        locationSelect.style.display = 'block';
    }
});
});
