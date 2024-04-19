/* SPDX-License-Identifier: MulanPSL-2.0 */
/*

    创建于2024年4月13日 上海市嘉定区
*/

import { useSearchParams } from 'react-router-dom'
import PageRouteManager from '../../common/PageRoutes/PageRouteManager'
import styles from './SeatsList.module.css'
import React, { useState } from 'react'
import { ensureGlobalData, globalData, globalHooks } from '../../common/GlobalData'
import { useConstructor } from '../../utils/react-functional-helpers'
import { SeatEntity } from '../../api/Entities'
import { Button, Input, Modal, Popover, Spin, Table, message } from 'antd'
import { IResponse, request } from '../../utils/request'
import { DeleteOutlined } from '@ant-design/icons'
import { HttpStatusCode } from '../../utils/HttpStatusCode'
import { PageRouteData } from '../../common/PageRoutes/TypeDef'
import { GroupPermission, Permission } from '../../api/Permissions'


export interface SeatListProps {
    groupId?: number

    /** 传入 pageEntity 表示让该模块接管整个页面。 */
    pageEntity?: PageRouteData

    style?: React.CSSProperties
}

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
export default function SeatList(props: SeatListProps) {

    const groupMode = props.groupId !== undefined
    const groupId = groupMode ? props.groupId : undefined


    /* states */
    const [dataLoading, setDataLoading] = useState(false)
    const [tableDataSource, setTableDataSource] = useState([] as any[])

    const [deleteConfirmLoading, setDeleteConfirmLoading] = useState(false)
    const [deleteSeatEntity, setDeleteSeatEntity] = useState<SeatEntity | null>(null)

    /* constructor */
    useConstructor(constructor)
    function constructor() {
        ensureGlobalData().then(() => {
            
            if (props.pageEntity) {
                const pageEntity = props.pageEntity
                globalHooks.layoutFrame.setCurrentPageEntity(pageEntity)

                if (groupMode) {
                    globalHooks.layoutFrame.setTitle(`${pageEntity.title} - ${groupId} 组`)
                }
            }

            fetchData()

        }).catch(err => {})
    }

    /* table columns */

    const tableColumns = [
        {
            title: '主机',
            dataIndex: 'id',
            key: 'id',
            render: (_: any, record: SeatEntity) => {

                const ChangeNicknamePopover = () => {
                    const [confirmLoading, setConfirmLoading] = useState(false)
                    let newName = ''

                    const PopOverContent = () => {
                        return <div>
                            修改主机名
                            <div style={{height: 8}} />
                            <Input placeholder={record.nickname} disabled={confirmLoading}
                                onChange={(e) => {
                                    newName = e.target.value
                                }}
                            />
                            <div style={{height: 8}} />
                            <Button type='primary' shape='round' style={{width: '100%'}} 
                                disabled={confirmLoading}
                                onClick={() => {
                                    let name = newName
                                    setConfirmLoading(true)
                                    request({
                                        url: 'seat/name',
                                        method: 'post',
                                        data: {
                                            seatId: record.id,
                                            name: name
                                        },
                                        vfOpts: {
                                            rejectNonOKResults: true, 
                                            autoHandleNonOKResults: true, 
                                            giveResDataToCaller: true
                                        }
                                    }).then(res => {
                                        globalHooks.app.message.success('成功')
                                        record.nickname = name
                                    }).catch(err => {}).finally(() => {
                                        setConfirmLoading(false)
                                    })
                                }}
                            >
                                确认
                            </Button>
                        </div>
                    }

                    return <Popover destroyTooltipOnHide={true} content={<PopOverContent/>}>
                        <Button type='link'>{record.nickname}</Button>
                    </Popover>
                }

                return <div>
                    <ChangeNicknamePopover />
                    ({record.id})
                </div>
            }
        },
        {
            title: '组号',
            dataIndex: 'groupId',
            key: 'groupId',
        },
        {
            title: 'linux账户',
            dataIndex: 'linuxUid',
            key: 'linuxUid',
            render: (_: any, record: SeatEntity) => {
                return `${record.linuxLoginName} (${record.linuxUid})`
            }
        },
        {
            title: '备注',
            dataIndex: 'note',
            key: 'note'
        },
        {
            title: '操作',
            key: 'user-op',
            render(_: any, record: SeatEntity) {
                let buttons = []

                const buttonStyle = {
                    margin: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                } as React.CSSProperties

                if (
                    record.userId === globalData.userEntity?.id
                    || 
                    globalData.userPermissions.has(Permission.LOGIN_TO_ANY_SEAT)
                    || 
                    (
                        record.groupId
                        && 
                        globalData.groupPermissions.has(
                            record.groupId, GroupPermission.LOGIN_TO_ANY_SEAT
                        )
                    )
                ) {
                    buttons.push(
                        <Button type='primary' shape='round' style={buttonStyle}
                            onClick={() => {
                                globalHooks.app.navigate!({
                                    pathname: '/seats/detail',
                                    search: `seatId=${record.id}`
                                })
                            }}
                        >
                            进入
                        </Button>
                    )
                }

                buttons.push(
                    <Button type='primary' shape='circle' style={buttonStyle}
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => {
                            setDeleteSeatEntity(record)
                        }}
                    />
                )

                return <div style={{
                    display: 'flex',
                    flexWrap: 'wrap'
                }}>
                    {buttons}
                </div>
            }
        }
    ]


    /* methods */
    function fetchData() {
        setDataLoading(true)
        request({
            url: 'seat/seats',
            params: {
                groupId: groupMode ? groupId : undefined,
                viewAllSeatsInGroup: true
            }
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
        setTableDataSource(data)
    }


    /* render */


    const containerStyle = {
        ...props.style,

        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'absolute',
        width: '100%',
        height: '100%',
    } as React.CSSProperties


    return <div
        style={containerStyle}
        className='overflow-y-overlay overflow-x-overlay'
    ><Spin spinning={ dataLoading }>


        <Table
            columns={tableColumns}
            dataSource={tableDataSource}
        />

        { /* delete seat dialog */ }
        <Modal
            open={deleteSeatEntity !== null}
            destroyOnClose={true}
            centered={true}
            title={`删除：${deleteSeatEntity?.nickname}`}
            confirmLoading={deleteConfirmLoading}
            onCancel={() => setDeleteSeatEntity(null)}
            maskClosable={true}
            okText='立即删除'
            okButtonProps={{
                danger: true,
                type: 'primary'
            }}
            cancelText='取消'
            onOk={() => {
                setDeleteConfirmLoading(true)
                request({
                    url: 'seat/delete',
                    method: 'post',
                    vfOpts: {
                        rejectNonOKResults: true, autoHandleNonOKResults: true,
                        giveResDataToCaller: true
                    },
                    data: {
                        seatIds: [deleteSeatEntity?.id]
                    }
                }).then(res => {
                    const thisRes = res[0]

                    if (thisRes.success) {
                        setDeleteSeatEntity(null)
                        tableDataSource.splice(tableDataSource.indexOf(deleteSeatEntity))
                        setTableDataSource([...tableDataSource])
                        globalHooks.app.message.success('删除成功')
                    } else {
                        globalHooks.app.message.error(`失败：${thisRes.msg}`)        
                    }
                    
                }).catch(err => {}).finally(() => {
                    setDeleteConfirmLoading(false)
                })
            }}
        >
            <p>这将删除该主机下的所有文件。</p>
            <p>此操作无法撤销！</p>

        </Modal>

    </Spin></div>
    

}
