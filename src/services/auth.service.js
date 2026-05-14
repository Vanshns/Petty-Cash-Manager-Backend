const prisma = require("../config/db");

const {
  comparePassword,
} = require("../utils/password");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/jwt");

const login = async ({ username, password }) => {
  const account = await prisma.account.findUnique({
    where: {
      username,
    },
  });

  if (!account) {
    throw new Error("Invalid credentials");
  }

  const isPasswordValid = await comparePassword(
    password,
    account.passwordHash
  );

  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const payload = {
    id: account.id,
    role: account.role,
  };

  const accessToken = generateAccessToken(payload);

  const refreshToken = generateRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      accountId: account.id,
      expiresAt: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ),
    },
  });

  return {
    account,
    accessToken,
    refreshToken,
  };
};

const jwt = require("jsonwebtoken");

const refreshAccessToken = async (token) => {
  if (!token) {
    throw new Error("Refresh token missing");
  }

  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      token,
    },
  });

  if (!storedToken) {
    throw new Error("Invalid refresh token");
  }

  const decoded = jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET
  );

  const account = await prisma.account.findUnique({
    where: {
      id: decoded.id,
    },
  });

  if (!account) {
    throw new Error("Account not found");
  }

  const accessToken = generateAccessToken({
    id: account.id,
    role: account.role,
  });

  return accessToken;
};

const logout = async (token) => {
  if (!token) return;

  await prisma.refreshToken.deleteMany({
    where: {
      token,
    },
  });
};

module.exports = {
  login,
  refreshAccessToken,
  logout,
};