async function getMyProfile(request, response) {
  response.json({
    user: request.user.toSafeObject()
  });
}

async function updateMyProfile(request, response) {
  try {
    const {
      name,
      college,
      year,
      email,
      username,
      profilePhoto,
      skills,
      projects,
      certifications
    } = request.body;

    if (typeof name === "string") {
      request.user.name = name.trim() || request.user.name;
    }

    if (typeof college === "string") {
      request.user.college = college.trim() || request.user.college;
    }

    if (typeof year === "string") {
      request.user.year = year.trim() || request.user.year;
    }

    if (typeof email === "string" && email.trim()) {
      request.user.email = email.trim().toLowerCase();
    }

    if (typeof username === "string" && username.trim()) {
      request.user.username = username.trim().toLowerCase();
    }

    if (typeof profilePhoto === "string") {
      request.user.profilePhoto = profilePhoto;
    }

    if (Array.isArray(skills)) {
      request.user.skills = skills.map((item) => String(item).trim()).filter(Boolean);
    }

    if (Array.isArray(projects)) {
      request.user.projects = projects.map((item) => String(item).trim()).filter(Boolean);
    }

    if (Array.isArray(certifications)) {
      request.user.certifications = certifications.map((item) => String(item).trim()).filter(Boolean);
    }

    await request.user.save();

    response.json({
      message: "Profile updated successfully.",
      user: request.user.toSafeObject()
    });
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({ message: "Email or username already exists." });
    }

    response.status(500).json({ message: "Unable to update profile.", error: error.message });
  }
}

module.exports = {
  getMyProfile,
  updateMyProfile
};
