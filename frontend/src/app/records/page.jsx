"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePatient } from "@/context/PatientContext";
import { api } from "@/lib/api";
import AppShell from "@/components/layout/AppShell";
import {
  FileText, Upload, Trash2, Plus, X, Loader2,
  ChevronDown, ChevronUp, Info,
} from "lucide-react";

const RECORD_TYPES = ["diagnosis", "lab_result", "allergy", "report", "vaccination", "prescription", "surgery"];

export default function RecordsPage() {
  const { patientId, loading: authLoading } = usePatient();
  const router = useRouter();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState("diagnosis");
  const [addTitle, setAddTitle] = useState("");
  const [addSummary, setAddSummary] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !patientId) { router.replace("/auth"); return; }
    if (patientId) loadRecords();
  }, [patientId, authLoading]);

  const loadRecords = async () => {
    try {
      const res = await api.getRecords(patientId);
      setRecords(Array.isArray(res) ? res : res?.records || []);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  };

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try { await api.uploadReport(patientId, file); await loadRecords(); }
    catch (err) { console.error(err); }
    finally { setUploading(false); }
  };

  const handleManualAdd = async () => {
    if (!addTitle.trim()) return;
    setAddLoading(true);
    try {
      await api.addRecord(patientId, { record_type: addType, title: addTitle, summary: addSummary || addTitle });
      setShowAdd(false); setAddTitle(""); setAddSummary("");
      await loadRecords();
    } catch (err) { console.error(err); }
    finally { setAddLoading(false); }
  };

  const handleDelete = async (id) => {
    try { await api.deleteRecord(patientId, id); await loadRecords(); }
    catch (err) { console.error(err); }
  };

  return (
    <AppShell>
      <div className="animate-fadeUp">
        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-4">

          {/* ─── Left: Records list ─── */}
          <div>
            {/* Header */}
            <div className="bg-white rounded-2xl p-5 mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-[#1d1d1f]">Medical Records</h1>
                <p className="text-[12px] text-[#aeaeb2] mt-0.5">{records.length} records</p>
              </div>
              <button onClick={() => setShowAdd(!showAdd)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 ${showAdd ? "bg-[#ff3b30] text-white" : "bg-[#007aff] text-white"}`}>
                {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>

            {/* Manual Add */}
            {showAdd && (
              <div className="bg-white rounded-2xl p-5 mb-4 space-y-3">
                <p className="text-[13px] font-semibold text-[#1d1d1f]">Add Record</p>
                <select value={addType} onChange={e => setAddType(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-[#f5f5f7] text-[13px] text-[#1d1d1f] outline-none capitalize">
                  {RECORD_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                </select>
                <input type="text" value={addTitle} onChange={e => setAddTitle(e.target.value)}
                  placeholder="Title (e.g. Type 2 Diabetes)" className="w-full h-11 px-4 rounded-xl bg-[#f5f5f7] text-[14px] text-[#1d1d1f] placeholder:text-[#aeaeb2] outline-none" />
                <textarea value={addSummary} onChange={e => setAddSummary(e.target.value)}
                  placeholder="Details (optional)" rows={2}
                  className="w-full p-3.5 rounded-xl bg-[#f5f5f7] text-[13px] text-[#1d1d1f] placeholder:text-[#aeaeb2] outline-none resize-none" />
                <button onClick={handleManualAdd} disabled={addLoading || !addTitle.trim()}
                  className="w-full h-10 rounded-xl bg-[#1d1d1f] text-white text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
                  {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Record"}
                </button>
              </div>
            )}

            {/* Upload */}
            <div onClick={() => fileInputRef.current?.click()}
              className="bg-white rounded-2xl p-6 text-center cursor-pointer transition-all hover:shadow-sm border border-dashed border-[#d2d2d7] mb-4">
              <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => handleFile(e.target.files[0])} />
              {uploading ? (
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-[#aeaeb2]" />
              ) : (
                <>
                  <Upload className="w-5 h-5 mx-auto text-[#aeaeb2] mb-2" strokeWidth={1.6} />
                  <p className="text-[13px] font-medium text-[#6e6e73]">Upload report or lab result</p>
                  <p className="text-[11px] text-[#aeaeb2] mt-0.5">PDF, JPG, PNG — AI extracts info</p>
                </>
              )}
            </div>

            {/* List */}
            {loading ? (
              <div className="py-12 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-[#aeaeb2]" /></div>
            ) : records.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center">
                <FileText className="w-7 h-7 mx-auto text-[#d2d2d7] mb-2" />
                <p className="text-[13px] font-medium text-[#6e6e73]">No records yet</p>
                <p className="text-[11px] text-[#aeaeb2] mt-0.5">Add a record to enrich your assessments</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl overflow-hidden divide-y divide-[#f0f0f0]">
                {records.map(r => {
                  const isExp = expanded === r.id;
                  return (
                    <div key={r.id}>
                      <button onClick={() => setExpanded(isExp ? null : r.id)}
                        className="w-full px-5 py-3.5 flex items-center gap-3 text-left transition-colors hover:bg-[#fafafa]">
                        <div className="w-1.5 h-8 rounded-full bg-[#007aff]" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-[#1d1d1f] truncate">{r.title || r.record_type}</p>
                          <p className="text-[11px] text-[#aeaeb2] capitalize">{r.record_type?.replace(/_/g, " ")}</p>
                        </div>
                        <span className="text-[10px] font-semibold text-[#aeaeb2] px-2 py-0.5 rounded-full bg-[#f5f5f7]">Context</span>
                        {isExp ? <ChevronUp className="w-4 h-4 text-[#aeaeb2]" /> : <ChevronDown className="w-4 h-4 text-[#aeaeb2]" />}
                      </button>
                      {isExp && (
                        <div className="px-5 pb-4 space-y-2 border-t border-[#f0f0f0]">
                          {r.summary && <p className="text-[12px] text-[#6e6e73] pt-3 leading-relaxed">{r.summary}</p>}
                          {r.created_at && <p className="text-[10px] text-[#aeaeb2]">Added {new Date(r.created_at).toLocaleDateString()}</p>}
                          <button onClick={() => handleDelete(r.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[#ff3b30]/10 text-[#ff3b30] transition-all active:scale-[0.98]">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── Right: Context info ─── */}
          <div className="mt-4 lg:mt-0">
            <div className="bg-white rounded-2xl p-5">
              <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest mb-3">How Records Are Used</p>
              <div className="space-y-3">
                {[
                  { title: "Risk Flag Scanning", desc: "Records are scanned for keywords (diabetes, asthma, hypertension) to set risk flags in the triage engine." },
                  { title: "Context Building", desc: "Past diagnoses and conditions are assembled into longitudinal context for the AI explanation layer." },
                  { title: "ML Model Features", desc: "Known conditions from records influence feature engineering for XGBoost risk prediction models." },
                  { title: "Triage Escalation", desc: "Cardiac, respiratory, or diabetes history can escalate your triage level from LOW to MEDIUM/HIGH." },
                ].map(({ title, desc }) => (
                  <div key={title} className="p-3 rounded-xl bg-[#f5f5f7]">
                    <p className="text-[12px] font-semibold text-[#1d1d1f] mb-0.5">{title}</p>
                    <p className="text-[11px] text-[#6e6e73] leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
