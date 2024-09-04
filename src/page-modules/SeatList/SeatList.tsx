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
import { Button, Divider, Drawer, Flex, Input, Modal, Popover, StepProps, Steps, Switch, Table, TablePaginationConfig, TableProps, Tooltip, message } from 'antd'
import { IResponse, VFRequestCtrlOptions, VFRequestParams, request } from '../../utils/request'
import { DeleteOutlined, PoweroffOutlined } from '@ant-design/icons'
import { HttpStatusCode } from '../../utils/HttpStatusCode'
import { PageRouteData } from '../../common/PageRoutes/TypeDef'
import { GroupPermission, Permission } from '../../api/Permissions'
import { GetSeatsResponseDto, GetSeatsResponseDtoEntry } from '../../api/SeatController'
import Config from '../../common/Config'
import { PagedResult } from '../../api/PagedResult'
import { AutoGrowAntdTable } from '../../components/AutoGrowAntdTable/AutoGrowAntdTable'
import { ChangeNicknameDrawer } from './ChangeNicknameDrawer'
import { SingleClickLoginDialog } from './SingleClickLoginDialog'


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
                fetchData(pagination)
            }
        }
    }, [])


    /* states */

    const [dataLoading, setDataLoading] = useState(false)
    const [tableDataSource, setTableDataSource] = useState<GetSeatsResponseDtoEntry[]>([])

    const [deleteConfirmLoading, setDeleteConfirmLoading] = useState(false)
    const [deleteSeatEntity, setDeleteSeatEntity] = useState<GetSeatsResponseDtoEntry | null>(null)

    const [singleClickLoginSeat, setSingleClickLoginSeat] = useState<GetSeatsResponseDtoEntry | null>(null)
    const [pagination, setPagination] = useState<TablePaginationConfig>({
        current: 1,
        pageSize: 20,
        total: 0
    })

    const [changeNicknameTargetSeat, setChangeNicknameTargetSeat] = useState<GetSeatsResponseDtoEntry | null>(null)

    const [search, setSearch] = useState('')


    /* constructor */
    useConstructor(constructor)
    function constructor() {
        ensureGlobalData().then(() => {
            
            if (props.pageEntity) {
                const pageEntity = props.pageEntity

                if (groupMode) {
                    globalHooks.layoutFrame.setTitle(`${pageEntity.title} - ${groupId} 组`)
                }
            }

            fetchData(pagination)

        }).catch(err => {})
    }

    /* table columns */

    const tableColumns = [
        {
            title: '主机',
            dataIndex: 'id',
            key: 'id',
            render: (_: any, record: GetSeatsResponseDtoEntry) => {

                return <div>
                    <Tooltip title='点击以编辑'>
                        <Button 
                            type='link' 
                            onClick={() => setChangeNicknameTargetSeat(record)}
                        >
                            {record.nickname}
                        </Button>
                    </Tooltip>
                    ({record.id})
                </div>
            }
        },
        {
            title: '组',
            dataIndex: 'groupId',
            key: 'groupId',
            render(_: any, record: GetSeatsResponseDtoEntry) {
                return `${record.groupname} (${record.groupId})`
            }
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

                let switchMode = globalData.userPermissions.has(Permission.DISABLE_OR_ENABLE_ANY_SEAT)
                if (!switchMode && groupMode)
                    switchMode = globalData.groupPermissions.has(groupId, GroupPermission.DISABLE_OR_ENABLE_ANY_SEAT)


                if (switchMode) {

                    return <Switch 
                        checked={seat.seatEnabled} 
                        onChange={(checked) => {
                            request({
                                url: 'seat/enable',
                                method: 'post',
                                vfOpts: {
                                    giveResDataToCaller: true,
                                    rejectNonOKResults: true,
                                    autoHandleNonOKResults: true
                                },
                                data: {
                                    seatId: seat.id,
                                    enabled: checked,
                                    alsoQuit: !checked
                                }
                            }).then(res => {
                                globalHooks.app.message.success('操作成功。')
                                seat.seatEnabled = checked
                                setTableDataSource([...tableDataSource])
                            }).catch(err => {}).finally(() => {

                            })
                        }}
                    />

                } else {

                    return seat.seatEnabled
                        ?
                        <div style={{ color: '#41b349' }}>启用</div> 
                        :
                        <div style={{ color: '#ee3f4d' }}>停用</div> 
                }
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
                            onClick={() => { setSingleClickLoginSeat(record) }}
                        >
                            登录
                        </Button>
                    )

                    buttons.push(
                        <Button type='primary' shape='round' style={buttonStyle}
                            onClick={() => {
                                globalHooks.app.navigate!({
                                    pathname: '/seats/detail',
                                    search: `seatId=${record.id}`
                                })
                            }}
                        >
                            详细
                        </Button>
                    )

                }


                // poweroff
                buttons.push(
                    <Button type='primary' shape='circle' style={buttonStyle}
                        danger
                        icon={<PoweroffOutlined />}
                        onClick={() => {
                            request({
                                url: 'seat/shutdown',
                                method: 'post',
                                data: {
                                    seatId: record.id
                                },
                                vfOpts: {
                                    giveResDataToCaller: true,
                                    rejectNonOKResults: true,
                                    autoHandleNonOKResults: true
                                }
                            }).then(res => {
                                globalHooks.app.message.success('操作成功')
                            }).catch(err => {}).finally(() => {
                                // do nothing.
                            })
                        }}
                    />
                )


                if (
                    globalData.userPermissions.has(Permission.DELETE_ANY_SEAT)
                    ||
                    (
                        record.groupId !== null 
                        &&
                        globalData.groupPermissions.has(record.groupId, GroupPermission.CREATE_OR_DELETE_SEAT)
                    )
                ) {
                    // delete seat
                    buttons.push(
                        <Button type='primary' shape='circle' style={buttonStyle}
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                                setDeleteSeatEntity(record)
                            }}
                        />
                    )
                }

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

    function fetchData(pagination: TablePaginationConfig) {
        setDataLoading(true)
        request({
            url: 'seat/seats',
            params: {
                groupId: groupMode ? groupId : undefined,
                viewAllSeatsInGroup: true,
                pageNo: pagination.current,
                pageSize: pagination.pageSize,
                search: search
            }
        }).then(untypedRes => {
            const res = untypedRes as IResponse<PagedResult<GetSeatsResponseDtoEntry>>
            if (res.code !== HttpStatusCode.OK) {
                message.error(res.msg)
                return
            }

            setPagination({
                total: res.data.total,
                current: res.data.pageNo,
                pageSize: res.data.pageSize
            })
            loadData(res.data.records)
        }).catch(err => {})
        .finally(() => {
            setDataLoading(false)
        })
    }


    function loadData(data: GetSeatsResponseDtoEntry[]) {
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
            fetchData(pagination)
        }).catch(_ => {
            setDataLoading(false)
        })

    }


    /* render */


    const containerStyle = {
        ...props.style,

        flexShrink: 0,
        position: 'absolute',
        width: '100%',
        height: '100%',
    } as React.CSSProperties


    return <Flex vertical
        style={containerStyle}
    >

        { /* filters */ }

        <Flex vertical
            style={{
                marginTop: 4
            }}
        >
            <Flex style={{ height: 32, alignItems: 'center' }}>
                <p>搜索项：</p>
                <Input
                    value={search}
                    onChange={(event) => {
                        setSearch(event.currentTarget.value)
                    }}
                    style={{
                        width: 'auto',
                        height: '100%',
                        flexGrow: 1,
                        
                    }}
                    placeholder='空格分隔搜索词'
                />
            </Flex>
            <Button
                shape='round'
                ghost
                type='primary'
                style={{
                    width: 64,
                    alignSelf: 'end',
                    marginTop: 4
                }}
                onClick={() => fetchData(pagination)}
            >
                确认
            </Button>
        </Flex>

        <AutoGrowAntdTable
            columns={tableColumns}
            dataSource={tableDataSource}
            pagination={pagination}
            onChange={(newPagination) => {
                fetchData(newPagination)
            }}
            loading={dataLoading}
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

        <SingleClickLoginDialog seat={singleClickLoginSeat}
            onClose={() => {setSingleClickLoginSeat(null)}}
        />

        <ChangeNicknameDrawer seat={ changeNicknameTargetSeat } 
            onClose={(newName) => {
                if (newName !== changeNicknameTargetSeat?.nickname) {
                    changeNicknameTargetSeat!.nickname = newName
                    setTableDataSource([...tableDataSource])
                }

                setChangeNicknameTargetSeat(null)
            }} 
        />

    </Flex>
    

})

