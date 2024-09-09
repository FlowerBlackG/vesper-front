// SPDX-License-Identifier: MulanPSL-2.0
/*
 *
 * 创建于 2024年4月1日 上海市嘉定区
 */

import { Button, Divider, Drawer, Flex, FloatButton, Image, Input, Modal, Popconfirm, Row, Select, Space, Spin, Switch, Table, Tooltip, message } from "antd"
import { ensureGlobalData, globalData, globalHooks } from "../../../common/GlobalData"
import PageRouteManager from "../../../common/PageRoutes/PageRouteManager"
import { useConstructor } from "../../../utils/react-functional-helpers"
import { useRef, useState } from "react"
import { IResponse, request } from "../../../utils/request"
import { HttpStatusCode } from "../../../utils/HttpStatusCode"
import { useSearchParams } from "react-router-dom"
import { later } from "../../../utils/later"
import DateTimeUtils from "../../../utils/DateTimeUtils"
import { GroupPermissionEntity, GroupPermissionGrantEntity, SeatEntity, UserEntity, UserGroupEntity } from "../../../api/Entities"
import { GroupPermission } from "../../../api/Permissions"
import { ExportOutlined, PlusOutlined, UploadOutlined, UserAddOutlined, UsergroupAddOutlined } from "@ant-design/icons"

import '../../../index.css'
import Dragger from "antd/es/upload/Dragger"
import CSVSheet from "../../../utils/CSVSheet"
import { CreateSeatsRequestDto, CreateSeatsRequestDtoEntry, CreateSeatsResponseDto, CreateSeatsResponseDtoEntry } from "../../../api/SeatController"
import * as XLSX from 'xlsx'

import styles from './UserManagement.module.css'
import XlsxUtils from "../../../utils/XlsxUtils"
import { UserChangeGroupDrawer } from "./UserChangeGroupDrawer"


interface UserManagementProps {
    groupId: number | null | undefined
    afterAddSeats?: () => void
}

