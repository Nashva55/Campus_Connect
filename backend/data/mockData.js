const internships = [
  {
    id: "intern-1",
    title: "Frontend Developer Intern",
    company: "PixelForge Labs",
    location: "Remote",
    level: "beginner",
    description: "Build responsive UI screens and improve student-facing features.",
    applyUrl: "https://example.com/apply/frontend-intern"
  },
  {
    id: "intern-2",
    title: "Data Analyst Intern",
    company: "Insight Grid",
    location: "Bengaluru",
    level: "final",
    description: "Work with dashboards, reports, and campus engagement analytics.",
    applyUrl: "https://example.com/apply/data-intern"
  }
];

const companies = [
  {
    id: "company-1",
    name: "Google",
    role: "Software Engineer",
    location: "Hyderabad",
    type: "product"
  },
  {
    id: "company-2",
    name: "Amazon",
    role: "Support Engineer",
    location: "Chennai",
    type: "product"
  },
  {
    id: "company-3",
    name: "TCS",
    role: "Graduate Trainee",
    location: "Remote",
    type: "service"
  }
];

const certifications = [
  {
    id: "cert-1",
    title: "Meta Front-End Developer",
    provider: "Coursera",
    category: "web development",
    enrollUrl: "https://example.com/cert/meta-frontend"
  },
  {
    id: "cert-2",
    title: "Google Data Analytics",
    provider: "Coursera",
    category: "data science",
    enrollUrl: "https://example.com/cert/google-data"
  }
];

const domains = [
  {
    id: "domain-1",
    name: "Web Development",
    summary: "Frontend, backend, APIs, and deployment roadmaps."
  },
  {
    id: "domain-2",
    name: "Data Science and AI",
    summary: "Python, ML basics, data cleaning, and model building."
  },
  {
    id: "domain-3",
    name: "Cloud and DevOps",
    summary: "CI/CD, Docker, cloud deployment, and automation."
  }
];

const interviewPrep = [
  {
    id: "prep-1",
    title: "DSA Practice",
    description: "Solve arrays, strings, linked lists, and graph problems regularly."
  },
  {
    id: "prep-2",
    title: "HR Questions",
    description: "Prepare your introduction, strengths, weaknesses, and project stories."
  }
];

const events = [
  {
    id: "event-1",
    title: "Campus Hackathon",
    date: "2026-04-12",
    location: "Main Auditorium",
    type: "competition"
  },
  {
    id: "event-2",
    title: "AI Career Talk",
    date: "2026-04-18",
    location: "Seminar Hall B",
    type: "session"
  }
];

const notifications = [
  {
    id: "note-1",
    title: "Profile reminder",
    message: "Complete your skills and projects to improve your visibility.",
    read: false
  },
  {
    id: "note-2",
    title: "New internship posted",
    message: "A frontend internship matching your interests is now available.",
    read: false
  }
];

const conversations = [
  {
    id: "chat-1",
    name: "Ananya",
    role: "Classmate",
    messages: [
      {
        id: "msg-1",
        sender: "Ananya",
        text: "Did you apply for the hackathon yet?",
        timestamp: "2026-03-18T09:30:00.000Z"
      },
      {
        id: "msg-2",
        sender: "You",
        text: "Not yet, I am finishing my profile first.",
        timestamp: "2026-03-18T09:35:00.000Z"
      }
    ]
  }
];

module.exports = {
  internships,
  companies,
  certifications,
  domains,
  interviewPrep,
  events,
  notifications,
  conversations
};
