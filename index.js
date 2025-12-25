/**
 * @format
 */

import "react-native-get-random-values"
import { getRandomValues } from "react-native-get-random-values"
import { Buffer } from "buffer"

Object.assign(global, {
  Buffer: Buffer,
  crypto: {
    getRandomValues,
  },
})

import { AppRegistry } from "react-native"
import App from "./src/App"
import { name as appName } from "./app.json"

AppRegistry.registerComponent(appName, () => App)
