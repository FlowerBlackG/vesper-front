// SPDX-License-Identifier: MulanPSL-2.0
/* 上财果团团 */

import React, { useRef } from "react"
import { HttpStatusCode } from "../utils/HttpStatusCode"
import { IResponse, request } from "../utils/request"
import { GroupPermissionEntity, GroupPermissionGrantEntity, UserEntity } from "../api/Entities"
import { Permission } from "../api/Permissions"
import { message } from "antd"
import { NavigateFunction, NavigateOptions, To } from "react-router-dom"
import { GroupPermissionStore, PermissionStore } from "./PermissionStore"
import { later } from "../utils/later"
import { PageRouteData } from "./PageRoutes/TypeDef"

/**
 * 全局变量。
 */

export const globalData = {

    userEntity: null as UserEntity | null,
    userPermissions: new PermissionStore,
    groupPermissions: new GroupPermissionStore

}


export const globalHooksRegistry = {
    app: {
        navigate: null as NavigateFunction | null
    },

    layoutFrame: {
        setDataLoading: null as ((loading: boolean) => void) | null,
        setCurrentPageEntity: null as ((e: PageRouteData) => void) | null,
        setTitle: null as ((s: string) => void) | null,
        forceUpdate: null as (() => void) | null
    }
}


export const globalHooks = {
    app: {
        // buggy, but fixed in components/GlobalNavigate.tsx
        navigate: globalHooksRegistry.app.navigate as NavigateFunction
    },

    layoutFrame: {
        setDataLoading: (loading: boolean) => {
            const f = globalHooksRegistry.layoutFrame.setDataLoading
            if (f) {
                f(loading)
            }
        },

        setCurrentPageEntity: (entity: PageRouteData) => {
            const f = globalHooksRegistry.layoutFrame.setCurrentPageEntity
            if (f) {
                f(entity)
            }
        },

        setTitle: (title: string) => {
            const f = globalHooksRegistry.layoutFrame.setTitle
            if (f) {
                f(title)
            }
        },

        forceUpdate: () => {
            const f = globalHooksRegistry.layoutFrame.forceUpdate
            if (f) {
                f()
            }
        }
    }
}


export function resetGlobalData() {
    globalData.userEntity = null
    globalData.userPermissions.clear()
    globalData.groupPermissions.clear()
}


export interface EnsureGlobalDataParams {
    useDefaultExceptionHandler?: boolean
    dontReject?: boolean
    dontResolve?: boolean
    forceReloadGroupPermissions?: boolean
    forceReloadPermissions?: boolean
    forceReloadUserEntity?: boolean

    resolveLater?: boolean
}

const ensureGlobalDataDefaultParams: EnsureGlobalDataParams = {
    useDefaultExceptionHandler: true,
    dontReject: false,
    dontResolve: false,
    forceReloadGroupPermissions: false,
    forceReloadPermissions: false,
    forceReloadUserEntity: false,

    resolveLater: false,
}


/**
 * 用户浏览器刷新时，globalData 可能会被清空，但 session 仍存在。
 * 此时，需要重新获取用户信息。
 */
export function ensureGlobalData(callParams: EnsureGlobalDataParams = {}) {
    
    // 处理参数。
    
    let params: EnsureGlobalDataParams = { ...ensureGlobalDataDefaultParams }
    Object.keys(params).forEach(key => {
        let callValue = (callParams as any)[key]
        if (callValue !== undefined) {
            (params as any)[key] = callValue
        }
    })

    // 重置状态。

    if (params.forceReloadGroupPermissions) {
        globalData.groupPermissions.clear()
    }

    if (params.forceReloadGroupPermissions) {
        globalData.userPermissions.clear()
    }

    if (params.forceReloadUserEntity) {
        globalData.userEntity = null
    }


    return new Promise((resolve, reject) => {

        let exceptionOccurreded = false
        let resolved = false
        const tryResolve = () => {
            if (
                params.dontResolve
                || resolved
                || globalData.userEntity === null
                || !globalData.userPermissions.ready
                || !globalData.groupPermissions.ready
            ) {
                return
            }

            resolved = true
            if (params.resolveLater) {
                later(() => resolve(null))
            } else {
                resolve(null)
            }
        }

        const defaultExceptionHandler = () => {
            // do nothing.
        }
        
        tryResolve()

        if (globalData.userEntity === null) {
            loadBasicInfo().then(() => {
                tryResolve()
            }).catch(() => {
                if (!exceptionOccurreded) {
                    exceptionOccurreded = true
                    if (params.useDefaultExceptionHandler) {
                        defaultExceptionHandler()                        
                    }
                    
                    if (!params.dontReject)
                        reject()
                }
            })
        }

        // todo: 这附近有bug。如果获取权限和获取信息，有一个接口挂了，依旧会 resolve。

        if (!globalData.userPermissions.ready) {
            loadPermissions().then(() => {
                tryResolve()
            }).catch(() => {
                if (!exceptionOccurreded) {
                    exceptionOccurreded = true

                    if (params.useDefaultExceptionHandler) {
                        defaultExceptionHandler()
                    }

                    if (!params.dontReject)
                        reject()
                }
            })
        }

        
        if (!globalData.groupPermissions.ready) {
            loadGroupPermissions().then(() => {
                tryResolve()
            }).catch(() => {
                if (!exceptionOccurreded) {
                    exceptionOccurreded = true

                    if (params.useDefaultExceptionHandler) {
                        defaultExceptionHandler()
                    }

                    if (!params.dontReject)
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
    
            if (res.code === HttpStatusCode.OK) {
    
                globalData.userEntity = res.data
                globalHooks.layoutFrame.forceUpdate()
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
            method: 'get',
            vfOpts: {
                useDefaultUnauthorizedExceptionHandler: false
            }
        }).then(res => {
            res = res as IResponse
            if (res.code === HttpStatusCode.OK) {
    
                globalData.userPermissions.clear()
                for (let it of res.data) {
                    globalData.userPermissions.put(it)
                }
    
                globalData.userPermissions.ready = true
                globalHooks.layoutFrame.forceUpdate()

                resolve(null)
            } else {
                message.warning(res.code + res.msg)
                reject()
            }
        }).catch(reject)
    })
    
}


function loadGroupPermissions() {
    return new Promise((resolve, reject) => {
        request({
            url: 'group/permissions',
            vfOpts: {
                useDefaultUnauthorizedExceptionHandler: false
            }
        }).then(res => {
            res = res as IResponse
            if (res.code === HttpStatusCode.OK) {
                for (let obj of res.data) {
                    globalData.groupPermissions.putGrantEntity(obj)
                }

                globalData.groupPermissions.ready = true
                globalHooks.layoutFrame.forceUpdate()

                resolve(null)
            } else {
                message.warning(res.code + res.msg)
                reject()
            }
        }).catch(reject)
    })

}
