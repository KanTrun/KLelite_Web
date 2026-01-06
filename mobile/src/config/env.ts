import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getLocalHost = () => {
  if (Constants.expoConfig?.hostUri) {
    const host = Constants.expoConfig.hostUri.split(':')[0];
    return `http://${host}:5000/api`;
  }
  return 'http://localhost:5000/api';
};

export const API_URL = Platform.select({
  web: 'http://localhost:5000/api',
  default: getLocalHost(),
});

if (__DEV__) {
  console.log('API_URL configured as:', API_URL);
}
