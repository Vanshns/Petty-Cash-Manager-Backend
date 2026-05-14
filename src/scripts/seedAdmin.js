require("dotenv").config();

const prisma = require("../config/db");

const { hashPassword } = require("../utils/password");

const seedAdmin = async () => {
  try {
    const existingAdmin = await prisma.account.findFirst({
      where: {
        role: "ADMIN",
      },
    });

    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await hashPassword("Admin@123");

    await prisma.account.create({
      data: {
        username: "admin_main",
        passwordHash: hashedPassword,
        role: "ADMIN",
      },
    });

    console.log("Admin created successfully");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAdmin();