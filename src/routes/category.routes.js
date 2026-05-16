const express = require("express");

const router = express.Router();

const prisma = require(
  "../config/db"
);

router.get(
  "/",
  async (req, res) => {
    const categories =
      await prisma.category.findMany({
        orderBy: {
          name: "asc",
        },
      });

    return res.status(200).json({
      success: true,

      data: categories,
    });
  }
);

module.exports = router;