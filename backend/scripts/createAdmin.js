const dotenv = require("dotenv");
const connectDB = require("../config/db");
const User = require("../models/User");

dotenv.config();

function getArgumentValue(flagName) {
  const flagIndex = process.argv.indexOf(flagName);

  if (flagIndex === -1) {
    return null;
  }

  return process.argv[flagIndex + 1] || null;
}

function getAdminDetails() {
  return {
    name: getArgumentValue("--name") || "CampusConnect Admin",
    email: (getArgumentValue("--email") || "admin@campusconnect.com").trim().toLowerCase(),
    password: getArgumentValue("--password") || "Admin@123"
  };
}

async function createAdmin() {
  try {
    const adminDetails = getAdminDetails();

    if (!adminDetails.name || !adminDetails.email || !adminDetails.password) {
      throw new Error("Name, email, and password are required.");
    }

    if (adminDetails.password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    await connectDB();

    const existingAdmin = await User.findOne({ email: adminDetails.email });

    if (existingAdmin) {
      console.log(`Admin already exists for email: ${adminDetails.email}`);
      process.exit(0);
    }

    await User.create({
      name: adminDetails.name.trim(),
      email: adminDetails.email,
      password: adminDetails.password,
      role: "admin"
    });

    console.log("Admin created successfully.");
    console.log(`Name: ${adminDetails.name}`);
    console.log(`Email: ${adminDetails.email}`);
    console.log(`Password: ${adminDetails.password}`);
    process.exit(0);
  } catch (error) {
    console.error("Unable to create admin:", error.message);
    process.exit(1);
  }
}

createAdmin();
