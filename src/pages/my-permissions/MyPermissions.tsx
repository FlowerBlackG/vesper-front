/* SPDX-License-Identifier: MulanPSL-2.0 */

/*

    创建于2024年3月14日 上海市嘉定区
*/

import { useState } from 'react'
import styles from './MyPermissions.module.css'
import { useConstructor } from '../../utils/react-functional-helpers'
import { ensureGlobalData, globalData } from '../../common/GlobalData'
import { loadPageToLayoutFrame } from '../../components/LayoutFrame/LayoutFrame'
import PageRouteManager from '../../common/PageRoutes/PageRouteManager'
import { Permission } from '../../api/Permissions'
import { PermissionEntity } from '../../api/Entities'
import { Spin, Table, message } from 'antd'
import { IResponse, request } from '../../utils/request'
import { HttpStatusCode } from '../../utils/HttpStatusCode'
import { FreeKeyObject } from '../../utils/FreeKeyObject'


interface MyPermissionsPageState {
    dataSource: FreeKeyObject[]
    dataSourceLoading: boolean
}


const columns = [
    {
        title: '编号',
        dataIndex: 'permissionid',
        key: 'permissionid'
    },
    {
        title: '内部键',
        dataIndex: 'enumKey',
        key: 'enumKey'
    },
    {
        title: '备注',
        dataIndex: 'note',
        key: 'note'
    },
    {
        title: '我有吗',
        dataIndex: 'ihave',
        key: 'ihave'
    }
]


export default function MyPermissionsPage() {
    const pageEntity = PageRouteManager.getRouteEntity('/my-permissions')
    const [state, setState] = useState<MyPermissionsPageState>({
        dataSource: [],
        dataSourceLoading: false
    })


    const constructor = () => {
        loadPageToLayoutFrame(pageEntity)
        ensureGlobalData().then(() => {
            loadData()
        }).catch(() => {})
    }
    useConstructor(constructor)

    function loadData() {
        state.dataSourceLoading = true
        setState({...state})

        request({
            url: 'user/allPermissions'
        }).then(res => {
            res = res as IResponse
            if (res.code !== HttpStatusCode.OK) {
                message.error(res.msg)
                return
            }

            state.dataSource = []
            for (let permission of res.data as PermissionEntity[]) {
                let doIHave = globalData.userPermissions?.includes(permission.id)
                state.dataSource.push({
                    key: permission.id + '',
                    permissionid: permission.id,
                    enumKey: permission.enumKey,
                    note: permission.note,
                    ihave: doIHave ? '✅' : '❌'
                })
            }
        }).catch(() => {})
        .finally(() => {
            state.dataSourceLoading = false
            setState({...state})
        })
    }

    return <div style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'scroll',
        height: '100%',
        width: '100%',
        position: 'absolute'
        
    }} className='overflow-y-overlay nicer-scrollbar'>

        <Spin spinning={state.dataSourceLoading}>
            <Table 
                dataSource={state.dataSource} 
                columns={columns} 
                style={{
                    
                }}
            />
        </Spin>

    </div>

}
