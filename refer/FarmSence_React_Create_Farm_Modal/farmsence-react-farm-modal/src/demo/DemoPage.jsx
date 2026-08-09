import React, { useState } from 'react';
import FarmCreationModal from '../components/FarmCreationModal/FarmCreationModal';

export default function DemoPage() {
  const [open, setOpen] = useState(true);

  async function handleCreateFarm(payload) {
    // Replace this demo delay with your API request.
    await new Promise((resolve) => setTimeout(resolve, 850));
    console.log('Farm payload:', payload);

    // Example:
    // const response = await fetch('/api/admin/farms', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: `Bearer ${token}`,
    //   },
    //   body: JSON.stringify(payload),
    // });
    // if (!response.ok) throw new Error('Unable to create farm');

    return {
      id: crypto.randomUUID(),
      ...payload,
    };
  }

  return (
    <main className="demo-page">
      <section className="demo-panel">
        <span className="demo-kicker">FarmSence.ai Admin</span>
        <h1>Farm Operations</h1>
        <p>
          This demo shows the React modal designed to replace the existing
          “Create New Farm” popup.
        </p>
        <button className="demo-button" onClick={() => setOpen(true)}>
          Create New Farm
        </button>
      </section>

      <FarmCreationModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSubmit={handleCreateFarm}
        organisations={[
          { id: 'org-new', name: 'New Organisation' },
          { id: 'org-chickcoop', name: 'ChickCoop Farm Private Limited' },
          { id: 'org-individual', name: 'Individual Farmer Account' },
        ]}
        defaultCountryCode="IN"
        defaultTimezone="Asia/Kolkata"
      />
    </main>
  );
}
