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

  // ✅ OPTIONAL: Wenn du im Dev Client keine RevenueCat Calls willst, aktivieren:
  // if (__DEV__) {
  //   didInit = true;
  //   return;
  // }

  const apiKey = getApiKey();

  if (!apiKey) {
    console.warn(
      "[RevenueCat] Missing API key. Set EXPO_PUBLIC_RC_IOS_API_KEY / EXPO_PUBLIC_RC_ANDROID_API_KEY"
    );
    // nicht initialisieren, sonst wird’s später doppelt versucht
    return;
  }

  // Logs nur in Dev
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  try {
    Purchases.configure({
      apiKey: "appl_JOmuxVQsEPVPSlWIVselscpMHvh",
      appUserID: userId, // optional
    });

    didInit = true;
  } catch (e) {
    console.warn("[RevenueCat] configure() failed:", e);
    // didInit NICHT true setzen, falls du später mit validem key neu starten willst
  }
}

export async function setRevenueCatUser(userId: string) {
  // ✅ logIn erst sinnvoll, wenn initRevenueCat schon configured hat
  if (!didInit) {
    await initRevenueCat(userId);
    // falls kein key -> initRevenueCat returned ohne init -> dann abbrechen
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

export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<CustomerInfo> {
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

export function isPro(info: CustomerInfo) {
  return Boolean(info.entitlements.active?.[PRO_ENTITLEMENT_ID]);
}
