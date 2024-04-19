// SPDX-License-Identifier: MulanPSL-2.0
/*
 *
 * 创建于 2024年4月1日 上海市嘉定区
 */

import { Button, Divider, Drawer, Flex, FloatButton, Image, Modal, Select, Space, Spin, Switch, Table, Tooltip, message } from "antd"
import { ensureGlobalData, globalData, globalHooks } from "../../../common/GlobalData"
import PageRouteManager from "../../../common/PageRoutes/PageRouteManager"
import { loadPageToLayoutFrame } from "../../../components/LayoutFrame/LayoutFrame"
import { useConstructor } from "../../../utils/react-functional-helpers"
import { useState } from "react"
import { IResponse, request } from "../../../utils/request"
import { HttpStatusCode } from "../../../utils/HttpStatusCode"
import { useSearchParams } from "react-router-dom"
import { later } from "../../../utils/later"
import DateTimeUtils from "../../../utils/DateTimeUtils"
import { SeatEntity, UserEntity, UserGroupEntity } from "../../../api/Entities"
import { GroupPermission } from "../../../api/Permissions"
import { PlusOutlined, UploadOutlined, UserAddOutlined, UsergroupAddOutlined } from "@ant-design/icons"

import '../../../index.css'
import Dragger from "antd/es/upload/Dragger"
import CSVSheet from "../../../utils/CSVSheet"
import { CreateSeatsResponseDto } from "../../../api/SeatController"


interface UserManagementProps {
    groupId: number | null | undefined
}

