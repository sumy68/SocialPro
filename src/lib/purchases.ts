// src/lib/purchases.ts
import { Platform } from "react-native";
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOfferings,
  PurchasesPackage,
} from "react-native-purchases";

let didInit = false;

function getApiKey() {
  const iosKey = process.env.EXPO_PUBLIC_RC_IOS_API_KEY;
  const androidKey = process.env.EXPO_PUBLIC_RC_ANDROID_API_KEY;

  if (Platform.OS === "ios") return iosKey;
  if (Platform.OS === "android") return androidKey;
  return undefined;
}

export async function initRevenueCat(userId?: string) {
  if (didInit) return;

  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn(
      "[RevenueCat] Missing API key. Set EXPO_PUBLIC_RC_IOS_API_KEY / EXPO_PUBLIC_RC_ANDROID_API_KEY"
    );
    return;
  }

  // Logs nur in Dev (optional)
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  Purchases.configure({
    apiKey,
    appUserID: userId, // optional
  });

  didInit = true;
}

export async function setRevenueCatUser(userId: string) {
  // kannst du callen sobald du einen Login/User hast
  // (nach initRevenueCat oder auch davor, beides ok)
  await Purchases.logIn(userId);
}

export async function logoutRevenueCatUser() {
  await Purchases.logOut();
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

// Helper: check entitlement
export function hasEntitlement(info: CustomerInfo, entitlementId: string) {
  return Boolean(info.entitlements.active?.[entitlementId]);
}

// --- Entitlement helpers ---
export const PRO_ENTITLEMENT_ID = "pro"; 
// ⚠️ Muss GENAU so heißen wie dein Entitlement in RevenueCat Dashboard!

export function isPro(info: import("react-native-purchases").CustomerInfo) {
  return Boolean(info.entitlements.active?.[PRO_ENTITLEMENT_ID]);
}
