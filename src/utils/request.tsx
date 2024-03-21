// SPDX-License-Identifier: MulanPSL-2.0

/* 上财果团团 */

/*
 * 果团团控制台通用网络请求工具。
 */

import axios, { AxiosRequestConfig, AxiosResponse } from "axios"
import { globalHooks, resetGlobalData } from "../common/GlobalData"
import { HttpStatusCode } from "./HttpStatusCode"
import URLNavigate from "./URLNavigate"
import { message } from "antd"
import { Navigate, useNavigate } from "react-router-dom"
import { CookieBasedDataStore as DataStore } from "./CookieBasedDataStore"

const vesperSession = {
    token: null as string | null
}

const VESPER_SESSION_HTTP_HEADER_KEY = 'vesper-session'
const VESPER_SESSION_TOKEN_DATASTORE_KEY = "vesper-session-token"

/**
 * 果团后端的 IResponse 统一返回格式。
 * code 为 200 表示请求正常。
 * 
 * 请求出现问题时，会将可以展示给用户的信息写在msg里（一般情况下）。
 * 请求出现问题时，data可能不可用。
 */
export interface IResponse {
    code: HttpStatusCode,
    msg: string,
    data: any
}

/**
 * 默认的网络异常处理逻辑：弹出提示信息。
 * 
 * @param isReallyNetworkError 是不是真的是网络错误。当服务器后端出现错误，也会调用此函数。
 */
function defaultNetworkExceptionHandler(isReallyNetworkError: boolean) {
    message.error({
        content: isReallyNetworkError ? '网络异常' : '服务器异常'
    })
}

/**
 * 默认的未登录处理逻辑：跳转到登录页。
 */
function defaultUnauthorizedExceptionHandler() {
    resetGlobalData()
    globalHooks.app.navigate!({ pathname: '/login' })
}


/**
 * 果团团网络请求工具。
 * 对 axios 做二次封装，且内部处理后端环境配置。
 * 参考自同济大学破壁工作室济星云项目。
 * 
 * @author GTY
 * 
 * @param params axios 网络请求参数。请将要请求的 url 放置在其中。
 *               如果请求的是果团自有 api，则不要写根路径（https://xxx）。
 *               如果访问的是外部 api，需要令 url 以 https 开头。
 * 
 * @param useDefaultUnauthorizedExceptionHandler 当遇到未登录问题，是否使用默认处理逻辑。默认为使用。
 *                                               仅当 useOriginalResult 设为 false 时有效。
 * 
 * @param useOriginalResult 是否不对数据做预处理。默认做预处理。
 *                          预处理会在网络请求成功时，自动判断是否存在服务器异常及未登录问题，并适当处理。
 *                          同时，会将返回的 IResponse 结构提取，传递给调用者使用。
 *                          若请求的 api 是外部 api，预处理会被强制关闭。
 * 
 * @param useDefaultNetworkExceptionHandler 当遇到网络异常或服务器异常时，是否执行默认处理逻辑。该选项默认开启。
 */
export function request(
    params: AxiosRequestConfig,
    useDefaultUnauthorizedExceptionHandler: boolean = true,
    useOriginalResult: boolean = false,
    useDefaultNetworkExceptionHandler: boolean = true
): Promise< IResponse | AxiosResponse<any, any> > {

    /** 访问的是否是我们自己的后端 api。我们自己的后端 api 只会返回 IResponse Json 数据。 */
    let isQueryOurApi: boolean

    // 识别传入的 url。
    if (params.url!!.startsWith('https://') || params.url!!.startsWith('http://')) {
        isQueryOurApi = false
    } else {
        isQueryOurApi = true
    }

    // 尝试获取缓存的 token。
    if (vesperSession.token === null) {
        let token = DataStore.get(VESPER_SESSION_TOKEN_DATASTORE_KEY)
        if (token !== undefined) {
            vesperSession.token = token
        }
    }

    // 加入 vesper session token
    if (isQueryOurApi && vesperSession.token !== null) {
        if (params.headers === undefined) {
            params.headers = {}
        }

        params.headers[VESPER_SESSION_HTTP_HEADER_KEY] = vesperSession.token
    }

    return new Promise((resolve, reject) => {
        axios.request(params).then(res => {
            // axios 请求成功。

            if (isQueryOurApi && !useOriginalResult) {
                // 如果请求的是我们自己的api，并且需要做预处理...

                if (res.status == HttpStatusCode.OK) {
                    // 果团后端正常情况会无脑标记 http 状态为 200.

                    let response = res.data as IResponse

                    if (response.code == HttpStatusCode.UNAUTHORIZED) {
                        // 鉴权异常。未登录。
                        if (useDefaultUnauthorizedExceptionHandler) {
                            defaultUnauthorizedExceptionHandler()
                        }

                        reject(response)
                        
                    } else {

                        // 拦截 vesper session token
                        if (isQueryOurApi) {
                            let token = res.headers[VESPER_SESSION_HTTP_HEADER_KEY]
                            
                            if (token !== undefined) {
                                vesperSession.token = token
                                DataStore.put(VESPER_SESSION_TOKEN_DATASTORE_KEY, token)
                            }
                        }

                        resolve(response)
                    }
                } else {
                    // 如果果团后端的 http 状态非 200，说明后端出现异常。

                    if (useDefaultNetworkExceptionHandler) {
                        defaultNetworkExceptionHandler(false)
                    }

                    reject(res)
                    
                }

            } else {

                // 如果访问的是外部 api，或已经要求不做预处理。
                resolve(res)

            }
        }).catch(err => {
            
            // axios 请求异常。

            if (useDefaultNetworkExceptionHandler) {
                defaultNetworkExceptionHandler(true)
            }

            reject(err)
            
        })
    })
}
