import axios from 'axios';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salaryRange?: string;
  type: string;
  createdAt: any;
  url: string;
  isLocal?: boolean;
}

// Determine the base URL for API calls
// In development, it uses relative paths (proxied by Vite)
// In production (Vercel), it uses relative paths which are handled by vercel.json rewrites
const API_BASE = '';

export const fetchRealJobs = async (query: string, location: string, country: string = 'gb'): Promise<Job[]> => {
  try {
    // 1. Fetch from Adzuna (Global/UK)
    const adzunaPromise = axios.get(`${API_BASE}/api/jobs`, {
      params: {
        query: query || 'software',
        location: location || 'london',
        country: country,
      },
    }).catch((e) => {
      console.error("Adzuna fetch failed:", e);
      return { data: { results: [] } };
    });

    // 2. Fetch from Jooble (Excellent for Africa, UAE, etc.)
    const jooblePromise = axios.post(`${API_BASE}/api/jobs/jooble`, {
      query: query || 'software',
      location: location || 'Uganda',
    }).catch((e) => {
      console.error("Jooble fetch failed:", e);
      return { data: { jobs: [] } };
    });

    // 3. Fetch from JSearch via RapidAPI (Excellent for Uganda/East Africa)
    const jsearchPromise = axios.get(`${API_BASE}/api/jobs/jsearch`, {
      params: {
        query: query || 'software',
        location: location || 'Uganda',
      },
    }).catch((e) => {
      console.error("JSearch fetch failed:", e);
      return { data: { data: [] } };
    });

    // Wait for all APIs to return
    const [adzunaRes, joobleRes, jsearchRes] = await Promise.all([adzunaPromise, jooblePromise, jsearchPromise]);

    // Format Adzuna Jobs
    const adzunaJobs = (adzunaRes.data.results || []).map((job: any) => ({
      id: `adzuna_${job.id}`,
      title: job.title,
      company: job.company.display_name,
      location: job.location.display_name,
      description: job.description,
      salaryRange: job.salary_min ? `${job.salary_min} - ${job.salary_max}` : undefined,
      type: 'Full-time',
      createdAt: new Date(job.created),
      url: job.redirect_url,
    }));

    // Format Jooble Jobs
    const joobleJobs = (joobleRes.data.jobs || []).map((job: any) => ({
      id: `jooble_${job.id}`,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.snippet,
      salaryRange: job.salary || undefined,
      type: 'Full-time',
      createdAt: new Date(job.updated || Date.now()),
      url: job.link || '#',
    }));

    // Format JSearch Jobs
    const jsearchJobs = (jsearchRes.data.data || []).map((job: any) => ({
      id: `jsearch_${job.job_id}`,
      title: job.job_title,
      company: job.employer_name,
      location: `${job.job_city || ''} ${job.job_country || ''}`,
      description: job.job_description,
      type: job.job_employment_type || 'Full-time',
      createdAt: new Date(job.job_posted_at_datetime_utc || Date.now()),
      url: job.job_apply_link || '#',
    }));

    // Combine all arrays
    return [...jsearchJobs, ...joobleJobs, ...adzunaJobs];
  } catch (error) {
    console.error('Error fetching jobs from APIs:', error);
    return [];
  }
};
