const prisma = require("../config/db");

const { hashPassword } = require("../utils/password");

const createAccount = async (data) => {
  const {
    username,
    password,
    role,
    centreName,
    minimumBalance,
    transactionLimit,
  } = data;

  const existingAccount =
    await prisma.account.findUnique({
      where: {
        username,
      },
    });

  if (existingAccount) {
    throw new Error("Username already exists");
  }

  const passwordHash =
    await hashPassword(password);

  return prisma.$transaction(async (tx) => {
    const account = await tx.account.create({
      data: {
        username,
        passwordHash,
        role,
      },
    });

    if (role === "CENTRE") {
      if (
        !centreName ||
        minimumBalance == null ||
        transactionLimit == null
      ) {
        throw new Error(
          "Centre configuration is required"
        );
      }

      await tx.centre.create({
        data: {
          name: centreName,

          balance: 0,

          minimumBalance,

          transactionLimit,

          accountId: account.id,
        },
      });
    }

    return account;
  });
};

const createCategory = async (name) => {
  return prisma.category.create({
    data: {
      name,
    },
  });
};

const getDashboardMetrics =
  async () => {
    const [
      totalCentres,
      totalAccountants,
      totalAdmins,
    ] = await Promise.all([
      prisma.centre.count(),

      prisma.account.count({
        where: {
          role: "ACCOUNTANT",
        },
      }),

      prisma.account.count({
        where: {
          role: "ADMIN",
        },
      }),
    ]);

    return {
      totalCentres,
      totalAccountants,
      totalAdmins,
    };
  };

  const getAccounts = async () => {
  return prisma.account.findMany({
    orderBy: {
      createdAt: "desc",
    },

    select: {
      id: true,

      username: true,

      role: true,

      createdAt: true,
    },
  });
};

module.exports = {
  createAccount,
  createCategory,
  getDashboardMetrics,
  getAccounts,
};