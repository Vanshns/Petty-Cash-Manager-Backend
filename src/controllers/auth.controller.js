// const asyncHandler = require("../utils/asyncHandler");

// const authService = require("../services/auth.service");

// const login = asyncHandler(async (req, res) => {
//   const result = await authService.login(
//     req.validatedData
//   );

//   res.cookie("refreshToken", result.refreshToken, {
//     httpOnly: true,
//     secure: false,
//     sameSite: "strict",
//   });

//   return res.status(200).json({
//     success: true,
//     message: "Login successful",
//     data: {
//       accessToken: result.accessToken,
//       account: {
//         id: result.account.id,
//         username: result.account.username,
//         role: result.account.role,
//       },
//     },
//   });
// });

// const me = asyncHandler(async (req, res) => {
//   return res.status(200).json({
//     success: true,
//     data: {
//       id: req.user.id,
//       username: req.user.username,
//       role: req.user.role,
//     },
//   });
// });

// const refreshAccessToken = asyncHandler(
//   async (req, res) => {
//     const refreshToken = req.cookies.refreshToken;

//     const accessToken =
//       await authService.refreshAccessToken(
//         refreshToken
//       );

//     return res.status(200).json({
//       success: true,
//       data: {
//         accessToken,
//       },
//     });
//   }
// );

// const logout = asyncHandler(async (req, res) => {
//   const refreshToken = req.cookies.refreshToken;

//   await authService.logout(refreshToken);

//   res.clearCookie("refreshToken");

//   return res.status(200).json({
//     success: true,
//     message: "Logout successful",
//   });
// });

// module.exports = {
//   login,
//   me,
//   refreshAccessToken,
//   logout,
// };

const asyncHandler =
  require("../utils/asyncHandler");

const authService =
  require("../services/auth.service");

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

const login = asyncHandler(
  async (req, res) => {

    const result =
      await authService.login(
        req.validatedData,
      );

    return res.status(200).json({
      success: true,

      message:
        "Login successful",

      data: {

        accessToken:
          result.accessToken,

        refreshToken:
          result.refreshToken,

        account: {
          id:
            result.account.id,

          username:
            result.account
              .username,

          role:
            result.account
              .role,
        },
      },
    });
  },
);

/*
|--------------------------------------------------------------------------
| Current User
|--------------------------------------------------------------------------
*/

const me = asyncHandler(
  async (req, res) => {

    return res.status(200).json({
      success: true,

      data: {
        id: req.user.id,

        username:
          req.user.username,

        role: req.user.role,
      },
    });
  },
);

/*
|--------------------------------------------------------------------------
| Refresh Access Token
|--------------------------------------------------------------------------
*/

const refreshAccessToken =
  asyncHandler(
    async (req, res) => {

      const {
        refreshToken,
      } = req.body;

      const accessToken =
        await authService.refreshAccessToken(
          refreshToken,
        );

      return res.status(200).json({
        success: true,

        data: {
          accessToken,
        },
      });
    },
  );

/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
*/

const logout = asyncHandler(
  async (req, res) => {

    const {
      refreshToken,
    } = req.body;

    await authService.logout(
      refreshToken,
    );

    return res.status(200).json({
      success: true,

      message:
        "Logout successful",
    });
  },
);

module.exports = {
  login,
  me,
  refreshAccessToken,
  logout,
};