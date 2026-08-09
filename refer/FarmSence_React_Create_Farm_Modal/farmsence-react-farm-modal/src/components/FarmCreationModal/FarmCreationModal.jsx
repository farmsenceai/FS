import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  LocateFixed,
  UploadCloud,
  Building2,
  Map,
  Gauge,
  Cpu,
  UserRound,
  ShieldCheck,
  LoaderCircle,
} from 'lucide-react';
import {
  AREA_UNITS,
  FARMER_PROFILES,
  FARM_CATEGORIES,
  FARM_STATUSES,
  INDIA_STATES,
  OWNERSHIP_TYPES,
  PRIMARY_ACTIVITIES,
  SUBCATEGORY_OPTIONS,
  YES_NO_UNKNOWN,
} from './farmOptions';
import './FarmCreationModal.css';

const INITIAL_FORM = {
  organisationId: '',
  farmName: '',
  farmCode: '',
  farmerProfile: '',
  farmCategory: '',
  primaryActivity: '',
  subCategory: '',
  ownershipType: '',
  registrationNumber: '',
  status: 'planned',
  operationalSince: '',
  logoFile: null,

  countryCode: 'IN',
  state: '',
  district: '',
  villageCity: '',
  address: '',
  postalCode: '',
  timezone: 'Asia/Kolkata',
  latitude: '',
  longitude: '',

  capacityType: '',
  capacityValue: '',
  capacityUnit: 'birds',
  totalArea: '',
  areaUnit: 'sqm',
  shedCount: '',
  productionSystem: '',
  waterSource: '',
  electricitySource: '',

  managerName: '',
  phoneCountryCode: '+91',
  phoneNumber: '',
  email: '',
  whatsappNumber: '',
  emergencyContactName: '',
  emergencyContactNumber: '',

  internetAvailable: '',
  electricityAvailable: '',
  camerasInstalled: '',
  sensorsInstalled: '',
  iotGatewayInstalled: '',
  droneAvailable: '',
  aiMonitoringEnabled: true,
  weatherIntelligenceEnabled: true,
  offlineSyncEnabled: false,

  biosecurityLevel: '',
  visitorsAllowed: '',
  footbathInstalled: '',
  vehicleDisinfection: '',
  notes: '',
};

const REQUIRED_BY_STEP = {
  1: [
    'organisationId',
    'farmName',
    'farmerProfile',
    'farmCategory',
    'primaryActivity',
    'ownershipType',
    'status',
  ],
  2: ['countryCode', 'state', 'district', 'villageCity', 'address', 'postalCode'],
  3: ['capacityType', 'capacityValue', 'capacityUnit', 'totalArea', 'areaUnit'],
  4: ['managerName', 'phoneNumber'],
};

function normaliseCodePart(value, fallback) {
  const clean = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 4);

  return clean || fallback;
}

function getCapacityConfiguration(primaryActivity) {
  const map = {
    poultry: {
      typeLabel: 'Bird Capacity',
      typeValue: 'bird_capacity',
      unitOptions: ['birds'],
    },
    hatchery: {
      typeLabel: 'Egg-setting Capacity',
      typeValue: 'egg_capacity',
      unitOptions: ['eggs / cycle', 'eggs / month'],
    },
    dairy: {
      typeLabel: 'Cattle Capacity',
      typeValue: 'cattle_capacity',
      unitOptions: ['animals'],
    },
    goat_sheep: {
      typeLabel: 'Livestock Capacity',
      typeValue: 'livestock_capacity',
      unitOptions: ['animals'],
    },
    pig: {
      typeLabel: 'Pig Capacity',
      typeValue: 'pig_capacity',
      unitOptions: ['animals'],
    },
    fish: {
      typeLabel: 'Production Capacity',
      typeValue: 'fish_capacity',
      unitOptions: ['kg / cycle', 'tonnes / year', 'fish'],
    },
    crop: {
      typeLabel: 'Cultivable Capacity',
      typeValue: 'cultivable_area',
      unitOptions: ['acre', 'hectare', 'bigha'],
    },
    horticulture: {
      typeLabel: 'Cultivable Capacity',
      typeValue: 'cultivable_area',
      unitOptions: ['acre', 'hectare', 'bigha'],
    },
    mixed: {
      typeLabel: 'Primary Operating Capacity',
      typeValue: 'mixed_capacity',
      unitOptions: ['units', 'animals', 'birds', 'acre'],
    },
  };

  return (
    map[primaryActivity] || {
      typeLabel: 'Operational Capacity',
      typeValue: '',
      unitOptions: ['units'],
    }
  );
}

