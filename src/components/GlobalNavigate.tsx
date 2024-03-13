/* SPDX-License-Identifier: MulanPSL-2.0 */

import { useNavigate } from "react-router-dom"
import { globalHooks } from "../common/GlobalData"

/*

    创建于2024年3月13日 上海市嘉定区
*/

export const GlobalNavigate = () => {
    globalHooks.app.navigate = useNavigate()
    return null
}
