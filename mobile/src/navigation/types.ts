import { NavigatorScreenParams } from '@react-navigation/native';
import { Product } from '@shared/types/product';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type ShopStackParamList = {
  ProductList: undefined;
  ProductDetail: { slug: string; product?: Product };
};

export type CartStackParamList = {
  Cart: undefined;
  Checkout: undefined;
  OrderSuccess: undefined;
};

export type TabParamList = {
  Home: undefined;
  Shop: NavigatorScreenParams<ShopStackParamList>;
  Cart: NavigatorScreenParams<CartStackParamList>;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<TabParamList>;
};
