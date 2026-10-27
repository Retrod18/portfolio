/* Single source of truth for the portfolio. Every widget (sections, skill space,
   resume RAG, command palette) reads from here, so edit content in one place. */
window.PORTFOLIO = {
  name: 'Dhruv Sharma',
  role: 'AI/ML Engineer',
  focus: ['Generative AI', 'LLM & RAG Systems', 'AI Agents'],
  location: 'Delhi, India',
  timezone: 'Asia/Kolkata',
  email: 'dhruvsharma292005@gmail.com',
  linkedin: 'https://www.linkedin.com/in/dhruvsharma29/',
  github: 'https://github.com/Retrod18',
  resume: 'assets/Dhruv_Sharma_Resume.pdf',
  status: 'Open to AI/ML roles',

  summary:
    'AI/ML Engineer specializing in generative AI and LLM applications, with hands-on experience building RAG pipelines, autonomous AI agents, and production-ready systems using Python, LangChain, MCP, and FastAPI.',

  streamLines: [
    'I build RAG pipelines that answer straight from your documents.',
    'I ship autonomous agents with LangChain + MCP.',
    'I evaluate LLMs until their answers hold up.',
    'I turn raw data into LLM-ready pipelines.'
  ],

  metrics: [
    { value: 15, suffix: '%', label: 'efficiency gain from LLM-integrated pipelines' },
    { value: 25, suffix: '%', label: 'less manual effort via automated preprocessing' },
    { value: 30, suffix: '%', label: 'faster dev cycles with AutoML Pipeline' },
    { value: 50, suffix: 'k+', label: 'records used to fine-tune BERT models' },
    { value: 200, prefix: '<', suffix: 'ms', label: 'recommendation latency on Bookwise ML' }
  ],

  experience: [
    {
      id: 'handshake',
      role: 'AI Trainer',
      org: 'Handshake AI',
      note: 'Project Dynamo',
      period: 'Jul 2026 — Aug 2026',
      trace: [
        ['thought', 'Can LLM answers be trusted on complex, multi-step reasoning?'],
        ['action', 'Evaluated LLM-generated responses for factual consistency, instruction adherence and output quality against structured guidelines.'],
        ['observation', 'Human-in-the-loop feedback and prompt engineering surfaced failure modes and strengthened reliability, reasoning accuracy and response quality.']
      ],
      skills: ['LLM Evaluation', 'Prompt Engineering', 'LLMs', 'Generative AI']
    },
    {
      id: 'drdo',
      role: 'AI/ML Engineer Intern',
      org: 'DRDO',
      note: 'Defence Research & Development Organisation',
      period: 'Jan 2026 — Mar 2026',
      trace: [
        ['thought', 'Apply generative AI and deep learning to complex engineering problems in a high-impact R&D setting.'],
        ['action', 'Architected and deployed LLM-powered RAG pipelines and autonomous agent systems with LangChain and MCP.'],
        ['observation', 'Agents handling multi-step reasoning and document retrieval, with full-lifecycle exposure from applied research to cloud deployment.']
      ],
      skills: ['RAG Pipelines', 'AI Agents', 'LangChain', 'MCP', 'LLMs', 'Generative AI', 'Deep Learning', 'Python']
    },
    {
      id: 'renu',
      role: 'Lead Data Science Intern',
      org: 'Renu Sharma Foundation',
      note: 'Data science for resource optimisation',
      period: 'Aug 2025 — Oct 2025',
      trace: [
        ['thought', 'Use data to optimise how resources are allocated.'],
        ['action', 'Engineered LLM-integrated data pipelines in modular, reusable Python; fine-tuned BERT-based NLP models with TensorFlow and Scikit-learn on 50,000+ records.'],
        ['observation', '15% efficiency gain, and 25% less manual effort after automating preprocessing workflows.']
      ],
      skills: ['Python', 'Pandas', 'LLMs', 'BERT/GPT Fine-tuning', 'TensorFlow', 'Scikit-learn', 'NLP']
    }
  ],

  projects: [
    {
      id: 'docusense',
      name: 'DocuSense AI',
      kind: 'RAG-Powered Document Intelligence Platform',
      date: 'Jan 2026',
      blurb: 'Full-stack RAG for context-aware Q&A across PDF, DOCX and TXT with sub-second responses. FastAPI backend with Google OAuth, NLP modules for summarization and keyword/entity extraction, and a LangChain conversational agent, deployed on Vercel with an AWS-ready design.',
      metric: ['<1s', 'answer latency'],
      pipeline: ['PDF · DOCX', 'chunk', 'embed', 'FAISS', 'retriever', 'LLM agent', 'answer'],
      skills: ['RAG Pipelines', 'LangChain', 'FAISS', 'FastAPI', 'NLP', 'AI Agents', 'Python', 'Vercel', 'AWS'],
      links: [
        { label: 'live demo', url: 'https://docusenseai.vercel.app', cursor: 'launch' },
        { label: 'frontend', url: 'https://github.com/Retrod18/docusenseai-frontend' },
        { label: 'backend', url: 'https://github.com/Retrod18/docusenseai-backend' }
      ],
      featured: true
    },
    {
      id: 'bookwise',
      name: 'Bookwise ML',
      kind: 'Vector-Based Recommendation Engine',
      date: 'Nov 2025',
      blurb: 'Hybrid recommender using TF-IDF embeddings and FAISS cosine-similarity retrieval, served through FastAPI with fuzzy title matching.',
      metric: ['<200ms', 'latency'],
      pipeline: ['title', 'fuzzy match', 'TF-IDF', 'cosine', 'top-N'],
      skills: ['TF-IDF', 'FAISS', 'FastAPI', 'Python', 'Scikit-learn'],
      links: [{ label: 'github', url: 'https://github.com/Retrod18/bookrecommendationsystem' }]
    },
    {
      id: 'automl',
      name: 'AutoML Pipeline',
      kind: 'LLM-Ready Data Automation Framework',
      date: 'Sep 2025',
      blurb: 'Scalable automated preprocessing framework that feeds LLM input pipelines and vector-store ingestion.',
      metric: ['30%', 'faster cycles'],
      pipeline: ['raw data', 'clean', 'transform', 'validate', 'vector store'],
      skills: ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'LLMs'],
      links: [{ label: 'github', url: 'https://github.com/Retrod18/Auto_ml_project' }]
    }
  ],

  categories: {
    genai: { label: 'AI & Generative AI', color: '#9b8cff' },
    ml: { label: 'Machine Learning', color: '#5ef0c8' },
    vector: { label: 'Vector Databases', color: '#ffc56b' },
    prog: { label: 'Programming', color: '#6cc4ff' },
    cloud: { label: 'Cloud & Deployment', color: '#ff7aa8' },
    tools: { label: 'Tools', color: '#c7f36b' }
  },

  skills: [
    ['LLMs', 'genai'], ['RAG Pipelines', 'genai'], ['LangChain', 'genai'], ['LangSmith', 'genai'],
    ['MCP', 'genai'], ['AI Agents', 'genai'], ['Prompt Engineering', 'genai'], ['LLM Evaluation', 'genai'],
    ['Generative AI', 'genai'],
    ['Scikit-learn', 'ml'], ['TensorFlow', 'ml'], ['PyTorch', 'ml'], ['NLP', 'ml'],
    ['BERT/GPT Fine-tuning', 'ml'], ['Deep Learning', 'ml'],
    ['FAISS', 'vector'], ['Chroma', 'vector'], ['Pinecone', 'vector'], ['TF-IDF', 'vector'],
    ['Python', 'prog'], ['Pandas', 'prog'], ['NumPy', 'prog'], ['SQL', 'prog'], ['NoSQL', 'prog'],
    ['FastAPI', 'prog'], ['Flask', 'prog'], ['React/Next.js', 'prog'],
    ['AWS', 'cloud'], ['Firebase', 'cloud'], ['Vercel', 'cloud'],
    ['GitHub', 'tools'], ['GitHub Copilot', 'tools'], ['Claude Code', 'tools'], ['Power BI', 'tools']
  ].map(([name, cat]) => ({ name, cat })),

  education: [
    { title: 'Master of Operational Research', org: 'University of Delhi (DU)', period: '2026 — 2028', detail: 'Pursuing' },
    { title: 'BCA (Computer Science)', org: 'IINTM (IP University), Delhi', period: 'Exp. 2026', detail: '8.3 CGPA' },
    { title: 'Class XII (CBSE)', org: 'Hira Lal Jain Sr. Sec. School, Delhi', period: '2023', detail: '78%' },
    { title: 'Class X (CBSE)', org: 'Canterbury Public School, Delhi', period: '2021', detail: '72%' }
  ],

  certs: [
    { id: 'cert-ds', title: 'Data Science Professional & Power BI Certification', org: 'IINTM', period: '2024 — 2025', skills: ['Power BI', 'Python', 'Pandas'] },
    { id: 'cert-cloud', title: 'Cloud Computing & Software Testing', org: 'NPTEL', period: '2023 — 2024', skills: [] }
  ],

  /* Knowledge base for the in-browser resume RAG. `text` is what gets embedded,
     `answer` is what the generator streams back, `anchor` is where sources link. */
  chunks: [
    { id: 'summary', title: 'Professional summary', anchor: '#about',
      text: 'AI ML engineer generative AI LLM applications RAG pipelines autonomous AI agents production systems Python LangChain MCP FastAPI vector databases FAISS Chroma Pinecone retrieval re-ranking evaluating LLM outputs reliability deployment cloud who is overview background specialize',
      answer: 'Dhruv is an AI/ML Engineer specializing in generative AI and LLM applications. He builds RAG pipelines, autonomous AI agents and production-ready systems with Python, LangChain, MCP and FastAPI, and works across vector databases (FAISS, Chroma, Pinecone), retrieval and re-ranking design, and LLM evaluation.' },
    { id: 'contact', title: 'Contact and links', anchor: '#contact',
      text: 'contact email reach hire linkedin github message connect get in touch mail',
      answer: 'You can reach Dhruv at dhruvsharma292005@gmail.com, on LinkedIn (linkedin.com/in/dhruvsharma29) or GitHub (github.com/Retrod18). The contact section at the bottom can draft the email for you.' },
    { id: 'location', title: 'Location', anchor: '#about',
      text: 'location based live city Delhi India timezone IST',
      answer: 'Dhruv is based in Delhi, India (IST, UTC+5:30).' },
    { id: 'status', title: 'Availability', anchor: '#contact',
      text: 'available availability open to work roles hiring job opportunities looking full time',
      answer: 'Dhruv is open to AI/ML roles, especially work on LLM applications, RAG systems and AI agents. The fastest route is email: dhruvsharma292005@gmail.com.' },
    { id: 'handshake', title: 'AI Trainer · Handshake AI', anchor: '#exp-handshake',
      text: 'AI Trainer Handshake AI Project Dynamo evaluated improved LLM generated responses complex reasoning factual consistency instruction adherence output quality evaluation guidelines human in the loop feedback prompt engineering failure modes reliability latest recent current experience',
      answer: 'At Handshake AI (Project Dynamo, Jul–Aug 2026) Dhruv worked as an AI Trainer. He evaluated LLM responses on complex reasoning tasks for factual consistency, instruction adherence and output quality, and used human-in-the-loop feedback and prompt engineering to surface failure modes and improve model reliability.' },
    { id: 'drdo', title: 'AI/ML Engineer Intern · DRDO', anchor: '#exp-drdo',
      text: 'AI ML Engineer Intern DRDO Defence Research Development Organisation architected deployed LLM powered RAG pipelines autonomous AI agent systems research R&D generative AI deep learning engineering LangChain MCP multi step reasoning document retrieval cloud deployment internship',
      answer: 'At DRDO (Defence Research & Development Organisation, Jan–Mar 2026) Dhruv was an AI/ML Engineer Intern. He architected and deployed LLM-powered RAG pipelines and autonomous agent systems, building agents with LangChain and MCP for multi-step reasoning and document retrieval, from applied research through to cloud deployment.' },
    { id: 'renu', title: 'Lead Data Science Intern · Renu Sharma Foundation', anchor: '#exp-renu',
      text: 'Lead Data Science Intern Renu Sharma Foundation LLM integrated data pipelines resource optimization efficiency gain 15% modular reusable Python fine tuned BERT NLP TensorFlow Scikit-learn 50000 records automated preprocessing manual effort 25% data science internship',
      answer: 'As Lead Data Science Intern at the Renu Sharma Foundation (Aug–Oct 2025), Dhruv engineered LLM-integrated data pipelines that delivered a 15% efficiency gain, and fine-tuned BERT-based NLP models on 50,000+ records with TensorFlow and Scikit-learn. Automating the preprocessing workflows cut manual effort by 25%.' },
    { id: 'docusense', title: 'DocuSense AI · RAG document intelligence', anchor: '#proj-docusense',
      text: 'DocuSense AI RAG powered document intelligence platform full stack LangChain FAISS custom retrievers context aware document question answering PDF DOCX TXT sub second response FastAPI Google OAuth summarization keyword entity extraction conversational agent Vercel AWS project best flagship',
      answer: 'DocuSense AI is a RAG-powered document intelligence platform. Dhruv built a full-stack pipeline with LangChain, FAISS and custom retrievers that answers questions over PDF, DOCX and TXT files in under a second. A FastAPI backend handles Google OAuth, summarization and keyword/entity extraction alongside a LangChain conversational agent, and it runs on Vercel with an AWS-ready design. You can try it live at docusenseai.vercel.app.' },
    { id: 'bookwise', title: 'Bookwise ML · vector recommendation engine', anchor: '#proj-bookwise',
      text: 'Bookwise ML vector based recommendation engine hybrid TF-IDF embeddings FAISS cosine similarity retrieval FastAPI fuzzy matching 200ms latency books recommend recommender project',
      answer: 'Bookwise ML is a hybrid recommendation engine. It uses TF-IDF embeddings with FAISS cosine-similarity retrieval and is served through FastAPI with fuzzy title matching at under 200 ms latency. This resume assistant uses the same TF-IDF + cosine retrieval idea.' },
    { id: 'automl', title: 'AutoML Pipeline · LLM-ready data automation', anchor: '#proj-automl',
      text: 'AutoML Pipeline LLM ready data automation framework scalable automated preprocessing LLM input pipelines vector store ingestion accelerating development cycles 30% project data engineering',
      answer: 'AutoML Pipeline is an LLM-ready data automation framework: a scalable automated preprocessing layer that feeds LLM input pipelines and vector-store ingestion. It sped up development cycles by 30%.' },
    { id: 'sk-genai', title: 'Skills · AI & Generative AI', anchor: '#skills',
      text: 'skills AI generative AI LLMs RAG pipelines LangChain LangSmith MCP AI agents prompt engineering LLM evaluation stack tech',
      answer: 'On the AI side Dhruv works with LLMs, RAG pipelines, LangChain, LangSmith, MCP, AI agents, prompt engineering, LLM evaluation and generative AI in general.' },
    { id: 'sk-ml', title: 'Skills · Machine Learning', anchor: '#skills',
      text: 'skills machine learning Scikit-learn TensorFlow PyTorch NLP BERT GPT fine tuning deep learning frameworks',
      answer: 'His machine learning toolkit covers Scikit-learn, TensorFlow, PyTorch, NLP, BERT/GPT fine-tuning and deep learning.' },
    { id: 'sk-vector', title: 'Skills · Vector databases', anchor: '#skills',
      text: 'skills vector databases FAISS Chroma Pinecone TF-IDF embeddings similarity search retrieval re-ranking',
      answer: 'For vector search Dhruv uses FAISS, Chroma, Pinecone and TF-IDF, and he designs retrieval and re-ranking systems on top of them.' },
    { id: 'sk-prog', title: 'Skills · Programming', anchor: '#skills',
      text: 'skills programming languages Python Pandas NumPy SQL NoSQL FastAPI Flask React Next.js backend frontend web',
      answer: 'He programs mainly in Python (Pandas, NumPy), plus SQL and NoSQL. He builds APIs with FastAPI and Flask and frontends with React/Next.js.' },
    { id: 'sk-cloud', title: 'Skills · Cloud & tools', anchor: '#skills',
      text: 'skills cloud deployment AWS Lambda EC2 S3 Firebase Vercel tools GitHub Copilot Claude Code Power BI devops deploy',
      answer: 'For cloud and deployment he uses AWS (Lambda, EC2, S3), Firebase and Vercel. Day to day he works with GitHub, GitHub Copilot, Claude Code and Power BI.' },
    { id: 'edu-msc', title: 'Master of Operational Research · University of Delhi', anchor: '#education',
      text: 'education masters master operational research University of Delhi DU pursuing 2026 2028 postgraduate degree studying current',
      answer: 'Dhruv is pursuing a Master of Operational Research at the University of Delhi (2026–2028).' },
    { id: 'edu-bca', title: 'BCA (Computer Science) · IINTM', anchor: '#education',
      text: 'education bachelor BCA computer science IINTM IP University Delhi 8.3 CGPA graduation undergraduate college degree school class XII X CBSE',
      answer: 'He holds a BCA in Computer Science from IINTM (IP University), Delhi, expected 2026, with an 8.3 CGPA. Before that he completed Class XII (CBSE, 78%) at Hira Lal Jain Sr. Sec. School and Class X (CBSE, 72%) at Canterbury Public School.' },
    { id: 'certs', title: 'Certifications', anchor: '#education',
      text: 'certifications certificate certified Data Science Professional Power BI IINTM Cloud Computing Software Testing NPTEL courses',
      answer: 'Dhruv is certified in Data Science Professional & Power BI (IINTM, 2024–2025) and Cloud Computing & Software Testing (NPTEL, 2023–2024).' }
  ]
};
