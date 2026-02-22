const courses = [
  {
    title: "Fundamentals of Digital Marketing",
    provider: "Google Digital Garage",
    skill: "Marketing",
    link: "https://learndigital.withgoogle.com/digitalgarage/course/digital-marketing"
  },
  {
    title: "Responsive Web Design",
    provider: "freeCodeCamp",
    skill: "Web Development",
    link: "https://www.freecodecamp.org/learn/responsive-web-design/"
  },
  {
    title: "Introduction to Data Science",
    provider: "IBM",
    skill: "Data Science",
    link: "https://www.ibm.com/skills/learn/data-science"
  },
  {
    title: "Azure Fundamentals",
    provider: "Microsoft Learn",
    skill: "Cloud",
    link: "https://learn.microsoft.com/en-us/training/paths/azure-fundamentals/"
  },
  {
    title: "Google Cloud Digital Leader",
    provider: "Google Cloud",
    skill: "Cloud",
    link: "https://www.cloudskillsboost.google/paths/9"
  },
  {
    title: "Google Data Analytics",
    provider: "Google",
    skill: "Data Science",
    link: "https://www.coursera.org/professional-certificates/google-data-analytics"
  },
  {
    title: "Introduction to Cybersecurity",
    provider: "Cisco",
    skill: "Cybersecurity",
    link: "https://www.netacad.com/courses/cybersecurity/introduction-cybersecurity"
  },
  {
    title: "Python for Everybody",
    provider: "University of Michigan",
    skill: "Programming",
    link: "https://www.coursera.org/specializations/python"
  }
];

const grid = document.getElementById("courseGrid");
const searchInput = document.getElementById("searchInput");
const skillFilter = document.getElementById("skillFilter");

function displayCourses(list) {
  grid.innerHTML = "";

  list.forEach(course => {
    const card = document.createElement("div");
    card.className = "course-card";

    card.innerHTML = `
      <div>
        <h3>${course.title}</h3>
        <p class="provider">Provider: ${course.provider}</p>
        <span class="tag">${course.skill}</span>
      </div>
      <a href="${course.link}" target="_blank" class="enroll-btn">Enroll Now</a>
    `;

    grid.appendChild(card);
  });
}
function filterCourses() {
  const searchText = searchInput.value.toLowerCase();
  const selectedSkill = skillFilter.value;

  const filtered = courses.filter(course => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchText) ||
      course.skill.toLowerCase().includes(searchText);

    const matchesSkill =
      selectedSkill === "all" || course.skill === selectedSkill;

    return matchesSearch && matchesSkill;
  });

  displayCourses(filtered);
}
searchInput.addEventListener("input", filterCourses);
skillFilter.addEventListener("change", filterCourses);

// Initial load
displayCourses(courses);