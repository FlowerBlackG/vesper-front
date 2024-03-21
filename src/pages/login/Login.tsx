/* SPDX-License-Identifier: MulanPSL-2.0 */

/*

    创建于2024年3月13日 上海市嘉定区
*/


import { useState } from "react"
import { ensureGlobalData, globalHooks } from "../../common/GlobalData"
import PageRouteManager from "../../common/PageRoutes"
import { loadPageToLayoutFrame } from "../../components/LayoutFrame/LayoutFrame"
import { useConstructor } from "../../utils/react-functional-helpers"
import styles from "./Login.module.css"
import { Input, Spin, message } from "antd"
import FluentUIEmojiProxy from "../../utils/FluentUIEmojiProxy"
import Version from "../../common/Version"
import DateTimeUtils from "../../utils/DateTimeUtils"
import { IResponse, request } from "../../utils/request"
import { HttpStatusCode } from "../../utils/HttpStatusCode"
import Random from "../../utils/Random"

type LoginPageState = {
    loginOnProgress: boolean
}


const backgroundUrl = Random.randElement([
    'https://canfish.oss-cn-shanghai.aliyuncs.com/app/vesper-front/20231208_123408.1.webp', // 嘉定校区鸟瞰
    'https://canfish.oss-cn-shanghai.aliyuncs.com/app/vesper-front/20231211_125623.webp', // 肖四
    'https://canfish.oss-cn-shanghai.aliyuncs.com/app/vesper-front/20231122_183343.webp', // 嘉定校区图书馆
    'https://canfish.oss-cn-shanghai.aliyuncs.com/app/vesper-front/20210412_092042.webp', // 水杉
    'https://canfish.oss-cn-shanghai.aliyuncs.com/app/vesper-front/20210326_183307.webp', // 樱花冰糖
    'https://canfish.oss-cn-shanghai.aliyuncs.com/app/vesper-front/20210326_180029.webp', // 樱花猫猫
])

export default function LoginPage() {

    const pageEntity = PageRouteManager.getRouteEntity('/login')

    const [state, setState] = useState<LoginPageState>({
        loginOnProgress: false
    })

    const [backgroundImgOpacity, setBackgroundOpacity] = useState(0)


    useConstructor(constructor)
    function constructor() {
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
                uname: uname,
                password: password
            }
        }).then(res => {
            res = res as IResponse
            if (res.code === HttpStatusCode.OK) {
                // 登录成功。
                message.success('欢迎登录落霞前厅')
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


    let uname = ""
    let password = ""


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
            src={ backgroundUrl }
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
                    uname = event.target.value
                }}
            />
            <Input.Password 
                placeholder='密码'
                style={{
                    marginTop: 22,
                    opacity: 0.72
                }}

                onChange={(event) => {
                    password = event.target.value
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
                        className={ styles.loginBtn }

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
            { Version.tag } ({Version.code})-{Version.branch} {Version.buildTime}
            
        </div>
    </div>

}
