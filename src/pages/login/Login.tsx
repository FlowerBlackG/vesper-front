/* SPDX-License-Identifier: MulanPSL-2.0 */

/*

    创建于2024年3月13日 上海市嘉定区
*/


import { useState } from "react"
import { ensureGlobalData, globalHooks } from "../../common/GlobalData"
import PageRouteManager from "../../common/PageRoutes/PageRouteManager"
import { loadPageToLayoutFrame } from "../../components/LayoutFrame/LayoutFrame"
import { useConstructor } from "../../utils/react-functional-helpers"
import { Button, FloatButton, Input, Modal, Spin, message } from "antd"
import FluentUIEmojiProxy from "../../utils/FluentUIEmojiProxy"
import Version from "../../common/Version"
import DateTimeUtils from "../../utils/DateTimeUtils"
import { IResponse, request } from "../../utils/request"
import { HttpStatusCode } from "../../utils/HttpStatusCode"
import Random from "../../utils/Random"
import { CloudServerOutlined, LinkOutlined } from "@ant-design/icons"
import Config from "../../common/Config"
import { LoginPageBackgroundManager } from "./LoginPageBackgrounds"
import { useSearchParams } from "react-router-dom"

type LoginPageState = {
    loginOnProgress: boolean
}


const data = {
    uname: '',
    password: ''
}


