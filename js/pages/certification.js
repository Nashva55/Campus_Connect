const courses = [
  {
    title: "Fundamentals of Digital Marketing",
    provider: "Google Digital Garage",
    skill: "Marketing",
    description: "Build practical digital marketing foundations across search, social, email, and analytics.",
    link: "https://learndigital.withgoogle.com/digitalgarage/course/digital-marketing"
  },
  {
    title: "Responsive Web Design",
    provider: "freeCodeCamp",
    skill: "Web Development",
    description: "Learn modern layout, accessibility, and responsive UI building for real websites.",
    link: "https://www.freecodecamp.org/learn/responsive-web-design/"
  },
  {
    title: "Introduction to Data Science",
    provider: "IBM",
    skill: "Data Science",
    description: "Understand the data science workflow, tools, and career paths in analytics and AI.",
    link: "https://www.ibm.com/skills/learn/data-science"
  },
  {
    title: "Azure Fundamentals",
    provider: "Microsoft Learn",
    skill: "Cloud",
    description: "Get started with core cloud concepts, Azure services, and deployment basics.",
    link: "https://learn.microsoft.com/en-us/training/paths/azure-fundamentals/"
  },
  {
    title: "Google Cloud Digital Leader",
    provider: "Google Cloud",
    skill: "Cloud",
    description: "Explore cloud transformation, infrastructure, and business-focused Google Cloud concepts.",
    link: "https://www.cloudskillsboost.google/paths/9"
  },
  {
    title: "Google Data Analytics",
    provider: "Google",
    skill: "Data Science",
    description: "Practice spreadsheets, SQL, visualization, and core analytics workflows.",
    link: "https://www.coursera.org/professional-certificates/google-data-analytics"
  },
  {
    title: "Introduction to Cybersecurity",
    provider: "Cisco",
    skill: "Cybersecurity",
    description: "Learn core security concepts, common threats, and responsible digital practices.",
    link: "https://www.netacad.com/courses/cybersecurity/introduction-cybersecurity"
  },
  {
    title: "Python for Everybody",
    provider: "University of Michigan",
    skill: "Programming",
    description: "Start coding with Python and build strong problem-solving basics for technical roles.",
    link: "https://www.coursera.org/specializations/python"
  }
];

const grid = document.getElementById("courseGrid");
const searchInput = document.getElementById("searchInput");
const skillFilter = document.getElementById("skillFilter");
const resultsMeta = document.getElementById("resultsMeta");

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function updateResultsMeta(count, searchText, selectedSkill) {
  const activeSkill = selectedSkill === "all" ? "All skills" : selectedSkill;

  if (!count) {
    resultsMeta.textContent = "No certifications match the current search.";
    return;
  }

  if (searchText) {
    resultsMeta.textContent = `${count} result${count === 1 ? "" : "s"} for "${searchText}" in ${activeSkill}`;
    return;
  }

  resultsMeta.textContent = `${count} certification${count === 1 ? "" : "s"} available in ${activeSkill}`;
}

function displayCourses(list, searchText = "", selectedSkill = "all") {
  grid.innerHTML = "";
  updateResultsMeta(list.length, searchText, selectedSkill);

  if (!list.length) {
    grid.innerHTML = `
      <div class="empty-courses">
        <h3>No certifications found</h3>
        <p>Try another skill filter or search term.</p>
      </div>`;
    return;
  }

  list.forEach((course) => {
    const card = document.createElement("article");
    card.className = "course-card";

    card.innerHTML = `
      <div class="course-card-top">
        <span class="course-chip">Curated</span>
        <div>
          <h3>${escapeHTML(course.title)}</h3>
          <p class="course-provider">${escapeHTML(course.provider)}</p>
        </div>
        <span class="course-tag">${escapeHTML(course.skill)}</span>
        <p class="course-description">${escapeHTML(course.description)}</p>
      </div>
      <div class="course-card-actions">
        <span class="provider-badge">Trusted provider</span>
        <a href="${course.link}" target="_blank" rel="noopener noreferrer" class="enroll-btn">Open Course</a>
      </div>
    `;

    grid.appendChild(card);
  });
}

function filterCourses() {
  const searchText = searchInput.value.trim().toLowerCase();
  const selectedSkill = skillFilter.value;

  const filtered = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchText) ||
      course.skill.toLowerCase().includes(searchText) ||
      course.provider.toLowerCase().includes(searchText);

    const matchesSkill = selectedSkill === "all" || course.skill === selectedSkill;
    return matchesSearch && matchesSkill;
  });

  displayCourses(filtered, searchInput.value.trim(), selectedSkill);
}

searchInput.addEventListener("input", filterCourses);
skillFilter.addEventListener("change", filterCourses);

displayCourses(courses);
