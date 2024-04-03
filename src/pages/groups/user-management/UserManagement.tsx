// SPDX-License-Identifier: MulanPSL-2.0
/*
 *
 * 创建于 2024年4月1日 上海市嘉定区
 */

import { ensureGlobalData } from "../../../common/GlobalData"
import PageRouteManager from "../../../common/PageRoutes/PageRouteManager"
import { loadPageToLayoutFrame } from "../../../components/LayoutFrame/LayoutFrame"
import { useConstructor } from "../../../utils/react-functional-helpers"


export function UserManagementPage() {

    const pageEntity = PageRouteManager.getRouteEntity("/groups/user-management")

    /* ctor */
    useConstructor(constructor)
    function constructor() {
        ensureGlobalData().then(res => {

            loadPageToLayoutFrame(pageEntity)

        }).catch(() => {})
    }

    /* render */

    return <div>happy!</div>
}


