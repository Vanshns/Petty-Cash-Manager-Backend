// const multer = require("multer");

// const storage = multer.memoryStorage();

// const fileFilter = (req, file, cb) => {
//   const allowedMimeTypes = [
//     "image/jpeg",
//     "image/jpg",
//     "image/png",
//     "image/webp",
//   ];

//   if (
//     !allowedMimeTypes.includes(file.mimetype)
//   ) {
//     return cb(
//       new Error("Invalid file type"),
//       false
//     );
//   }

//   cb(null, true);
// };

// const upload = multer({
//   storage,

//   fileFilter,

//   limits: {
//     fileSize: 5 * 1024 * 1024,
//   },
// });

// module.exports = upload;

const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf", // Added to support vendor invoices & receipts
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new Error("Invalid file type. Only images (JPEG, PNG, WEBP) and PDFs are allowed."),
      false
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

module.exports = upload;