const {
  internships,
  companies,
  certifications,
  domains,
  interviewPrep,
  events,
  notifications
} = require("../data/mockData");

function getDashboardData(request, response) {
  response.json({
    stats: {
      internships: internships.length,
      companies: companies.length,
      certifications: certifications.length,
      events: events.length,
      notifications: notifications.filter((item) => !item.read).length
    },
    recentNotifications: notifications,
    upcomingEvents: events
  });
}

function getInternships(request, response) {
  response.json({ internships });
}

function getCompanies(request, response) {
  response.json({ companies });
}

function getCertifications(request, response) {
  response.json({ certifications });
}

function getDomains(request, response) {
  response.json({ domains });
}

function getInterviewPrep(request, response) {
  response.json({ interviewPrep });
}

function getEvents(request, response) {
  response.json({ events });
}

function getNotifications(request, response) {
  response.json({ notifications });
}

module.exports = {
  getDashboardData,
  getInternships,
  getCompanies,
  getCertifications,
  getDomains,
  getInterviewPrep,
  getEvents,
  getNotifications
};
