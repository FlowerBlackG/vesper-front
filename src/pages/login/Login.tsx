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

type LoginPageState = {
    loginOnProgress: boolean
}

export default function LoginPage() {

    const pageEntity = PageRouteManager.getRouteEntity('/login')

    const [state, setState] = useState<LoginPageState>({
        loginOnProgress: false
    })

    useConstructor(constructor)
    function constructor() {
        loadPageToLayoutFrame(pageEntity)
        ensureGlobalData()
            .then(() => {})
            .catch(() => {})
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


    return <div
        style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            display: 'flex',
            backgroundColor: '#A7E8C3',
        }}
    >

        <div style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            backgroundImage: "url('https://guotuantuan.oss-cn-shanghai.aliyuncs.com/web-common-assets/illustrations-co/day56-tv-room.webp')",
            backgroundRepeat: 'no-repeat',
            backgroundSize: '50%',
            backgroundPosition: 'center',
            filter: 'blur(10px)'
        }} />

        
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

            background: '#fff6',
            borderRadius: 24,
            boxShadow: '0px 6px 24px #0004',
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
            bottom: 6,
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#0007',
            userSelect: 'none',
            textAlign: 'center'
        }}>
            { Version.tag } (build {Version.code})
            <br />
            构建时间：{ DateTimeUtils.iso8601toHumanFriendly(Version.buildTime) }
            <br />
            同济大学计算机系内部使用
        </div>
    </div>

}
