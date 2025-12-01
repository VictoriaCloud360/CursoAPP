import React, { useState, useEffect } from 'react';
import { Course, CourseModule, QuizQuestion } from '../types';
import { Button } from './Button';

interface CourseViewProps {
  course: Course;
  onBack: () => void;
}

interface Resource {
  title: string;
  url: string;
}

const SimpleMarkdown = ({ text }: { text: string }) => {
    // Basic replacements for bold and list
    const format = (str: string) => {
        return str
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n- (.*)/g, '<br/>• $1')
            .replace(/\n\n/g, '<br/><br/>');
    };
    return <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: format(text) }} />;
};

export const CourseView: React.FC<CourseViewProps> = ({ course, onBack }) => {
  const [activeTab, setActiveTab] = useState<string>('module-0');
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>(new Array(course.quiz.length).fill(-1));
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Resources state and Dev Mode state
  const [resources, setResources] = useState<Resource[]>([
    { title: 'Lectura complementaria PDF', url: '#' },
    { title: 'Plantilla de trabajo', url: '#' },
    { title: 'Audio resumen del módulo', url: '#' }
  ]);
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Dev Mode with Ctrl + Alt + E
      if (e.ctrlKey && e.altKey && (e.key === 'e' || e.key === 'E')) {
        setIsDevMode(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResourceChange = (index: number, field: keyof Resource, value: string) => {
    const newResources = [...resources];
    newResources[index] = { ...newResources[index], [field]: value };
    setResources(newResources);
  };

  const addResource = () => {
    setResources([...resources, { title: 'Nuevo recurso', url: '#' }]);
  };

  const removeResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const handleQuizSubmit = () => {
    let score = 0;
    quizAnswers.forEach((answer, index) => {
      if (answer === course.quiz[index].correctAnswer) score++;
    });
    setQuizScore(score);
  };

  // Export Functions
  const handlePrint = () => {
    setShowExportMenu(false);
    window.print();
  };

  const handleDownloadMarkdown = () => {
    setShowExportMenu(false);
    let content = `# ${course.title}\n\n`;
    content += `${course.introduction}\n\n`;
    content += `---\n\n`;
    
    course.modules.forEach((mod, i) => {
      content += `## Módulo ${i + 1}: ${mod.title}\n\n`;
      content += `${mod.content}\n\n`;
      content += `### Puntos Clave\n`;
      mod.keyPoints.forEach(p => content += `- ${p}\n`);
      content += `\n---\n\n`;
    });
    
    content += `## Evaluación Final\n\n`;
    course.quiz.forEach((q, i) => {
      content += `${i+1}. ${q.question}\n`;
      q.options.forEach(opt => content += `   - ${opt}\n`);
      content += `\n`;
    });

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${course.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadScorm = async () => {
    setShowExportMenu(false);
    if (!window.JSZip) {
      alert("Error: Librería de compresión no cargada. Por favor recarga la página.");
      return;
    }

    const zip = new window.JSZip();
    
    // 1. imsmanifest.xml
    const manifest = `<?xml version="1.0" standalone="no" ?>
<manifest identifier="com.cursoapp.${Date.now()}" version="1"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                      http://www.imsproject.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="default_org">
    <organization identifier="default_org">
      <title>${course.title}</title>
      <item identifier="item_1" identifierref="resource_1">
        <title>${course.title}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="resource_1" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
    </resource>
  </resources>
</manifest>`;

    // 2. index.html (Vanilla JS version of the course)
    const modulesHtml = course.modules.map((mod, idx) => `
      <div id="module-${idx}" class="tab-content ${idx === 0 ? '' : 'hidden'} animate-fade-in">
        <div class="grid lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 space-y-6">
            <h2 class="text-2xl font-bold text-slate-800">${mod.title}</h2>
            <div class="bg-slate-50 rounded-xl p-6 border border-slate-100 prose prose-slate max-w-none text-slate-700">
               ${mod.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n- (.*)/g, '<br/>• $1').replace(/\n\n/g, '<br/><br/>')}
            </div>
            <div class="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
              <h3 class="text-indigo-900 font-semibold mb-3 flex items-center">
                Puntos Clave
              </h3>
              <div class="grid gap-3 sm:grid-cols-2">
                ${mod.keyPoints.map(p => `<div class="bg-white p-3 rounded-lg shadow-sm text-sm text-indigo-800 flex items-start"><span class="text-indigo-500 mr-2 font-bold">•</span>${p}</div>`).join('')}
              </div>
            </div>
          </div>
          <div class="space-y-6">
            <div class="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden sticky top-6">
              <div class="relative aspect-video bg-slate-200">
                <img src="https://picsum.photos/seed/${mod.imageKeyword}${idx}/800/600" alt="${mod.title}" class="absolute inset-0 w-full h-full object-cover"/>
                <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                  <p class="text-white text-sm font-medium">Concepto: ${mod.imageKeyword}</p>
                </div>
              </div>
              <div class="p-4 bg-slate-50">
                <p class="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Recursos Sugeridos</p>
                <ul class="text-sm text-slate-600 space-y-2">
                  ${resources.map(r => `<li class="flex items-start"><span class="mr-2 text-indigo-400 mt-0.5">•</span><a href="${r.url}" target="_blank" class="hover:text-indigo-600 hover:underline">${r.title}</a></li>`).join('')}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    const quizHtml = `
      <div id="quiz" class="tab-content hidden animate-fade-in mt-8">
        <div class="max-w-2xl mx-auto" id="quiz-container">
          <h2 class="text-2xl font-bold text-slate-800 mb-6 text-center">Evaluación de Conocimientos</h2>
          <div class="space-y-8">
            ${course.quiz.map((q, idx) => `
              <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 class="text-lg font-semibold text-slate-800 mb-4 flex">
                  <span class="bg-slate-100 text-slate-500 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3 flex-shrink-0">${idx + 1}</span>
                  ${q.question}
                </h3>
                <div class="space-y-3 pl-11">
                  ${q.options.map((opt, optIdx) => `
                    <label class="flex items-center p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all">
                      <input type="radio" name="q-${idx}" value="${optIdx}" class="w-4 h-4 text-teal-600 border-slate-300 focus:ring-teal-500">
                      <span class="ml-3 text-slate-700">${opt}</span>
                    </label>
                  `).join('')}
                </div>
              </div>
            `).join('')}
            <div class="flex justify-center pt-4">
              <button onclick="submitQuiz()" class="px-6 py-3 rounded-xl font-semibold bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all w-full md:w-auto min-w-[200px]">
                Ver Resultados
              </button>
            </div>
          </div>
        </div>
        <div id="quiz-results" class="hidden max-w-2xl mx-auto bg-teal-50 border border-teal-200 rounded-2xl p-8 text-center">
            <div class="text-6xl mb-4" id="result-emoji"></div>
            <h3 class="text-2xl font-bold text-teal-900 mb-2">Tu Puntuación: <span id="result-score"></span> / ${course.quiz.length}</h3>
            <p class="text-teal-700 mb-6" id="result-message"></p>
        </div>
      </div>
    `;

    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${course.title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    .hidden { display: none; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen p-4 md:p-8">
  <div class="bg-white rounded-3xl shadow-xl overflow-hidden max-w-6xl mx-auto">
    <!-- Header -->
    <div class="bg-indigo-900 text-white p-8 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-800 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
        <div class="relative z-10">
          <h1 class="text-3xl md:text-4xl font-bold mb-4 leading-tight">${course.title}</h1>
          <p class="text-indigo-100 text-lg max-w-3xl">${course.introduction}</p>
        </div>
    </div>

    <!-- Navigation -->
    <div class="flex overflow-x-auto border-b border-slate-200 bg-slate-50 sticky top-0 z-20">
      ${course.modules.map((_, idx) => `
        <button onclick="showTab('module-${idx}')" id="btn-module-${idx}" class="nav-btn px-6 py-4 whitespace-nowrap font-medium text-sm focus:outline-none transition-colors border-b-2 ${idx === 0 ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-indigo-600 hover:bg-slate-100'}">
          Módulo ${idx + 1}
        </button>
      `).join('')}
      <button onclick="showTab('quiz')" id="btn-quiz" class="nav-btn px-6 py-4 whitespace-nowrap font-medium text-sm focus:outline-none transition-colors border-b-2 border-transparent text-slate-500 hover:text-teal-600 hover:bg-slate-100 flex items-center">
        Evaluación Final
      </button>
    </div>

    <!-- Content -->
    <div class="p-6 md:p-8">
      ${modulesHtml}
      ${quizHtml}
    </div>
  </div>

  <script>
    // SCORM API Helper
    var scorm = {
        init: function() {
            var api = this.getAPI();
            if(api) { api.LMSInitialize(""); api.LMSSetValue("cmi.core.score.min", "0"); api.LMSSetValue("cmi.core.score.max", "${course.quiz.length}"); }
        },
        setScore: function(score) {
            var api = this.getAPI();
            if(api) { 
                api.LMSSetValue("cmi.core.score.raw", score); 
                api.LMSSetValue("cmi.core.lesson_status", score >= ${Math.ceil(course.quiz.length * 0.7)} ? "passed" : "completed");
                api.LMSCommit(""); 
            }
        },
        finish: function() {
            var api = this.getAPI();
            if(api) api.LMSFinish("");
        },
        getAPI: function() {
            var api = window.API;
            var findAPITries = 0;
            while ((!api) && (window.parent) && (window.parent != window) && (findAPITries <= 10)) {
                findAPITries++;
                window = window.parent;
                api = window.API;
            }
            return api;
        }
    };

    // Initialize SCORM on load
    window.onload = function() { scorm.init(); };
    window.onunload = function() { scorm.finish(); };

    // Tab Logic
    function showTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.getElementById(tabId).classList.remove('hidden');
        
        document.querySelectorAll('.nav-btn').forEach(el => {
            el.className = el.className.replace('border-indigo-600 text-indigo-700 bg-white', 'border-transparent text-slate-500 hover:text-indigo-600 hover:bg-slate-100');
            el.className = el.className.replace('border-teal-500 text-teal-700 bg-white', 'border-transparent text-slate-500 hover:text-teal-600 hover:bg-slate-100');
        });

        var btn = document.getElementById('btn-' + tabId);
        if(tabId === 'quiz') {
             btn.className = btn.className.replace('border-transparent text-slate-500 hover:text-teal-600 hover:bg-slate-100', 'border-teal-500 text-teal-700 bg-white');
        } else {
             btn.className = btn.className.replace('border-transparent text-slate-500 hover:text-indigo-600 hover:bg-slate-100', 'border-indigo-600 text-indigo-700 bg-white');
        }
    }

    // Quiz Logic
    const correctAnswers = [${course.quiz.map(q => q.correctAnswer).join(',')}];
    function submitQuiz() {
        let score = 0;
        let answered = 0;
        
        correctAnswers.forEach((ans, idx) => {
            const selected = document.querySelector('input[name="q-'+idx+'"]:checked');
            if(selected) {
                answered++;
                if(parseInt(selected.value) === ans) score++;
            }
        });

        if(answered < correctAnswers.length) {
            alert("Por favor responde todas las preguntas.");
            return;
        }

        document.getElementById('quiz-container').classList.add('hidden');
        const results = document.getElementById('quiz-results');
        results.classList.remove('hidden');
        
        document.getElementById('result-score').innerText = score;
        document.getElementById('result-emoji').innerText = score === correctAnswers.length ? '🏆' : score > 0 ? '👏' : '📚';
        document.getElementById('result-message').innerText = score === correctAnswers.length 
            ? '¡Excelente! Dominas el tema a la perfección.' 
            : 'Buen intento. Revisa los módulos para perfeccionar tu conocimiento.';
            
        // Send to SCORM
        scorm.setScore(score);
    }
  </script>
</body>
</html>`;

    zip.file("imsmanifest.xml", manifest);
    zip.file("index.html", htmlContent);
    
    const content = await zip.generateAsync({type:"blob"});
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SCORM_${course.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadH5P = async () => {
    setShowExportMenu(false);
    if (!window.JSZip) {
      alert("Error: Librería de compresión no cargada. Por favor recarga la página.");
      return;
    }

    const zip = new window.JSZip();

    // H5P.json manifest
    // Declares usage of H5P.Column, Text, and MultiChoice
    const h5pJson = {
      "title": course.title,
      "language": "es",
      "mainLibrary": "H5P.Column",
      "embedTypes": ["div"],
      "license": "U",
      "preloadedDependencies": [
        { "machineName": "H5P.Column", "majorVersion": 1, "minorVersion": 13 },
        { "machineName": "H5P.Text", "majorVersion": 1, "minorVersion": 1 },
        { "machineName": "H5P.MultiChoice", "majorVersion": 1, "minorVersion": 14 },
        { "machineName": "H5P.Image", "majorVersion": 1, "minorVersion": 1 },
        { "machineName": "FontAwesome", "majorVersion": 4, "minorVersion": 5 }
      ]
    };

    // Constructing H5P content structure (Column)
    const contentList: any[] = [];
    
    // Header
    contentList.push({
      "library": "H5P.Text 1.1",
      "params": {
        "text": `<div style="text-align:center; padding: 20px;"><h1>${course.title}</h1><p>${course.introduction}</p></div>`
      }
    });

    // Modules
    course.modules.forEach((mod, idx) => {
      // 1. Image (Embedded as HTML string inside Text atom to avoid CORS/File dependency issues in a light export)
      const imageUrl = `https://picsum.photos/seed/${mod.imageKeyword}${idx}/800/400`;
      
      const moduleContent = `
        <div style="background:#fff; border-radius:10px; padding:20px; border:1px solid #eee; margin-bottom:20px;">
          <h2 style="color:#2c3e50;">Módulo ${idx + 1}: ${mod.title}</h2>
          <img src="${imageUrl}" alt="${mod.title}" style="width:100%; border-radius:8px; margin: 15px 0;" />
          <div style="font-size:1.1em; line-height:1.6; color:#34495e;">
             ${mod.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n- (.*)/g, '<br/>• $1').replace(/\n\n/g, '<br/><br/>')}
          </div>
          <div style="background:#f0f9ff; padding:15px; border-left: 4px solid #3498db; margin-top:20px;">
             <strong>Puntos Clave:</strong>
             <ul>
               ${mod.keyPoints.map(p => `<li>${p}</li>`).join('')}
             </ul>
          </div>
        </div>
      `;

      contentList.push({
        "library": "H5P.Text 1.1",
        "params": { "text": moduleContent }
      });
    });

    // Quiz Questions
    contentList.push({
      "library": "H5P.Text 1.1",
      "params": { "text": "<h2>Evaluación de Conocimientos</h2><p>Pon a prueba lo aprendido:</p>" }
    });

    course.quiz.forEach((q, idx) => {
      contentList.push({
        "library": "H5P.MultiChoice 1.14",
        "params": {
          "question": `<p>${q.question}</p>`,
          "answers": q.options.map((opt, optIdx) => ({
             "text": `<div>${opt}</div>`,
             "correct": optIdx === q.correctAnswer,
             "tipsAndFeedback": { "tip": "", "chosenFeedback": "", "notChosenFeedback": "" }
          })),
          "behaviour": {
            "singlePoint": false,
            "randomAnswers": true,
            "showSolutionsRequiresInput": true,
            "confirmCheckDialog": false,
            "enableRetry": true,
            "enableSolutionsButton": true,
            "type": "auto"
          }
        }
      });
    });

    // Final Content Object
    const contentJson = {
      "useSeparator": "auto",
      "content": contentList
    };

    zip.file("h5p.json", JSON.stringify(h5pJson));
    zip.file("content/content.json", JSON.stringify(contentJson));

    // FIX: Remove explicit directory entry 'content/' if it exists.
    // Moodle's strict file validator flags folder entries as "files without extension".
    if (zip.files["content/"]) {
        delete zip.files["content/"];
    }

    const blob = await zip.generateAsync({type:"blob"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `H5P_${course.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.h5p`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden min-h-[600px] flex flex-col course-container">
      {/* Header */}
      <div className="bg-indigo-900 text-white p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex justify-between items-start">
          <div className="flex-1">
            <button onClick={onBack} className="text-indigo-200 hover:text-white flex items-center mb-4 transition-colors no-print">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Volver a variaciones
            </button>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{course.title}</h1>
            <p className="text-indigo-100 text-lg max-w-3xl">{course.introduction}</p>
          </div>
          
          {/* Export Button */}
          <div className="relative ml-4 no-print">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg backdrop-blur-sm transition-all border border-white/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Exportar
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden text-slate-700 z-50 animate-fade-in">
                <button 
                  onClick={handlePrint}
                  className="w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-center gap-2 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-indigo-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                  </svg>
                  Imprimir / PDF
                </button>
                <button 
                  onClick={handleDownloadMarkdown}
                  className="w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-center gap-2 transition-colors border-t border-slate-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-teal-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  Descargar MD
                </button>
                <button 
                  onClick={handleDownloadScorm}
                  className="w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-center gap-2 transition-colors border-t border-slate-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-orange-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                  Exportar SCORM
                </button>
                <button 
                  onClick={handleDownloadH5P}
                  className="w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-center gap-2 transition-colors border-t border-slate-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
                  </svg>
                  Exportar H5P
                </button>
              </div>
            )}
            {/* Backdrop to close menu */}
            {showExportMenu && <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)}></div>}
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Hidden on Print) */}
      <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 sticky top-0 z-20 no-print">
        {course.modules.map((mod, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(`module-${idx}`)}
            className={`px-6 py-4 whitespace-nowrap font-medium text-sm focus:outline-none transition-colors border-b-2 ${
              activeTab === `module-${idx}`
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
            }`}
          >
            Módulo {idx + 1}
          </button>
        ))}
        <button
          onClick={() => setActiveTab('quiz')}
          className={`px-6 py-4 whitespace-nowrap font-medium text-sm focus:outline-none transition-colors border-b-2 flex items-center ${
            activeTab === 'quiz'
              ? 'border-teal-500 text-teal-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-teal-600 hover:bg-slate-100'
          }`}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          Evaluación Final
        </button>
      </div>

      {/* Content Area */}
      <div className="p-6 md:p-8 flex-1 overflow-y-auto">
        {course.modules.map((mod, idx) => (
          <div key={idx} className={`${activeTab === `module-${idx}` ? 'block animate-fade-in' : 'hidden'} course-module-content`}>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-2xl font-bold text-slate-800">{mod.title}</h2>
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                  <SimpleMarkdown text={mod.content} />
                </div>
                
                {/* Key Points Schema */}
                <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
                  <h3 className="text-indigo-900 font-semibold mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Puntos Clave
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {mod.keyPoints.map((point, i) => (
                      <div key={i} className="bg-white p-3 rounded-lg shadow-sm text-sm text-indigo-800 flex items-start">
                        <span className="text-indigo-500 mr-2 font-bold">•</span>
                        {point}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Visuals Sidebar */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden sticky top-6">
                  <div className="relative aspect-video bg-slate-200">
                    <img 
                      src={`https://picsum.photos/seed/${mod.imageKeyword}${idx}/800/600`} 
                      alt={mod.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                      <p className="text-white text-sm font-medium">Concepto Visual: {mod.imageKeyword}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 transition-colors duration-300">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Recursos Sugeridos</p>
                      {isDevMode && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse dev-tools">
                          DEV
                        </span>
                      )}
                    </div>
                    
                    {isDevMode ? (
                      <div className="space-y-3 dev-tools">
                        {resources.map((res, i) => (
                          <div key={i} className="flex flex-col gap-1 p-2 bg-white rounded border border-indigo-100 shadow-sm animate-fade-in">
                            <div className="flex gap-1">
                              <input 
                                type="text" 
                                value={res.title}
                                onChange={(e) => handleResourceChange(i, 'title', e.target.value)}
                                className="flex-1 text-xs font-medium text-slate-700 border-b border-slate-200 focus:border-indigo-500 outline-none py-1"
                                placeholder="Título del recurso"
                              />
                              <button onClick={() => removeResource(i)} className="text-red-400 hover:text-red-600 px-1" title="Eliminar">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                            <input 
                              type="text" 
                              value={res.url}
                              onChange={(e) => handleResourceChange(i, 'url', e.target.value)}
                              className="w-full text-[10px] text-slate-400 focus:text-indigo-600 border-b border-transparent focus:border-indigo-200 outline-none py-0.5"
                              placeholder="URL (https://...)"
                            />
                          </div>
                        ))}
                        <button 
                          onClick={addResource}
                          className="w-full py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 border-dashed transition-colors"
                        >
                          + Agregar Recurso
                        </button>
                      </div>
                    ) : (
                      <ul className="text-sm text-slate-600 space-y-2">
                        {resources.map((res, i) => (
                          <li key={i} className="flex items-start">
                            <span className="mr-2 text-indigo-400 mt-0.5">•</span>
                            {res.url && res.url !== '#' ? (
                              <a href={res.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 hover:underline transition-colors">
                                {res.title}
                              </a>
                            ) : (
                              <span>{res.title}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Quiz Section (Hidden on Print if not desired, or styled to show) */}
        {/* We can leave it hidden in print if the user is in a module tab, OR we can force it to show at the end. 
            For now, let's keep it simple: It prints if it's the active tab, OR we can append it. 
            But standard "Export Class" usually implies content. 
            I'll add 'course-module-content' to it so it prints at the end of the PDF too. 
        */}
        <div className={`${activeTab === 'quiz' ? 'block animate-fade-in' : 'hidden'} course-module-content mt-8`}>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Evaluación de Conocimientos</h2>
            {quizScore !== null ? (
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-8 text-center no-print">
                 {/* Results are interactive, usually not printed unless specified. I will hide results wrapper in print. */}
                <div className="text-6xl mb-4">
                    {quizScore === course.quiz.length ? '🏆' : quizScore > 0 ? '👏' : '📚'}
                </div>
                <h3 className="text-2xl font-bold text-teal-900 mb-2">
                  Tu Puntuación: {quizScore} / {course.quiz.length}
                </h3>
                <p className="text-teal-700 mb-6">
                  {quizScore === course.quiz.length 
                    ? '¡Excelente! Dominas el tema a la perfección.' 
                    : 'Buen intento. Revisa los módulos para perfeccionar tu conocimiento.'}
                </p>
                <Button onClick={() => {
                  setQuizScore(null);
                  setQuizAnswers(new Array(course.quiz.length).fill(-1));
                }} variant="secondary">
                  Intentar de nuevo
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {course.quiz.map((q, qIdx) => (
                  <div key={qIdx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 break-inside-avoid">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex">
                      <span className="bg-slate-100 text-slate-500 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3 flex-shrink-0">{qIdx + 1}</span>
                      {q.question}
                    </h3>
                    <div className="space-y-3 pl-11">
                      {q.options.map((opt, optIdx) => (
                        <label 
                          key={optIdx} 
                          className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                            quizAnswers[qIdx] === optIdx 
                              ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500' 
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${qIdx}`}
                            className="w-4 h-4 text-teal-600 border-slate-300 focus:ring-teal-500 no-print"
                            checked={quizAnswers[qIdx] === optIdx}
                            onChange={() => {
                              const newAnswers = [...quizAnswers];
                              newAnswers[qIdx] = optIdx;
                              setQuizAnswers(newAnswers);
                            }}
                          />
                          {/* Print specific checkbox representation could go here */}
                          <span className="ml-3 text-slate-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex justify-center pt-4 no-print">
                  <Button 
                    onClick={handleQuizSubmit} 
                    disabled={quizAnswers.includes(-1)}
                    variant="primary"
                    className="w-full md:w-auto min-w-[200px]"
                  >
                    Ver Resultados
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};