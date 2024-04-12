/* SPDX-License-Identifier: MulanPSL-2.0 */

/*

    创建于2024年3月14日 上海市嘉定区
*/


import { useState } from 'react'
import PageRouteManager from '../../common/PageRoutes/PageRouteManager'
import styles from './MyInfo.module.css'
import { useConstructor } from '../../utils/react-functional-helpers'
import { Avatar, Button, Modal, Spin, Typography } from 'antd'
import { UserEntity } from '../../api/Entities'
import { ensureGlobalData, globalData } from '../../common/GlobalData'
import { loadPageToLayoutFrame } from '../../components/LayoutFrame/LayoutFrame'
import DateTimeUtils from '../../utils/DateTimeUtils'

const { Text } = Typography

interface MyProfilePageState {
    userInfo: UserEntity | null
}

export default function MyProfilePage() {
    const pageEntity = PageRouteManager.getRouteEntity('/my-profile')


    /* states */

    const [state, setState] = useState<MyProfilePageState>({
        userInfo: globalData.userEntity
    })
    const [changePwDialogOpen, setChangePwDialogOpen] = useState(false)


    function constructor() {
        loadPageToLayoutFrame(pageEntity)
        ensureGlobalData().then(() => {
            state.userInfo = globalData.userEntity
            setState({...state})
        }).catch(() => {})
    }
    useConstructor(constructor)


    /* render */


    function settings(): React.ReactNode {
        const commonMargin = <div style={{ height: 12 }} />
        const commonWidth = 200

        function changePwModal() {
            return <Modal
                destroyOnClose={true}
                title="修改密码"
                open={changePwDialogOpen}
                centered={true}
                onCancel={() => setChangePwDialogOpen(false)}
            >
                暂不可用。
            </Modal>
        }

        return <div
            style={{
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                display: 'flex'
            }}
        >
            <Button type='primary' shape='round'
                style={{
                    width: commonWidth,
                    maxWidth: '90%'
                }}
                onClick={() => setChangePwDialogOpen(true)}
            >
                修改密码
            </Button>
            { changePwModal() }
        </div>
    
    }


    const avatarWidth = 100

    return <div
        style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        }}
        className='overflow-y-overlay'
    >

        <div style={{height: 64}} />

        <Avatar 
            shape='square'
            src={ 
                'https://i0.wp.com/chiikawahk.com/wp-content/uploads/2023/12/image-3.png' // todo: copyright
                //'https://canfish.oss-cn-shanghai.aliyuncs.com/app/vesper-front/20231208_123408.1.webp' 
            } 
            style={{
                height: avatarWidth,
                width: avatarWidth,
            }}
        />


        <div style={{height: 16}} />

        <Text style={{
            fontSize: 22
        }}>
            { state.userInfo?.username }
        </Text>

        <div style={{height: 16}} />

        <Text>
            {'加入于：'}
            { 
                state.userInfo?.createTime === undefined ?
                '未知时间'
                :
                DateTimeUtils.iso8601toHumanFriendly(
                    state.userInfo?.createTime
                )    
            } 
        </Text>

        <div style={{height: 4}} />

        <Text>
            {'上次登录：'}
            { 
                state.userInfo?.lastLoginTime === undefined ?
                '未知时间'
                :
                DateTimeUtils.iso8601toHumanFriendly(
                    state.userInfo?.lastLoginTime
                )    
            } 
        </Text>

        <div style={{height: 16}} />

        { settings() }
    </div>
}