export function UserManagement(props: UserManagementProps) {

    /* states */

    const [pageLoading, setPageLoading] = useState(false)
    const [tableDataSource, setTableDataSource] = useState<UserEntity[]>([])


    const [addUsersDialogOpen, setAddUsersDialogOpen] = useState(false)

    const [addSeatDrawerTargetUser, setAddSeatDrawerTargetUser] = useState<UserEntity | null>(null)

    const [permissionViewerTargetUser, setPermissionViewerTargetUser] = useState<UserEntity | null>(null)

    const [userChangeGroupTargetUser, setUserChangeGroupTargetUser] = useState<UserEntity | null>(null)


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
                        <Button ghost style={{margin: 2}}
                            type="primary" shape="round"
                            icon={ <PlusOutlined /> }
                            onClick={() => {
                                setAddSeatDrawerTargetUser(record)
                            }}
                        >
                            创建环境
                        </Button>
                    )
                }

                buttons.push(
                    <Button style={{ margin: 2 }}
                        type="primary"
                        shape="round" ghost
                        onClick={() => {
                            setPermissionViewerTargetUser(record)
                        }}
                    >
                        权限
                    </Button>
                )

                if (hasPermission(GroupPermission.ADD_OR_REMOVE_USER)) {
                    buttons.push(
                        <Popconfirm 
                            title='这将删除该用户在该组的所有桌面环境！' 
                            cancelText='算了' 
                            okText='嗯！'
                            onConfirm={() => {
                                setPageLoading(true)
                                request({
                                    url: 'group/removeUser',
                                    data: {
                                        userId: record.id,
                                        groupId: props.groupId
                                    },
                                    method: 'post',
                                    vfOpts: {
                                        rejectNonOKResults: true,
                                        autoHandleNonOKResults: true,
                                        giveResDataToCaller: true
                                    }
                                }).then(res => {
                                    globalHooks.app.message.success('操作成功')
                                    fetchData()
                                    if (props.afterAddSeats) {
                                        props.afterAddSeats()
                                    }
                                }).catch(_ => {
                                    setPageLoading(false)
                                })
                            }}
                        >
                            <Button danger type="primary" shape="round" ghost
                                style={{
                                    margin: 2
                                }}
                            >
                                踢掉
                            </Button>
                        </Popconfirm>
                    )
                }


                if (hasPermission(GroupPermission.ADD_OR_REMOVE_USER)) {
                    buttons.push(
                        <Button shape="round" ghost type="primary"
                            style={{
                                margin: 2
                            }}
                            onClick={() => {
                                setUserChangeGroupTargetUser(record)
                            }}
                        >
                            换组
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


    function exportUserTable() {
        let tableData = structuredClone(tableDataSource) as any[]
        for (let it of tableData) {
            it['vesper-username'] = it['username']
        }
        
        let sheet = XLSX.utils.json_to_sheet(tableData)
        let csv = XLSX.utils.sheet_to_csv(sheet)
        
        
        // todo: make following a helper function
        
        let mime = 'text/csv;encoding:utf-8'
        let filename = '群组用户名单.csv'
        
        let aLink = document.createElement('a')
        
        aLink.href = URL.createObjectURL( new Blob([csv], {type: mime}) )
        aLink.setAttribute('download', filename)
        aLink.click()


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
            
            <Tooltip title='批量添加用户'>
                <Button style={{ marginLeft: 0 }}
                    icon={<UsergroupAddOutlined />}
                    shape="circle" ghost
                    type="primary"
                    onClick={() => setAddUsersDialogOpen(true)}
                />
            </Tooltip>,
            
            <Tooltip title='导出用户名单'>
                <Button style={{ marginLeft: 8 }}
                    icon={<ExportOutlined />}
                    shape="circle" ghost
                    type="primary"
                    onClick={exportUserTable}
                />
            </Tooltip>,
        ]
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

        <AddMultipleUsersDialog
            groupId={props.groupId}
            open={addUsersDialogOpen}
            onClose={() => {
                setAddUsersDialogOpen(false)
            }}
            afterAddSeats={props.afterAddSeats}
        />

        <AddSingleSeatDialog
            onClose={() => setAddSeatDrawerTargetUser(null)}
            user={addSeatDrawerTargetUser}
            groupId={props.groupId}
            afterAddSeats={props.afterAddSeats}
        />

        <PermissionViewer 
            groupId={props.groupId}    
            onClose={() => {setPermissionViewerTargetUser(null)}}
            user={permissionViewerTargetUser}
        />

        
        <UserChangeGroupDrawer
            onClose={(success) => {
                if (success) {
                    if (userChangeGroupTargetUser !== null) {
                        const idx = tableDataSource.indexOf(userChangeGroupTargetUser, 0)
                        if (idx > -1) {
                            tableDataSource.splice(idx, 1)
                            setTableDataSource([...tableDataSource])
                        }
                    } else {
                        const msg = '网页内部异常。错误定位码：' + 'dca325bf-939b-48ba-ba98-c1a9e27e9f99'
                        globalHooks.app.message.error(msg)
                        console.error(msg)
                    }
                }

                setUserChangeGroupTargetUser(null)
            }}
            user={userChangeGroupTargetUser}
            fromGroup={props.groupId}
        />

    </Flex>
} // export function UserManagement(props: UserManagementProps)


/* ================ shared components ================ */

// use template

interface SeatTemplateSelectorProps {
    withTopMargin: boolean
    groupId: number
    show: boolean
    onSelect: (templateSeatId: number) => any
}
function SeatTemplateSelector(props: SeatTemplateSelectorProps) {
    
    // states

    const dropdownEntryForNoTemplate = {
        label: '不使用模板',
        value: -1
    }

    const [templateSeatId, setTemplateSeatId] = useState(-1)
    const [loading, setLoading] = useState(false)
    const [dropdownEntries, setDropdownEntries] = useState([dropdownEntryForNoTemplate])

    // ctor

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
                pageSize: 100000000000000
            },
            vfOpts: {
                giveResDataToCaller: true,
                rejectNonOKResults: true,
                autoHandleNonOKResults: true
            }
        }).then(res => {
            dropdownEntries.length = 0
            dropdownEntries.push(dropdownEntryForNoTemplate)
            for (const it of res.records) {
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

    // render

    return <Flex
        style={{
            marginTop: (props.withTopMargin && props.show) ? 16 : 0,
            width: '100%',
            height: props.show ? 32 : 0,
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
            disabled={!props.show}
            onChange={(value) => {
                setTemplateSeatId(value)
                props.onSelect(value)
            }}
        />
    </Flex>
}


/* ------------ add single seat dialog ------------ */

interface AddSingleSeatDialogProps {
    onClose: () => void
    user: UserEntity | null
    groupId: number
    afterAddSeats?: () => void
}

function AddSingleSeatDialog(props: AddSingleSeatDialogProps) {
    const [loading, setLoading] = useState(false)
    const [templateSeatId, setTemplateSeatId] = useState(-1)

    return <Drawer
        title="创建桌面环境"
        size='large'
        onClose={props.onClose}
        open={props.user !== null}
        destroyOnClose={true}
    >
        <p>目标用户：{props.user?.username}</p>
        
        <Divider />

        <SeatTemplateSelector
            show withTopMargin={false} groupId={props.groupId}
            onSelect={(value) => {
                setTemplateSeatId(value)
            }}
        />

        <Divider />

        <Spin spinning={loading}>
            <Button
                style={{
                    width: '100%'
                }}
                disabled={loading}
                type="primary" shape="round"
                onClick={() => {
                    setLoading(true)
                    request({
                        url: 'seat/new',
                        data: [
                            {
                                uniqueKey: 0,
                                group: props.groupId,
                                userid: props.user?.id,
                                skel: templateSeatId === -1 ? undefined : templateSeatId,
                                note: `${props.user?.username}在第${props.groupId}组的桌面环境`
                            }
                        ] as CreateSeatsRequestDto,
                        method: 'post',
                        vfOpts: {
                            rejectNonOKResults: true,
                            autoHandleNonOKResults: true,
                            giveResDataToCaller: true
                        }
                    }).then(untypedRes => {
                        const resEntry = untypedRes[0] as CreateSeatsResponseDtoEntry  // todo: check array's length before accessing.
                        if (resEntry.success) {
                            globalHooks.app.message.success(resEntry.msg)
                            if (props.afterAddSeats) {
                                props.afterAddSeats()
                            }
                        } else {
                            globalHooks.app.message.error(resEntry.msg)
                        }
                        
                    }).catch(() => {}).finally(() => {
                        setLoading(false)
                        props.onClose()
                    })
                }}
            >
                创建
            </Button>
        </Spin>

    </Drawer>
}


/* ------------ add multiple users dialog ------------ */

interface AddMultipleUsersDialogProps {
    groupId: number
    open: boolean
    onClose: () => void
    afterAddSeats?: () => void
}


interface AddMultipleUsersTableEntry {
    uniqueKey: number
    userId: number | null
    username: string
    status: 'pending' | 'success' | 'failed'
    msg: string
    createSeatAPIResponse: CreateSeatsResponseDtoEntry | null
}

function AddMultipleUsersDialog(props: AddMultipleUsersDialogProps) {

    /* states */

    const [confirmLoading, setConfirmLoading] = useState(false)
    const [tableDataSource, setTableDataSource] = useState<AddMultipleUsersTableEntry[]>([])
    
    const [alsoCreateSeats, setAlsoCreateSeats] = useState(false)
    const [templateSeatId, setTemplateSeatId] = useState(-1)  // set to -1 to disable template

    const [singleAddInputContent, setSingleAddInputContent] = useState("")

    
    const userTableCSVBuf = useRef<ArrayBuffer | null>(null)
    const userTableCSVEncoding = useRef('utf-8')
    const uniqueKeyCounter = useRef(0)

    // you should call this once CSVBuf or CSVEncoding changed.
    function bufferToTableDataSource() {
        
        const buf = userTableCSVBuf.current
        const encoding = userTableCSVEncoding.current
        
        if (buf === null) {
            setTableDataSource([])
            return
        }

        const decoder = new TextDecoder(encoding)
        
        let csv = new CSVSheet(decoder.decode(buf))
        let users = csv.getCol('vesper-username')
        let dataSource = [] as AddMultipleUsersTableEntry[]
        if (users !== null) {
            for (let it of users) {
                dataSource.push({
                    uniqueKey: ++ uniqueKeyCounter.current,
                    userId: null,
                    username: it,
                    status: 'pending',
                    msg: '未上传',
                    createSeatAPIResponse: null,
                })
            }
        } // if (users !== null)
        setTableDataSource(dataSource)
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

        const requestDto: CreateSeatsRequestDto = tableDataSource
            .filter(it => it.status === 'success')
            .filter(it => {
                if (it.createSeatAPIResponse === null)
                    return true
                return it.createSeatAPIResponse.success === false
            })
            .map(it => {
                return {
                    uniqueKey: it.uniqueKey,
                    group: props.groupId,
                    userid: it.userId,
                    skel: templateSeatId === -1 ? undefined : templateSeatId,
                } as CreateSeatsRequestDtoEntry
            })


        request({
            url: 'seat/new',
            method: 'post',
            data: requestDto,
            vfOpts: {
                rejectNonOKResults: true,
                autoHandleNonOKResults: true,
                giveResDataToCaller: true
            }
        }).then(untypedRes => {
            const res = untypedRes as CreateSeatsResponseDto
            const resMap = new Map<number, CreateSeatsResponseDtoEntry>()  // uniqueKey -> entry

            res.forEach(it => resMap.set(it.uniqueKey, it))
            
            for (const tableIt of tableDataSource) {
                if (tableIt.uniqueKey === null) {
                    continue
                }

                if (resMap.has(tableIt.uniqueKey)) {
                    const dtoEntry = resMap.get(tableIt.uniqueKey)!
                    tableIt.createSeatAPIResponse = dtoEntry
                }
            }

            setTableDataSource([...tableDataSource])

            if (props.afterAddSeats) {
                props.afterAddSeats()
            }
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
            setConfirmLoading(false)
            setTableDataSource([])
            setAlsoCreateSeats(false)
            setTemplateSeatId(-1)
            setSingleAddInputContent("")
            userTableCSVBuf.current = null
            userTableCSVEncoding.current = 'utf-8'
            uniqueKeyCounter.current = 0
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
                file.arrayBuffer().then(buf => {
                    userTableCSVBuf.current = buf
                    bufferToTableDataSource()
                }) // file.arrayBuffer().then(buf =>
                return false
            }} // beforeUpload={(file, fileList) => {
        >
            <p className='ant-upload-drag-icon'>
                <UploadOutlined />
            </p>
            <p className='ant-upload-text'>点击我 或 拖拽 CSV 文件到这里（⚠ 会清空下表的所有内容）</p>
        </Dragger>

        <p>你也可以直接在这里输入待添加成员的用户名 👇</p>

        <Space.Compact style={{ width: '100%' }}>
            <Input
                placeholder="输入用户名，然后点击右边的加号"
                value={ singleAddInputContent }
                onChange={(event) => {
                    setSingleAddInputContent(event.currentTarget.value)
                }}
            />
            <Button 
                icon={ <PlusOutlined/> } 
                type="primary"
                disabled={ singleAddInputContent === "" }
                onClick={() => {
                    setTableDataSource([
                        {
                            uniqueKey: ++ uniqueKeyCounter.current,
                            userId: null,
                            username: singleAddInputContent,
                            status: 'pending',
                            msg: '未上传',
                            createSeatAPIResponse: null,
                        },
                        ...tableDataSource
                    ])
                    setSingleAddInputContent("")
                }}
            />
        </Space.Compact>

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

            <SeatTemplateSelector
                withTopMargin={true}
                groupId={props.groupId}
                onSelect={(value) => {
                    setTemplateSeatId(value)
                }}
                show={alsoCreateSeats}
            />


        </Flex>

        <Divider />

        <p>如果表格中有乱码，可以切换“使用GB18030”开关。</p>
        <p style={{color: "#ee3f4d"}}><b>⚠ 切换会导致手动添加的表项丢失！</b></p>
        <p>如果要同时以表格和手动的方式添加用户，请先导入表格，切换开关，确认无乱码后再手动添加用户。</p>
        
        <Divider />

        <Row style={{ alignItems: 'center'}}>
            <p style={{ flexGrow: 1 }}>添加信息预览</p>
            <text>使用GB18030</text>
            <Switch
                checked={ userTableCSVEncoding.current === 'gb18030' }
                style={{ marginLeft: 8 }}
                onChange={(checked) => {
                    userTableCSVEncoding.current = checked ? 'gb18030' : 'utf-8'
                    bufferToTableDataSource()
                }}
            />
        </Row>

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
                    title: '主机情况',
                    key: 'createSeatAPIResponse',
                    dataIndex: 'createSeatAPIResponse',
                    render(apiResponse: CreateSeatsResponseDtoEntry | null, entry: AddMultipleUsersTableEntry) {
                        if (apiResponse === null) {
                            if (entry.status === 'success' && alsoCreateSeats)
                                return <div style={{color: '#ee3f4d'}}>
                                    未创建（后台未收到请求或遇到未知错误）。
                                </div>
                            else
                                return <div style={{color: '#ee3f4d'}}>
                                    未创建（尚未操作）。
                                </div>
                        }

                        if (!apiResponse.success)
                            return <div style={{color: '#ee3f4d'}}>
                                { apiResponse.msg }
                            </div>

                        const seat = apiResponse.seatInfo
                        return <div style={{
                            color: '#41b349'
                        }}>
                            { apiResponse.msg }（主机id：{seat?.id}）
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
            disabled={tableDataSource.length === 0}
            onClick={() => {
                commitAddUsers()
            }}
        >
            提交
        </Button>

        <div style={{ height: 32 }} />
    </Spin></Drawer>
}


interface PermissionViewerProps {
    onClose: () => any
    user: UserEntity | null
    groupId: number
}

function PermissionViewer(props: PermissionViewerProps) {

    const [allPermissions, setAllPermissions] = useState<GroupPermissionEntity[]>([])
    const [userPermissions, setUserPermissions] = useState<GroupPermission[]>([])
    const [grantPermissionLoading, setGrantPermissionLoading] = useState<GroupPermission[]>([])
    const [user, setUser] = useState<UserEntity | null>(null)

    if (user !== props.user) {
        setUser(props.user)
        setUserPermissions([])

        if (props.user !== null) {
            request({
                url: 'group/permissions',
                params: {
                    userId: props.user?.id,
                    groupId: props.groupId
                },
                vfOpts: {
                    rejectNonOKResults: true,
                    autoHandleNonOKResults: true,
                    giveResDataToCaller: true
                }
            }).then(untypedRes => {
                const res = untypedRes as GroupPermissionGrantEntity[]
                setUserPermissions(res.map(it => it.permissionId))
            }).catch(_ => {})
        }
    }

    if (allPermissions.length === 0) {
        request({
            url: 'group/allPermissions',
            vfOpts: {
                rejectNonOKResults: true, 
                autoHandleNonOKResults: true, 
                giveResDataToCaller: true
            }
        }).then(res => {
            setAllPermissions(res)
        }).catch(_ => {})
    }

    return <Drawer open={props.user !== null}
        size="large"
        title="组内权限"
        destroyOnClose={true}
        onClose={props.onClose}
    >
        <p>用户：{user?.username} ({user?.id})</p>
        <Divider />

        <table rules='none' cellPadding={12}>
            {
                allPermissions.map((it) => {
                    return <tr className={styles.tableRow}> 
                        <td className={styles.tableCell}>{it.id}</td>
                        <td className={styles.tableCell}>{it.enumKey}</td>
                        
                        <td className={styles.tableCell}>
                            {it.note}
                        </td>
                        <td className={styles.tableCell}>
                            <Switch
                                disabled={ 
                                    !globalData.groupPermissions.contains(props.groupId, GroupPermission.GRANT_PERMISSION)
                                }
                                checked={
                                    userPermissions.includes(it.id)
                                }
                                loading={
                                    grantPermissionLoading.includes(it.id)
                                }
                                onChange={(checked: boolean, event: any) => {
                                    if (!grantPermissionLoading.includes(it.id)) {
                                        grantPermissionLoading.push(it.id)
                                        setGrantPermissionLoading([...grantPermissionLoading])
                                    }

                                    request({
                                        url: 'group/grantPermission',
                                        data: {
                                            permission: it.id,
                                            grant: checked,
                                            targetUserId: props.user?.id,
                                            groupId: props.groupId
                                        },
                                        method: 'post',
                                        vfOpts: {
                                            rejectNonOKResults: true,
                                            autoHandleNonOKResults: true,
                                            giveResDataToCaller: true
                                        }
                                    }).then(res => {

                                        message.success('赋权编辑成功')

                                        if (checked) {
                                            userPermissions.push(it.id)
                                        } else {
                                            userPermissions.splice(
                                                userPermissions.indexOf(it.id), 1
                                            )
                                        }
                                        setUserPermissions([...userPermissions])

                                    }).catch(_ => {}).finally(() => {
                                        grantPermissionLoading.splice(
                                            grantPermissionLoading.indexOf(it.id), 1
                                        )
                                        setGrantPermissionLoading([...grantPermissionLoading])
                                    })
                                }}
                            />
                        </td>
                    </tr>
                })
            }
        </table>

    </Drawer>
}
