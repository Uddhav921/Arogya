"use client";

import { createContext, useContext, useState, useEffect } from "react";

const PatientContext = createContext(null);

export function PatientProvider({ children }) {
  const [patientId, setPatientId] = useState(null);
  const [patient, setPatient] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    // Try new keys first, fall back to old keys for migration
    const stored = localStorage.getItem("aroga_patient_id") || localStorage.getItem("health_patient_id");
    const storedUser = localStorage.getItem("aroga_username") || localStorage.getItem("health_username");
    const storedName = localStorage.getItem("aroga_patient_name") || localStorage.getItem("health_patient_name");
    if (stored) {
      setPatientId(Number(stored));
      setUsername(storedUser);
      setPatient((prev) => ({ ...prev, name: storedName }));
    }
    setLoading(false);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (patientId) {
      localStorage.setItem("aroga_patient_id", String(patientId));
    }
    if (username) {
      localStorage.setItem("aroga_username", username);
    }
  }, [patientId, username]);

  const login = (id, user, data = null) => {
    setPatientId(id);
    setUsername(user);
    if (data) {
      setPatient(data);
      if (data.name) localStorage.setItem("aroga_patient_name", data.name);
    }
  };

  const logout = () => {
    setPatientId(null);
    setPatient(null);
    setUsername(null);
    localStorage.removeItem("aroga_patient_id");
    localStorage.removeItem("aroga_username");
    localStorage.removeItem("aroga_patient_name");
    // Clean old keys too
    localStorage.removeItem("health_patient_id");
    localStorage.removeItem("health_username");
    localStorage.removeItem("health_patient_name");
  };

  return (
    <PatientContext.Provider
      value={{ patientId, setPatientId, patient, setPatient, username, login, logout, loading }}
    >
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error("usePatient must be used within PatientProvider");
  return ctx;
}
