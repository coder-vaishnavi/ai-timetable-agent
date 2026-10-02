import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { getClasses, getDivisions } from '../api/divisions';
import { analyzeNL, generate } from '../api/agent';
import { useApp } from '../context/AppContext';

const STEP_NAMES = [
  'Input Analysis',
  'Natural Language Parsing',
  'Constraint Validation',
  'Teacher Availability Check',
  'Classroom Availability Check',
  'CP-SAT Optimization',
  'Conflict Check',
  'Timetable Generation',
];

function StepIcon({ status }) {
  if (status === 'success') return <CheckCircle size={16} color="#16a34a" />;
  if (status === 'error')   return <XCircle     size={16} color="#dc2626" />;
  if (status === 'warning') return <AlertCircle size={16} color="#d97706" />;
  return <Clock size={16} color="#94a3b8" />;
}

export default function TimetableGenerator() {
  const [classes, setClasses]     = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [classId, setClassId]     = useState('');
  const [selDivs, setSelDivs]     = useState([]);
  const [ttName, setTtName]       = useState('AI Generated Timetable');
  const [nlInput, setNlInput]     = useState('');
  const [steps, setSteps]         = useState([]);
  const [generating, setGenerating] = useState(false);
  const [nlParsed, setNlParsed]   = useState(null);
  const { setLastGenerated }      = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    getClasses().then(r => {
      setClasses(r.data);
      if (r.data.length) setClassId(String(r.data[0].id));
    });
  }, []);

  useEffect(() => {
    if (!classId) return;
    getDivisions(classId).then(r => {
      setDivisions(r.data);
      setSelDivs(r.data.map(d => d.id));
    });
  }, [classId]);

  function toggleDiv(id) {
    setSelDivs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleAnalyze() {
    if (!nlInput.trim()) return toast.error('Enter some natural language input first');
    try {
      const res = await analyzeNL({ nl_input: nlInput, class_id: +classId });
      setNlParsed(res.data);
      toast.success(`Identified ${res.data.parsed_constraints?.length || 0} constraint(s)`);
    } catch (err) { toast.error('Analysis failed'); }
  }

  async function handleGenerate() {
    if (!classId) return toast.error('Select a class');
    if (selDivs.length === 0) return toast.error('Select at least one division');
    setSteps([]);
    setGenerating(true);

    // Animate pending steps
    setSteps(STEP_NAMES.map(n => ({ step: n, status: 'pending', message: 'Waiting…' })));

    try {
      const res = await generate({
        class_id:     +classId,
        division_ids: selDivs,
        nl_input:     nlInput,
        name:         ttName,
        time_limit:   60,
      });

      const data = res.data;
      // Always show the real agent steps (success or error)
      if (data.agent_steps && data.agent_steps.length > 0) {
        setSteps(data.agent_steps);
      }

      if (data.status === 'success') {
        toast.success('Timetable generated!');
        setLastGenerated(data);
        navigate(`/timetable/${data.timetable_id}`);
      } else {
        toast.error(data.message || 'Generation failed');
      }
    } catch (err) {
      // Only reached on network errors or 500s
      const msg = err.response?.data?.error || 'Generation failed';
      toast.error(msg);
      setSteps(prev => prev.map(s =>
        s.status === 'pending' ? { ...s, status: 'error', message: 'Aborted' } : s
      ));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">AI Timetable Generator</h2>
          <p className="page-subtitle">Configure parameters and let the AI agent schedule your timetable</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left – config form */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Configuration</h3>

            <div className="form-group">
              <label className="form-label">Timetable Name</label>
              <input className="form-input" value={ttName} onChange={e => setTtName(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Class</label>
              <select className="form-input form-select" value={classId} onChange={e => setClassId(e.target.value)}>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Divisions to schedule</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                {divisions.map(d => (
                  <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                    <input type="checkbox" checked={selDivs.includes(d.id)} onChange={() => toggleDiv(d.id)} />
                    Division {d.name}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* NL input */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Natural Language Input <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 400 }}>(optional)</span></h3>
            <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 10 }}>
              e.g. "Prof. Sharma not available on Friday. ML needs 2 sessions per week."
            </p>
            <textarea className="form-input" rows={4} value={nlInput} onChange={e => setNlInput(e.target.value)}
              placeholder="Describe constraints in plain English…" style={{ resize: 'vertical' }} />
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={handleAnalyze}>
              Analyze Constraints
            </button>
            {nlParsed && (
              <div style={{ marginTop: 12, padding: 12, background: '#f8fafc', borderRadius: 6, fontSize: 12 }}>
                <strong>Identified {nlParsed.parsed_constraints?.length} constraint(s):</strong>
                {nlParsed.parsed_constraints?.map((c, i) => (
                  <div key={i} style={{ marginTop: 4, color: 'var(--color-muted)' }}>
                    • [{c.type}] {Object.entries(c.params).map(([k,v]) => `${k}=${v}`).join(', ')}
                  </div>
                ))}
                {nlParsed.warnings?.map((w, i) => (
                  <div key={i} style={{ marginTop: 4, color: '#d97706' }}>⚠ {w}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right – steps + generate button */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Agent Processing Steps</h3>
            {steps.length === 0 ? (
              <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>Steps will appear here during generation…</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {steps.map((step, i) => (
                  <div key={i} className="step-item">
                    <StepIcon status={step.status} />
                    <div>
                      <div className="step-text-name">{step.step}</div>
                      <div className="step-text-msg">{step.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className="btn btn-primary w-full"
            style={{ padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 10 }}
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Generating…</>
            ) : (
              <><Zap size={18} /> GENERATE AI TIMETABLE</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