export default function LoginPage() {

    const pageEntity = PageRouteManager.getRouteEntity('/login')

    const [state, setState] = useState<LoginPageState>({
        loginOnProgress: false
    })

    const [backgroundImgOpacity, setBackgroundOpacity] = useState(0)

    const [loginButtonHover, setLoginButtonHover] = useState(false)
    const [loginButtonActive, setLoginButtonActive] = useState(false)
    const [backendUrl, setBackendUrl] = useState(Config.backendRoot)


    const [searchParams, setSearchParams] = useSearchParams()
    if (searchParams.has('backendRoot')) {
        const backendRoot = searchParams.get('backendRoot')!
        Config.backendRoot = backendRoot
        globalHooks.app.message.success(`后端地址设置为 ${backendRoot}`)
        searchParams.delete('backendRoot')
        setSearchParams(searchParams)
        setBackendUrl(backendRoot)
    }

    useConstructor(constructor)
    function constructor() {
        data.password = ''
        data.uname = ''
        loadPageToLayoutFrame(pageEntity)
        checkVesperSystemInitialized()
    }


    function loginBtnClickHandler() {
        if (state.loginOnProgress) {
            return
        } else {
            state.loginOnProgress = true
            setState({ ...state })
        }
        
        request({
            url: 'user/login',
            method: 'post',
            data: {
                uname: data.uname,
                password: data.password
            }
        }).then(res => {
            res = res as IResponse
            if (res.code === HttpStatusCode.OK) {
                // 登录成功。
                globalHooks.app.message.success('欢迎登录落霞前厅')
                globalHooks.app.navigate!({ pathname: '/' })
            } else {
                // 登录失败。
                message.error(res.msg)

                state.loginOnProgress = false
                setState({ ...state })
            }
        }).catch(() => {
            state.loginOnProgress = false
            setState({...state})
        })
    }


    /* 检查系统是否需要初始化。 */
    function checkVesperSystemInitialized() {
        request({
            url: 'vesperCenter/systemInitialized'
        }).then(res => {

            res = res as IResponse
            
            if (res.code !== HttpStatusCode.OK) {
                message.error(res.msg)
                return
            }

            let initialized = res.data as boolean
            if (!initialized) {
                globalHooks.app.navigate!({ pathname: '/init' })
            }
        }).catch(err => {})
    }


    let editBackendModalBackendUrl = ''

    function showEditBackendModal() {
        Modal.info({
            title: '更改后端地址',
            closable: true,
            onOk() {
                setBackendUrl(editBackendModalBackendUrl)
                Config.backendRoot = editBackendModalBackendUrl
                editBackendModalBackendUrl = ''
            },
            centered: true,
            maskClosable: true,
            content: <div
                style={{
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <div>
                    当前地址：{ backendUrl }
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        marginTop: 8,
                        alignItems: 'center'
                    }}
                >
                    <div 
                        style={{ 
                            flexShrink: 0,
                            maxLines: 1 
                        }}
                    >
                        修改为：
                    </div>

                    <Input 
                        onChange={(event) => {
                            editBackendModalBackendUrl = event.target.value
                        }}
                    />
                    
                </div>            
            </div>
        })
    }


    const loginButtonStyles = LoginPageBackgroundManager.instance.background.styles!.button

    return <div
        style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            display: 'flex',
            background: '#000'
        }}
    >

        { /* 背景图。 */ }

        <img
            src={ LoginPageBackgroundManager.instance.background.url }
            style={{
                objectFit: 'cover',
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                
                opacity: backgroundImgOpacity,

                transitionDuration: '1s',
                transitionProperty: 'opacity',
                userSelect: 'none'
            }}
            onLoad={() => {
                setBackgroundOpacity(1)
            }}
        />

        
        <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',

            display: 'flex',
            flexDirection: 'column',

            paddingTop: '4rem',
            paddingBottom: '4rem',
            paddingLeft: '2rem',
            paddingRight: '2rem',

            width: '20rem',

            background: '#6664',
            borderRadius: 24,
            boxShadow: '0px 6px 24px #0008',

            backdropFilter: 'blur(8px)'
        }}>

            <div style={{
                fontSize: '2em',
                color: '#000',
                textAlign: 'center',
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <img
                    src={ FluentUIEmojiProxy.colorSvg('camping_color') }
                    style={{
                        width: '1.2em',
                    }}
                />

                <div style={{ width: '0.2em' }} />
                
                落霞前厅
            </div>

            <Input 
                placeholder='用户名或用户id' 
                style={{
                    marginTop: 56,
                    opacity: 0.72
                }}

                onChange={(event) => {
                    data.uname = event.target.value
                }}
              
                onInput={(event) => {
                    let target = event.target as any
                    data.uname = target.value
                }}
            />
            <Input.Password 
                placeholder='密码'
                style={{
                    marginTop: 22,
                    opacity: 0.72
                }}

                onChange={(event) => {
                    data.password = event.target.value
                }}
                
                onInput={(event) => {
                    let target = event.target as any
                    data.password = target.value
                }}

                onPressEnter={(event) => loginBtnClickHandler()}
            />

            <div style={{
                marginTop: 40,
                width: '100%',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>{
                state.loginOnProgress ?
                
                    <Spin size='large' />

                :

                    <div 
                        style={
                            loginButtonHover ?
                                loginButtonActive ? 
                                    loginButtonStyles.active 
                                : 
                                    loginButtonStyles.hover
                            :
                                loginButtonStyles.normal
                        }

                        onMouseEnter={() => setLoginButtonHover(true)}
                        onMouseLeave={() => setLoginButtonHover(false)}
                        onMouseDown={() => setLoginButtonActive(true)}
                        onMouseUp={() => setLoginButtonActive(false)}
                        
                        
                        onTouchStart={() => {
                            setLoginButtonActive(true)
                            setLoginButtonHover(true)
                        }}
                        onTouchEnd={() => {
                            setLoginButtonActive(false)
                            setLoginButtonHover(false)
                        }}

                        onClick={(event) => loginBtnClickHandler()}
                        
                    >
                        登录
                    </div>
            }</div>

        </div>

        <div style={{ // 脚注
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#0007',
            textAlign: 'center',
            borderRadius: 12,
            padding: 4,
        }}>
            { Version.tag } ({Version.code}) {Version.buildTime}
            
        </div>

        { /* 后端地址配置按钮 */ }
        <FloatButton
            icon={ <LinkOutlined /> }
            onClick={() => {
                showEditBackendModal()
            }}
        />
    </div>

}
