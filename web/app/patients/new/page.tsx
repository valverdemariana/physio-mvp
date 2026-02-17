"use client";

import { useEffect } from "react";
import { Nav } from "../../../components/Nav";
import { requireToken } from "../../../lib/guard";
import { PatientForm } from "../../../components/PatientForm";

export default function NewPatientPage() {
  useEffect(() => { requireToken(); }, []);
  return (
    <div className="container">
      <Nav />
      <h1>Novo paciente</h1>
      <PatientForm />
    </div>
  );
}
