// SPDX-License-Identifier: MulanPSL-2.0
/*
 *
 * 创建于 2024年3月28日 上海市嘉定区
 */

import { ensureGlobalData } from "../../common/GlobalData";
import PageRouteManager from "../../common/PageRoutes/PageRouteManager";
import { loadPageToLayoutFrame } from "../../components/LayoutFrame/LayoutFrame";
import { useConstructor } from "../../utils/react-functional-helpers";

export default function GroupsPage() {

    const pageEntity = PageRouteManager.getRouteEntity('/groups')


    /* states */


    /* constructor */

    useConstructor(constructor)
    function constructor() {
        
        ensureGlobalData().then(() => {

            loadPageToLayoutFrame(pageEntity)
        
        }).catch(() => {})
    
    }



    /* methods */


    
    /* render */

    return <div style={{
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        display: 'flex',
        flexDirection: 'column',
        
    }}>

    </div>

}
