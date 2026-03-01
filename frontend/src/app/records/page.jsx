"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { usePatient } from "@/context/PatientContext";
import { api } from "@/lib/api";
import AppShell from "@/components/layout/AppShell";
import {
  FileText, Upload, Trash2, Plus, X, Loader2,
  ChevronDown, ChevronUp, FolderOpen, Database, Fingerprint
} from "lucide-react";

const RECORD_TYPES = ["diagnosis", "lab_result", "allergy", "report", "vaccination", "prescription", "surgery"];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function RecordsPage() {
  const { patientId, loading: authLoading } = usePatient();
  const router = useRouter();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  
  // Form State
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
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full h-full max-w-[1400px] mx-auto pb-10">
        
        {/* Header Section */}
        <motion.div variants={itemVariants} className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-[28px] lg:text-[32px] font-bold text-foreground tracking-tight">Identity Context</h1>
              <p className="text-[14px] text-muted-foreground mt-1">Manage documents and baseline records that power the Arogya inference engine.</p>
            </div>
            
             <button onClick={() => setShowAdd(!showAdd)}
                className={`flex items-center gap-2 h-11 px-5 rounded-xl text-[14px] font-bold transition-all shadow-sm ${showAdd ? "bg-muted text-foreground border border-border hover:bg-muted/80" : "bg-foreground text-background hover:bg-foreground/80"}`}>
                {showAdd ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Record</>}
             </button>
        </motion.div>

        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-6">

          {/* ─── Left Column (Vault) ─── */}
          <motion.div variants={itemVariants} className="space-y-6">
            
            {/* Manual Entry Form */}
            <AnimatePresence>
              {showAdd && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, scale: 0.98 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.98 }}
                  className="bg-card border border-border rounded-2xl p-6 overflow-hidden origin-top"
                >
                  <p className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2"><Fingerprint className="w-4 h-4"/> Create Profile Entry</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                     <select value={addType} onChange={e => setAddType(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl bg-muted/50 border border-border text-[14px] text-foreground outline-none focus:border-blue-500 capitalize transition-colors">
                        {RECORD_TYPES.map(t => <option key={t} value={t} className="bg-muted">{t.replace(/_/g, " ")}</option>)}
                      </select>
                      <input type="text" value={addTitle} onChange={e => setAddTitle(e.target.value)}
                        placeholder="Condition / Entry Name" className="w-full h-12 px-4 rounded-xl bg-muted/50 border border-border text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-blue-500 transition-colors" />
                  </div>
                  
                  <textarea value={addSummary} onChange={e => setAddSummary(e.target.value)}
                    placeholder="Clinical Notes or Additional Details..." rows={3}
                    className="w-full p-4 rounded-xl bg-muted/50 border border-border text-[14px] text-foreground placeholder:text-muted-foreground outline-none resize-none mb-4 focus:border-blue-500 transition-colors" />
                  
                  <button onClick={handleManualAdd} disabled={addLoading || !addTitle.trim()}
                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[14px] font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-muted transition-colors shadow-lg shadow-blue-500/10">
                    {addLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Commit to Vault"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Smart Upload Dropzone */}
            <div onClick={() => fileInputRef.current?.click()}
              className="bg-card/50 border-2 border-dashed border-border hover:border-blue-500/50 hover:bg-muted/30 rounded-3xl p-8 text-center cursor-pointer transition-all group">
              <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleFile(e.target.files[0])} />
              
              {uploading ? (
                <div className="flex flex-col items-center justify-center h-20">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                  <p className="text-[13px] text-muted-foreground font-mono">Extracting semantic entities via OCR...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-muted border border-border group-hover:bg-blue-500/10 group-hover:border-blue-500/30 flex items-center justify-center mb-4 transition-colors">
                     <Upload className="w-6 h-6 text-muted-foreground group-hover:text-blue-400" strokeWidth={2} />
                  </div>
                  <p className="text-[16px] font-bold text-foreground group-hover:text-foreground/80 mb-1 transition-colors">Upload Document & Auto-Extract</p>
                  <p className="text-[13px] text-muted-foreground font-medium max-w-sm">Securely upload PDFs, Images or Lab Results. The AI automatically classifies and extracts risk markers.</p>
                </div>
              )}
            </div>

            {/* Records Vault List */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
               <div className="px-6 py-5 bg-card/80 border-b border-border flex items-center justify-between backdrop-blur-md">
                 <p className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Database className="w-4 h-4"/> Current Vault Vector</p>
                 <span className="text-[11px] font-mono text-muted-foreground px-2 py-0.5 bg-muted rounded">{records.length} Documents</span>
               </div>

              {loading ? (
                <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
              ) : records.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                     <FolderOpen className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-[15px] font-bold text-foreground">Vault Empty</p>
                  <p className="text-[13px] text-muted-foreground mt-1 max-w-[250px]">To build accurate ML profiles, begin by manually adding known conditions or uploading reports.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {records.map(r => {
                    const isExp = expanded === r.id;
                    return (
                      <div key={r.id} className="group transition-colors hover:bg-muted/30">
                        <button onClick={() => setExpanded(isExp ? null : r.id)}
                          className="w-full px-6 py-4 flex items-center justify-between text-left">
                          
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                               <FileText className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0 pr-4">
                              <p className="text-[15px] font-bold text-foreground truncate group-hover:text-foreground/80 transition-colors">{r.title || r.record_type}</p>
                              <p className="text-[12px] text-muted-foreground capitalize font-medium">{r.record_type?.replace(/_/g, " ")}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                             <span className="hidden sm:inline-block text-[10px] font-mono text-emerald-400/80 uppercase px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">Vectorized</span>
                             <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-muted/80 transition-colors">
                                {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                             </div>
                          </div>

                        </button>
                        
                        <AnimatePresence>
                          {isExp && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="px-6 pb-6 overflow-hidden"
                            >
                              <div className="pt-4 border-t border-border/50 flex flex-col gap-4">
                                <div>
                                   <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Extracted Metadata</p>
                                   <div className="p-4 rounded-xl bg-background border border-border">
                                     {r.summary ? <p className="text-[13px] text-muted-foreground leading-relaxed font-mono whitespace-pre-wrap">{r.summary}</p> : <p className="text-[13px] text-muted-foreground italic">No exact summary available.</p>}
                                   </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  {r.created_at && <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Uploaded: {new Date(r.created_at).toLocaleDateString()}</p>}
                                  <button onClick={() => handleDelete(r.id)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all active:scale-[0.98]">
                                    <Trash2 className="w-3.5 h-3.5" /> Purge Record
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* ─── Right Column (Docs Info) ─── */}
          <motion.div variants={itemVariants} className="mt-6 lg:mt-0">
            <div className="bg-card border border-border rounded-3xl p-6 sticky top-6">
              <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-6 border-b border-border pb-4">Engine Utilization Context</p>
              <div className="space-y-6">
                {[
                  { title: "Risk Flag Injection", desc: "Documents are verified for critical keywords (Diabetes, Asthma) and injected to base triage engine." },
                  { title: "Longitudinal Context", desc: "Past conditions dictate standard deviation in new assessments, reducing hallucinations." },
                  { title: "Feature Weighting", desc: "Records explicitly tune feature importance vectors used within XGBoost." },
                ].map(({ title, desc }, i) => (
                  <div key={title} className="relative pl-6 before:absolute before:left-[7px] before:top-2 before:bottom-[-24px] before:w-[2px] before:bg-border last:before:hidden">
                    <div className="absolute left-0 top-1.5 w-[16px] h-[16px] rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center -translate-x-[0px] z-10">
                        <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    </div>
                    <p className="text-[14px] font-bold text-foreground mb-1 leading-none pt-0.5">{title}</p>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </AppShell>
  );
}
