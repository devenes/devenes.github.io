export interface SocialProfileLink {
  id: string;
  platform: string;
  handle: string;
  url: string;
  category: 'social' | 'engineering';
}

export interface SpeakerHeadshot {
  id: string;
  title: string;
  caption: string;
  assetPath: string;
  downloadFilename: string;
  width: number;
  height: number;
  aspectLabel: string;
  fileSizeLabel: string;
}

export interface FeaturedTalkProposal {
  id: string;
  title: string;
  description: string;
  formats: string;
  audience: string;
  topics: string[];
}

export const SPEAKER_PROFILE = {
  name: 'Enes Turan',
  jobTitle: 'Software Engineer',
  company: 'JumpCloud',
  recognition: 'Google Developer Expert',
  roleHeadline: 'Software Engineer at JumpCloud · Google Developer Expert',
  homeBase: 'Istanbul, Türkiye',
  airports: 'IST / SAW',
  languages: 'English, Turkish',
  standardBio:
    'Enes Turan is a Software Engineer at JumpCloud and a Google Developer Expert. He specializes in cloud-native technologies, Kubernetes, platform engineering, and multi-cloud architectures. His work focuses on building secure, scalable, and efficient platforms for modern applications and AI workloads, bridging the gap between cloud infrastructure and artificial intelligence.',
  shortBio:
    'Enes Turan is a Software Engineer at JumpCloud and a Google Developer Expert specializing in cloud-native technologies, Kubernetes, platform engineering, and scalable infrastructure for AI workloads.',
  socialLinks: [
    {
      id: 'linkedin',
      platform: 'LinkedIn',
      handle: 'linkedin.com/in/devenes',
      url: 'https://www.linkedin.com/in/devenes/',
      category: 'social',
    },
    {
      id: 'instagram',
      platform: 'Instagram',
      handle: '@enes.ai',
      url: 'https://www.instagram.com/enes.ai/',
      category: 'social',
    },
    {
      id: 'x',
      platform: 'X (Twitter)',
      handle: '@thedevenes',
      url: 'https://x.com/thedevenes',
      category: 'social',
    },
    {
      id: 'facebook',
      platform: 'Facebook',
      handle: 'Enes Turan',
      url: 'https://www.facebook.com/profile.php?id=100087441315629',
      category: 'social',
    },
    {
      id: 'github',
      platform: 'GitHub',
      handle: '@devenes',
      url: 'https://github.com/devenes',
      category: 'engineering',
    },
    {
      id: 'speakerdeck',
      platform: 'Speaker Deck',
      handle: 'speakerdeck.com/devenes',
      url: 'https://speakerdeck.com/devenes',
      category: 'engineering',
    },
    {
      id: 'medium',
      platform: 'Medium',
      handle: '@devenes',
      url: 'https://medium.com/@devenes',
      category: 'engineering',
    },
  ] satisfies SocialProfileLink[],
  headshots: [
    {
      id: 'portrait-studio',
      title: 'Portrait Headshot (Front-Facing)',
      caption:
        'Best for conference websites, speaker directories, agenda thumbnails, and square badges.',
      assetPath: 'assets/profile/enes-turan-pp-2.jpg',
      downloadFilename: 'Enes-Turan-Portrait-Headshot-1254x1254.jpg',
      width: 1254,
      height: 1254,
      aspectLabel: '1:1 Square',
      fileSizeLabel: '285 KB · High-Res JPG',
    },
    {
      id: 'keynote-stage',
      title: 'Keynote Stage Photograph',
      caption:
        'Best for keynote announcements, editorial features, event banners, and social cards.',
      assetPath: 'assets/profile/enes-turan-pp.jpg',
      downloadFilename: 'Enes-Turan-Keynote-Stage-1254x1254.jpg',
      width: 1254,
      height: 1254,
      aspectLabel: '1:1 Square',
      fileSizeLabel: '188 KB · High-Res JPG',
    },
  ] satisfies SpeakerHeadshot[],
  featuredTalks: [
    {
      id: 'gke-ai-at-scale',
      title: 'Kubernetes for AI at Scale on Google Kubernetes Engine',
      description:
        'As AI agents and inference workloads become increasingly dynamic and resource-intensive, Kubernetes infrastructure must evolve beyond traditional container orchestration. This talk explores how Google Kubernetes Engine enables scalable AI infrastructure through secure, isolated execution environments for agents, faster workload startup, dynamic resource adjustments without unnecessary restarts, hardware-aware resource allocation, and intelligent inference traffic routing. By connecting these capabilities across the agent, compute, and networking layers, we will explore how to build more efficient, responsive, and adaptable infrastructure for AI workloads at scale.',
      formats: 'Keynote · 35–45 min Conference Session',
      audience: 'Cloud, Platform, Kubernetes & AI Infrastructure Engineers',
      topics: [
        'Google Kubernetes Engine (GKE)',
        'AI Agent Sandboxing',
        'Inference Traffic Routing',
        'Hardware-Aware Scheduling',
        'Dynamic Pod Scaling',
      ],
    },
  ] satisfies FeaturedTalkProposal[],
} as const;
