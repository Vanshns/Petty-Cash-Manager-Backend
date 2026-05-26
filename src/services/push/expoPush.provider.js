// const { Expo } = require("expo-server-sdk");

// const expo = new Expo();

// const sendPushNotification = async ({
//   pushToken,
//   title,
//   body,
//   data = {},
// }) => {
//   try {
//     if (!Expo.isExpoPushToken(pushToken)) {
//       console.log("Invalid Expo push token:", pushToken);
//       return;
//     }

//     const messages = [
//       {
//         to: pushToken,
//         sound: "default",
//         title,
//         body,
//         data,
//       },
//     ];

//     await expo.sendPushNotificationsAsync(messages);
//   } catch (error) {
//     console.error("Push notification error:", error);
//   }
// };

// module.exports = {
//   sendPushNotification,
// };

const {
  Expo,
} = require(
  "expo-server-sdk"
);

const expo =
  new Expo();

const sendPushNotification =
  async ({
    pushToken,
    title,
    body,
    data = {},
  }) => {

    try {

      /*
      |--------------------------------------------------------------------------
      | Push Function Called
      |--------------------------------------------------------------------------
      */

      console.log(
        "---------------------------------"
      );

      console.log(
        "EXPO PUSH FUNCTION CALLED"
      );

      console.log(
        "TOKEN:"
      );

      console.log(
        pushToken
      );

      /*
      |--------------------------------------------------------------------------
      | Validate Expo Token
      |--------------------------------------------------------------------------
      */

      if (
        !Expo.isExpoPushToken(
          pushToken
        )
      ) {

        console.log(
          "INVALID EXPO PUSH TOKEN:"
        );

        console.log(
          pushToken
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Create Message Payload
      |--------------------------------------------------------------------------
      */

      const messages = [
        {
          to: pushToken,

          sound: "default",

          title,

          body,

          data,
        },
      ];

      console.log(
        "MESSAGE PAYLOAD:"
      );

      console.log(
        messages
      );

      /*
      |--------------------------------------------------------------------------
      | Send Notification
      |--------------------------------------------------------------------------
      */

      console.log(
        "SENDING TO EXPO..."
      );

      const response =
        await expo
          .sendPushNotificationsAsync(
            messages
          );

      /*
      |--------------------------------------------------------------------------
      | Expo Response
      |--------------------------------------------------------------------------
      */

      console.log(
        "EXPO RESPONSE:"
      );

      console.log(
        response
      );

      console.log(
        "EXPO PUSH SEND COMPLETED"
      );

      console.log(
        "---------------------------------"
      );

    } catch (error) {

      console.error(
        "PUSH NOTIFICATION ERROR:"
      );

      console.error(
        error
      );

    }
  };

module.exports = {
  sendPushNotification,
};