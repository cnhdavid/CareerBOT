export default function ResourcesPanel({ topic }) {
  if (!topic || topic === "Other") return null;

  const RESOURCES_BY_TOPIC = {
    IT: [
      { label: "Karrierewege in IT (Überblick)", href: "https://roadmap.sh/" },
      { label: "Tech Interview Prep", href: "https://www.pramp.com/" },
      { label: "GitHub Jobs / Karriere", href: "https://github.com/about/careers" },
    ],
    Business: [
      { label: "Bewerbung & Karriere (StepStone Ratgeber)", href: "https://www.stepstone.de/Karriere-Bewerbungstipps/" },
      { label: "LinkedIn Learning (Business Skills)", href: "https://www.linkedin.com/learning/" },
      { label: "Karriere & Gehalt (Glassdoor)", href: "https://www.glassdoor.com/" },
    ],
    Medicine: [
      { label: "Berufe im Gesundheitswesen (Überblick)", href: "https://www.who.int/" },
      { label: "Karriereplattform (allg.)", href: "https://www.linkedin.com/" },
      { label: "CV Beispiele (allg.)", href: "https://www.indeed.com/career-advice/resumes-cover-letters" },
    ],
    Education: [
      { label: "Studienwahl & Orientierung (allg.)", href: "https://www.study.eu/" },
      { label: "Kurse & Upskilling (Coursera)", href: "https://www.coursera.org/" },
      { label: "Zertifikate & Skills (edX)", href: "https://www.edx.org/" },
    ],
    Application: [
      { label: "Lebenslauf-Guide", href: "https://www.indeed.com/career-advice/resumes-cover-letters" },
      { label: "Interview Vorbereitung", href: "https://www.themuse.com/advice/interviewing" },
      { label: "LinkedIn Profil optimieren", href: "https://www.linkedin.com/help/linkedin/" },
    ],
  };

  const resources = RESOURCES_BY_TOPIC[topic] ?? [];

  if (resources.length === 0) return null;

  return (
    <div className="resourcesCard">
      <div className="resourcesTitle">Ressourcen zu: {topic}</div>
      <ul className="resourcesList">
        {resources.map((r) => (
          <li key={r.href}>
            <a href={r.href} target="_blank" rel="noreferrer">
              {r.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
