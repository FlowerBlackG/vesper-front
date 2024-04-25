// SPDX-License-Identifier: MulanPSL-2.0
/*
 *
 * 创建于 2024年4月13日 上海市嘉定区
 */

import { useSearchParams } from 'react-router-dom'
import PageRouteManager from '../../../common/PageRoutes/PageRouteManager'
import styles from './Detail.module.css'
import { useConstructor } from '../../../utils/react-functional-helpers'
import { ensureGlobalData, globalHooks } from '../../../common/GlobalData'
import { Card, Descriptions, Flex, Spin } from 'antd'
import {SeatList, SeatListHandle} from '../../../page-modules/SeatList/SeatList'
import { useRef, useState } from 'react'
import { UserGroupEntity } from '../../../api/Entities'
import { request } from '../../../utils/request'
import DateTimeUtils from '../../../utils/DateTimeUtils'
import { UserManagement } from './UserManagement'


export default function DetailPage() {

    const pageEntity = PageRouteManager.getRouteEntity('/groups/detail')


    /* hooks */

    const [searchParams, setSearchParams] = useSearchParams()
    const message = globalHooks.app.message

    /* ref */

    const seatListRef = useRef(null) as React.RefObject<SeatListHandle> | null

    /* states */

    const [groupInfo, setGroupInfo] = useState<
        (UserGroupEntity) & { membersCount: number, seatsCount: number }
        |    
        null
    >(null)

    const [groupInfoLoading, setGroupInfoLoading] = useState(false)


    /* data */

    const groupId = Number(searchParams.get('groupId'))

    /* ctor */
    useConstructor(constructor)
    function constructor() {

        ensureGlobalData({ resolveLater: true, dontReject: true }).then(res => {

            globalHooks.layoutFrame.loadPageEntity(pageEntity)

            if (!searchParams.has('groupId')) {
                message.warning('groupId required')
                globalHooks.app.navigate!({ pathname: '/groups' })
                return
            }

            loadGroupBasicInfo()
        })
    }

    /* methods */

    function loadGroupBasicInfo() {
        setGroupInfoLoading(true)
        request({
            url: 'group/info',
            params: {
                groupId: groupId
            },
            vfOpts: {
                rejectNonOKResults: true, autoHandleNonOKResults: true,
                giveResDataToCaller: true
            }
        }).then(res => {
            setGroupInfo(res)
        }).catch(err => {}).finally(() => {
            setGroupInfoLoading(false)
        })
    }


    /* render */


    function GroupBasicInfo() {

        return <div style={{
            width: '100%',
            margin: 16
        }}><Spin spinning={groupInfoLoading}>

            <div>基本信息</div>
            
            <Descriptions style={{marginTop: 8}} bordered>
                <Descriptions.Item label='序号' children={groupId} />
                <Descriptions.Item label='名称' children={groupInfo?.groupName} />
                <Descriptions.Item label='创建时间' 
                    children={DateTimeUtils.iso8601toHumanFriendly(groupInfo?.createTime)} 
                />
                <Descriptions.Item label='备注' children={groupInfo?.note} />
                <Descriptions.Item label='成员数' children={groupInfo?.membersCount} />
                <Descriptions.Item label='主机环境数' children={groupInfo?.seatsCount} />
                
            </Descriptions>
        
        </Spin></div>
    }


    return <Flex wrap='wrap' className='overflow-y-overlay'
        style={{
            width: '100%',
            height: '100%',
            position: 'absolute'
        }}
    >
        <GroupBasicInfo />

        <DetailCard title='用户' width='100%' height={400}>
            <UserManagement groupId={groupId} 
                afterAddSeats={() => {
                    seatListRef?.current?.reloadTableData()
                }}
            />
        </DetailCard>

        <DetailCard title='桌面环境' width='100%' height={400}>
            <SeatList groupId={groupId} ref={seatListRef} />
        </DetailCard>

        <div style={{ height: 64 }} />
    </Flex>
}


type DetailCardProps = {
    children: React.ReactNode
    style?: React.CSSProperties
    maxHeight?: number | string
    maxWidth?: number | string
    width?: number | string
    height?: number | string
    title?: string
}

function DetailCard(props: DetailCardProps) {

    const style = {
        ...props.style,

        margin: 16,
        borderRadius: 4,
        position: 'relative',
        border: 'solid 1px #6662',
        marginTop: 8
    } as React.CSSProperties

    for (const key of ['maxWidth', 'maxHeight', 'width', 'height']) {
        const untypedProps = props as any
        const untypedStyle = style as any
        if (untypedProps[key] !== undefined && untypedStyle[key] === undefined) {
            untypedStyle[key] = untypedProps[key]
        }
    }

    if (style.maxHeight === undefined) {
        style.maxHeight = '100%'
    }
    if (style.maxWidth === undefined) {
        style.maxWidth = '100%'
    }


    return <Flex vertical style={style} className={styles.DetailCardShadow}>
        {
            props.title !== undefined &&
            <div
                style={{
                    margin: 8,
                    flexShrink: 0
                }}
            >
                {props.title}
            </div>
        }
        <div style={{ 
            position: 'relative', 
            flexShrink: 0,
            flexGrow: 1,
        }}>
            {props.children}
        </div>
    </Flex>
}
