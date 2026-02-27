import { useState, useMemo } from "react";

const MOCK_PREDICTIONS = [
  { id: 1, feature: "Building Footprint", location: "Parcel A-12, Main St", confidence: 0.97, status: "auto_approved", area: "2,450 sq ft", source: "LiDAR + Ortho", details: "Clear roofline, no occlusion, matches tax records", reviewTime: null },
  { id: 2, feature: "Road Centerline", location: "Oak Avenue, Segment 7", confidence: 0.94, status: "auto_approved", area: "340 linear ft", source: "Orthomosaic", details: "Well-defined pavement edges, standard width", reviewTime: null },
  { id: 3, feature: "Utility Pole", location: "Intersection B-4", confidence: 0.88, status: "auto_approved", area: "Single point", source: "LiDAR", details: "Height and cross-arm pattern match standard distribution pole", reviewTime: null },
  { id: 4, feature: "Sidewalk Edge", location: "Elm St, Block 3", confidence: 0.79, status: "pending_review", area: "180 linear ft", source: "Orthomosaic", details: "Partial tree canopy shadow overlap — edge detection uncertain in shaded segment", reviewTime: "~2 min" },
  { id: 5, feature: "Fence Line", location: "Parcel C-8, Rear", confidence: 0.72, status: "pending_review", area: "95 linear ft", source: "Orthomosaic", details: "Vegetation overgrowth obscures fence in 30% of segment", reviewTime: "~3 min" },
  { id: 6, feature: "Curb Return", location: "Main & 3rd Intersection", confidence: 0.68, status: "pending_review", area: "Arc segment", source: "LiDAR + Ortho", details: "ADA ramp geometry creates ambiguous curb boundary", reviewTime: "~2 min" },
  { id: 7, feature: "Retaining Wall", location: "Hillside Dr, Parcel D-2", confidence: 0.61, status: "flagged", area: "45 linear ft", source: "LiDAR", details: "Low point density on vertical surface — could be wall, grade change, or shadow artifact", reviewTime: "~5 min" },
  { id: 8, feature: "Driveway Apron", location: "456 Oak Avenue", confidence: 0.54, status: "flagged", area: "220 sq ft", source: "Orthomosaic", details: "Material color similar to adjacent roadway — boundary detection unreliable", reviewTime: "~4 min" },
  { id: 9, feature: "Storm Drain Inlet", location: "Elm & 5th, NE Corner", confidence: 0.41, status: "flagged", area: "Single point", source: "Orthomosaic", details: "Small feature partially occluded by parked vehicle — may be manhole or inlet", reviewTime: "~3 min" },
  { id: 10, feature: "Building Overhang", location: "Commercial Parcel E-1", confidence: 0.33, status: "rejected", area: "180 sq ft", source: "LiDAR", details: "Point cloud shows elevated surface but insufficient density to distinguish overhang from canopy", reviewTime: "~8 min" },
  { id: 11, feature: "Guardrail", location: "Highway 9, Segment 12", confidence: 0.91, status: "auto_approved", area: "200 linear ft", source: "LiDAR + Ortho", details: "Strong linear return with consistent height profile", reviewTime: null },
  { id: 12, feature: "Parking Stripe", location: "Lot F-3, Commercial", confidence: 0.46, status: "flagged", area: "450 linear ft", source: "Orthomosaic", details: "Faded paint with inconsistent line detection — 40% of stripes may be hallucinated", reviewTime: "~6 min" },
];

const THRESHOLDS = { high: 0.85, medium: 0.65 };
const F = { head: "'Bricolage Grotesque', sans-serif", body: "'Outfit', sans-serif", mono: "'JetBrains Mono', monospace" };

function getConfidenceColor(score, high = THRESHOLDS.high, med = THRESHOLDS.medium) {
  if (score >= high) return "#3A86FF";
  if (score >= med) return "#FF9B54";
  return "#e84057";
}

