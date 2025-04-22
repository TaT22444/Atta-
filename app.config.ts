import 'dotenv/config';

// export default ({ config }) => ({
//   ...config,
//   extra: {
//     googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
//   },
// });

export default {
  expo: {
    name: "Atta",
    slug: "Atta",
    scheme: "Atta",
    extra: {
      googleMapsApiKey: "AIzaSyAy0m4eC_DwrwW4x8mouclfTMsqdMsElec",
      firebaseWebClientId: "823481101265-j4vknpoh096rig29e929jjo3fvsp24jn.apps.googleusercontent.com"
    },
    linking: {
      "scheme": "Atta",
      "prefixes": ["https://auth.expo.io/@tat22444/Atta", "Atta://"]
    },
    newArchEnabled: true
  },
};
