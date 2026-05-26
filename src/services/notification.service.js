// const prisma =
//   require("../config/db");

// const {
//   sendPushNotification,
// } = require("./push/expoPush.provider");

// const createAndSendNotification = async ({
//   accountId,
//   type,
//   title,
//   message,
//   metadata = {},
// }) => {
//   // Create DB notification
//   await prisma.notification.create({
//     data: {
//       accountId,
//       type,
//       title,
//       message,
//       metadata,
//     },
//   });

//   // Fetch active devices
//   const devices = await prisma.device.findMany({
//     where: {
//       accountId,
//       isActive: true,
//     },
//   });

//   // Send push notifications
//   await Promise.all(
//     devices.map((device) =>
//       sendPushNotification({
//         pushToken: device.pushToken,
//         title,
//         body: message,
//         data: metadata,
//       })
//     )
//   );
// };

// module.exports = {
//   createAndSendNotification,
// };

const prisma =
  require("../config/db");

const {
  sendPushNotification,
} = require(
  "./push/expoPush.provider"
);

const createAndSendNotification =
  async ({
    accountId,
    type,
    title,
    message,
    metadata = {},
  }) => {

    /*
    |--------------------------------------------------------------------------
    | Notification Service Called
    |--------------------------------------------------------------------------
    */

    console.log(
      "================================="
    );

    console.log(
      "NOTIFICATION SERVICE CALLED"
    );

    console.log({
      accountId,
      type,
      title,
      message,
      metadata,
    });

    /*
    |--------------------------------------------------------------------------
    | Create DB Notification
    |--------------------------------------------------------------------------
    */

    const notification =
      await prisma.notification.create({
        data: {
          accountId,
          type,
          title,
          message,
          metadata,
        },
      });

    console.log(
      "NOTIFICATION SAVED TO DB"
    );

    console.log(notification);

    /*
    |--------------------------------------------------------------------------
    | Fetch Active Devices
    |--------------------------------------------------------------------------
    */

    const devices =
      await prisma.device.findMany({
        where: {
          accountId,
          isActive: true,
        },
      });

    console.log(
      "DEVICES FOUND:"
    );

    console.log(devices);

    /*
    |--------------------------------------------------------------------------
    | No Devices Found
    |--------------------------------------------------------------------------
    */

    if (
      devices.length === 0
    ) {

      console.log(
        "NO ACTIVE DEVICES FOUND"
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Send Push Notifications
    |--------------------------------------------------------------------------
    */

    await Promise.all(

      devices.map(
        async (device) => {

          console.log(
            "SENDING PUSH TO:"
          );

          console.log(
            device.pushToken
          );

          return sendPushNotification({
            pushToken:
              device.pushToken,

            title,

            body: message,

            data: metadata,
          });

        }
      )

    );

    console.log(
      "PUSH NOTIFICATION FLOW COMPLETED"
    );

    console.log(
      "================================="
    );

  };

module.exports = {
  createAndSendNotification,
};