function getStatusConfig(status) {
  return {
    auto_approved: { label: "Auto-Approved", color: "#3A86FF", bg: "#3A86FF10", icon: "✓" },
    pending_review: { label: "Needs Review", color: "#FF9B54", bg: "#FF9B5410", icon: "◐" },
    flagged: { label: "Flagged", color: "#e84057", bg: "#e8405710", icon: "⚑" },
    rejected: { label: "Low Confidence", color: "#94a3b8", bg: "#94a3b810", icon: "✕" },
  }[status] || { label: "Flagged", color: "#e84057", bg: "#e8405710", icon: "⚑" };
}

function ConfidenceRing({ score, size = 48, high, med }) {
  const r = (size-6)/2; const c = 2*Math.PI*r; const off = c*(1-score); const color = getConfidenceColor(score,high,med);
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={3.5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3.5} strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" style={{ transition:"stroke-dashoffset 0.8s ease" }} />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.26, fontWeight:700, fontFamily:F.mono, color }}>{Math.round(score*100)}</div>
    </div>
  );
}

function DistributionBar({ predictions, high, med }) {
  const total = predictions.length;
  const h = predictions.filter(p => p.confidence >= high).length;
  const m = predictions.filter(p => p.confidence >= med && p.confidence < high).length;
  const l = predictions.filter(p => p.confidence < med).length;
  return (
    <div>
      <div style={{ display:"flex", height:10, borderRadius:5, overflow:"hidden", gap:2 }}>
        <div style={{ width:`${(h/total)*100}%`, background:"#3A86FF", borderRadius:5, transition:"width 0.5s ease" }} />
        <div style={{ width:`${(m/total)*100}%`, background:"#FF9B54", borderRadius:5, transition:"width 0.5s ease" }} />
        <div style={{ width:`${(l/total)*100}%`, background:"#e84057", borderRadius:5, transition:"width 0.5s ease" }} />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, fontSize:12, fontFamily:F.mono, fontWeight:600 }}>
        <span style={{ color:"#3A86FF" }}>{h} high</span>
        <span style={{ color:"#FF9B54" }}>{m} medium</span>
        <span style={{ color:"#e84057" }}>{l} low</span>
      </div>
    </div>
  );
}

function ThresholdSlider({ label, value, onChange, color }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:13, color:"#475569", fontWeight:600, fontFamily:F.body }}>{label}</span>
        <span style={{ fontSize:13, fontFamily:F.mono, color, fontWeight:700 }}>{Math.round(value*100)}%</span>
      </div>
      <input type="range" min={10} max={99} value={Math.round(value*100)} onChange={e => onChange(parseInt(e.target.value)/100)}
        style={{ width:"100%", height:5, appearance:"none", background:"#e2e8f0", borderRadius:3, outline:"none", cursor:"pointer", accentColor:color }} />
    </div>
  );
}

