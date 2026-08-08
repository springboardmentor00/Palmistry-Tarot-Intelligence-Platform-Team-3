import React, { useState } from 'react';
import { PalmFeatures, TarotReadingSession, SynthesisReport, UserProfile } from '../types';
import { INITIAL_REPORTS } from '../data/mockDatabase';
import { jsPDF } from 'jspdf';
import { 
  Sparkles, 
  Compass, 
  Award, 
  TrendingUp, 
  Download, 
  CheckCircle2, 
  Heart, 
  Briefcase, 
  ShieldCheck,
  Calendar,
  Layers,
  Hand
} from 'lucide-react';

interface UnifiedReadingViewProps {
  currentPalm: PalmFeatures | null;
  currentTarot: TarotReadingSession | null;
  currentUser: UserProfile;
}

export const UnifiedReadingView: React.FC<UnifiedReadingViewProps> = ({
  currentPalm,
  currentTarot,
  currentUser
}) => {
  const [report, setReport] = useState<SynthesisReport>(INITIAL_REPORTS[0]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Trigger Backend Synthesis
  const handleSynthesize = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          palmData: currentPalm || report.palmAnalysis,
          tarotData: currentTarot || report.tarotSession,
          userProfile: currentUser
        })
      });

      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
      }
    } catch (err) {
      console.error('Synthesis failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate & Download PDF Report via jsPDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Palmistry & Tarot Intelligence Report', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Client: ${report.userName} | Date: ${report.createdAt}`, 14, 28);
    doc.text(`Overall Insight Score: ${report.weightedScore.overallScore}%`, 14, 34);

    doc.setLineWidth(0.5);
    doc.line(14, 38, 196, 38);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('1. Weighted Scoring Model Breakdown:', 14, 46);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`- Palm Confidence (30%): ${report.weightedScore.palmConfidence}%`, 20, 52);
    doc.text(`- Tarot Relevance (25%): ${report.weightedScore.tarotRelevance}%`, 20, 58);
    doc.text(`- Personality Alignment (20%): ${report.weightedScore.personalityAlignment}%`, 20, 64);
    doc.text(`- User Context Relevance (15%): ${report.weightedScore.userContextRelevance}%`, 20, 70);
    doc.text(`- Reading Consistency (10%): ${report.weightedScore.readingConsistency}%`, 20, 76);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('2. Personality Intelligence:', 14, 86);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Archetype: ${report.personality.archetype}`, 20, 92);
    doc.text(`Strengths: ${report.personality.strengths.join(', ')}`, 20, 98);
    doc.text(`Weaknesses: ${report.personality.weaknesses.join(', ')}`, 20, 104);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('3. Synthesized Guidance:', 14, 114);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const summaryLines = doc.splitTextToSize(report.synthesizedGuidance.executiveSummary, 175);
    doc.text(summaryLines, 20, 120);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('4. Life Trend Forecast (Timeline):', 14, 150);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    let y = 156;
    report.lifeTrends.timeline.forEach((tl) => {
      doc.text(`- ${tl.horizon} (${tl.focusCategory}): ${tl.prediction}`, 20, y);
      y += 6;
    });

    doc.save(`Palmistry_Tarot_Report_${report.userName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-[#0A0A0F] rounded-2xl p-6 border border-white/10 shadow-2xl text-[#E0E0E6] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-violet-400 font-mono text-[10px] tracking-[0.25em] uppercase mb-1">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Multi-Modal Synthesis • 5-Tier Scoring</span>
          </div>
          <h2 className="text-2xl font-light text-white italic serif">
            Unified <span className="font-bold not-italic">Spiritual Report</span>
          </h2>
          <p className="text-xs text-white/50 max-w-2xl mt-1">
            Combining Palmistry Computer Vision with Tarot Spreads, Personality Intelligence, and 5-Year Life Trend Forecasting.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleSynthesize}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold uppercase tracking-[0.15em] sleek-glow-violet transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{isGenerating ? 'Synthesizing...' : 'Synthesize Reading'}</span>
          </button>

          <button
            onClick={exportPDF}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 text-xs font-semibold uppercase tracking-wider transition-all shadow-md flex items-center space-x-2"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Personality & Life Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Personality Intelligence Module */}
        <div className="lg:col-span-6 bg-[#0A0A0F] border border-white/10 rounded-2xl p-6 text-[#E0E0E6] shadow-xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
            <Award className="w-4 h-4 text-violet-400" />
            <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-white">Personality Intelligence</h3>
          </div>

          <div className="p-3.5 bg-violet-950/30 border border-violet-500/30 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[9px] font-mono uppercase text-violet-400 font-bold">Archetype Classification</div>
              <div className="text-base font-extrabold text-white">{report.personality.archetype}</div>
            </div>
            <div className="text-[10px] font-mono bg-violet-600/30 text-violet-300 px-3 py-1 rounded-full border border-violet-500/40">
              HIGH_CATALYST_RATIO
            </div>
          </div>

          {/* Elemental Balance */}
          <div>
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] mb-2">Elemental Balance Matrix</div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-black rounded-xl border border-white/10">
                <div className="text-amber-400 font-bold font-mono">{report.personality.elementalBalance.fire}%</div>
                <div className="text-[9px] text-white/40 uppercase font-mono">Fire</div>
              </div>
              <div className="p-2.5 bg-black rounded-xl border border-white/10">
                <div className="text-sky-400 font-bold font-mono">{report.personality.elementalBalance.water}%</div>
                <div className="text-[9px] text-white/40 uppercase font-mono">Water</div>
              </div>
              <div className="p-2.5 bg-black rounded-xl border border-white/10">
                <div className="text-indigo-400 font-bold font-mono">{report.personality.elementalBalance.air}%</div>
                <div className="text-[9px] text-white/40 uppercase font-mono">Air</div>
              </div>
              <div className="p-2.5 bg-black rounded-xl border border-white/10">
                <div className="text-emerald-400 font-bold font-mono">{report.personality.elementalBalance.earth}%</div>
                <div className="text-[9px] text-white/40 uppercase font-mono">Earth</div>
              </div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#050507] rounded-xl border border-white/10">
              <div className="font-bold text-emerald-400 mb-1 text-[11px] uppercase tracking-wider">Key Strengths</div>
              <ul className="list-disc list-inside space-y-1 text-white/70">
                {report.personality.strengths.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="p-3 bg-[#050507] rounded-xl border border-white/10">
              <div className="font-bold text-rose-400 mb-1 text-[11px] uppercase tracking-wider">Growth Areas</div>
              <ul className="list-disc list-inside space-y-1 text-white/70">
                {report.personality.weaknesses.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Life Trend Analysis Engine */}
        <div className="lg:col-span-6 bg-[#0A0A0F] border border-white/10 rounded-2xl p-6 text-[#E0E0E6] shadow-xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-white">Life Trend Timeline</h3>
          </div>

          <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">
            <div className="text-[9px] font-mono uppercase text-emerald-400 font-bold">Current Lifecycle Phase</div>
            <div className="text-base font-extrabold text-white">{report.lifeTrends.currentPhase}</div>
          </div>

          {/* Timeline Cards */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] mb-1">Strategic Horizon Forecast</div>
            {report.lifeTrends.timeline.map((item, idx) => (
              <div key={idx} className="p-3 bg-black rounded-xl border border-white/10 flex items-start space-x-3 text-xs">
                <div className="px-2 py-1 bg-violet-950 text-violet-300 rounded border border-violet-800 font-mono text-[10px] font-bold shrink-0">
                  {item.horizon}
                </div>
                <div>
                  <div className="font-bold text-white">{item.focusCategory} Focus</div>
                  <div className="text-white/70 mt-0.5">{item.prediction}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Synthesized Guidance Categories */}
      <div className="bg-[#0A0A0F] border border-white/10 rounded-2xl p-6 text-[#E0E0E6] shadow-xl space-y-4">
        <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-violet-400 border-b border-white/10 pb-3 flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Synthesized Action Plan & Guidance</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1">
            <div className="font-bold text-purple-400 flex items-center space-x-1.5 uppercase tracking-wider">
              <Briefcase className="w-4 h-4" />
              <span>Career & Finance</span>
            </div>
            <p className="text-white/70 leading-relaxed">{report.synthesizedGuidance.careerAndFinance}</p>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1">
            <div className="font-bold text-pink-400 flex items-center space-x-1.5 uppercase tracking-wider">
              <Heart className="w-4 h-4" />
              <span>Relationships</span>
            </div>
            <p className="text-white/70 leading-relaxed">{report.synthesizedGuidance.relationshipInsights}</p>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1">
            <div className="font-bold text-emerald-400 flex items-center space-x-1.5 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Spiritual Action Steps</span>
            </div>
            <ul className="list-disc list-inside text-white/70 space-y-1">
              {report.synthesizedGuidance.spiritualActionPlan.map((ap, i) => (
                <li key={i}>{ap}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
};
