

// const multer = require("multer");

// const storage = multer.memoryStorage();

// const fileFilter = (req, file, cb) => {
//   const allowedMimeTypes = [
//     "image/jpeg",
//     "image/jpg",
//     "image/png",
//     "image/webp",
//     "application/pdf", // Added to support vendor invoices & receipts
//   ];

//   if (!allowedMimeTypes.includes(file.mimetype)) {
//     return cb(
//       new Error("Invalid file type. Only images (JPEG, PNG, WEBP) and PDFs are allowed."),
//       false
//     );
//   }

//   cb(null, true);
// };

// const upload = multer({
//   storage,
//   fileFilter,
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB limit
//   },
// });

// module.exports = upload;


const multerS3 = require("multer-s3");

const multer = require("multer");

const { v4: uuidv4 } = require("uuid");

const { S3Client } = require("@aws-sdk/client-s3");

/*
|--------------------------------------------------------------------------
| S3 Client Configuration
|--------------------------------------------------------------------------
*/

const s3 = new S3Client({
  credentials: {
    accessKeyId:
      process.env.AWS_ACCESS_KEY_ID,

    secretAccessKey:
      process.env.AWS_SECRET_ACCESS_KEY,
  },

  region: process.env.AWS_REGION,

  endpoint: process.env.AWS_ENDPOINT,

  forcePathStyle: true,
});

/*
|--------------------------------------------------------------------------
| Allowed File Types
|--------------------------------------------------------------------------
*/

const fileFilter = (
  req,
  file,
  cb
) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  if (
    !allowedMimeTypes.includes(
      file.mimetype
    )
  ) {
    return cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, WEBP and PDF files are allowed."
      ),
      false
    );
  }

  cb(null, true);
};

/*
|--------------------------------------------------------------------------
| Multer S3 Upload Middleware
|--------------------------------------------------------------------------
*/

const upload = multer({
  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },

  storage: multerS3({
    s3,

    bucket:
      process.env.AWS_BUCKET_NAME,

    acl: "public-read",

    contentType:
      multerS3.AUTO_CONTENT_TYPE,

    key: function (
      req,
      file,
      cb
    ) {
      /*
      |--------------------------------------------------------------------------
      | Generate Unique Filename
      |--------------------------------------------------------------------------
      */

      const extension =
        file.originalname
          .split(".")
          .pop();

      const filename =
        `${uuidv4()}.${extension}`;

      /*
      |--------------------------------------------------------------------------
      | Store ONLY filename for database usage
      |--------------------------------------------------------------------------
      | Example:
      |   abc123.jpg
      |--------------------------------------------------------------------------
      */

      file.generatedName =
        filename;

      /*
      |--------------------------------------------------------------------------
      | Actual S3 Object Key
      |--------------------------------------------------------------------------
      | Example:
      | bookeventz-files/html/pravaayu.com/pettycash/abc123.jpg
      |--------------------------------------------------------------------------
      */

      const key =
        `bookeventz-files/html/pravaayu.com/pettycash/${filename}`;

      cb(null, key);
    },
  }),
});

module.exports = upload;