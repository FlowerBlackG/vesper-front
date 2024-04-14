/* SPDX-License-Identifier: MulanPSL-2.0 */

/*

    创建于2024年3月27日 上海市嘉定区
*/

import PageRouteManager from '../../common/PageRoutes/PageRouteManager'
import SeatList from '../../page-modules/SeatList/SeatList'


export default function SeatsPage() {
    return <SeatList pageEntity={ PageRouteManager.getRouteEntity('/seats') } />
}
