/**
 * Seeker Hardware Detection Service
 * Detects Solana Seeker device capabilities and optimizes app accordingly
 */

import { Dimensions, Platform } from "react-native"
import DeviceInfo from "react-native-device-info"

export interface SeekerDeviceInfo {
  isSeekerDevice: boolean
  screenSize: "compact" | "normal" | "large"
  processor: string
  ramGB: number
  isOLEDScreen: boolean
  androidVersion: number
  batteryCapacity: number
}

export class SeekerDetector {
  static async detectDevice(): Promise<SeekerDeviceInfo> {
    const { width, height } = Dimensions.get("window")
    const isTablet = Platform.isPad || (width > 700 && height > 700)

    // Get device info
    const manufacturer = await DeviceInfo.getManufacturer()
    const model = await DeviceInfo.getModel()
    const systemVersion = await DeviceInfo.getSystemVersion()
    const totalMemory = await DeviceInfo.getTotalMemory()

    // Detect if it's a Seeker device
    const isSeekerDevice =
      manufacturer.toLowerCase().includes("qualcomm") &&
      (model.toLowerCase().includes("seeker") || model.toLowerCase().includes("solana"))

    // Determine screen size
    let screenSize: "compact" | "normal" | "large" = "normal"
    const diagonal = Math.sqrt(width * width + height * height)
    if (diagonal < 500) screenSize = "compact"
    else if (diagonal > 600) screenSize = "large"

    // Estimate processor (Snapdragon 7+ Gen 1 for Seeker)
    const processor = isSeekerDevice ? "Snapdragon 7+ Gen 1" : model

    // Get RAM in GB
    const ramGB = Math.round(totalMemory / 1073741824) // Convert bytes to GB

    // Seeker typically has OLED display
    const isOLEDScreen = isSeekerDevice

    // Parse Android version
    const androidVersion = Number.parseInt(systemVersion)

    // Approximate battery (Seeker has ~4100 mAh)
    const batteryCapacity = isSeekerDevice ? 4100 : 3500

    return {
      isSeekerDevice,
      screenSize,
      processor,
      ramGB,
      isOLEDScreen,
      androidVersion,
      batteryCapacity,
    }
  }

  static async optimizeForDevice(deviceInfo: SeekerDeviceInfo) {
    const optimizations = {
      // OLED optimization: reduce brightness of dark areas
      useOLEDOptimization: deviceInfo.isOLEDScreen,

      // Memory optimization for lower-end devices
      disableImageCaching: deviceInfo.ramGB < 6,
      limitBackgroundProcesses: deviceInfo.ramGB < 6,

      // Battery optimization
      enableBatteryMode: true,
      reduceAnimationFrameRate: deviceInfo.batteryCapacity < 4000,

      // Screen optimization
      fontSize: deviceInfo.screenSize === "large" ? 1.2 : 1,
      paddingMultiplier: deviceInfo.screenSize === "large" ? 1.3 : 1,

      // Network optimization
      compressionLevel: deviceInfo.ramGB < 4 ? "high" : "medium",
    }

    return optimizations
  }

  static async logDeviceInfo() {
    const deviceInfo = await this.detectDevice()
    console.log("[Seeker Detector]", {
      message: "Device detected",
      details: deviceInfo,
      timestamp: new Date().toISOString(),
    })
  }
}
