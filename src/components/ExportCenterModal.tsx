import React, { useState } from 'react';
import {
  Download,
  X,
  FileText,
  FileSpreadsheet,
  Headphones,
  Presentation,
  CheckCircle,
  Video,
  Network,
  HelpCircle,
  Layers,
  Sparkles
} from 'lucide-react';
import { Artifact, Source } from '../types';

interface ExportCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  artifacts: Artifact[];
  sources: Source[];
}

export const ExportCenterModal: React.FC<ExportCenterModalProps> = ({
  isOpen,
  onClose,
  artifacts,
  sources
}) => {
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>(
    artifacts[0]?.id || ''
  );
  const [exportFormat, setExportFormat] = useState<string>('txt');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const currentArtifact = artifacts.find(a => a.id === selectedArtifactId) || artifacts[0];

  const getSupportedFormats = (type?: string) => {
    switch (type) {
      case 'audio_overview':
        return [
          { id: 'json', label: 'JSON Audio Transcript', ext: 'json' },
          { id: 'txt', label: 'Dialogue Script (TXT)', ext: 'txt' }
        ];
      case 'slide_deck':
        return [
          { id: 'html', label: 'Interactive Slide Deck (HTML Presentation)', ext: 'html' },
          { id: 'txt', label: 'Presentation Outline (TXT)', ext: 'txt' },
          { id: 'json', label: 'Slide Deck Data (JSON)', ext: 'json' }
        ];
      case 'video_overview':
        return [
          { id: 'txt', label: 'Video Scene Script (TXT)', ext: 'txt' },
          { id: 'json', label: 'Storyboard Data (JSON)', ext: 'json' }
        ];
      case 'mind_map':
        return [
          { id: 'json', label: 'Mind Map Graph (JSON)', ext: 'json' },
          { id: 'txt', label: 'Indented Hierarchy (TXT)', ext: 'txt' }
        ];
      case 'report':
        return [
          { id: 'html', label: 'Print-Ready Clean Report (HTML / PDF)', ext: 'html' },
          { id: 'md', label: 'Markdown Document (.md)', ext: 'md' },
          { id: 'txt', label: 'Plain Text (.txt)', ext: 'txt' },
          { id: 'json', label: 'JSON Data (.json)', ext: 'json' }
        ];
      case 'flashcards':
        return [
          { id: 'csv', label: 'CSV Flashcards (Anki/Quizlet compatible)', ext: 'csv' },
          { id: 'txt', label: 'Plain Text Study Deck (.txt)', ext: 'txt' },
          { id: 'md', label: 'Markdown Study Deck (.md)', ext: 'md' },
          { id: 'json', label: 'JSON Flashcards', ext: 'json' }
        ];
      case 'quiz':
        return [
          { id: 'txt', label: 'Printable Exam Paper with Key (.txt)', ext: 'txt' },
          { id: 'md', label: 'Markdown Exam Document (.md)', ext: 'md' },
          { id: 'json', label: 'Quiz Data (.json)', ext: 'json' }
        ];
      case 'data_table':
        return [
          { id: 'csv', label: 'Comma Separated Values (.csv)', ext: 'csv' },
          { id: 'md', label: 'Markdown Table (.md)', ext: 'md' },
          { id: 'txt', label: 'Plain Text Table (.txt)', ext: 'txt' },
          { id: 'json', label: 'JSON Table (.json)', ext: 'json' }
        ];
      case 'summary':
      case 'study_guide':
      case 'questions':
      case 'definitions':
      default:
        return [
          { id: 'md', label: 'Markdown Document (.md)', ext: 'md' },
          { id: 'txt', label: 'Study Document (.txt)', ext: 'txt' },
          { id: 'json', label: 'Structured Data (.json)', ext: 'json' }
        ];
    }
  };

  const handleDownload = () => {
    if (!currentArtifact) return;
    setIsExporting(true);

    try {
      let contentToDownload = '';
      let filename = `${currentArtifact.title.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      let mime = 'text/plain';

      if (exportFormat === 'json') {
        contentToDownload = JSON.stringify(currentArtifact.content, null, 2);
        filename += '.json';
        mime = 'application/json';
      } else if (exportFormat === 'csv') {
        if (currentArtifact.type === 'flashcards') {
          const cards = currentArtifact.content?.cards || [];
          contentToDownload = 'Front,Back,Topic,Difficulty\n' +
            cards.map((c: any) => `"${(c.front || '').replace(/"/g, '""')}","${(c.back || '').replace(/"/g, '""')}","${c.tag || ''}","${c.difficulty || ''}"`).join('\n');
        } else if (currentArtifact.type === 'data_table') {
          const cols = currentArtifact.content?.columns || [];
          const rows = currentArtifact.content?.rows || [];
          contentToDownload = cols.join(',') + '\n' +
            rows.map((r: any[]) => r.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
        } else {
          contentToDownload = JSON.stringify(currentArtifact.content);
        }
        filename += '.csv';
        mime = 'text/csv';
      } else if (exportFormat === 'html' && currentArtifact.type === 'slide_deck') {
        const slides = currentArtifact.content?.slides || [];
        // Build interactive HTML presentation
        const slidesData = JSON.stringify(slides).replace(/`/g, '\\`');
        const artTitle = currentArtifact.title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        contentToDownload = [
          '<!DOCTYPE html>',
          '<html lang="en"><head>',
          '<meta charset="utf-8">',
          '<meta name="viewport" content="width=device-width,initial-scale=1">',
          `<title>${artTitle} — GenNote AI</title>`,
          '<style>',
          '*{box-sizing:border-box;margin:0;padding:0}',
          'body{font-family:system-ui,sans-serif;background:#0f172a;color:#f1f5f9;height:100vh;display:flex;flex-direction:column;overflow:hidden}',
          '#progress{height:3px;background:#10b981;transition:width .3s}',
          '#deck{flex:1;display:flex;flex-direction:column;justify-content:space-between;padding:4vw 6vw;position:relative;overflow:hidden}',
          '#bg{position:absolute;inset:0;background:linear-gradient(135deg,#0f172a,#1e293b);pointer-events:none}',
          '#counter{position:relative;z-index:1;font:600 .8rem/1 monospace;color:#10b981;letter-spacing:.1em;text-transform:uppercase;margin-bottom:1.25rem}',
          '#slide-title{position:relative;z-index:1;font-size:clamp(1.4rem,3.5vw,2.6rem);font-weight:900;line-height:1.2;margin-bottom:.5rem}',
          '#slide-subtitle{position:relative;z-index:1;font-size:1rem;color:#94a3b8;margin-bottom:1.75rem}',
          '#bullets{position:relative;z-index:1;flex:1;display:flex;flex-direction:column;gap:.7rem;overflow:hidden}',
          '.bl{display:flex;gap:.75rem;align-items:flex-start;font-size:clamp(.85rem,1.6vw,1.05rem);line-height:1.6}',
          '.bd{width:.5rem;height:.5rem;border-radius:50%;background:#10b981;flex-shrink:0;margin-top:.55em}',
          '#footer{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;padding-top:1rem;border-top:1px solid rgba(255,255,255,.07);font-size:.72rem;color:#475569}',
          '#notes{display:none;padding:.75rem 6vw;background:#1e293b;border-top:1px solid rgba(255,255,255,.07);font-size:.85rem;color:#94a3b8;line-height:1.6}',
          '#notes.on{display:block}',
          '#notes strong{color:#6366f1;margin-right:.5rem}',
          '#ctrl{display:flex;align-items:center;gap:.5rem;padding:.6rem 6vw;background:#1e293b;border-top:1px solid rgba(255,255,255,.07)}',
          'button{cursor:pointer;border:none;border-radius:.5rem;padding:.45rem 1.1rem;font-size:.78rem;font-weight:600;transition:all .15s}',
          '#bp{background:#334155;color:#f1f5f9}#bp:hover{background:#475569}',
          '#bn{background:#10b981;color:#fff}#bn:hover{background:#059669}',
          '#bno{background:transparent;border:1px solid #334155;color:#94a3b8}#bno:hover{border-color:#6366f1;color:#a5b4fc}',
          '#bfs{background:transparent;border:1px solid #334155;color:#94a3b8;margin-left:auto}#bfs:hover{border-color:#10b981;color:#10b981}',
          'kbd{background:#334155;border-radius:.25rem;padding:.1em .4em;font-size:.72rem;margin:0 .2em}',
          '</style></head><body>',
          '<div id="progress"></div>',
          '<div id="deck"><div id="bg"></div>',
          '<div><div id="counter"></div><div id="slide-title"></div><div id="slide-subtitle"></div></div>',
          '<div id="bullets"></div>',
          '<div id="footer"><span id="vcue"></span><span id="cit"></span></div>',
          '</div>',
          '<div id="notes"><strong>Speaker Notes:</strong><span id="ntext"></span></div>',
          '<div id="ctrl">',
          '<button id="bp">&#8592; Prev</button>',
          '<button id="bn">Next &#8594;</button>',
          '<button id="bno">Notes</button>',
          '<button id="bfs">&#x26F6; Fullscreen</button>',
          '<span style="margin-left:auto;font-size:.7rem;color:#334155"><kbd>&#8592;</kbd><kbd>&#8594;</kbd></span>',
          '</div>',
          '<script>',
          `var S=${slidesData},cur=0;`,
          'function r(){var s=S[cur]||{};',
          'document.getElementById("counter").textContent="SLIDE "+(cur+1)+" / "+S.length;',
          'document.getElementById("slide-title").textContent=s.title||"";',
          'document.getElementById("slide-subtitle").textContent=s.subtitle||"";',
          'document.getElementById("bullets").innerHTML=(s.bullets||[]).map(function(b){return\'<div class="bl"><span class="bd"></span><span>\'+b+\'</span></div>\'}).join("");',
          'document.getElementById("vcue").textContent=s.visualSuggestion?"\\uD83D\\uDC41 "+s.visualSuggestion:"";',
          'document.getElementById("cit").textContent=s.citation||"";',
          'document.getElementById("ntext").textContent=s.speakerNotes||"";',
          'if(!s.speakerNotes)document.getElementById("notes").classList.remove("on");',
          'document.getElementById("progress").style.width=((cur+1)/S.length*100)+"%";}',
          'document.getElementById("bp").onclick=function(){if(cur>0){cur--;r();}};',
          'document.getElementById("bn").onclick=function(){if(cur<S.length-1){cur++;r();}};',
          'document.getElementById("bno").onclick=function(){document.getElementById("notes").classList.toggle("on");};',
          'document.getElementById("bfs").onclick=function(){if(!document.fullscreenElement)document.documentElement.requestFullscreen();else document.exitFullscreen();};',
          'document.addEventListener("keydown",function(e){',
          'if(e.key==="ArrowRight"||e.key==="ArrowDown"){e.preventDefault();if(cur<S.length-1){cur++;r();}}',
          'else if(e.key==="ArrowLeft"||e.key==="ArrowUp"){e.preventDefault();if(cur>0){cur--;r();}}',
          'else if(e.key==="Escape"&&document.fullscreenElement)document.exitFullscreen();});',
          'r();',
          '<\/script></body></html>'
        ].join('\n');
        filename += '.html';
        mime = 'text/html';
      } else if (exportFormat === 'html' && currentArtifact.type === 'report') {
        const secHtml = (currentArtifact.content?.sections || []).map((s: any, i: number) => {
          const subHtml = (s.subsections || []).map((sub: any) =>
            `<div style="margin-left:1.5rem;margin-top:1rem;border-left:3px solid #10b981;padding-left:1rem;">
              <h4 style="font-size:1rem;margin-bottom:0.4rem;color:#0f172a;">${sub.title}</h4>
              <p style="font-size:0.95rem;line-height:1.6;color:#334155;">${sub.content}</p>
            </div>`
          ).join('');
          return `
            <section style="margin-top:2rem;">
              <h2 style="font-size:1.35rem;border-bottom:1px solid #e2e8f0;padding-bottom:0.4rem;color:#0f172a;">${i + 2}. ${s.title}</h2>
              <p style="font-size:1rem;line-height:1.7;color:#334155;margin-top:0.8rem;white-space:pre-line;">${s.content}</p>
              ${subHtml}
            </section>
          `;
        }).join('');

        const refHtml = (currentArtifact.content?.references || []).map((r: string, i: number) =>
          `<li style="font-size:0.88rem;color:#475569;margin-bottom:0.4rem;"><strong style="color:#10b981;">[${i + 1}]</strong> ${r}</li>`
        ).join('');

        contentToDownload = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${currentArtifact.title} — GenNote AI Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Georgia, serif; line-height: 1.6; max-width: 820px; margin: 40px auto; padding: 0 24px; color: #1e293b; background: #fafafa; }
    .card { background: #fff; padding: 48px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
    h1 { font-size: 2.2rem; color: #0f172a; margin-bottom: 0.5rem; line-height: 1.25; }
    .meta { font-size: 0.85rem; color: #64748b; font-family: sans-serif; border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 2rem; }
    .badge { display: inline-block; background: #ecfdf5; color: #059669; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; padding: 0.2rem 0.6rem; border-radius: 999px; margin-bottom: 0.75rem; letter-spacing: 0.05em; font-family: sans-serif; }
    .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; margin-top: 1.5rem; }
    .print-btn { display: inline-block; background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; margin-bottom: 1.5rem; font-family: sans-serif; }
    @media print {
      body { background: #fff; margin: 0; padding: 0; max-width: 100%; }
      .card { border: none; box-shadow: none; padding: 0; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖶 Print / Save as PDF</button>
  <div class="card">
    <span class="badge">GenNote AI Technical Synthesis</span>
    <h1>${currentArtifact.title}</h1>
    <div class="meta">Generated: ${new Date(currentArtifact.createdAt).toLocaleString()} • Model-Verified Grounding</div>

    <div class="summary-box">
      <h3 style="font-size:1.1rem;margin-bottom:0.5rem;color:#0f172a;">1. Executive Summary</h3>
      <p style="font-size:0.95rem;line-height:1.6;color:#334155;">${currentArtifact.content?.executiveSummary || ''}</p>
    </div>

    ${secHtml}

    ${currentArtifact.content?.conclusion ? `
      <section style="margin-top:2rem;">
        <h2 style="font-size:1.35rem;border-bottom:1px solid #e2e8f0;padding-bottom:0.4rem;color:#0f172a;">Conclusions & Recommendations</h2>
        <p style="font-size:1rem;line-height:1.7;color:#334155;margin-top:0.8rem;">${currentArtifact.content.conclusion}</p>
      </section>
    ` : ''}

    ${refHtml ? `
      <section style="margin-top:2.5rem;border-top:2px solid #e2e8f0;padding-top:1.5rem;">
        <h3 style="font-size:1.1rem;color:#0f172a;margin-bottom:1rem;">Verified Source References</h3>
        <ul style="list-style:none;padding:0;">${refHtml}</ul>
      </section>
    ` : ''}
  </div>
</body>
</html>`;
        filename += '.html';
        mime = 'text/html';
      } else {
        // Plain text / markdown output
        contentToDownload = formatArtifactToText(currentArtifact);
        filename += exportFormat === 'md' ? '.md' : '.txt';
      }

      const blob = new Blob([contentToDownload], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2500);
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  function formatArtifactToText(art: Artifact): string {
    const c = art.content;
    let out = `# ${art.title}\nGenerated with GenNote AI\nType: ${art.type}\nDate: ${new Date(art.createdAt).toLocaleString()}\n\n`;

    if (art.type === 'summary') {
      out += `## Overview\n${c.overview || ''}\n\n## Key Points\n`;
      (c.keyPoints || []).forEach((kp: string) => { out += `- ${kp}\n`; });
      if (c.sections) {
        c.sections.forEach((s: any) => { out += `\n### ${s.title}\n${s.text}\n`; });
      }
    } else if (art.type === 'audio_overview') {
      out += `Duration: ${c.duration || 'N/A'}\n\n## Dialogue Transcript\n`;
      (c.dialogue || []).forEach((d: any) => {
        out += `**[${d.speaker.toUpperCase()}]**: ${d.text}\n\n`;
      });
    } else if (art.type === 'quiz') {
      out += `## Mastery Quiz & Examination Questions\n\n`;
      (c.questions || []).forEach((q: any, i: number) => {
        out += `### Question ${i + 1}: ${q.question}\n`;
        (q.options || []).forEach((opt: string, optI: number) => {
          out += `- [${String.fromCharCode(65 + optI)}] ${opt}\n`;
        });
        out += `\n**Correct Answer**: Option ${String.fromCharCode(65 + (q.correctAnswer || 0))}\n`;
        out += `**Explanation**: ${q.explanation}\n`;
        if (q.citation) out += `**Source Reference**: ${q.citation}\n`;
        out += '\n';
      });
    } else if (art.type === 'flashcards') {
      out += `## Study Flashcards\n\n`;
      (c.cards || []).forEach((fc: any, i: number) => {
        out += `### Card #${i + 1} [${fc.tag || 'General'} | Difficulty: ${fc.difficulty || 'Normal'}]\n`;
        out += `**Front (Prompt)**: ${fc.front}\n`;
        out += `**Back (Answer)**: ${fc.back}\n`;
        if (fc.explanation) out += `*Note*: ${fc.explanation}\n`;
        out += '\n';
      });
    } else if (art.type === 'report') {
      out += `## 1. Executive Summary\n${c.executiveSummary || ''}\n\n`;
      (c.sections || []).forEach((s: any, i: number) => {
        out += `## ${i + 2}. ${s.title}\n${s.content}\n\n`;
        (s.subsections || []).forEach((sub: any) => {
          out += `### ${sub.title}\n${sub.content}\n\n`;
        });
      });
      if (c.conclusion) {
        out += `## Recommendations & Conclusions\n${c.conclusion}\n\n`;
      }
      if (c.references && c.references.length > 0) {
        out += `## Source References\n`;
        c.references.forEach((r: string, i: number) => {
          out += `[${i + 1}] ${r}\n`;
        });
      }
    } else if (art.type === 'study_guide') {
      out += `## Comprehensive Syllabus Study Guide\n\n`;
      (c.topics || []).forEach((t: any, i: number) => {
        out += `### Topic ${i + 1}: ${t.title} [Status: ${t.status || 'Not Started'}]\n`;
        out += `${t.description || t.summary || ''}\n\n`;
        if (t.keyCheckpoints && t.keyCheckpoints.length > 0) {
          out += `**Core Learning Objectives:**\n`;
          t.keyCheckpoints.forEach((cp: string) => { out += `- ${cp}\n`; });
          out += '\n';
        }
      });
    } else if (art.type === 'questions') {
      out += `## Curated Exam & Important Technical Questions\n\n`;
      if (c.shortQuestions && c.shortQuestions.length > 0) {
        out += `### Section A: 2-Mark Short Conceptual Questions\n`;
        c.shortQuestions.forEach((q: any, i: number) => {
          out += `Q${i + 1}. ${q.question}\n**Model Answer**: ${q.modelAnswer || q.answer}\n`;
          if (q.citation) out += `*Citation*: ${q.citation}\n`;
          out += '\n';
        });
      }
      if (c.mediumQuestions && c.mediumQuestions.length > 0) {
        out += `### Section B: 5-Mark Analytical Questions\n`;
        c.mediumQuestions.forEach((q: any, i: number) => {
          out += `Q${i + 1}. ${q.question}\n**Model Answer**: ${q.modelAnswer || q.answer}\n`;
          if (q.citation) out += `*Citation*: ${q.citation}\n`;
          out += '\n';
        });
      }
      if (c.longQuestions && c.longQuestions.length > 0) {
        out += `### Section C: 10-Mark Comprehensive Questions\n`;
        c.longQuestions.forEach((q: any, i: number) => {
          out += `Q${i + 1}. ${q.question}\n**Model Answer**: ${q.modelAnswer || q.answer}\n`;
          if (q.citation) out += `*Citation*: ${q.citation}\n`;
          out += '\n';
        });
      }
    } else if (art.type === 'definitions') {
      out += `## Glossary of Core Technical Terms & Definitions\n\n`;
      (c.definitions || []).forEach((d: any) => {
        out += `### ${d.term}\n${d.definition}\n`;
        if (d.example) out += `*Example*: ${d.example}\n`;
        if (d.citation) out += `*Source*: ${d.citation}\n`;
        out += '\n';
      });
    } else if (art.type === 'slide_deck') {
      out += `## Presentation Deck Outline\n\n`;
      (c.slides || []).forEach((s: any, i: number) => {
        out += `### Slide ${i + 1}: ${s.title}\n`;
        if (s.subtitle) out += `*${s.subtitle}*\n\n`;
        (s.bullets || []).forEach((b: string) => { out += `- ${b}\n`; });
        if (s.speakerNotes) out += `\n**Speaker Notes**: ${s.speakerNotes}\n`;
        if (s.citation) out += `**Source**: ${s.citation}\n`;
        out += '\n---\n\n';
      });
    } else if (art.type === 'video_overview') {
      out += `Duration Target: ${c.totalDuration || '3:00'}\n\n## Video Storyboard & Production Script\n\n`;
      (c.scenes || []).forEach((s: any, i: number) => {
        out += `### Scene ${s.sceneNumber || i + 1} (${s.timecode || '00:00'}): ${s.title}\n`;
        out += `**Visual Description**: ${s.visualDescription}\n`;
        if (s.onScreenText) out += `**On-Screen Text**: ${s.onScreenText}\n`;
        out += `**Narration**: "${s.narration}"\n\n`;
      });
    } else if (art.type === 'data_table') {
      const cols: string[] = c.columns || [];
      const rows: any[][] = c.rows || [];
      out += `| ${cols.join(' | ')} |\n`;
      out += `| ${cols.map(() => '---').join(' | ')} |\n`;
      rows.forEach((r) => {
        out += `| ${r.map((cell) => (cell || '').toString().replace(/\|/g, '\\|')).join(' | ')} |\n`;
      });
    } else if (art.type === 'mind_map') {
      out += `## Hierarchical Mind Map Outline\n\n`;
      const renderNode = (node: any, depth = 0) => {
        if (!node) return;
        const indent = '  '.repeat(depth);
        const title = node.title || node.label || 'Concept';
        out += `${indent}- **${title}**\n`;
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach((ch: any) => renderNode(ch, depth + 1));
        }
      };
      renderNode(c.root || c);
    } else if (art.type === 'infographic') {
      out += `## ${c.mainTopic || art.title}\n${c.subtitle || ''}\n\n`;
      if (c.stats && c.stats.length > 0) {
        out += `### Key Architectural Metrics\n`;
        c.stats.forEach((st: any) => {
          out += `- **${st.label}**: ${st.value} (${st.context || ''})\n`;
        });
        out += '\n';
      }
      if (c.processSteps && c.processSteps.length > 0) {
        out += `### Execution Process Pipeline\n`;
        c.processSteps.forEach((ps: any, i: number) => {
          out += `${i + 1}. **${ps.title}**: ${ps.description}\n`;
        });
        out += '\n';
      }
      if (c.comparison && c.comparison.rows) {
        out += `### Architectural Matrix\n`;
        out += `| Criterion | ${c.comparison.featureA || 'A'} | ${c.comparison.featureB || 'B'} |\n|---|---|---|\n`;
        c.comparison.rows.forEach((r: any) => {
          out += `| ${r.metric || r.criterion} | ${r.valueA} | ${r.valueB} |\n`;
        });
      }
    } else {
      out += JSON.stringify(c, null, 2);
    }
    return out;
  }

  const formats = getSupportedFormats(currentArtifact?.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
        <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                GenNote Export Center
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Download your synthesized knowledge artifacts in production formats
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Select Artifact to Export
            </label>
            <select
              value={selectedArtifactId}
              onChange={(e) => {
                setSelectedArtifactId(e.target.value);
                const selected = artifacts.find(a => a.id === e.target.value);
                const newFormats = getSupportedFormats(selected?.type);
                setExportFormat(newFormats[0]?.id || 'txt');
              }}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {artifacts.map(a => (
                <option key={a.id} value={a.id}>
                  [{a.type.replace(/_/g, ' ').toUpperCase()}] {a.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Available Export Formats
            </label>
            <div className="grid grid-cols-1 gap-2">
              {formats.map((f) => (
                <label
                  key={f.id}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    exportFormat === f.id
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                      : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="exportFormat"
                      checked={exportFormat === f.id}
                      onChange={() => setExportFormat(f.id)}
                      className="accent-emerald-600"
                    />
                    <span className="font-medium">{f.label}</span>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">
                    .{f.ext}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {exportSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>File exported successfully to your downloads!</span>
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4.5 py-2.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isExporting}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] disabled:opacity-50 rounded-xl shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? 'Generating file...' : 'Download Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
