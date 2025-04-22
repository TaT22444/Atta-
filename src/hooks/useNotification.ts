import * as Notifications from 'expo-notifications';

export const useNotification = () => {
  const triggerNotification = async (title: string, body: string) => {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  };

  return { triggerNotification };
};
