const prisma = require("../config/db");

const {
  hashPassword,
} = require("../utils/password");

const ROLES = require(
  "../constants/roles"
);

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const ensureUsernameAvailable =
  async (username) => {
    const existingAccount =
      await prisma.account.findUnique({
        where: {
          username,
        },
      });

    if (existingAccount) {
      throw new Error(
        "Username already exists"
      );
    }
  };

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/

const createAdmin = async (
  data
) => {
  const {
    username,
    password,
  } = data;

  await ensureUsernameAvailable(
    username
  );

  const passwordHash =
    await hashPassword(password);

  return prisma.account.create({
    data: {
      username,

      passwordHash,

      role: ROLES.ADMIN
    },
  });
};

/*
|--------------------------------------------------------------------------
| Accountant
|--------------------------------------------------------------------------
*/

const createAccountant =
  async (data) => {
    const {
      username,
      password,
    } = data;

    await ensureUsernameAvailable(
      username
    );

    const passwordHash =
      await hashPassword(password);

    return prisma.account.create({
      data: {
        username,

        passwordHash,

        role: ROLES.ACCOUNTANT
      },
    });
  };

/*
|--------------------------------------------------------------------------
| Centre
|--------------------------------------------------------------------------
*/

const createCentre = async (
  data
) => {
  const {
    username,
    password,
    centreName,
    minimumBalance,
    transactionLimit,
  } = data;

  await ensureUsernameAvailable(
    username
  );

  const passwordHash =
    await hashPassword(password);

  return prisma.$transaction(
    async (tx) => {
      const account =
        await tx.account.create({
          data: {
            username,

            passwordHash,

            role: ROLES.CENTRE
          },
        });

      await tx.centre.create({
        data: {
          name: centreName,

          balance: 0,

          minimumBalance,

          transactionLimit,

          accountId:
            account.id,
        },
      });

      return account;
    }
  );
};

/*
|--------------------------------------------------------------------------
| Categories
|--------------------------------------------------------------------------
*/

const createCategory =
  async (name) => {

    const normalizedName =
      name.trim();

    return prisma.category.create({
      data: {
        name: normalizedName,
      },
    });
  };

const getCategories =
  async () => {
    return prisma.category.findMany({
      where: {
        isActive: true,
      },

      orderBy: {
        name: "asc",
      },
    });
  };

const archiveCategory =
  async (categoryId) => {

    return prisma.category.update({
      where: {
        id: categoryId,
      },

      data: {
        isActive: false,
      },
    });
  };
/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

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
          role:
            "ACCOUNTANT",
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

/*
|--------------------------------------------------------------------------
| Accounts
|--------------------------------------------------------------------------
*/

const getAccounts =
  async () => {
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

  const resetPassword =
  async ({
    accountId,
    newPassword,
  }) => {
    const passwordHash =
      await hashPassword(
        newPassword
      );

    return prisma.account.update({
      where: {
        id: accountId,
      },

      data: {
        passwordHash,
      },
    });
  };

module.exports = {
  createAdmin,

  createAccountant,

  createCentre,

  createCategory,

  getDashboardMetrics,

  getAccounts,

  resetPassword,

  getCategories,

  archiveCategory,
};