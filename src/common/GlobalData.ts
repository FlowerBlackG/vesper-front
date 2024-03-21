// SPDX-License-Identifier: MulanPSL-2.0
/* 上财果团团 */

import React, { useRef } from "react"
import { HttpStatusCode } from "../utils/HttpStatusCode"
import { IResponse, request } from "../utils/request"
import LayoutFrame, { LayoutFrameHandle } from "../components/LayoutFrame/LayoutFrame"
import { UserEntity } from "../api/Entities"
import { Permission } from "../api/Permissions"
import { message } from "antd"
import { NavigateFunction } from "react-router-dom"

/**
 * 全局变量。
 */

export const globalData = {


    /** 
     * 指向边框对象的引用。 
     * 在 PageRoutes::preprocess 内设置。
     */
    layoutFrameRef: null as React.RefObject<LayoutFrameHandle> | null,

    userEntity: null as UserEntity | null,
    userPermissions: null as Permission[] | null,

}


export const globalHooks = {
    app: {
        navigate: null as NavigateFunction | null
    }
}


export function resetGlobalData() {
    globalData.userEntity = null
    globalData.userPermissions = null
}


/**
 * 用户浏览器刷新时，globalData 可能会被清空，但 session 仍存在。
 * 此时，需要重新获取用户信息。
 */
export function ensureGlobalData(useDefaultExceptionHandler: boolean = true) {
    let exceptionOccurreded = false
    let resolved = false

    const defaultExceptionHandler = () => {
        // do nothing.
    }

    return new Promise((resolve, reject) => {
        if (globalData.userEntity !== null && globalData.userPermissions !== null) {
            resolve(null)
        }

        if (globalData.userEntity === null) {
            loadBasicInfo().then(() => {
                if (globalData.userPermissions !== null && !resolved) {
                    resolved = true
                    resolve(null)
                }
            }).catch(() => {
                if (!exceptionOccurreded) {
                    exceptionOccurreded = true
                    if (useDefaultExceptionHandler) {
                        defaultExceptionHandler()                        
                    }
                    
                    reject()

                }
            })
        }

        // todo: 这附近有bug。如果获取权限和获取信息，有一个接口挂了，依旧会 resolve。

        if (globalData.userPermissions === null) {
            loadPermissions().then(() => {
                if (globalData.userEntity !== null && !resolved) {
                    resolved = true
                    resolve(null)
                }
            }).catch(() => {
                if (!exceptionOccurreded) {
                    exceptionOccurreded = true

                    if (useDefaultExceptionHandler) {
                        defaultExceptionHandler()
                    }

                    reject()
                }
            })
        }
        
    }) // return new Promise((resolve, reject) => {
} // export function ensureGlobalData


function loadBasicInfo() {
    return new Promise((resolve, reject) => {
        request({
            url: 'user/basicInfo',
            method: 'get',
        }).then(res => {
    
            res = res as IResponse
    
            if (res.code == HttpStatusCode.OK) {
    
                globalData.userEntity = res.data

                globalData.layoutFrameRef?.current?.update()

                resolve(null)
            } else {
                message.warning(res.code + res.msg)
                reject()
            }
        }).catch(() => {
            reject()
        })
    })
    
}


function loadPermissions() {
    return new Promise((resolve, reject) => {
        request({
            url: 'user/myPermissions',
            method: 'get'
        }, false).then(res => {
            res = res as IResponse
            if (res.code == HttpStatusCode.OK) {
    
                globalData.userPermissions = []
                for (let obj of res.data) {
                    globalData.userPermissions.push(obj.permissionId)
                }
    
                globalData.layoutFrameRef?.current?.update()

                resolve(null)
            } else {
                message.warning(res.code + res.msg)
                reject()
            }
        }).catch(() => {
            reject()
        })
    })
    
}