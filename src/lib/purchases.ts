// src/lib/purchases.ts
import { Platform } from "react-native";
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOfferings,
  PurchasesPackage,
} from "react-native-purchases";

let didInit = false;

function pickApiKey() {
  // Expo injiziert EXPO_PUBLIC_* zur Build/Bundle-Zeit
  // @ts-ignore
  const iosKey: string | undefined = process.env.EXPO_PUBLIC_RC_IOS_API_KEY;
  // @ts-ignore
  const androidKey: string | undefined = process.env.EXPO_PUBLIC_RC_ANDROID_API_KEY;

  const key = Platform.OS === "ios" ? iosKey : Platform.OS === "android" ? androidKey : undefined;

  // Debug ohne Key zu leaken:
  const prefix = key ? key.slice(0, 5) : "NONE";
  const len = key ? key.length : 0;
  console.log(`[RevenueCat] Platform=${Platform.OS} keyPrefix=${prefix} keyLen=${len}`);

  return key;
}

export async function initRevenueCat(userId?: string) {
  if (didInit) return;

  const apiKey = pickApiKey();

  // harter Guard
  if (!apiKey || !apiKey.startsWith("appl_")) {
    console.warn(
      `[RevenueCat] Invalid/missing iOS key. Expected appl_. Got: ${apiKey ? apiKey.slice(0, 5) : "NONE"}`
    );
    return;
  }

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  try {
    Purchases.configure({
      apiKey,
      appUserID: userId,
      usesStoreKit2IfAvailable: false,
    });
    didInit = true;
    console.log("[RevenueCat] configure OK");
  } catch (e) {
    console.warn("[RevenueCat] configure() failed:", e);
  }
}

export async function setRevenueCatUser(userId: string) {
  if (!didInit) {
    await initRevenueCat(userId);
    if (!didInit) return;
  }

  try {
    await Purchases.logIn(userId);
  } catch (e) {
    console.warn("[RevenueCat] logIn failed:", e);
  }
}

export async function logoutRevenueCatUser() {
  try {
    await Purchases.logOut();
  } catch (e) {
    console.warn("[RevenueCat] logOut failed:", e);
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}

export async function getOfferings(): Promise<PurchasesOfferings> {
  return Purchases.getOfferings();
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

export const PRO_ENTITLEMENT_ID = "SocialPro Pro";

export function isPro(info: CustomerInfo) {
  return Boolean(info.entitlements.active?.[PRO_ENTITLEMENT_ID]);
}