export function UserManagement(props: UserManagementProps) {

    /* states */

    const [pageLoading, setPageLoading] = useState(false)
    const [tableDataSource, setTableDataSource] = useState([])


    const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
    const [addUsersDialogOpen, setAddUsersDialogOpen] = useState(false)
    const [addUserDialogConfirmLoading, setAddUserDialogConfirmLoading] = useState(false)
    const [addUsersDialogConfirmLoading, setAddUsersDialogConfirmLoading] = useState(false)


    const [addSeatDrawerOpen, setAddSeatDrawerOpen] = useState(false)
    const [addSeatDrawerTargetUser, setAddSeatDrawerTargetUser] = useState(-1)

    /* hooks */



    /* data */



    /* table columns */

    const tableColumns = [
        {
            title: '用户',
            dataIndex: 'username',
            key: 'username',
            render(_: any, record: UserEntity) {
                return `${record.username} (${record.id})`
            }
        },
        {
            title: '上次登录时间',
            dataIndex: 'lastLoginTime',
            key: 'lastLoginTime',
            render(it: string) {
                return DateTimeUtils.iso8601toHumanFriendly(it)
            }
        },

        {
            title: '操作',
            dataIndex: 'op',
            key: 'op',
            render: (_: any, record: UserEntity) => {

                let buttons = [] as any[]

                const hasPermission = (permission: GroupPermission) => {
                    return globalData.groupPermissions.has(props.groupId, permission)
                }

                const btnStyle = {
                    margin: 4,
                } as React.CSSProperties

                if (hasPermission(GroupPermission.CREATE_OR_DELETE_SEAT)) {
                    buttons.push(
                        <Button
                            type="primary"
                            icon={ <PlusOutlined /> }
                            onClick={() => {
                                setAddSeatDrawerTargetUser(record.id)
                                setAddSeatDrawerOpen(true)
                            }}
                        >
                            主机环境
                        </Button>
                    )
                }

                return <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                    }}
                >
                    { buttons }
                </div>
            },
        }
    ]

    /* ctor */
    useConstructor(constructor)
    function constructor() {
        if (props.groupId === null || props.groupId === undefined) {
            return
        }

        ensureGlobalData({ resolveLater: true, dontReject: true }).then(res => {

            fetchData()

        })
    }

    /* methods */
    function fetchData() {
        setPageLoading(true)
        request({

            url: 'group/users',
            params: {
                'groupId': props.groupId
            },


            vfOpts: {
                autoHandleNonOKResults: true,
                rejectNonOKResults: true,
                giveResDataToCaller: true
            }

        }).then(res => {
            
            setTableDataSource(res as any)

        }).catch(() => {})
        .finally(() => {
            setPageLoading(false)
        })
    }

    /* render */

    if (props.groupId === null || props.groupId === undefined) {
        return null
    }

    function usersTable() {
        return <Table
            columns={ tableColumns }
            dataSource={ tableDataSource }
        />
    }

    
    function addUserFloatingButtonGroup() {

        return [
            <Tooltip title='添加用户'>
                <Button
                    icon={<UserAddOutlined />}
                    shape="circle" ghost
                    type="primary"
                    onClick={() => setAddUserDialogOpen(true)}
                />
            </Tooltip>,
            
            <Tooltip title='批量添加用户'>
                <Button style={{ marginLeft: 8 }}
                    icon={<UsergroupAddOutlined />}
                    shape="circle" ghost
                    type="primary"
                    onClick={() => setAddUsersDialogOpen(true)}
                />
            </Tooltip>,
        ]
    }


    function addUserDialog() {
        return <Modal
            title='添加用户'
            centered={true}
            closable={true}
            open={addUserDialogOpen}
            destroyOnClose={true}
            confirmLoading={addUserDialogConfirmLoading}
            onCancel={() => setAddUserDialogOpen(false)}
        >
            { /* todo */ }
        </Modal>
    }


    function addSeatDrawer() {
        return <Drawer title="添加桌面环境"
            open={ addSeatDrawerOpen }
            
            onClose={() => setAddSeatDrawerOpen(false)}
            destroyOnClose={ true }
            extra={
                <Space>
                    <Button 
                        onClick={() => setAddSeatDrawerOpen(false)}
                    >
                        取消
                    </Button>
                    <Button 
                        type="primary"
                        onClick={() => {
                            // todo
                            request({
                                url: 'seat/new',
                                data: {
                                    group: props.groupId,
                                    users: [addSeatDrawerTargetUser],
                                    note: `desktop env for user: ${addSeatDrawerTargetUser}`
                                },
                                method: 'post',
                                vfOpts: {
                                    rejectNonOKResults: true,
                                    autoHandleNonOKResults: true,
                                    giveResDataToCaller: true
                                }
                            }).then(res => {
                                // todo
                                
                            }).catch(() => {}).finally(() => {
                                setAddSeatDrawerOpen(false)
                            })
                        }}

                    >
                        添加
                    </Button>
                </Space>
            }
        >

        </Drawer>
    }

    const toolboxHeight = '48px'
    return <Flex
        vertical
        style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
        }}
    >
        <div style={{
            flexGrow: 1,
            flexShrink: 0,
            height: `calc(100% - ${toolboxHeight})`
        }} className="overflow-y-overlay">
            <Spin spinning={pageLoading}>
                { usersTable() }
            </Spin>
        </div>
        
        { /* toolbox */ }
        <Flex style={{
            height: toolboxHeight,
            flexShrink: 0,
            display: 'inline-block',
            padding: 8,
        }}>
            {
                globalData.groupPermissions?.has(props.groupId, GroupPermission.ADD_OR_REMOVE_USER) 
                
                &&

                addUserFloatingButtonGroup() 
            }
        </Flex>

        { addUserDialog() }
        <AddMultipleUsersDialog
            groupId={props.groupId}
            open={addUsersDialogOpen}
            onClose={() => {
                setAddUsersDialogOpen(false)
            }}
        />
        { addSeatDrawer() }

    </Flex>
}



/* ------------ add multiple users dialog ------------ */

interface AddMultipleUsersDialogProps {
    groupId: number
    open: boolean
    onClose: () => void
}


interface AddMultipleUsersTableEntry {
    userId: number | null
    username: string
    seatId: number | null
    status: 'pending' | 'success' | 'failed'
    msg: string
}

