/**
 * Mock job data for development and testing
 * Use this when JOB_API_KEY is not available or for testing the semantic matching system
 */

export const mockJobs = [
  {
    id: "mock-1",
    title: "Senior Frontend Developer",
    company: "TechCorp Inc",
    company_name: "TechCorp Inc",
    location: "San Francisco, CA",
    remote: true,
    url: "https://example.com/jobs/1",
    published_at: new Date().toISOString(),
    description: "We're looking for a Senior Frontend Developer with 5+ years of experience in React, TypeScript, and modern web technologies. You'll lead the development of our customer-facing applications and mentor junior developers.",
    requirements: "React, TypeScript, Node.js, 5+ years experience, Team leadership"
  },
  {
    id: "mock-2",
    title: "Full Stack Engineer",
    company: "StartupXYZ",
    company_name: "StartupXYZ",
    location: "New York, NY",
    remote: true,
    url: "https://example.com/jobs/2",
    published_at: new Date().toISOString(),
    description: "Join our fast-growing startup as a Full Stack Engineer. Work with React, Node.js, and PostgreSQL to build scalable web applications.",
    requirements: "React, Node.js, PostgreSQL, 3+ years experience"
  },
  {
    id: "mock-3",
    title: "React Developer",
    company: "Digital Solutions Ltd",
    company_name: "Digital Solutions Ltd",
    location: "Austin, TX",
    remote: false,
    url: "https://example.com/jobs/3",
    published_at: new Date().toISOString(),
    description: "We need a talented React Developer to join our team. You'll work on building responsive web applications using React, Redux, and modern JavaScript.",
    requirements: "React, Redux, JavaScript, CSS, 2+ years experience"
  },
  {
    id: "mock-4",
    title: "Senior Software Engineer",
    company: "Enterprise Tech",
    company_name: "Enterprise Tech",
    location: "Seattle, WA",
    remote: true,
    url: "https://example.com/jobs/4",
    published_at: new Date().toISOString(),
    description: "Looking for a Senior Software Engineer to architect and build enterprise-scale applications. Experience with microservices, cloud platforms, and modern frameworks required.",
    requirements: "React, Node.js, AWS, Microservices, 7+ years experience, Architecture"
  },
  {
    id: "mock-5",
    title: "Frontend Engineer",
    company: "Creative Agency",
    company_name: "Creative Agency",
    location: "Los Angeles, CA",
    remote: true,
    url: "https://example.com/jobs/5",
    published_at: new Date().toISOString(),
    description: "Join our creative team as a Frontend Engineer. Build beautiful, performant web experiences using React, Next.js, and modern CSS frameworks.",
    requirements: "React, Next.js, TailwindCSS, TypeScript, 3+ years experience"
  },
  {
    id: "mock-6",
    title: "Junior Full Stack Developer",
    company: "Learning Platform Inc",
    company_name: "Learning Platform Inc",
    location: "Boston, MA",
    remote: true,
    url: "https://example.com/jobs/6",
    published_at: new Date().toISOString(),
    description: "Great opportunity for a Junior Full Stack Developer to grow their skills. Work with React, Node.js, and MongoDB in a supportive team environment.",
    requirements: "React, Node.js, MongoDB, 1+ years experience, Eager to learn"
  },
  {
    id: "mock-7",
    title: "Lead Frontend Architect",
    company: "FinTech Solutions",
    company_name: "FinTech Solutions",
    location: "Chicago, IL",
    remote: true,
    url: "https://example.com/jobs/7",
    published_at: new Date().toISOString(),
    description: "We're seeking a Lead Frontend Architect to define our frontend strategy and lead a team of developers. Deep expertise in React, TypeScript, and frontend architecture required.",
    requirements: "React, TypeScript, Architecture, Team Leadership, 8+ years experience, FinTech"
  },
  {
    id: "mock-8",
    title: "React Native Developer",
    company: "Mobile First Inc",
    company_name: "Mobile First Inc",
    location: "Denver, CO",
    remote: true,
    url: "https://example.com/jobs/8",
    published_at: new Date().toISOString(),
    description: "Build cross-platform mobile applications using React Native. Work on iOS and Android apps used by millions of users.",
    requirements: "React Native, JavaScript, iOS, Android, 3+ years experience"
  },
  {
    id: "mock-9",
    title: "Frontend Developer",
    company: "E-commerce Giant",
    company_name: "E-commerce Giant",
    location: "Portland, OR",
    remote: false,
    url: "https://example.com/jobs/9",
    published_at: new Date().toISOString(),
    description: "Join our e-commerce platform team as a Frontend Developer. Build high-performance shopping experiences with React and Next.js.",
    requirements: "React, Next.js, E-commerce, Performance optimization, 2+ years experience"
  },
  {
    id: "mock-10",
    title: "Senior React Engineer",
    company: "SaaS Innovators",
    company_name: "SaaS Innovators",
    location: "Remote",
    remote: true,
    url: "https://example.com/jobs/10",
    published_at: new Date().toISOString(),
    description: "Remote-first company seeking a Senior React Engineer to build our SaaS platform. Work with cutting-edge technologies and a talented distributed team.",
    requirements: "React, TypeScript, GraphQL, Testing, 5+ years experience, SaaS"
  },
  {
    id: "mock-11",
    title: "Full Stack JavaScript Developer",
    company: "Media Company",
    company_name: "Media Company",
    location: "Miami, FL",
    remote: true,
    url: "https://example.com/jobs/11",
    published_at: new Date().toISOString(),
    description: "Build content management systems and media platforms using JavaScript across the stack. React, Node.js, and MongoDB experience required.",
    requirements: "React, Node.js, MongoDB, CMS, 4+ years experience"
  },
  {
    id: "mock-12",
    title: "Principal Engineer",
    company: "Tech Unicorn",
    company_name: "Tech Unicorn",
    location: "San Francisco, CA",
    remote: true,
    url: "https://example.com/jobs/12",
    published_at: new Date().toISOString(),
    description: "Lead technical initiatives as a Principal Engineer. Drive architecture decisions, mentor engineers, and shape our technical direction.",
    requirements: "React, System Design, Leadership, 10+ years experience, Startup experience"
  }
];

/**
 * Filter mock jobs based on query
 */
export function filterMockJobs(query, location, remote) {
  let filtered = [...mockJobs];

  // Filter by query (title, company, description)
  if (query) {
    const lowerQuery = query.toLowerCase();
    filtered = filtered.filter(job => 
      job.title.toLowerCase().includes(lowerQuery) ||
      job.company.toLowerCase().includes(lowerQuery) ||
      (job.description && job.description.toLowerCase().includes(lowerQuery)) ||
      (job.requirements && job.requirements.toLowerCase().includes(lowerQuery))
    );
  }

  // Filter by location
  if (location) {
    const lowerLocation = location.toLowerCase();
    filtered = filtered.filter(job =>
      job.location.toLowerCase().includes(lowerLocation)
    );
  }

  // Filter by remote
  if (remote === true) {
    filtered = filtered.filter(job => job.remote === true);
  }

  return filtered;
}
