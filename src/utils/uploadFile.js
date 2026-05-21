// const minioClient = require(
//   "../config/minio"
// );

// const { v4: uuidv4 } = require("uuid");

// const uploadFile = async (file) => {
//   const fileExtension =
//     file.originalname.split(".").pop();

//   const fileName =
//     `${uuidv4()}.${fileExtension}`;

//   await minioClient.putObject(
//     process.env.MINIO_BUCKET_NAME,

//     fileName,

//     file.buffer,

//     file.size,

//     {
//       "Content-Type": file.mimetype,
//     }
//   );

//   return `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${process.env.MINIO_BUCKET_NAME}/${fileName}`;
// };

// module.exports = uploadFile;