function AddMultipleUsersDialog(props: AddMultipleUsersDialogProps) {

    const dropdownEntryForNoTemplate = {
        label: '不使用模板',
        value: -1
    }


    /* states */

    const [confirmLoading, setConfirmLoading] = useState(false)
    const [tableDataSource, setTableDataSource] = useState<AddMultipleUsersTableEntry[]>([])
    
    const [uploadButtonDisabled, setUploadButtonDisabled] = useState(true)
    const [alsoCreateSeats, setAlsoCreateSeats] = useState(false)
    const [templateSeatId, setTemplateSeatId] = useState(-1)  // set to -1 to disable template
    const [dropdownEntries, setDropdownEntries] = useState([dropdownEntryForNoTemplate])


    /* ctor */

    useConstructor(constructor)
    function constructor() {
        loadSeatTemplates()
    }

    function loadSeatTemplates() {
        request({
            url: 'seat/seats',
            params: {
                groupId: props.groupId,
                viewAllSeatsInGroup: false,
                alsoSeatsInNonGroupMode: true,
            },
            vfOpts: {
                giveResDataToCaller: true,
                rejectNonOKResults: true,
                autoHandleNonOKResults: true
            }
        }).then(res => {
            dropdownEntries.length = 0
            dropdownEntries.push(dropdownEntryForNoTemplate)
            for (const it of res) {
                dropdownEntries.push({
                    label: `${it.id}: ${it.nickname}`,
                    value: it.id
                })
            }
            setDropdownEntries([...dropdownEntries])
        }).catch(err => {}).finally(() => {
            // do nothing...
        })
    }


    function commitAddUsers() {
        setConfirmLoading(true)

        request({
            url: 'group/addUsers',
            method: 'post',
            data: {
                groupId: props.groupId,
                usernames: tableDataSource.map(it => it.username)
            },
            vfOpts: {
                rejectNonOKResults: true,
                autoHandleNonOKResults: true,
                giveResDataToCaller: true
            }
        }).then(untypedRes => {
            type ResEntry = {
                userId: number, 
                username: string, 
                success: boolean, 
                msg: string
            }
            const res = untypedRes as ResEntry[]

            const resMap = new Map<string, ResEntry>()

            res.forEach(it => {
                resMap.set(it.username, it)
            })

            for (const it of tableDataSource) {
                const resEntity = resMap.get(it.username)
                if (resEntity) {
                    it.status = resEntity.success ? 'success' : 'failed'
                    it.msg = resEntity.msg
                    if (it.status === 'success') {
                        it.userId = resEntity.userId
                    }
                }
            }

            setTableDataSource([...tableDataSource])
        }).catch(err => {}).finally(() => {
            if (alsoCreateSeats) {
                createSeatsForUsers()
            } else {
                setConfirmLoading(false)
            }
        })
    }


    function createSeatsForUsers() {
        if (!confirmLoading) {
            setConfirmLoading(true)
        }

        request({
            url: 'seat/new',
            method: 'post',
            data: {
                group: props.groupId,
                skel: templateSeatId === -1 ? undefined : templateSeatId,
                users: tableDataSource
                    .filter(it => it.status === 'success')
                    .map(it => it.userId)
            },
            vfOpts: {
                rejectNonOKResults: true,
                autoHandleNonOKResults: true,
                giveResDataToCaller: true
            }
        }).then(untypedRes => {
            const res = untypedRes as CreateSeatsResponseDto
            const successMap = new Map<number, SeatEntity>()  // userId -> SeatEntity
            res.forEach(it => successMap.set(it.userId, it.seatInfo))
            for (const tableIt of tableDataSource) {
                if (tableIt.userId === null) {
                    continue
                }

                if (successMap.has(tableIt.userId)) {
                    tableIt.seatId = successMap.get(tableIt.userId)!.id
                }
            }

            setTableDataSource([...tableDataSource])
        }).catch(err => {}).finally(() => {
            setConfirmLoading(false)
        })
    }


    /* render */

    return <Drawer
        title="批量添加用户"
        size='large'
        destroyOnClose={true}
        open={props.open}
        onClose={() => {
            props.onClose()
        }}
        maskClosable={false}
    ><Spin spinning={confirmLoading}>

        <Image
            width='100%'
            src='https://canfish.oss-cn-shanghai.aliyuncs.com/app/vesper-front/add-users-csv-example.webp'
            style={{
                borderRadius: 8,
                boxShadow: '0 0 8px 4px #6664'
            }}
            preview={false}
        />
        
        <p>将待添加用户信息整理到表格，导出为 CSV 格式。</p>
        <p>首行为表头；待添加用户的用户名在 <b>vesper-username</b> 列，如上图所示。其他列默认忽略。</p>
        
        <Dragger
            name='file'
            multiple={false}
            accept='.csv'
            maxCount={1}
            beforeUpload={(file, fileList) => {
                file.text().then(res => {
                    let csv = new CSVSheet(res)
                    let users = csv.getCol('vesper-username')
                    let dataSource = [] as AddMultipleUsersTableEntry[]
                    if (users !== null) {
                        for (let it of users) {
                            dataSource.push({
                                userId: null,
                                username: it,
                                seatId: null,
                                status: 'pending',
                                msg: '未上传',
                            })
                        }
                    } // if (users !== null)
                    setTableDataSource(dataSource)
                    setUploadButtonDisabled(dataSource.length === 0)
                }) // file.text().then(res =>
                return false
            }} // beforeUpload={(file, fileList) => {
        >
            <p className='ant-upload-drag-icon'>
                <UploadOutlined />
            </p>
            <p className='ant-upload-text'>点击我 或 拖拽 CSV 文件到这里</p>
        </Dragger>

        <Flex vertical style={{
            marginTop: 16,
            background: '#5cb3cc20',
            padding: 16,
            borderRadius: 8,
        }}>
            <Flex style={{flexShrink: 0}}>
                <div style={{
                    flexGrow: 1
                }}>
                    同时创建桌面环境
                </div>
                <Switch
                    checked={alsoCreateSeats}
                    onChange={(checked: boolean) => { setAlsoCreateSeats(checked) }}
                />
            </Flex>


            <Flex
                style={{
                    marginTop: alsoCreateSeats ? 16 : 0,
                    width: '100%',
                    height: alsoCreateSeats ? 32 : 0,
                    overflow: 'hidden',
                    transition: '0.2s',
                    alignItems: 'center'
                }}
            >
                <p>模板</p>
                <Select 
                    style={{ 
                        flexGrow: 1,
                        marginLeft: 16
                    }}
                    variant='filled'
                    options={dropdownEntries}
                    value={templateSeatId}
                    disabled={!alsoCreateSeats}
                    onChange={(value) => {
                        setTemplateSeatId(value)
                    }}
                />
            </Flex>


        </Flex>

        <Divider />

        <p>添加信息预览</p>

        <Table
            columns={[
                {
                    title: '用户名',
                    key: 'username',
                    dataIndex: 'username',
                    render: (_: any, record: AddMultipleUsersTableEntry) => {
                        const res = record.username
                        return res
                    }
                },
                {
                    title: '状态',
                    key: 'create-status',
                    dataIndex: 'create-status',
                    render: (_: any, record: AddMultipleUsersTableEntry) => {
                        const style = {} as React.CSSProperties

                        if (record.status === 'failed') {
                            style.color = '#ee3f4d'
                        } else if (record.status === 'success') {
                            style.color = '#41b349'
                        }

                        return <div style={style}>{record.msg}</div>
                    }
                },
                {
                    title: '主机ID',
                    dataIndex: 'seatId',
                    key: 'seatId',
                    render(it: string | null) {
                        return it === null 
                            ? 
                            <div style={{color: '#ee3f4d'}}>
                                未创建
                            </div> 
                            : 
                            <div style={{color: '#41b349'}}>
                                创建成功：{it}
                            </div>
                    }
                },
            ]}

            dataSource={tableDataSource}
        />

        <p>确认信息无误，点击“提交”即可添加用户。</p>

        <Button
            style={{
                width: '100%'
            }}
            type='primary'
            shape='round'
            disabled={uploadButtonDisabled}
            onClick={() => {
                commitAddUsers()
            }}
        >
            提交
        </Button>

        <div style={{ height: 32 }} />
    </Spin></Drawer>
}

