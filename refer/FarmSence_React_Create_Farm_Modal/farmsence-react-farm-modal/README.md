# FarmSence.ai React Farm Creation Modal

A complete, responsive React modal designed to replace the existing **Create New Farm** popup in the FarmSence.ai admin dashboard.

## Included

- Four-step React modal
- Responsive desktop, tablet and mobile layout
- Basic farm identity and ownership fields
- New/interested farmer, experienced farmer and business-user profiles
- Dynamic activity subcategories
- Dynamic operational capacity labels and units
- Farm location and browser geolocation
- Manager/contact information
- AI, camera, sensor, IoT and connectivity readiness
- Biosecurity settings
- Front-end validation
- Loading and API error states
- Structured API payload
- Standalone Vite demo

## Run the demo

```bash
npm install
npm run dev
```

## Add to your existing React project

Copy this folder:

```text
src/components/FarmCreationModal/
```

Import the component:

```jsx
import FarmCreationModal from './components/FarmCreationModal/FarmCreationModal';
```

Use it in your Farm Operations page:

```jsx
import React, { useState } from 'react';
import FarmCreationModal from './components/FarmCreationModal/FarmCreationModal';

export default function FarmOperations() {
  const [showCreateFarm, setShowCreateFarm] = useState(false);

  async function createFarm(payload) {
    const response = await fetch('/api/admin/farms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.message || 'Unable to create farm');
    }

    const createdFarm = await response.json();

    // Refresh your farm list here.
    // await loadFarms();
    // setSelectedFarmId(createdFarm.id);

    return createdFarm;
  }

  return (
    <>
      <button onClick={() => setShowCreateFarm(true)}>
        Create New Farm
      </button>

      <FarmCreationModal
        isOpen={showCreateFarm}
        onClose={() => setShowCreateFarm(false)}
        onSubmit={createFarm}
        organisations={[
          { id: 'org-1', name: 'New Organisation' },
          { id: 'org-2', name: 'ChickCoop Farm Private Limited' },
        ]}
        defaultCountryCode="IN"
        defaultTimezone="Asia/Kolkata"
      />
    </>
  );
}
```

## Important API note

The payload includes a `logoFile` object. JSON cannot upload a browser `File` directly.

You have two implementation choices:

### Option A: Create the farm first, upload the logo separately

1. Send the JSON payload without `logoFile`.
2. Create the farm.
3. Upload the logo to `/api/admin/farms/:farmId/logo` using `FormData`.

### Option B: Send the complete form as multipart/form-data

Convert the nested payload to JSON and append both it and the logo:

```js
const body = new FormData();
body.append('farm', JSON.stringify({ ...payload, logoFile: undefined }));

if (payload.logoFile) {
  body.append('logo', payload.logoFile);
}

await fetch('/api/admin/farms', {
  method: 'POST',
  body,
});
```

Do not manually set the `Content-Type` header for `FormData`; the browser adds the multipart boundary.

## Example JSON structure

```json
{
  "organisationId": "org-chickcoop",
  "identity": {
    "name": "Bhopal Poultry Project",
    "code": "FS-POUL-BH-BHO-26",
    "farmerProfile": "business",
    "category": "Commercial Farm",
    "primaryActivity": "poultry",
    "subCategory": "Broiler",
    "ownershipType": "Private Limited Company",
    "registrationNumber": null,
    "status": "planned",
    "operationalSince": null
  },
  "location": {
    "countryCode": "IN",
    "state": "Madhya Pradesh",
    "district": "Bhopal",
    "villageCity": "Bhopal",
    "address": "Complete address",
    "postalCode": "462001",
    "timezone": "Asia/Kolkata",
    "latitude": 23.2599,
    "longitude": 77.4126
  },
  "operations": {
    "capacityType": "bird_capacity",
    "capacityValue": 30000,
    "capacityUnit": "birds",
    "totalArea": 2.5,
    "areaUnit": "acre",
    "shedCount": 2,
    "productionSystem": "Environment Controlled",
    "waterSource": "Borewell",
    "electricitySource": "Grid + Generator"
  }
}
```

## Integration notes for your current popup

The modal uses a high `z-index` of `9999`, so it should display above the existing FarmSence.ai admin layout.

The component automatically:

- Locks background page scrolling while open
- Closes on Escape
- Closes when the backdrop is clicked
- Does not close while submission is in progress
- Focuses the modal body on opening
- Supports responsive display in your existing dashboard

## Map integration

The supplied code includes a visual map placeholder and browser geolocation.

For a production map, replace the `fsm-map-placeholder` block with your preferred library:

- Google Maps JavaScript API
- Mapbox GL JS
- React Leaflet with OpenStreetMap

The latitude and longitude fields are already included in the payload.