function FieldError({ message }) {
  return message ? <small className="fsm-error">{message}</small> : null;
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  required,
  error,
  placeholder = 'Select',
  disabled,
  hint,
}) {
  return (
    <label className="fsm-field">
      <span className="fsm-label">
        {label} {required && <b>*</b>}
      </span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={Boolean(error)}
      >
        <option value="">{placeholder}</option>
        {options.map((item) => {
          const option =
            typeof item === 'string'
              ? { value: item, label: item }
              : item;

          return (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          );
        })}
      </select>
      {hint && <small className="fsm-hint">{hint}</small>}
      <FieldError message={error} />
    </label>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  required,
  error,
  type = 'text',
  placeholder,
  readOnly,
  min,
  step,
  maxLength,
  inputMode,
  hint,
}) {
  return (
    <label className="fsm-field">
      <span className="fsm-label">
        {label} {required && <b>*</b>}
      </span>
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        readOnly={readOnly}
        min={min}
        step={step}
        maxLength={maxLength}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
      />
      {hint && <small className="fsm-hint">{hint}</small>}
      <FieldError message={error} />
    </label>
  );
}

export default function FarmCreationModal({
  isOpen,
  onClose,
  onSubmit,
  organisations = [],
  defaultCountryCode = 'IN',
  defaultTimezone = 'Asia/Kolkata',
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    ...INITIAL_FORM,
    countryCode: defaultCountryCode,
    timezone: defaultTimezone,
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const modalRef = useRef(null);

  const capacityConfig = useMemo(
    () => getCapacityConfiguration(form.primaryActivity),
    [form.primaryActivity]
  );

  const subcategories = SUBCATEGORY_OPTIONS[form.primaryActivity] || [];

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmitting) onClose?.();
    };

    document.addEventListener('keydown', handleKeyDown);
    setTimeout(() => modalRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  useEffect(() => {
    const activity = normaliseCodePart(form.primaryActivity, 'FARM');
    const state = normaliseCodePart(form.state, 'XX').slice(0, 2);
    const name = normaliseCodePart(form.farmName, 'NEW').slice(0, 3);
    const suffix = String(new Date().getFullYear()).slice(-2);

    setForm((current) => ({
      ...current,
      farmCode: `FS-${activity}-${state}-${name}-${suffix}`,
    }));
  }, [form.primaryActivity, form.state, form.farmName]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      capacityType: capacityConfig.typeValue,
      capacityUnit: capacityConfig.unitOptions[0],
    }));
  }, [capacityConfig]);

  if (!isOpen) return null;

  function updateField(event) {
    const { name, value, type, checked, files } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'file'
            ? files?.[0] || null
            : value,
      ...(name === 'primaryActivity' ? { subCategory: '' } : {}),
    }));

    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: '' }));
    }
  }

  function validateStep(targetStep) {
    const nextErrors = {};
    const fields = REQUIRED_BY_STEP[targetStep] || [];

    fields.forEach((name) => {
      if (String(form[name] ?? '').trim() === '') {
        nextErrors[name] = 'This field is required.';
      }
    });

    if (targetStep === 2 && form.countryCode === 'IN') {
      if (!/^[1-9][0-9]{5}$/.test(form.postalCode)) {
        nextErrors.postalCode = 'Enter a valid 6-digit Indian PIN code.';
      }
    }

    if (targetStep === 3) {
      if (Number(form.capacityValue) <= 0) {
        nextErrors.capacityValue = 'Capacity must be greater than zero.';
      }
      if (Number(form.totalArea) <= 0) {
        nextErrors.totalArea = 'Area must be greater than zero.';
      }
    }

    if (targetStep === 4) {
      if (!/^[0-9]{7,15}$/.test(form.phoneNumber.replace(/\s+/g, ''))) {
        nextErrors.phoneNumber = 'Enter a valid phone number.';
      }
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        nextErrors.email = 'Enter a valid email address.';
      }
    }

    setErrors((current) => ({ ...current, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((current) => Math.min(current + 1, 4));
    modalRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 1));
    modalRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function jumpToStep(target) {
    if (target < step) {
      setStep(target);
      return;
    }

    if (target === step + 1 && validateStep(step)) {
      setStep(target);
    }
  }

  function handleBackdropMouseDown(event) {
    if (event.target === event.currentTarget && !isSubmitting) {
      onClose?.();
    }
  }

  function getCurrentLocation() {
    setLocationStatus('');

    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by this browser.');
      return;
    }

    setLocationStatus('Requesting browser location permission...');

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((current) => ({
          ...current,
          latitude: coords.latitude.toFixed(7),
          longitude: coords.longitude.toFixed(7),
        }));
        setLocationStatus('Coordinates captured successfully.');
      },
      (error) => {
        setLocationStatus(
          error.code === 1
            ? 'Location permission was denied.'
            : 'Unable to detect the current location.'
        );
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  function buildPayload() {
    return {
      organisationId: form.organisationId,
      identity: {
        name: form.farmName.trim(),
        code: form.farmCode,
        farmerProfile: form.farmerProfile,
        category: form.farmCategory,
        primaryActivity: form.primaryActivity,
        subCategory: form.subCategory || null,
        ownershipType: form.ownershipType,
        registrationNumber: form.registrationNumber.trim() || null,
        status: form.status,
        operationalSince: form.operationalSince || null,
      },
      location: {
        countryCode: form.countryCode,
        state: form.state,
        district: form.district.trim(),
        villageCity: form.villageCity.trim(),
        address: form.address.trim(),
        postalCode: form.postalCode.trim(),
        timezone: form.timezone,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      },
      operations: {
        capacityType: form.capacityType,
        capacityValue: Number(form.capacityValue),
        capacityUnit: form.capacityUnit,
        totalArea: Number(form.totalArea),
        areaUnit: form.areaUnit,
        shedCount: form.shedCount ? Number(form.shedCount) : null,
        productionSystem: form.productionSystem || null,
        waterSource: form.waterSource || null,
        electricitySource: form.electricitySource || null,
      },
      manager: {
        name: form.managerName.trim(),
        phoneCountryCode: form.phoneCountryCode,
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim() || null,
        whatsappNumber: form.whatsappNumber.trim() || null,
        emergencyContactName: form.emergencyContactName.trim() || null,
        emergencyContactNumber: form.emergencyContactNumber.trim() || null,
      },
      aiReadiness: {
        internetAvailable: form.internetAvailable || null,
        electricityAvailable: form.electricityAvailable || null,
        camerasInstalled: form.camerasInstalled || null,
        sensorsInstalled: form.sensorsInstalled || null,
        iotGatewayInstalled: form.iotGatewayInstalled || null,
        droneAvailable: form.droneAvailable || null,
        aiMonitoringEnabled: form.aiMonitoringEnabled,
        weatherIntelligenceEnabled: form.weatherIntelligenceEnabled,
        offlineSyncEnabled: form.offlineSyncEnabled,
      },
      biosecurity: {
        level: form.biosecurityLevel || null,
        visitorsAllowed: form.visitorsAllowed || null,
        footbathInstalled: form.footbathInstalled || null,
        vehicleDisinfection: form.vehicleDisinfection || null,
      },
      notes: form.notes.trim() || null,
      logoFile: form.logoFile || null,
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');

    if (!validateStep(4)) return;

    setIsSubmitting(true);

    try {
      const payload = buildPayload();
      await onSubmit?.(payload);
      onClose?.();
    } catch (error) {
      setSubmitError(
        error?.message || 'Unable to create the farm. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const steps = [
    { number: 1, label: 'Basic Info', icon: Building2 },
    { number: 2, label: 'Location', icon: Map },
    { number: 3, label: 'Capacity', icon: Gauge },
    { number: 4, label: 'AI Setup', icon: Cpu },
  ];

  return (
    <div
      className="fsm-backdrop"
      onMouseDown={handleBackdropMouseDown}
      role="presentation"
    >
      <section
        className="fsm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fsm-title"
      >
        <header className="fsm-header">
          <div className="fsm-header-icon">
            <ShieldCheck size={23} />
          </div>
          <div className="fsm-header-copy">
            <h2 id="fsm-title">Create New Farm</h2>
            <p>
              Create a canonical farm and open its operational workspace
              immediately.
            </p>
          </div>
          <button
            type="button"
            className="fsm-icon-button"
            onClick={onClose}
            aria-label="Close"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </header>

        <div className="fsm-stepper" aria-label="Farm creation progress">
          {steps.map(({ number, label, icon: Icon }, index) => (
            <React.Fragment key={number}>
              <button
                type="button"
                className={[
                  'fsm-step',
                  step === number ? 'is-active' : '',
                  step > number ? 'is-complete' : '',
                ].join(' ')}
                onClick={() => jumpToStep(number)}
              >
                <span className="fsm-step-circle">
                  {step > number ? '✓' : <Icon size={15} />}
                </span>
                <span>{label}</span>
              </button>
              {index < steps.length - 1 && <span className="fsm-step-line" />}
            </React.Fragment>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="fsm-body" ref={modalRef} tabIndex={-1}>
            {step === 1 && (
              <section className="fsm-section">
                <div className="fsm-section-title">
                  <Building2 size={19} />
                  <div>
                    <h3>Basic Information</h3>
                    <p>Ownership, farming profile and operating category.</p>
                  </div>
                </div>

                <div className="fsm-grid fsm-grid-3">
                  <SelectField
                    label="Owning Organisation"
                    name="organisationId"
                    value={form.organisationId}
                    onChange={updateField}
                    required
                    error={errors.organisationId}
                    placeholder="Select organisation"
                    options={organisations.map((item) => ({
                      value: item.id,
                      label: item.name,
                    }))}
                  />

                  <InputField
                    label="Farm Name"
                    name="farmName"
                    value={form.farmName}
                    onChange={updateField}
                    required
                    error={errors.farmName}
                    placeholder="e.g. Green Valley Poultry Farm"
                  />

                  <InputField
                    label="Farm Code"
                    name="farmCode"
                    value={form.farmCode}
                    onChange={updateField}
                    readOnly
                    hint="Generated automatically."
                  />

                  <SelectField
                    label="User / Farmer Profile"
                    name="farmerProfile"
                    value={form.farmerProfile}
                    onChange={updateField}
                    required
                    error={errors.farmerProfile}
                    options={FARMER_PROFILES}
                  />

                  <SelectField
                    label="Farm Category"
                    name="farmCategory"
                    value={form.farmCategory}
                    onChange={updateField}
                    required
                    error={errors.farmCategory}
                    options={FARM_CATEGORIES}
                  />

                  <SelectField
                    label="Primary Farming Activity"
                    name="primaryActivity"
                    value={form.primaryActivity}
                    onChange={updateField}
                    required
                    error={errors.primaryActivity}
                    options={PRIMARY_ACTIVITIES}
                  />

                  {subcategories.length > 0 && (
                    <SelectField
                      label="Activity Subcategory"
                      name="subCategory"
                      value={form.subCategory}
                      onChange={updateField}
                      options={subcategories}
                      hint="Changes according to the selected activity."
                    />
                  )}

                  <SelectField
                    label="Ownership Type"
                    name="ownershipType"
                    value={form.ownershipType}
                    onChange={updateField}
                    required
                    error={errors.ownershipType}
                    options={OWNERSHIP_TYPES}
                  />

                  <InputField
                    label="Registration Number"
                    name="registrationNumber"
                    value={form.registrationNumber}
                    onChange={updateField}
                    placeholder="GST / Udyam / FSSAI / Other"
                  />

                  <SelectField
                    label="Farm Status"
                    name="status"
                    value={form.status}
                    onChange={updateField}
                    required
                    error={errors.status}
                    options={FARM_STATUSES}
                  />

                  <InputField
                    label="Operational Since"
                    name="operationalSince"
                    value={form.operationalSince}
                    onChange={updateField}
                    type="date"
                  />

                  <label className="fsm-field">
                    <span className="fsm-label">Farm Logo</span>
                    <span className="fsm-upload">
                      <UploadCloud size={20} />
                      <span>
                        {form.logoFile
                          ? form.logoFile.name
                          : 'Upload JPG, PNG or SVG'}
                      </span>
                      <input
                        type="file"
                        name="logoFile"
                        accept=".jpg,.jpeg,.png,.svg"
                        onChange={updateField}
                      />
                    </span>
                  </label>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="fsm-section">
                <div className="fsm-section-title">
                  <MapPin size={19} />
                  <div>
                    <h3>Location Details</h3>
                    <p>
                      Used for maps, weather intelligence, geofencing and risk
                      alerts.
                    </p>
                  </div>
                </div>

                <div className="fsm-grid fsm-grid-4">
                  <SelectField
                    label="Country"
                    name="countryCode"
                    value={form.countryCode}
                    onChange={updateField}
                    required
                    options={[
                      { value: 'IN', label: 'India (IN)' },
                      { value: 'US', label: 'United States (US)' },
                      { value: 'AE', label: 'United Arab Emirates (AE)' },
                      { value: 'AF', label: 'Afghanistan (AF)' },
                      { value: 'NP', label: 'Nepal (NP)' },
                      { value: 'BD', label: 'Bangladesh (BD)' },
                    ]}
                  />

                  {form.countryCode === 'IN' ? (
                    <SelectField
                      label="State"
                      name="state"
                      value={form.state}
                      onChange={updateField}
                      required
                      error={errors.state}
                      options={INDIA_STATES}
                    />
                  ) : (
                    <InputField
                      label="State / Province"
                      name="state"
                      value={form.state}
                      onChange={updateField}
                      required
                      error={errors.state}
                    />
                  )}

                  <InputField
                    label="District"
                    name="district"
                    value={form.district}
                    onChange={updateField}
                    required
                    error={errors.district}
                    placeholder="Enter district"
                  />

                  <InputField
                    label="Village / City"
                    name="villageCity"
                    value={form.villageCity}
                    onChange={updateField}
                    required
                    error={errors.villageCity}
                    placeholder="Enter village or city"
                  />

                  <label className="fsm-field fsm-span-2">
                    <span className="fsm-label">
                      Complete Address <b>*</b>
                    </span>
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={updateField}
                      rows={3}
                      placeholder="Road, landmark, village/city, district and state"
                      aria-invalid={Boolean(errors.address)}
                    />
                    <FieldError message={errors.address} />
                  </label>

                  <InputField
                    label="PIN / Postal Code"
                    name="postalCode"
                    value={form.postalCode}
                    onChange={updateField}
                    required
                    error={errors.postalCode}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Enter postal code"
                  />

                  <InputField
                    label="Timezone"
                    name="timezone"
                    value={form.timezone}
                    onChange={updateField}
                    readOnly
                  />

                  <InputField
                    label="Latitude"
                    name="latitude"
                    value={form.latitude}
                    onChange={updateField}
                    type="number"
                    step="any"
                    placeholder="Auto-filled"
                  />

                  <InputField
                    label="Longitude"
                    name="longitude"
                    value={form.longitude}
                    onChange={updateField}
                    type="number"
                    step="any"
                    placeholder="Auto-filled"
                  />

                  <div className="fsm-location-actions fsm-span-2">
                    <button
                      className="fsm-button fsm-button-secondary"
                      type="button"
                      onClick={getCurrentLocation}
                    >
                      <LocateFixed size={17} />
                      Use Current Location
                    </button>
                    <button
                      className="fsm-button fsm-button-ghost"
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          latitude: '',
                          longitude: '',
                        }))
                      }
                    >
                      Clear
                    </button>
                    {locationStatus && (
                      <span className="fsm-location-status">
                        {locationStatus}
                      </span>
                    )}
                  </div>

                  <div className="fsm-map-placeholder fsm-span-4">
                    <div className="fsm-map-pattern" />
                    <MapPin className="fsm-map-pin" size={34} />
                    <div className="fsm-map-caption">
                      <strong>Interactive map placeholder</strong>
                      <span>
                        Connect Google Maps, Mapbox or OpenStreetMap here.
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {step === 3 && (
              <section className="fsm-section">
                <div className="fsm-section-title">
                  <Gauge size={19} />
                  <div>
                    <h3>Capacity & Scale</h3>
                    <p>
                      Dynamic operational fields based on the selected farming
                      activity.
                    </p>
                  </div>
                </div>

                <div className="fsm-grid fsm-grid-4">
                  <InputField
                    label="Capacity Type"
                    name="capacityType"
                    value={capacityConfig.typeLabel}
                    onChange={() => {}}
                    readOnly
                  />

                  <InputField
                    label="Capacity Value"
                    name="capacityValue"
                    value={form.capacityValue}
                    onChange={updateField}
                    type="number"
                    min="0"
                    step="1"
                    required
                    error={errors.capacityValue}
                    placeholder="Enter capacity"
                  />

                  <SelectField
                    label="Capacity Unit"
                    name="capacityUnit"
                    value={form.capacityUnit}
                    onChange={updateField}
                    required
                    error={errors.capacityUnit}
                    options={capacityConfig.unitOptions}
                  />

                  <div className="fsm-split-field">
                    <InputField
                      label="Total Area"
                      name="totalArea"
                      value={form.totalArea}
                      onChange={updateField}
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      error={errors.totalArea}
                      placeholder="Area"
                    />
                    <SelectField
                      label="Area Unit"
                      name="areaUnit"
                      value={form.areaUnit}
                      onChange={updateField}
                      required
                      error={errors.areaUnit}
                      options={AREA_UNITS}
                    />
                  </div>

                  <InputField
                    label="Number of Sheds / Units"
                    name="shedCount"
                    value={form.shedCount}
                    onChange={updateField}
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Optional"
                  />

                  <SelectField
                    label="Production System"
                    name="productionSystem"
                    value={form.productionSystem}
                    onChange={updateField}
                    options={[
                      'Open Housing',
                      'Environment Controlled',
                      'Free Range',
                      'Cage System',
                      'Deep Litter',
                      'Biofloc',
                      'RAS',
                      'Greenhouse / Polyhouse',
                      'Mixed',
                    ]}
                  />

                  <SelectField
                    label="Water Source"
                    name="waterSource"
                    value={form.waterSource}
                    onChange={updateField}
                    options={[
                      'Borewell',
                      'Municipal Supply',
                      'River / Canal',
                      'Pond',
                      'Rainwater Harvesting',
                      'Tanker',
                      'Multiple Sources',
                    ]}
                  />

                  <SelectField
                    label="Electricity Source"
                    name="electricitySource"
                    value={form.electricitySource}
                    onChange={updateField}
                    options={[
                      'Grid Power',
                      'Solar',
                      'Generator',
                      'Grid + Solar',
                      'Grid + Generator',
                      'No Reliable Power',
                    ]}
                  />
                </div>

                <div className="fsm-insight-card">
                  <Gauge size={20} />
                  <div>
                    <strong>FarmSence.ai setup insight</strong>
                    <p>
                      These values can later drive shed planning, flock
                      allocation, sensor density, feed planning and operational
                      benchmarking.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {step === 4 && (
              <section className="fsm-section">
                <div className="fsm-section-title">
                  <Cpu size={19} />
                  <div>
                    <h3>Manager, AI Readiness & Biosecurity</h3>
                    <p>
                      Assign responsibility and record the farm’s digital
                      infrastructure.
                    </p>
                  </div>
                </div>

                <div className="fsm-subsection">
                  <div className="fsm-subsection-heading">
                    <UserRound size={17} />
                    <h4>Farm Manager & Contact</h4>
                  </div>

                  <div className="fsm-grid fsm-grid-3">
                    <InputField
                      label="Farm Manager Name"
                      name="managerName"
                      value={form.managerName}
                      onChange={updateField}
                      required
                      error={errors.managerName}
                      placeholder="Enter full name"
                    />

                    <div className="fsm-phone-field">
                      <span className="fsm-label">
                        Phone Number <b>*</b>
                      </span>
                      <div>
                        <select
                          name="phoneCountryCode"
                          value={form.phoneCountryCode}
                          onChange={updateField}
                        >
                          <option value="+91">+91</option>
                          <option value="+1">+1</option>
                          <option value="+971">+971</option>
                          <option value="+93">+93</option>
                          <option value="+977">+977</option>
                        </select>
                        <input
                          name="phoneNumber"
                          value={form.phoneNumber}
                          onChange={updateField}
                          inputMode="numeric"
                          placeholder="Phone number"
                          aria-invalid={Boolean(errors.phoneNumber)}
                        />
                      </div>
                      <FieldError message={errors.phoneNumber} />
                    </div>

                    <InputField
                      label="Email Address"
                      name="email"
                      value={form.email}
                      onChange={updateField}
                      type="email"
                      error={errors.email}
                      placeholder="name@example.com"
                    />

                    <InputField
                      label="WhatsApp Number"
                      name="whatsappNumber"
                      value={form.whatsappNumber}
                      onChange={updateField}
                      inputMode="numeric"
                      placeholder="Optional"
                    />

                    <InputField
                      label="Emergency Contact Name"
                      name="emergencyContactName"
                      value={form.emergencyContactName}
                      onChange={updateField}
                      placeholder="Optional"
                    />

                    <InputField
                      label="Emergency Contact Number"
                      name="emergencyContactNumber"
                      value={form.emergencyContactNumber}
                      onChange={updateField}
                      inputMode="numeric"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="fsm-subsection">
                  <div className="fsm-subsection-heading">
                    <Cpu size={17} />
                    <h4>AI & IoT Readiness</h4>
                  </div>

                  <div className="fsm-grid fsm-grid-3">
                    <SelectField
                      label="Internet Available?"
                      name="internetAvailable"
                      value={form.internetAvailable}
                      onChange={updateField}
                      options={YES_NO_UNKNOWN}
                    />
                    <SelectField
                      label="Reliable Electricity?"
                      name="electricityAvailable"
                      value={form.electricityAvailable}
                      onChange={updateField}
                      options={YES_NO_UNKNOWN}
                    />
                    <SelectField
                      label="Cameras Installed?"
                      name="camerasInstalled"
                      value={form.camerasInstalled}
                      onChange={updateField}
                      options={YES_NO_UNKNOWN}
                    />
                    <SelectField
                      label="Sensors Installed?"
                      name="sensorsInstalled"
                      value={form.sensorsInstalled}
                      onChange={updateField}
                      options={YES_NO_UNKNOWN}
                    />
                    <SelectField
                      label="IoT Gateway Installed?"
                      name="iotGatewayInstalled"
                      value={form.iotGatewayInstalled}
                      onChange={updateField}
                      options={YES_NO_UNKNOWN}
                    />
                    <SelectField
                      label="Drone Available?"
                      name="droneAvailable"
                      value={form.droneAvailable}
                      onChange={updateField}
                      options={YES_NO_UNKNOWN}
                    />
                  </div>

                  <div className="fsm-toggle-grid">
                    {[
                      [
                        'aiMonitoringEnabled',
                        'Enable AI monitoring',
                        'Prepare the farm for image, sensor and anomaly intelligence.',
                      ],
                      [
                        'weatherIntelligenceEnabled',
                        'Enable weather intelligence',
                        'Use the farm location for weather and heat-stress alerts.',
                      ],
                      [
                        'offlineSyncEnabled',
                        'Enable offline sync',
                        'Useful where farm internet connectivity is unreliable.',
                      ],
                    ].map(([name, title, description]) => (
                      <label className="fsm-toggle-card" key={name}>
                        <div>
                          <strong>{title}</strong>
                          <span>{description}</span>
                        </div>
                        <input
                          type="checkbox"
                          name={name}
                          checked={form[name]}
                          onChange={updateField}
                        />
                        <span className="fsm-switch" />
                      </label>
                    ))}
                  </div>
                </div>

                <details className="fsm-advanced">
                  <summary>Advanced Biosecurity Settings</summary>
                  <div className="fsm-grid fsm-grid-4">
                    <SelectField
                      label="Biosecurity Level"
                      name="biosecurityLevel"
                      value={form.biosecurityLevel}
                      onChange={updateField}
                      options={['Basic', 'Intermediate', 'Advanced']}
                    />
                    <SelectField
                      label="Visitors Allowed?"
                      name="visitorsAllowed"
                      value={form.visitorsAllowed}
                      onChange={updateField}
                      options={YES_NO_UNKNOWN}
                    />
                    <SelectField
                      label="Footbath Installed?"
                      name="footbathInstalled"
                      value={form.footbathInstalled}
                      onChange={updateField}
                      options={YES_NO_UNKNOWN}
                    />
                    <SelectField
                      label="Vehicle Disinfection?"
                      name="vehicleDisinfection"
                      value={form.vehicleDisinfection}
                      onChange={updateField}
                      options={YES_NO_UNKNOWN}
                    />
                  </div>
                </details>

                <label className="fsm-field fsm-notes">
                  <span className="fsm-label">Notes</span>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={updateField}
                    rows={4}
                    placeholder="Add onboarding notes, construction status, farmer experience, special requirements or deployment instructions."
                  />
                </label>

                {submitError && (
                  <div className="fsm-submit-error">{submitError}</div>
                )}
              </section>
            )}
          </div>

          <footer className="fsm-footer">
            <button
              type="button"
              className="fsm-button fsm-button-ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <div className="fsm-footer-right">
              {step > 1 && (
                <button
                  type="button"
                  className="fsm-button fsm-button-secondary"
                  onClick={goBack}
                  disabled={isSubmitting}
                >
                  <ChevronLeft size={17} />
                  Back
                </button>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  className="fsm-button fsm-button-primary"
                  onClick={goNext}
                >
                  Next
                  <ChevronRight size={17} />
                </button>
              ) : (
                <button
                  type="submit"
                  className="fsm-button fsm-button-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="fsm-spinner" size={17} />
                      Creating Farm...
                    </>
                  ) : (
                    'Create Farm'
                  )}
                </button>
              )}
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}
