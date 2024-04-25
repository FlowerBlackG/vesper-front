/* SPDX-License-Identifier: MulanPSL-2.0 */
/*

    创建于2024年4月13日 上海市嘉定区
*/

import { useSearchParams } from 'react-router-dom'
import PageRouteManager from '../../common/PageRoutes/PageRouteManager'
import styles from './SeatsList.module.css'
import React, { forwardRef, useImperativeHandle, useState } from 'react'
import { ensureGlobalData, globalData, globalHooks } from '../../common/GlobalData'
import { useConstructor } from '../../utils/react-functional-helpers'
import { SeatEntity } from '../../api/Entities'
import { Button, Flex, Input, Modal, Popover, Spin, Table, message } from 'antd'
import { IResponse, request } from '../../utils/request'
import { DeleteOutlined } from '@ant-design/icons'
import { HttpStatusCode } from '../../utils/HttpStatusCode'
import { PageRouteData } from '../../common/PageRoutes/TypeDef'
import { GroupPermission, Permission } from '../../api/Permissions'
import { GetSeatsResponseDto, GetSeatsResponseDtoEntry } from '../../api/SeatController'


export interface SeatListProps {
    groupId?: number

    /** 传入 pageEntity 表示让该模块接管整个页面。 */
    pageEntity?: PageRouteData

    style?: React.CSSProperties
}


export type SeatListHandle = {
    reloadTableData: () => void
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
export const SeatList = forwardRef(function (props: SeatListProps, ref) {

    const groupMode = props.groupId !== undefined
    const groupId = groupMode ? props.groupId : undefined


    /* ref */

    useImperativeHandle(ref, () => {
        return {
            reloadTableData() {
                fetchData()
            }
        }
    }, [])


    /* states */

    const [dataLoading, setDataLoading] = useState(false)
    const [tableDataSource, setTableDataSource] = useState<GetSeatsResponseDto>([])

    const [deleteConfirmLoading, setDeleteConfirmLoading] = useState(false)
    const [deleteSeatEntity, setDeleteSeatEntity] = useState<GetSeatsResponseDtoEntry | null>(null)

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
            render: (_: any, record: GetSeatsResponseDtoEntry) => {

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
            title: '用户',
            dataIndex: 'userId',
            key: 'userId',
            render(_: any, record: GetSeatsResponseDtoEntry) {
                return `${record.username} (${record.userId})`
            }
        },
        {
            title: 'linux账户',
            dataIndex: 'linuxUid',
            key: 'linuxUid',
            hidden: true,
            render: (_: any, record: GetSeatsResponseDtoEntry) => {
                return `${record.linuxLoginName} (${record.linuxUid})`
            }
        },
        {
            title: '备注',
            dataIndex: 'note',
            key: 'note'
        },
        {
            title: '启用',
            dataIndex: 'seatEnabled',
            key: 'seatEnabled',
            render: (_: any, seat: GetSeatsResponseDtoEntry) => {
                return seat.seatEnabled
                    ?
                    <div style={{ color: '#41b349' }}>启用</div> 
                    :
                    <div style={{ color: '#ee3f4d' }}>停用</div> 
            }
        },
        {
            title: '操作',
            key: 'user-op',
            render(_: any, record: GetSeatsResponseDtoEntry) {
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

            loadData(res.data as GetSeatsResponseDto)
        }).catch(err => {})
        .finally(() => {
            setDataLoading(false)
        })
    }


    function loadData(data: GetSeatsResponseDto) {
        setTableDataSource(data)
    }


    function setEnabledToAll(enabled: boolean) {
        if (!groupMode) {
            return
        }

        setDataLoading(true)
        request({
            url: 'seat/enable',
            method: 'POST',
            data: {
                groupId: groupId,
                enabled: enabled,
                alsoQuit: true
            },
            vfOpts: {
                rejectNonOKResults: true, 
                autoHandleNonOKResults: true,
                giveResDataToCaller: true,
            }
        }).then(res => {
            globalHooks.app.message.success('操作成功')
            fetchData()
        }).catch(_ => {
            setDataLoading(false)
        })

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

    const toolboxHeight = groupMode ? '48px' : '0'

    return <div
        style={containerStyle}
        className='overflow-y-overlay overflow-x-overlay'
    >
        <div style={{
            flexGrow: 1,
            flexShrink: 0,
            height: `calc(100% - ${toolboxHeight})`
        }} className='overflow-y-overlay'>
            <Spin spinning={ dataLoading }>
                <Table
                    columns={tableColumns}
                    dataSource={tableDataSource}
                />
            </Spin>
        </div>


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
                        tableDataSource.splice(tableDataSource.indexOf(deleteSeatEntity!), 1)
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


        {
            /* tools for group mode */

            groupMode &&
            <Flex style={{
                flexShrink: 0,
                height: toolboxHeight,
                padding: 8
            }}>
                <Button 
                    shape='round' ghost type='primary' danger onClick={() => setEnabledToAll(false)}
                    disabled={dataLoading}
                >
                    全部禁用并退出登录
                </Button>

                <div style={{width: 8}} />

                <Button shape='round' ghost type='primary' onClick={() => setEnabledToAll(true)}
                    disabled={dataLoading}
                >
                    全部启用
                </Button>
            </Flex>
        }

    </div>
    

})
