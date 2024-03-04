// SPDX-License-Identifier: MulanPSL-2.0

import { ForwardedRef, useState } from "react"

/*
 * 
 * 创建于2024年3月4日 上海市嘉定区
 */

export const useConstructor = (callback = () => {}) => {
    const [hasBeenCalled, setHasBeenCalled] = useState(false)
    if (hasBeenCalled) {
        return
    }

    callback()
    setHasBeenCalled(true)
}
