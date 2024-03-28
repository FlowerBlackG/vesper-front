/* SPDX-License-Identifier: MulanPSL-2.0 */

/*

    创建于2024年3月27日 上海市嘉定区
*/

import { Spin, message } from 'antd'
import PageRouteManager from '../../common/PageRoutes/PageRouteManager'
import { loadPageToLayoutFrame, setLayoutFrameTitle } from '../../components/LayoutFrame/LayoutFrame'
import { useConstructor } from '../../utils/react-functional-helpers'
import { IResponse, request } from '../../utils/request'
import styles from './MySeats.module.css'
import { useState } from 'react'
import { HttpStatusCode } from '../../utils/HttpStatusCode'
import { SeatEntity } from '../../api/Entities'
import { ensureGlobalData } from '../../common/GlobalData'
import { useSearchParams } from 'react-router-dom'


/**
 * 环境列表页面。
 * 该页面同时具备使用和管理功能。
 * 
 * 使用：
 *   该页面展示用户拥有的所有 seats。
 * 
 * 管理：
 *   该页面展示用户掌管的所有 seats，并可执行一些管理操作。
 * 
 * todo: 未完成。产品逻辑有待仔细考量。
 */
export default function SeatsPage() {



    const pageEntity = PageRouteManager.getRouteEntity('/seats')


    const [searchParams, setSearchParams] = useSearchParams()
    const groupMode = searchParams.has('group')
    let groupId = groupMode ? Number(searchParams.get('group')) : -1


    /* states */
    const [dataLoading, setDataLoading] = useState(false)

    /* constructor */
    useConstructor(constructor)
    function constructor() {
        ensureGlobalData().then(() => {
            
            loadPageToLayoutFrame(pageEntity)
            fetchData()


            if (groupMode) {
                setLayoutFrameTitle(pageEntity.title!.concat(` - ${groupId} 组`))
            }

        }).catch(err => {})
    }




    /* methods */
    function fetchData() {
        setDataLoading(true)
        request({
            url: 'seat/seats'
        }).then(res => {
            res = res as IResponse
            if (res.code !== HttpStatusCode.OK) {
                message.error(res.msg)
                return
            }

            loadData(res.data as SeatEntity[])
        }).catch(err => {})
        .finally(() => {
            setDataLoading(false)
        })
    }


    function loadData(data: SeatEntity[]) {

    }


    /* render */

    return <div
        style={{        
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}
    ><Spin spinning={ dataLoading }>
123
    </Spin></div>
    

}
