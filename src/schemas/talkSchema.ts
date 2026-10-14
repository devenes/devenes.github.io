import { z } from 'zod';

export const ClusterIdSchema = z.enum(['ai', 'k8s', 'cloud', 'workshops']);

export const ClusterSchema = z.object({
  id: ClusterIdSchema,
  label: z.string(),
  subLabel: z.string(),
  color: z.string(),
  anchor: z.tuple([z.number(), z.number(), z.number()]),
});

export const TalkSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1), // Used to deduplicate multiple talks at the same conference event
  title: z.string().min(1),
  event: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  countryCode: z.string().length(2), // ISO-3166 alpha-2 e.g. "KZ", "TR", "XK"
  coords: z.tuple([z.number(), z.number()]), // [lat, lng]
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['keynote', 'conference', 'workshop']),
  primaryCluster: ClusterIdSchema,
  topics: z.array(ClusterIdSchema).min(1),
  featured: z.boolean().optional().default(false),
  summary: z.string().optional(),
  image: z.string().refine((val) => !val.startsWith('/'), {
    message: 'Image path must be relative (no leading slash) for GitHub Pages BASE_URL compatibility',
  }),
  links: z.object({
    event: z.string().optional().default(''),
    slides: z.string().optional().default(''),
    video: z.string().optional().default(''),
  }),
});

export const OrbitArchiveSchema = z.object({
  speaker: z.object({
    name: z.string(),
    role: z.string(),
    tagline: z.string(),
    subTagline: z.string(),
    baseCity: z.string(),
    baseCoords: z.tuple([z.number(), z.number()]),
    careerBaseline: z
      .object({
        useCareerFloor: z.boolean(),
        talksFloor: z.number(),
        countriesFloor: z.number(),
        citiesFloor: z.number(),
      })
      .optional(),
  }),
  clusters: z.array(ClusterSchema).length(4),
  talks: z.array(TalkSchema).min(1),
});

export type ClusterId = z.infer<typeof ClusterIdSchema>;
export type Cluster = z.infer<typeof ClusterSchema>;
export type Talk = z.infer<typeof TalkSchema>;
export type OrbitArchive = z.infer<typeof OrbitArchiveSchema>;
