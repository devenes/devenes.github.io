export type SessionTrackId =
  | 'gke-platform'
  | 'ai-agents'
  | 'mlops-serving'
  | 'genai-serverless'
  | 'cloud-sre';

export type SessionFormatKind = 'Talk' | 'Workshop' | 'Keynote';

export interface SessionProposal {
  id: string;
  title: string;
  trackId: SessionTrackId;
  trackLabel: string;
  formats: SessionFormatKind[];
  durationLabel: string;
  participation: 'In-person, Virtual' | 'In-person';
  audienceLevels: string;
  featuredOnKit?: boolean;
  abstract: string[];
  keyTakeaways: string[];
  whoShouldAttend: string[];
  prerequisites?: string;
  topics: string[];
}

export const SESSION_TRACKS: Array<{ id: SessionTrackId; label: string }> = [
  { id: 'gke-platform', label: 'Kubernetes & GKE' },
  { id: 'ai-agents', label: 'AI Agents, ADK & MCP' },
  { id: 'mlops-serving', label: 'MLOps & Model Serving' },
  { id: 'genai-serverless', label: 'GenAI & Serverless' },
  { id: 'cloud-sre', label: 'Cloud Architecture & SRE' },
];

export const SESSION_PROPOSALS: SessionProposal[] = [
  {
    id: 'gke-ai-infrastructure-next-gen',
    title: 'Kubernetes for AI at Scale: Building the Next Generation of AI Infrastructure',
    trackId: 'gke-platform',
    trackLabel: 'Kubernetes & GKE',
    formats: ['Talk', 'Keynote'],
    durationLabel: '35–45 min',
    participation: 'In-person, Virtual',
    audienceLevels: 'Intermediate',
    featuredOnKit: true,
    abstract: [
      'AI workloads are changing the core assumptions Kubernetes was originally built around. Unlike stateless microservices, modern inference and agent systems are data-intensive, accelerator-bound, distributed across multi-node topologies, and bursty in ways CPU horizontal autoscalers cannot predict.',
      'This session examines how Kubernetes and Google Kubernetes Engine are evolving into a hardware-aware, AI-native control plane—covering isolated code execution for autonomous agents with Agent Sandbox, fast pod checkpointing and restoration, in-place vertical resource resizing without container restarts, accelerator-aware scheduling via Dynamic Resource Allocation (DRA), distributed LLM serving with llm-d and vLLM, high-throughput networking with DRA-Net, and KV-cache-aware traffic routing through GKE Inference Gateway.',
    ],
    keyTakeaways: [
      'Isolate untrusted, agent-generated tool and code execution safely using gVisor-backed Agent Sandbox on GKE.',
      'Eliminate cold-start and restart penalties with pod snapshot restoration and in-place vertical pod resizing.',
      'Schedule GPUs, TPUs, and high-bandwidth NICs topologically with Dynamic Resource Allocation (DRA) and DRA-Net.',
      'Route prompts intelligently across vLLM / llm-d replicas using model-aware metrics in GKE Inference Gateway.',
    ],
    whoShouldAttend: [
      'Platform engineers and Kubernetes operators running or planning GPU/TPU clusters.',
      'AI infrastructure engineers optimizing LLM serving throughput, tail latency, and accelerator utilization.',
      'Cloud architects evaluating GKE control-plane primitives for multi-tenant AI platforms.',
    ],
    topics: [
      'Google Kubernetes Engine (GKE)',
      'Agent Sandbox',
      'Dynamic Resource Allocation (DRA)',
      'GKE Inference Gateway',
      'vLLM & llm-d',
      'DRA-Net',
      'GPUs & TPUs',
      'Open Source Kubernetes',
    ],
  },
  {
    id: 'gke-ai-at-scale',
    title: 'Kubernetes for AI at Scale on Google Kubernetes Engine',
    trackId: 'gke-platform',
    trackLabel: 'Kubernetes & GKE',
    formats: ['Keynote', 'Talk'],
    durationLabel: '30–45 min',
    participation: 'In-person, Virtual',
    audienceLevels: 'Intermediate',
    featuredOnKit: true,
    abstract: [
      'As AI agents and inference workloads become increasingly dynamic and resource-intensive, Kubernetes infrastructure must evolve beyond traditional container orchestration.',
      'This talk explores how Google Kubernetes Engine enables scalable AI infrastructure through secure, isolated execution environments for agents, faster workload startup, dynamic resource adjustments without unnecessary restarts, hardware-aware resource allocation, and intelligent inference traffic routing. By connecting these capabilities across the agent, compute, and networking layers, we walk through a practical blueprint for building responsive, adaptable infrastructure for AI workloads at scale.',
    ],
    keyTakeaways: [
      'How agent, compute, and networking layers interact inside a modern GKE AI platform.',
      'Reducing startup latency and wasted accelerator idle time across bursty inference services.',
      'Architectural trade-offs when consolidating agent runtimes and model-serving pools onto shared clusters.',
    ],
    whoShouldAttend: [
      'Cloud architects, engineering leads, and platform teams modernizing Kubernetes clusters for AI workloads.',
      'DevOps and SRE engineers bridging application teams and accelerator infrastructure.',
    ],
    topics: [
      'Google Kubernetes Engine (GKE)',
      'AI Infrastructure',
      'Agent Sandboxing',
      'Inference Routing',
      'Hardware-Aware Scheduling',
      'Google Cloud',
    ],
  },
  {
    id: 'adk-agents-skills-tools',
    title: 'Building Google Agent Development Kit Agents with Skills and Tools',
    trackId: 'ai-agents',
    trackLabel: 'AI Agents, ADK & MCP',
    formats: ['Workshop'],
    durationLabel: '90–120 min hands-on lab',
    participation: 'In-person, Virtual',
    audienceLevels: 'Beginner, Intermediate',
    featuredOnKit: true,
    abstract: [
      'Learn how to build, test, and deploy a production-ready AI agent using Google’s open-source Agent Development Kit (ADK) in this hands-on developer workshop. Participants build a multi-step Marathon Planner Agent from scratch while practicing core agentic design patterns—including structured system instructions, modular skill loading, and live tool integration through Model Context Protocol (MCP) servers such as Google Maps.',
      'We walk through the full engineering lifecycle: scaffolding an ADK project in Python, wiring deterministic tools and reusable skills, evaluating multi-turn reasoning locally with the ADK inspector, and deploying the containerized agent to Cloud Run. Attendees leave with working code and a clear mental model for shipping modular, cloud-ready agents.',
    ],
    keyTakeaways: [
      'Structure maintainable Python agent projects using Google ADK primitives, instructions, and sub-agents.',
      'Extend foundation models with external context and live APIs via MCP servers and typed tool functions.',
      'Debug tool-call traces locally before deploying stateless, autoscaling agent endpoints on Cloud Run.',
    ],
    whoShouldAttend: [
      'Python and backend developers moving from single-prompt LLM calls to tool-using agents.',
      'Full-stack and cloud engineers integrating MCP tools and Gemini models into real applications.',
    ],
    prerequisites: 'Laptop with browser and basic Python familiarity; cloud lab steps run in a guided environment.',
    topics: [
      'Agent Development Kit (ADK)',
      'AI Agents',
      'Model Context Protocol (MCP)',
      'Gemini',
      'Cloud Run',
      'Python',
      'Google Cloud',
      'Build with AI',
    ],
  },
  {
    id: 'building-scalable-genai-apps',
    title: 'Building Scalable Generative AI Apps with Vertex AI and Cloud Run',
    trackId: 'genai-serverless',
    trackLabel: 'GenAI & Serverless',
    formats: ['Workshop'],
    durationLabel: '90–120 min hands-on lab',
    participation: 'In-person',
    audienceLevels: 'Beginner, Intermediate',
    abstract: [
      'In this practical, lab-based workshop, participants develop, containerize, and deploy a multimodal generative AI web application on Google Cloud. The session integrates the Gemini API on Vertex AI with an interactive Streamlit frontend and deploys the service to Cloud Run for zero-ops, scale-to-zero serving.',
      'Rather than watching slides or pre-recorded demos, attendees work inside a live Google Cloud environment using temporary provisioned lab credentials—no personal billing account or prior cloud setup required. Participants configure Vertex AI SDK authentication, implement streaming multimodal generation, package the app with Docker, and ship a live HTTPS endpoint.',
    ],
    keyTakeaways: [
      'Authenticate and call Gemini multimodal models cleanly through the Vertex AI SDK.',
      'Handle streaming responses, prompt templating, and safety settings in an interactive Python web app.',
      'Build lean container images and deploy autoscaling serverless revisions on Google Cloud Run.',
    ],
    whoShouldAttend: [
      'Application developers and ML practitioners building and shipping user-facing AI features.',
      'Cloud engineers evaluating serverless deployment patterns for generative AI services.',
      'Data scientists looking to turn local Python prototypes into shareable production web apps.',
      'Students and engineers comfortable with basic Python and REST APIs.',
    ],
    prerequisites: 'Laptop with a modern web browser; temporary Google Cloud lab access is provided.',
    topics: [
      'Vertex AI',
      'Gemini API',
      'Cloud Run',
      'Serverless & Containers',
      'Streamlit',
      'Docker',
      'Generative AI',
      'Build with AI',
    ],
  },
  {
    id: 'from-cloud-to-code-2026',
    title: 'From Cloud to Code: Navigating Google’s 2026 AI and Platform Innovations',
    trackId: 'cloud-sre',
    trackLabel: 'Cloud Architecture & SRE',
    formats: ['Keynote', 'Talk'],
    durationLabel: '35–45 min',
    participation: 'In-person, Virtual',
    audienceLevels: 'Beginner, Intermediate',
    abstract: [
      'Where enterprise cloud strategy meets day-to-day developer velocity: synthesizing the most important engineering releases from Google Cloud Next ’26 and Google I/O ’26 into concrete architectural guidance.',
      'First, we unpack the platform milestones from Cloud Next—including Gemini Live API capabilities, enterprise agent interoperability via the Model Context Protocol (MCP), and infrastructure advances across GKE and Google Cloud compute. Then we switch to the builder’s perspective from Google I/O, examining how the latest Gemini and open Gemma iterations, CLI/agentic developer workflows, and security primitives change how teams design and ship multi-cloud software.',
    ],
    keyTakeaways: [
      'Separate high-signal engineering releases from conference hype across Google Cloud Next and Google I/O.',
      'Understand where Gemini, Gemma, ADK, and MCP fit in real enterprise architectures.',
      'Adopt practical developer workflow and platform security upgrades without replatforming existing services.',
    ],
    whoShouldAttend: [
      'Software engineers, tech leads, and cloud architects looking for a technical synthesis of Google’s 2026 AI & cloud stack.',
      'DevFest, Google I/O Extended, and engineering summit audiences across experience levels.',
    ],
    topics: [
      'Google Cloud Next',
      'Google I/O',
      'Gemini & Gemma',
      'Model Context Protocol (MCP)',
      'Agent Development Kit (ADK)',
      'Platform Engineering',
      'Multi-Cloud',
    ],
  },
  {
    id: 'multi-agent-mcp-production',
    title: 'Beyond the Demo: Designing Reliable Multi-Agent Systems with ADK and MCP',
    trackId: 'ai-agents',
    trackLabel: 'AI Agents, ADK & MCP',
    formats: ['Talk'],
    durationLabel: '40 min',
    participation: 'In-person, Virtual',
    audienceLevels: 'Intermediate, Advanced',
    abstract: [
      'Single-prompt demos come together in an afternoon; multi-agent systems that survive real users, flaky downstream APIs, and strict latency budgets require disciplined systems engineering. When every sub-agent call compounds token cost, latency, and hallucination surface area, architecture matters more than prompt wording.',
      'This talk breaks down production multi-agent topologies built with Google’s Agent Development Kit (ADK) and standardized Model Context Protocol (MCP) tool servers. We cover coordinator-worker delegation vs. deterministic workflow graphs, scoped memory and context compaction, least-privilege MCP tool boundaries, OpenTelemetry trace instrumentation across reasoning hops, and automated trajectory evaluation.',
    ],
    keyTakeaways: [
      'Know when to use a single tool-augmented agent, a deterministic pipeline, or a multi-agent hierarchy.',
      'Design secure, versioned MCP servers with strict schema validation and bounded context payloads.',
      'Instrument multi-agent traces with OpenTelemetry and enforce token, latency, and loop guardrails.',
    ],
    whoShouldAttend: [
      'Backend, AI, and platform engineers taking agentic workflows from prototype into production.',
      'Architects standardizing internal tool access across teams using MCP and Vertex AI.',
    ],
    topics: [
      'Multi-Agent Systems',
      'Agent Development Kit (ADK)',
      'Model Context Protocol (MCP)',
      'Vertex AI',
      'OpenTelemetry',
      'AI Architecture',
      'Google Cloud',
    ],
  },
  {
    id: 'intelligent-agents-vertex-ai-landscape',
    title: 'Building Intelligent Agents: Reference Architectures and the Vertex AI Landscape',
    trackId: 'ai-agents',
    trackLabel: 'AI Agents, ADK & MCP',
    formats: ['Talk'],
    durationLabel: '35–45 min',
    participation: 'In-person, Virtual',
    audienceLevels: 'Intermediate',
    abstract: [
      'Autonomous and tool-using AI agents require far more than a foundation model endpoint—they depend on grounding, short- and long-term memory, safe tool execution, and repeatable evaluation. Yet navigating the rapidly expanding ecosystem of frameworks, managed runtimes, and open models can overwhelm engineering teams.',
      'This session maps out pragmatic reference architectures for enterprise AI agents and clarifies how Google Cloud’s building blocks fit together: Gemini and Gemma models, Vertex AI Agent Engine, ADK, grounding with enterprise data, and containerized deployment options. Attendees walk away with concrete design patterns for building agents that stay predictable, observable, and maintainable in production.',
    ],
    keyTakeaways: [
      'Decompose an agent system into reasoning, memory, grounding, tool invocation, and safety layers.',
      'Choose appropriately between managed Vertex AI agent runtimes and self-hosted Cloud Run / GKE deployments.',
      'Avoid common failure modes including unbounded tool loops, context poisoning, and unmeasured prompt drift.',
    ],
    whoShouldAttend: [
      'Software engineers and solution architects designing conversational or workflow-automation agents.',
      'Engineering managers evaluating the Vertex AI ecosystem for upcoming product roadmaps.',
    ],
    topics: [
      'AI Agents',
      'Vertex AI',
      'Agent Development Kit (ADK)',
      'Gemini & Gemma',
      'RAG & Grounding',
      'Cloud Architecture',
      'Google Cloud',
    ],
  },
  {
    id: 'architecting-scalable-mlops-gke',
    title: 'Architecting Scalable MLOps Platforms on Google Kubernetes Engine',
    trackId: 'mlops-serving',
    trackLabel: 'MLOps & Model Serving',
    formats: ['Talk'],
    durationLabel: '40 min',
    participation: 'In-person',
    audienceLevels: 'Intermediate',
    abstract: [
      'Machine learning teams move fastest when they do not have to reinvent cluster YAML, GPU drivers, or deployment scripts for every model experiment. Building an internal MLOps platform on Google Kubernetes Engine gives organizations portable, vendor-neutral workflows without sacrificing managed cloud automation.',
      'In this session, we design an end-to-end GKE MLOps platform covering reproducible training and fine-tuning pipelines, fair-share multi-team accelerator queuing with Kueue, Spot and Flex-start GPU/TPU cost optimization, artifact lineage, and automated rollout pipelines from experiment registries into production inference pools.',
    ],
    keyTakeaways: [
      'Structure multi-tenant GKE clusters so data science experimentation and production serving coexist safely.',
      'Use Kueue and GKE node auto-provisioning to maximize GPU/TPU utilization and control cloud spend.',
      'Standardize CI/CD/CT pipelines for containerizing, validating, and promoting ML models.',
    ],
    whoShouldAttend: [
      'MLOps, DevOps, and platform engineers building internal ML infrastructure.',
      'ML engineers looking to standardize training and serving workflows on Kubernetes.',
    ],
    topics: [
      'MLOps',
      'Google Kubernetes Engine (GKE)',
      'Kueue',
      'GPUs & TPUs',
      'Platform Engineering',
      'Cost Optimization',
      'Google Cloud',
    ],
  },
  {
    id: 'high-scale-aiml-workloads-gke',
    title: 'Working with High-Scale AI/ML Workloads on Google Kubernetes Engine',
    trackId: 'gke-platform',
    trackLabel: 'Kubernetes & GKE',
    formats: ['Talk'],
    durationLabel: '40 min',
    participation: 'In-person',
    audienceLevels: 'Intermediate, Advanced',
    abstract: [
      'Scaling AI/ML workloads from a single GPU node to dozens of accelerators exposes bottlenecks across container startup, storage throughput, pod scheduling, and cluster networking. Multi-gigabyte container images and massive model checkpoints can leave expensive GPUs sitting idle for minutes during scale-out events.',
      'This deep-dive session focuses on the systems mechanics of running high-scale distributed training and low-latency inference on GKE. We cover GPU time-sharing vs. Multi-Instance GPU (MIG) partitioning, multi-host TPU slice topology scheduling, GKE image streaming and Cloud Storage FUSE / Anywhere Cache for rapid weight loading, and custom queue-depth autoscaling for inference fleets.',
    ],
    keyTakeaways: [
      'Right-size accelerator sharing using NVIDIA MIG, GPU time-sharing, and GKE Autopilot/Standard node pools.',
      'Slash cold-start times for multi-gigabyte ML containers and model weights using image streaming and parallel caching.',
      'Autoscale inference workloads on custom saturation metrics (KV-cache usage, queue depth) instead of raw CPU.',
    ],
    whoShouldAttend: [
      'Kubernetes engineers, infrastructure architects, and ML systems engineers operating high-throughput AI clusters.',
    ],
    topics: [
      'Google Kubernetes Engine (GKE)',
      'Distributed Training & Serving',
      'GPU MIG & TPUs',
      'Cloud Storage FUSE',
      'Autoscaling',
      'Performance Engineering',
    ],
  },
  {
    id: 'model-deployment-canary-csm-gke',
    title: 'Model Deployment Strategies on Google Kubernetes Engine with Cloud Service Mesh',
    trackId: 'mlops-serving',
    trackLabel: 'MLOps & Model Serving',
    formats: ['Workshop'],
    durationLabel: '90–120 min hands-on lab',
    participation: 'In-person',
    audienceLevels: 'Intermediate',
    abstract: [
      'Replacing a live machine learning model in production carries risks that unit tests alone cannot catch—latency spikes under real payload distributions, silent accuracy drift, and memory regressions. Progressive delivery lets engineering teams validate new model revisions against real traffic while bounding blast radius.',
      'In this hands-on workshop, participants implement controlled canary and traffic-splitting rollouts on Google Kubernetes Engine using Cloud Service Mesh (managed Istio). Attendees provision a GKE environment, deploy multiple revisions of a TensorFlow Serving inference service, route weighted traffic percentages (95/5 → 50/50 → 100%), inspect per-revision golden signals, and trigger instant zero-downtime rollbacks.',
    ],
    keyTakeaways: [
      'Configure Cloud Service Mesh gateways and virtual services for fine-grained ML traffic splitting on GKE.',
      'Compare blue/green, canary, and shadow traffic strategies for model serving endpoints.',
      'Gate progressive promotion on real latency, error-rate, and prediction telemetry.',
    ],
    whoShouldAttend: [
      'ML engineers, SREs, and DevOps practitioners responsible for model serving reliability.',
    ],
    prerequisites: 'Working familiarity with Kubernetes fundamentals, basic Istio/service-mesh concepts, and containerized ML models.',
    topics: [
      'Google Kubernetes Engine (GKE)',
      'Cloud Service Mesh (Istio)',
      'Canary Rollouts',
      'TensorFlow Serving',
      'MLOps',
      'Progressive Delivery',
      'Google Cloud',
    ],
  },
  {
    id: 'zero-trust-ai-platform-security-gke',
    title: 'Securing Multi-Tenant Kubernetes and AI Workloads: Zero-Trust GKE and Sandboxing',
    trackId: 'gke-platform',
    trackLabel: 'Kubernetes & GKE',
    formats: ['Talk'],
    durationLabel: '40 min',
    participation: 'In-person, Virtual',
    audienceLevels: 'Intermediate, Advanced',
    abstract: [
      'AI agents that execute code, query internal databases, and call external APIs dramatically expand the threat surface of a Kubernetes cluster. Traditional perimeter firewalls and static long-lived cloud credentials break down when workloads dynamically spin up tool sandboxes and access sensitive model weights.',
      'Drawing from real-world cloud and identity platform engineering, this talk presents a defense-in-depth blueprint for multi-tenant GKE clusters: keyless authentication via Workload Identity Federation, kernel-level pod isolation with gVisor and Agent Sandbox, strict egress and FQDN network policies to mitigate prompt-injection data exfiltration, supply-chain attestation with Binary Authorization, and fleet-wide policy guardrails.',
    ],
    keyTakeaways: [
      'Eliminate static service-account keys across multi-cloud and GKE workloads with Workload Identity Federation.',
      'Contain untrusted LLM code-execution and multi-tenant workloads using gVisor sandboxes and strict Linux capabilities.',
      'Prevent data exfiltration from compromised or prompt-injected agents with layered network and identity controls.',
    ],
    whoShouldAttend: [
      'Platform, security, and Kubernetes engineers operating multi-team or customer-facing cloud infrastructure.',
      'Architects designing governance and isolation boundaries for enterprise AI platforms.',
    ],
    topics: [
      'Kubernetes Security',
      'Google Kubernetes Engine (GKE)',
      'Zero Trust & Identity',
      'Workload Identity',
      'gVisor & Sandboxing',
      'Platform Engineering',
      'Multi-Cloud',
    ],
  },
  {
    id: 'sre-for-ai-systems',
    title: 'SRE for AI Systems: SLOs, Tail Latency, and Resilience for Non-Deterministic Workloads',
    trackId: 'cloud-sre',
    trackLabel: 'Cloud Architecture & SRE',
    formats: ['Talk', 'Keynote'],
    durationLabel: '35–45 min',
    participation: 'In-person, Virtual',
    audienceLevels: 'Intermediate',
    abstract: [
      'Classic Site Reliability Engineering assumes services return deterministic responses in milliseconds. Generative AI and agentic workloads violate both assumptions: responses stream over seconds, token counts skew tail latency by 10×, upstream model quotas throttle unpredictably, and an HTTP 200 OK can still carry a hallucinated or malformed answer.',
      'This session adapts battle-tested SRE practices for production AI systems on Google Cloud and Kubernetes. We define actionable SLIs and SLOs for streaming inference (Time to First Token, Time Per Output Token, tool-call success rate, and semantic quality), implement token-aware rate limiting and graceful model fallback tiers, and design multi-region resilience across Vertex AI and GKE.',
    ],
    keyTakeaways: [
      'Replace naive request-latency averages with streaming-aware SLIs (TTFT, TPOT) and quality-adjusted error budgets.',
      'Build resilient fallback chains across regions, model tiers (Gemini Pro → Flash → self-hosted Gemma), and caches.',
      'Run blameless incident reviews and chaos experiments for quota exhaustion and upstream model degradation.',
    ],
    whoShouldAttend: [
      'Site Reliability Engineers, production engineers, and backend leads owning customer-facing AI services.',
    ],
    topics: [
      'Site Reliability Engineering (SRE)',
      'AI Reliability',
      'SLOs & Observability',
      'Tail Latency',
      'Vertex AI & GKE',
      'Resilience Patterns',
      'Google Cloud',
    ],
  },
  {
    id: 'cloud-run-vs-gke-ai-compute',
    title: 'Cloud Run GPU or Google Kubernetes Engine? Choosing the Right Compute Layer for AI',
    trackId: 'genai-serverless',
    trackLabel: 'GenAI & Serverless',
    formats: ['Talk'],
    durationLabel: '35–40 min',
    participation: 'In-person, Virtual',
    audienceLevels: 'Beginner, Intermediate',
    abstract: [
      'With serverless GPUs on Cloud Run, fully managed nodes on GKE Autopilot, and bare-metal topology control on GKE Standard, Google Cloud offers three compelling ways to run containerized AI services and open-weight models—yet choosing the wrong layer early either slows down product teams or locks in avoidable GPU spend.',
      'This session provides an honest, engineering-driven decision matrix comparing Cloud Run (with and without GPUs), GKE Autopilot, and GKE Standard. Through real workload profiles—API-orchestrated ADK agents, bursty Gemma/vLLM inference, and steady high-throughput batch pipelines—we compare cold-start behavior, concurrency limits, traffic routing, networking, cost crossover points, and operational complexity.',
    ],
    keyTakeaways: [
      'Match workload traffic curves (spiky scale-to-zero vs. steady GPU saturation) to the right compute runtime.',
      'Understand the exact cost and operational crossover point between Cloud Run GPUs and GKE inference pools.',
      'Package containerized Python/Go AI services portably so migrating from Cloud Run to GKE requires zero code rewrites.',
    ],
    whoShouldAttend: [
      'Cloud engineers, startup CTOs, and backend teams choosing how to host AI APIs, MCP servers, and open models.',
    ],
    topics: [
      'Cloud Run',
      'Google Kubernetes Engine (GKE)',
      'Serverless GPUs',
      'GKE Autopilot',
      'Cloud Architecture',
      'Cost Optimization',
      'Google Cloud',
    ],
  },
];

export function formatProposalCopyPayload(session: SessionProposal): string {
  const lines: string[] = [
    `Session Title: ${session.title}`,
    `Format: ${session.formats.join(' / ')} (${session.durationLabel})`,
    `Speaker Participation: ${session.participation}`,
    `Audience Level: ${session.audienceLevels}`,
    '',
    'Session Abstract:',
    ...session.abstract.flatMap((p, idx) => (idx === 0 ? [p] : ['', p])),
    '',
    'Key Takeaways:',
    ...session.keyTakeaways.map((t) => `- ${t}`),
    '',
    'Who Should Attend:',
    ...session.whoShouldAttend.map((w) => `- ${w}`),
  ];

  if (session.prerequisites) {
    lines.push('', `Prerequisites: ${session.prerequisites}`);
  }

  lines.push('', `Topics: ${session.topics.join(', ')}`);
  return lines.join('\n');
}