function PredictionRow({ prediction, isExpanded, onToggle, index, high, med }) {
  const conf = prediction.confidence; const color = getConfidenceColor(conf,high,med); const sc = getStatusConfig(prediction.status);
  return (
    <div style={{
      background:"#fff", border:`1px solid ${isExpanded ? color+"44" : "#e2e8f0"}`, borderRadius:12, marginBottom:8,
      overflow:"hidden", transition:"all 0.2s ease", animation:`fadeSlideIn 0.3s ease ${index*0.04}s both`,
      boxShadow: isExpanded ? `0 4px 16px ${color}10` : "0 1px 3px rgba(27,40,56,0.04)",
    }}>
      <div onClick={onToggle} style={{ padding:"14px 18px", display:"grid", gridTemplateColumns:"48px 1fr auto auto", alignItems:"center", gap:16, cursor:"pointer" }}
        onMouseEnter={e => e.currentTarget.style.background="#f8fafc"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
        <ConfidenceRing score={conf} size={46} high={high} med={med} />
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:"#1B2838", marginBottom:2, fontFamily:F.body }}>{prediction.feature}</div>
          <div style={{ fontSize:13, color:"#94a3b8", fontWeight:500 }}>{prediction.location}</div>
        </div>
        <span style={{ padding:"5px 11px", borderRadius:6, fontSize:12, fontWeight:700, background:sc.bg, color:sc.color, border:`1px solid ${sc.color}22`, whiteSpace:"nowrap", fontFamily:F.body }}>
          {sc.icon} {sc.label}
        </span>
        <span style={{ fontSize:16, color:"#cbd5e1", transition:"transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
      </div>

      {isExpanded && (
        <div style={{ padding:"0 18px 18px", borderTop:"1px solid #f1f5f9", paddingTop:16, animation:"fadeIn 0.2s ease" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:12, marginBottom:14 }}>
            {[
              { label:"Area", value:prediction.area },
              { label:"Data Source", value:prediction.source },
              ...(prediction.reviewTime ? [{ label:"Est. Review", value:prediction.reviewTime, color:"#FF9B54" }] : []),
            ].map((d,i) => (
              <div key={i} style={{ background:"#f8fafc", borderRadius:8, padding:"10px 14px" }}>
                <div style={{ fontSize:11, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4, fontWeight:700, fontFamily:F.body }}>{d.label}</div>
                <div style={{ fontSize:14, color:d.color||"#1B2838", fontFamily:F.mono, fontWeight:600 }}>{d.value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, fontWeight:700, fontFamily:F.body }}>Model Reasoning</div>
            <div style={{ fontSize:14, color:"#475569", lineHeight:1.6, padding:"12px 16px", background:"#f8fafc", borderRadius:8, borderLeft:`4px solid ${color}`, fontWeight:500 }}>{prediction.details}</div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ flex:1, height:8, background:"#e2e8f0", borderRadius:4, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${conf*100}%`, background:`linear-gradient(90deg, ${color}88, ${color})`, borderRadius:4 }} />
            </div>
            <span style={{ fontSize:20, fontWeight:800, fontFamily:F.mono, color, minWidth:52, textAlign:"right" }}>{Math.round(conf*100)}%</span>
          </div>

          {prediction.status !== "auto_approved" && (
            <div style={{ display:"flex", gap:8, marginTop:14 }}>
              {[
                { label:"✓ Approve", color:"#3A86FF" },
                { label:"✎ Edit & Approve", color:"#FF9B54" },
                { label:"✕ Reject", color:"#e84057" },
              ].map((btn,i) => (
                <button key={i} style={{
                  flex:1, padding:"11px", borderRadius:8, border:`1px solid ${btn.color}33`, background:`${btn.color}06`,
                  color:btn.color, fontSize:14, fontWeight:700, fontFamily:F.body, cursor:"pointer",
                }}>{btn.label}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ConfidenceDashboard() {
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [highThreshold, setHighThreshold] = useState(THRESHOLDS.high);
  const [medThreshold, setMedThreshold] = useState(THRESHOLDS.medium);
  const [sortBy, setSortBy] = useState("confidence_desc");
  const [showConfig, setShowConfig] = useState(false);

  const filtered = useMemo(() => {
    let items = [...MOCK_PREDICTIONS];
    if (filter==="high") items=items.filter(p=>p.confidence>=highThreshold);
    else if (filter==="medium") items=items.filter(p=>p.confidence>=medThreshold&&p.confidence<highThreshold);
    else if (filter==="low") items=items.filter(p=>p.confidence<medThreshold);
    else if (filter==="review") items=items.filter(p=>p.status==="pending_review"||p.status==="flagged");
    if (sortBy==="confidence_desc") items.sort((a,b)=>b.confidence-a.confidence);
    else if (sortBy==="confidence_asc") items.sort((a,b)=>a.confidence-b.confidence);
    else if (sortBy==="feature") items.sort((a,b)=>a.feature.localeCompare(b.feature));
    return items;
  }, [filter, sortBy, highThreshold, medThreshold]);

  const avg = MOCK_PREDICTIONS.reduce((s,p)=>s+p.confidence,0)/MOCK_PREDICTIONS.length;
  const autoApproved = MOCK_PREDICTIONS.filter(p=>p.confidence>=highThreshold).length;
  const needsReview = MOCK_PREDICTIONS.filter(p=>p.confidence>=medThreshold&&p.confidence<highThreshold).length;
  const flagged = MOCK_PREDICTIONS.filter(p=>p.confidence<medThreshold).length;

  const filters = [
    { key:"all", label:"All", count:MOCK_PREDICTIONS.length },
    { key:"high", label:"High", count:autoApproved, color:"#3A86FF" },
    { key:"medium", label:"Medium", count:needsReview, color:"#FF9B54" },
    { key:"low", label:"Low", count:flagged, color:"#e84057" },
    { key:"review", label:"Needs Review", count:needsReview+flagged, color:"#64748b" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#F8FAFC", color:"#1B2838", fontFamily:F.body }}>
      <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet" />

      <div style={{ padding:"24px 28px", borderBottom:"1px solid #e2e8f0", background:"#fff" }}>
        <div style={{ maxWidth:960, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:"#3A86FF", boxShadow:"0 0 10px #3A86FF44" }} />
                <span style={{ fontSize:12, letterSpacing:"0.12em", textTransform:"uppercase", color:"#94a3b8", fontWeight:700 }}>AI Model Output Review</span>
              </div>
              <h1 style={{ fontFamily:F.head, fontSize:"clamp(24px, 4vw, 34px)", fontWeight:800, margin:0, color:"#1B2838" }}>Confidence Score Dashboard</h1>
            </div>
            <button onClick={() => setShowConfig(!showConfig)} style={{
              padding:"9px 16px", borderRadius:8, fontSize:13, border: showConfig ? "1px solid #3A86FF33" : "1px solid #e2e8f0",
              background: showConfig ? "#3A86FF08" : "#fff", color: showConfig ? "#3A86FF" : "#64748b",
              cursor:"pointer", fontFamily:F.body, fontWeight:700,
            }}>⚙ Thresholds</button>
          </div>

          {showConfig && (
            <div style={{ marginTop:16, padding:20, background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:12, animation:"fadeIn 0.2s ease" }}>
              <div style={{ fontSize:15, fontWeight:700, color:"#1B2838", marginBottom:4, fontFamily:F.head }}>Confidence Thresholds</div>
              <p style={{ fontSize:14, color:"#64748b", margin:"0 0 16px", lineHeight:1.5, fontWeight:500 }}>
                Adjust where the boundaries fall between auto-approve, human review, and flag. This is the core product decision — where do you set the bar for automation?
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                <ThresholdSlider label="Auto-approve above" value={highThreshold} onChange={v => setHighThreshold(Math.max(v,medThreshold+0.05))} color="#3A86FF" />
                <ThresholdSlider label="Flag below" value={medThreshold} onChange={v => setMedThreshold(Math.min(v,highThreshold-0.05))} color="#e84057" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth:960, margin:"0 auto", padding:"24px 28px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))", gap:12, marginBottom:24 }}>
          {[
            { label:"Avg Confidence", value:`${Math.round(avg*100)}%`, sub:"across all predictions", color:getConfidenceColor(avg,highThreshold,medThreshold) },
            { label:"Auto-Approved", value:autoApproved, sub:`above ${Math.round(highThreshold*100)}% threshold`, color:"#3A86FF" },
            { label:"Needs Review", value:needsReview, sub:"human-in-the-loop", color:"#FF9B54" },
            { label:"Flagged", value:flagged, sub:`below ${Math.round(medThreshold*100)}% threshold`, color:"#e84057" },
            { label:"Est. Time Saved", value:`${autoApproved*4} min`, sub:"vs. full manual review", color:"#43D9AD" },
          ].map((stat,i) => (
            <div key={i} style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:"18px 20px", boxShadow:"0 1px 3px rgba(27,40,56,0.04)" }}>
              <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.1em", color:"#94a3b8", marginBottom:8, fontWeight:700 }}>{stat.label}</div>
              <div style={{ fontSize:28, fontWeight:800, fontFamily:F.mono, color:stat.color, marginBottom:2 }}>{stat.value}</div>
              <div style={{ fontSize:12, color:"#94a3b8", fontWeight:500 }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:"18px 20px", marginBottom:24, boxShadow:"0 1px 3px rgba(27,40,56,0.04)" }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#475569", marginBottom:10 }}>Confidence Distribution</div>
          <DistributionBar predictions={MOCK_PREDICTIONS} high={highThreshold} med={medThreshold} />
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {filters.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding:"7px 13px", borderRadius:8, fontSize:13, fontWeight:700, fontFamily:F.body, cursor:"pointer",
                background: filter===f.key ? (f.color||"#1B2838")+"10" : "#fff",
                border: filter===f.key ? `1px solid ${f.color||"#1B2838"}33` : "1px solid #e2e8f0",
                color: filter===f.key ? (f.color||"#1B2838") : "#94a3b8", transition:"all 0.15s ease",
              }}>{f.label} · {f.count}</button>
            ))}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
            padding:"7px 12px", borderRadius:8, fontSize:13, background:"#fff", border:"1px solid #e2e8f0",
            color:"#475569", fontFamily:F.body, fontWeight:600, cursor:"pointer",
          }}>
            <option value="confidence_desc">Confidence: High → Low</option>
            <option value="confidence_asc">Confidence: Low → High</option>
            <option value="feature">Feature Name A-Z</option>
          </select>
        </div>

        <div>
          {filtered.map((p,i) => <PredictionRow key={p.id} prediction={p} isExpanded={expandedId===p.id} onToggle={() => setExpandedId(expandedId===p.id?null:p.id)} index={i} high={highThreshold} med={medThreshold} />)}
          {filtered.length===0 && <div style={{ textAlign:"center", padding:48, color:"#94a3b8", fontSize:15, fontWeight:500 }}>No predictions match this filter.</div>}
        </div>

        <div style={{ marginTop:32, padding:"28px 28px", background:"linear-gradient(135deg, #1B2838, #243447)", borderRadius:14 }}>
          <h3 style={{ fontSize:18, fontWeight:800, color:"#fff", margin:"0 0 10px", fontFamily:F.head }}>Why This Dashboard Exists</h3>
          <p style={{ fontSize:14, color:"#cbd5e1", lineHeight:1.7, margin:"0 0 12px", fontWeight:500 }}>
            AI products face a fundamental trust problem: users need to know <em>when to trust the model and when to verify</em>. 
            Showing a single accuracy number ("our model is 94% accurate") doesn't help users make decisions about individual predictions. 
            This dashboard demonstrates how to surface prediction-level confidence scores with actionable context — the model's reasoning, 
            estimated review time, and clear thresholds that separate automation from human review.
          </p>
          <p style={{ fontSize:14, color:"#94a3b8", lineHeight:1.7, margin:0, fontWeight:500 }}>
            The adjustable thresholds are the key product decision: set them too high and you lose the efficiency gains of automation. 
            Set them too low and you ship errors that erode user trust. The right answer depends on your domain's tolerance for mistakes 
            — and giving users visibility into this tradeoff is what separates good AI products from black boxes.
          </p>
        </div>

        <div style={{ textAlign:"center", padding:"24px 0 12px" }}>
          <p style={{ fontSize:12, color:"#cbd5e1", fontWeight:500 }}>Built by a Product Leader · Prototype for AI transparency UX</p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing:border-box; }
        input[type="range"]::-webkit-slider-thumb { appearance:none; width:16px; height:16px; border-radius:50%; background:currentColor; cursor:pointer; }
        select:focus, button:focus { outline:2px solid #3A86FF33; outline-offset:2px; }
      `}</style>
    </div>
  );
}