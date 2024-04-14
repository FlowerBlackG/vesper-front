/* SPDX-License-Identifier: MulanPSL-2.0 */

/*

    创建于2024年3月31日 上海市嘉定区
*/


import { Card, Progress, ProgressProps } from "antd"
import { ensureGlobalData, globalHooks } from "../../common/GlobalData"
import PageRouteManager from "../../common/PageRoutes/PageRouteManager"
import { loadPageToLayoutFrame } from "../../components/LayoutFrame/LayoutFrame"
import { useConstructor } from "../../utils/react-functional-helpers"
import { request } from "../../utils/request"
import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"


const data = {
    pageActive: true
}


const pageConfig = {
    fetchDataRefreshIntervalMs: 3000
}


export default function SystemLoadPage() {

    const pageEntity = PageRouteManager.getRouteEntity("/system-load")


    /* states */

    const [memoryTotal, setMemoryTotal] = useState(0)
    const [memoryAvailable, setMemoryAvailable] = useState(0)
    const [swapTotal, setSwapTotal] = useState(0)
    const [swapFree, setSwapFree] = useState(0)

    const [cpuUsage, setCpuUsage] = useState(0.0)  // Double: 0 .. 100

    
    /* ctor */

    useConstructor(constructor)
    function constructor() {
        globalHooks.layoutFrame.setCurrentPageEntity(pageEntity)
        ensureGlobalData().then(() => {
            data.pageActive = true
            fetchData()
        }).catch(() => {})
    }


    const handleBeforeUnload = () => {
        data.pageActive = false
    }

    useEffect(() => {
        window.addEventListener("beforeunload", handleBeforeUnload)

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload)

            handleBeforeUnload()
        }
    }, [])


    /* methods */

    function fetchData(autoRefresh: boolean = true) {
        loadMemoryUsage()
        loadCpuUsage()
        
        if (autoRefresh) {
            setTimeout(() => {
                
                if (data.pageActive) {
                    fetchData(true)
                }
                
            }, pageConfig.fetchDataRefreshIntervalMs)
        }
    }

    function loadMemoryUsage() {
        request({
            url: 'vesperCenter/memoryUsage'
        }).then(res => {
            let data = res.data
            setMemoryAvailable(data.memAvailable)
            setMemoryTotal(data.memTotal)
            setSwapFree(data.swapFree)
            setSwapTotal(data.swapTotal)
        }).catch(() => {})
    }


    function loadCpuUsage() {
        request({
            url: 'vesperCenter/cpuUsage',
            vfOpts: {
                rejectNonOKResults: true,
                autoHandleNonOKResults: true,
                giveResDataToCaller: true
            }
        }).then(res => {
            setCpuUsage(res)
        }).catch(() => {})
    }


    /* render */

    const cardMargin = 4
    const progressColor = {
        '0%': '#2bae85',
        '50%': '#f2ce2b',
        '100%': '#d2357d'
    } as ProgressProps['strokeColor']

    function memoryUsageCard() {

        return <Card
            title="内存"
            style={{
                width: 200,
                margin: cardMargin
            }}
            hoverable
        >
            <p>总量：{ (memoryTotal / 1024 / 1024 / 1024).toFixed(2) } GB</p>
            <p>已用：{ ((memoryTotal - memoryAvailable) / 1024 / 1024 / 1024).toFixed(2) } GB</p>
            <p>可用：{ (memoryAvailable / 1024 / 1024 / 1024).toFixed(2) } GB</p>
            <Progress 
                percent={ Math.min(99, 100 - memoryAvailable / memoryTotal * 100) }
                showInfo={ false }
                strokeColor={ progressColor } 
            />

        </Card>
    }

    function swapUsageCard() {
        return <Card
            title="交换区"
            style={{
                width: 200,
                margin: cardMargin
            }}
            hoverable
        >
            <p>总量：{ (swapTotal / 1024 / 1024 / 1024).toFixed(2) } GB</p>
            <p>已用：{ ((swapTotal - swapFree) / 1024 / 1024 / 1024).toFixed(2) } GB</p>
            <p>可用：{ (swapFree / 1024 / 1024 / 1024).toFixed(2) } GB</p>
            <Progress 
                percent={ Math.min(99, 100 - swapFree / swapTotal * 100) }
                showInfo={ false }
                strokeColor={ progressColor } 
            />

        </Card>
    }

    function cpuUsageCard() {
        return <Card
            title='CPU负载'
            style={{
                width: 200,
                margin: cardMargin
            }}
            hoverable
        >
            <Progress
                type='dashboard'
                percent={ Math.min(99, Number(cpuUsage.toFixed(1))) }
                strokeColor={ progressColor } 
            />
        </Card>
    }

    return <div
        style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
        }}
    >

        { memoryUsageCard() }
        { swapUsageCard() }
        { cpuUsageCard() }

    </div>
}
